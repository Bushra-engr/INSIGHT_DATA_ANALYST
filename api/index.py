from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

from app.routes.auth import router as auth_router
from app.routes.data_upload import router as data_router
from app.routes.analysis import router as analysis_router

app = FastAPI(
    title="AI DATA ANALYST",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def normalize_vercel_paths(request: Request, call_next):
    raw_path = request.scope.get("path", "")
    if raw_path.startswith("/api/index.py") or raw_path.startswith("/api/index"):
        matched = (
            request.headers.get("x-matched-path")
            or request.headers.get("x-vercel-matched-path")
            or request.headers.get("x-forwarded-uri")
        )
        if matched and not matched.startswith("/api/index"):
            request.scope["path"] = matched
    return await call_next(request)

# Mount all routers for both root and /api prefixes
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")
app.include_router(data_router)
app.include_router(data_router, prefix="/api")
app.include_router(analysis_router)
app.include_router(analysis_router, prefix="/api")

@app.get("/")
@app.get("/api")
@app.get("/health")
@app.get("/api/health")
def root_and_health():
    return {
        "success": True,
        "status": "online",
        "service": "AI Data Analyst API",
        "version": "3.0.0"
    }

