"""
OllamaCodeHub — Modal.com GPU Inference Endpoint
Runs nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull (Q2_K_MTX)
on a T4 GPU with serverless scaling (scales to zero when idle).
"""

import modal
import subprocess
import time
import os
import json
import re
import urllib.request

app = modal.App("ollamacodehub-inference")

volume = modal.Volume.from_name("ollamacodehub-models", create_if_missing=True)

MODEL_NAME = "nutboy02/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:Q2_K_MTX"
OLLAMA_DIR = "/root/.ollama"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "ca-certificates", "zstd")
    .pip_install("fastapi[standard]")
    .run_commands("curl -fsSL https://ollama.com/install.sh | sh")
)


@app.cls(
    image=image,
    gpu="T4",
    volumes={OLLAMA_DIR: volume},
    scaledown_window=300,
    timeout=600,
)
@modal.concurrent(max_inputs=4)
class Inference:
    @modal.enter()
    def startup(self):
        """Start Ollama and ensure model is available."""
        env = os.environ.copy()
        env["OLLAMA_MODELS"] = OLLAMA_DIR + "/models"
        env["OLLAMA_KEEP_ALIVE"] = "10m"

        self.ollama_proc = subprocess.Popen(
            ["ollama", "serve"], env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )

        # Wait for server
        for _ in range(30):
            try:
                urllib.request.urlopen("http://localhost:11434/api/tags")
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("Ollama failed to start")

        # Check if model cached
        resp = urllib.request.urlopen("http://localhost:11434/api/tags")
        data = json.loads(resp.read())
        cached = [m["name"] for m in data.get("models", [])]

        if not any(MODEL_NAME in m for m in cached):
            print(f"Pulling {MODEL_NAME} (first time only)...")
            result = subprocess.run(
                ["ollama", "pull", MODEL_NAME],
                env=env, capture_output=True, text=True, timeout=600,
            )
            if result.returncode != 0:
                raise RuntimeError(f"Pull failed: {result.stderr}")
            volume.commit()
            print("Model cached to volume!")
        else:
            print("Model loaded from cache!")

    @modal.fastapi_endpoint(method="POST")
    def chat(self, data: dict):
        """OpenAI-compatible /v1/chat/completions endpoint with tool calling."""
        messages = data.get("messages", [])
        temperature = data.get("temperature", 0.7)
        max_tokens = data.get("max_tokens", 4096)
        tools = data.get("tools")
        tool_choice = data.get("tool_choice")

        # Use OpenAI-compatible endpoint for better tool support
        oai_payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            oai_payload["tools"] = tools
        if tool_choice:
            oai_payload["tool_choice"] = tool_choice

        payload = json.dumps(oai_payload).encode()

        req = urllib.request.Request(
            "http://localhost:11434/v1/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json"},
        )

        resp = urllib.request.urlopen(req, timeout=300)
        result = json.loads(resp.read())

        msg = result.get("choices", [{}])[0].get("message", {})
        raw_content = msg.get("content", "")
        tool_calls = msg.get("tool_calls")

        # Strip <think>...</think> blocks from output for cleaner responses
        content = re.sub(r'<think>.*?</think>\s*', '', raw_content, flags=re.DOTALL).strip()

        assistant_message = {"role": "assistant", "content": content}
        if tool_calls:
            assistant_message["tool_calls"] = tool_calls

        finish_reason = "tool_calls" if tool_calls else "stop"

        return {
            "id": result.get("id", "chatcmpl-modal"),
            "object": "chat.completion",
            "model": MODEL_NAME,
            "choices": [{
                "index": 0,
                "message": assistant_message,
                "finish_reason": finish_reason,
            }],
            "usage": result.get("usage", {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            }),
        }

    @modal.fastapi_endpoint(method="GET")
    def health(self):
        """Health check."""
        try:
            resp = urllib.request.urlopen("http://localhost:11434/api/tags")
            data = json.loads(resp.read())
            return {"status": "ok", "models": [m["name"] for m in data.get("models", [])]}
        except Exception as e:
            return {"status": "starting", "error": str(e)}
