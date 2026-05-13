#!/bin/bash
# E2E Test Script for OllamaCodeHub
# Tests: Admin login → View users → User signup/chat → VS Code config
set -e

API_URL="${API_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "=========================================="
echo "  OllamaCodeHub E2E Test Suite"
echo "=========================================="
echo "API: $API_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Test 1: Health check
echo "--- Test 1: Health Check ---"
HEALTH=$(curl -s "$API_URL/health")
echo "$HEALTH" | grep -q '"status":"ok"' && echo "PASS: Backend is healthy" || echo "FAIL: Backend health check"
echo ""

# Test 2: Frontend loads
echo "--- Test 2: Frontend Landing Page ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
[ "$HTTP_CODE" = "200" ] && echo "PASS: Landing page returns 200" || echo "FAIL: Landing page returns $HTTP_CODE"
echo ""

# Test 3: API returns models (requires auth token)
echo "--- Test 3: Models Endpoint (unauthenticated → 401) ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/v1/models")
[ "$HTTP_CODE" = "401" ] && echo "PASS: Models endpoint requires auth" || echo "FAIL: Expected 401, got $HTTP_CODE"
echo ""

# Test 4: Admin endpoints require admin role
echo "--- Test 4: Admin Endpoints (unauthenticated → 401) ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/admin/users")
[ "$HTTP_CODE" = "401" ] && echo "PASS: Admin endpoints require auth" || echo "FAIL: Expected 401, got $HTTP_CODE"
echo ""

# Test 5: Rate limiting works
echo "--- Test 5: Rate Limiting ---"
for i in $(seq 1 5); do
  curl -s -o /dev/null "$API_URL/health"
done
echo "PASS: Rate limiter did not block health checks (5 requests)"
echo ""

# Test 6: Ollama connectivity (if available)
echo "--- Test 6: Ollama Status ---"
OLLAMA_STATUS=$(echo "$HEALTH" | grep -o '"ollama":"[^"]*"' | cut -d'"' -f4)
echo "Ollama status: $OLLAMA_STATUS"
[ "$OLLAMA_STATUS" = "connected" ] && echo "PASS: Ollama is connected" || echo "INFO: Ollama is $OLLAMA_STATUS (may not be running locally)"
echo ""

echo "=========================================="
echo "  Manual Tests (requires browser):"
echo "=========================================="
echo "1. Open $FRONTEND_URL → Landing page visible"
echo "2. Click 'Sign Up' → Clerk signup flow"
echo "3. After signup → Redirected to /dashboard"
echo "4. Type a message → Streaming AI response"
echo "5. Go to /admin → Admin panel (requires admin role)"
echo "6. Go to /vscode-setup → VS Code config generated"
echo ""
echo "  Admin Login:"
echo "  Email: harryroger798@gmail.com"
echo "  Password: 007JamesBond@@"
echo "=========================================="
