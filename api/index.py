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

from app.main import app
from fastapi import Request


@app.middleware("http")
async def normalize_vercel_paths(request: Request, call_next):
    matched = (
        request.headers.get("x-matched-path")
        or request.headers.get("x-vercel-matched-path")
        or request.headers.get("x-forwarded-uri")
    )
    if matched and not matched.startswith("/api/index"):
        request.scope["path"] = matched
    elif request.scope.get("path") in ("/api/index", "/api/index.py"):
        request.scope["path"] = "/"
    return await call_next(request)
