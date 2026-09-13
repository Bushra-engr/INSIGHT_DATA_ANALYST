import sys
import os
from pathlib import Path

# Add project root and backend to sys.path so modules import seamlessly
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Mark running in Vercel environment
os.environ["VERCEL"] = "1"

from backend.app.main import app as fastapi_app


# Vercel ASGI path normalizer middleware
# When Vercel rewrites /auth/login -> /api/index.py, this middleware ensures
# FastAPI receives the original client requested path.
class VercelPathNormalizer:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            headers = dict(scope.get("headers", []))
            matched = headers.get(b"x-matched-path", b"").decode("utf-8")
            if matched and not matched.startswith("/api/index"):
                scope["path"] = matched
            elif scope.get("path") in ("/api/index", "/api/index.py"):
                scope["path"] = "/api"
        await self.asgi_app(scope, receive, send)


app = VercelPathNormalizer(fastapi_app)
