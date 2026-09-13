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
