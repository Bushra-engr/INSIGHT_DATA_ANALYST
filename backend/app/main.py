from fastapi import FastAPI
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

# 3. Serve Frontend Directly on "/" (Root URL) and "/index.html"
@app.get("/")
@app.get("/index.html")
async def serve_frontend():
    dist_index = BASE_DIR / "dist" / "index.html"
    if dist_index.exists():
        return FileResponse(dist_index)
    index_file = BASE_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "index.html not found in project root"}

# 4. Health Check API
@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "OK"
    }