# VS Code Integration Guide

## Setup Continue Extension with OllamaCodeHub

### Step 1: Install Continue

Open VS Code and install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue):

```
ext install Continue.continue
```

### Step 2: Configure Continue

Open Continue config: `Ctrl+Shift+P` → "Continue: Open config.json"

Replace with this configuration:

```json
{
  "models": [
    {
      "title": "OllamaCodeHub — Qwen3-Coder 30B",
      "provider": "openai",
      "model": "qwen3-coder:30b",
      "apiBase": "https://YOUR-RAILWAY-BACKEND-URL/v1",
      "apiKey": "YOUR-CLERK-JWT-TOKEN",
      "contextLength": 32768
    },
    {
      "title": "OllamaCodeHub — CodeLlama 13B",
      "provider": "openai",
      "model": "codellama:13b",
      "apiBase": "https://YOUR-RAILWAY-BACKEND-URL/v1",
      "apiKey": "YOUR-CLERK-JWT-TOKEN",
      "contextLength": 16384
    }
  ],
  "tabAutocompleteModel": {
    "title": "OllamaCodeHub Autocomplete",
    "provider": "openai",
    "model": "qwen3-coder:30b",
    "apiBase": "https://YOUR-RAILWAY-BACKEND-URL/v1",
    "apiKey": "YOUR-CLERK-JWT-TOKEN"
  }
}
```

### Step 3: Get Your API Token

1. Log in to the OllamaCodeHub dashboard
2. Open browser dev tools (F12)
3. In the console, run: `await window.Clerk.session.getToken()`
4. Copy the token and replace `YOUR-CLERK-JWT-TOKEN` in the config

### Step 4: Start Coding!

- **Chat**: Use Continue's sidebar chat to ask coding questions
- **Autocomplete**: Start typing and get AI suggestions
- **Inline Edit**: Select code and use `Ctrl+I` for inline AI edits

### Troubleshooting

- **Connection refused**: Check that your Railway backend is running
- **401 Unauthorized**: Your JWT token may have expired — regenerate it
- **Slow responses**: The first request may take longer as the model loads
