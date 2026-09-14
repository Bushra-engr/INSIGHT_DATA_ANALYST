from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from sqlalchemy.orm import declarative_base
from pathlib import Path
import os

# Load .env reliably from backend or root directory
env_path_backend = Path(__file__).resolve().parents[2] / ".env"
env_path_root = Path(__file__).resolve().parents[3] / ".env"

if env_path_backend.exists():
    load_dotenv(dotenv_path=env_path_backend)
elif env_path_root.exists():
    load_dotenv(dotenv_path=env_path_root)
else:
    load_dotenv()

import tempfile

DEFAULT_DB_URL = "postgresql://neondb_owner:npg_xsr6GVqKP9uM@ep-bitter-haze-aycachev-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DB_URL
if "channel_binding" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "").replace("?channel_binding=require", "")


Base = declarative_base()

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(url=DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(
            url=DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
        )
except Exception as e:
    print(f"[DB Setup Warning] Falling back to SQLite: {e}")
    fallback_db = (Path(tempfile.gettempdir()) / "analytics_fallback.db").as_posix()
    engine = create_engine(f"sqlite:///{fallback_db}", connect_args={"check_same_thread": False})

# Ensure tables exist in database
try:
    import app.models.tables  # noqa
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Table Creation Notice]: {e}")

SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine
)


