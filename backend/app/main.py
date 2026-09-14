from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

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

# 1. Routers (Both root & /api prefixed for Vercel and direct clients)
app.include_router(auth_router)
app.include_router(data_router)
app.include_router(data_router, prefix="") # Allows /upload and /datasets at root
app.include_router(analysis_router)

app.include_router(auth_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")

@app.get("/api")
@app.get("/api/index")
@app.get("/api/index.py")
def api_root():
    return {
        "status": "online",
        "service": "AI Data Analyst API",
        "version": "3.0.0"
    }

@app.get("/api/health")
def api_health():
    return {
        "success": True,
        "message": "OK"
    }

# 2. Frontend Directories Path Setup
BASE_DIR = Path(__file__).resolve().parents[2] # Project root

# Mount Production Build Assets if present
if (BASE_DIR / "dist" / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "dist" / "assets")), name="assets")

# Fallback mounts for backwards compatibility
if (BASE_DIR / "css").exists():
    app.mount("/css", StaticFiles(directory=str(BASE_DIR / "css")), name="css")

if (BASE_DIR / "js").exists():
    app.mount("/js", StaticFiles(directory=str(BASE_DIR / "js")), name="js")

# 4. Health Check API
@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "OK"
    }

# 5. Catch-All SPA Handler for "/" and any frontend subpath
@app.get("/")
@app.get("/index.html")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    # If a specific static file inside dist exists (e.g. assets, favicon)
    if full_path:
        asset_file = BASE_DIR / "dist" / full_path
        if asset_file.exists() and asset_file.is_file():
            return FileResponse(asset_file)

    dist_index = BASE_DIR / "dist" / "index.html"
    if dist_index.exists():
        return FileResponse(dist_index)
    index_file = BASE_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"status": "online", "service": "AI Data Analyst API", "version": "3.0.0"}