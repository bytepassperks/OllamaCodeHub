# VS Code Integration Guide

## Setup Continue Extension with OllamaCodeHub

### Step 1: Install Continue

Open VS Code and install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue):

```
ext install Continue.continue
```

### Step 2: Get Your Config (Auto-Generated)

1. Log in to [OllamaCodeHub](https://ollamacodehub.onrender.com/login)
2. Click **VS Code Setup** in the navigation bar
3. Your configuration JSON is auto-generated with your API token already embedded
4. Click **Copy** to copy it to your clipboard

### Step 3: Configure Continue

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type `Continue: Open config.json` and press Enter
4. Replace the entire file contents with the config you copied from Step 2
5. Save the file

Your config will look like this (with your real token filled in):

```json
{
  "models": [
    {
      "title": "OllamaCodeHub — qwen2.5-coder:7b",
      "provider": "openai",
      "model": "qwen2.5-coder:7b",
      "apiBase": "https://backend-production-57447.up.railway.app/v1",
      "apiKey": "YOUR-TOKEN-AUTO-FILLED",
      "contextLength": 32768
    }
  ],
  "tabAutocompleteModel": {
    "title": "OllamaCodeHub Autocomplete",
    "provider": "openai",
    "model": "qwen2.5-coder:7b",
    "apiBase": "https://backend-production-57447.up.railway.app/v1",
    "apiKey": "YOUR-TOKEN-AUTO-FILLED"
  }
}
```

### Step 4: Start Coding!

- **Chat**: Use Continue's sidebar chat (`Ctrl+L`) to ask coding questions
- **Autocomplete**: Start typing and get AI-powered code suggestions
- **Inline Edit**: Select code and use `Ctrl+I` for inline AI edits
- **Explain Code**: Select code, right-click → Continue → Explain

### Token Renewal

Your API token expires after 7 days. To renew:
1. Go to [VS Code Setup](https://ollamacodehub.onrender.com/vscode-setup)
2. Copy the fresh config (new token auto-generated on each visit)
3. Paste into Continue's config.json

### Troubleshooting

- **Connection refused**: Check that the backend is running at https://backend-production-57447.up.railway.app/health
- **401 Unauthorized**: Your JWT token may have expired — visit the VS Code Setup page to get a fresh one
- **Slow responses**: First request after idle period may take 5-10s as the model warms up. Subsequent responses are faster.
- **Autocomplete not working**: Make sure `tabAutocompleteModel` is set in your config. You may need to restart VS Code after changing config.
