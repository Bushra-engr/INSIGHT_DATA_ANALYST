from fastapi import APIRouter, Depends, File, UploadFile, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.services.upload_service import data_upload
from app.services.security import decode_access_token
from app.models.connection import SessionLocal
from app.models.tables import Dataset, Analysis

router = APIRouter(
    prefix="/data",
    tags=["data"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
@router.post("/datasets/upload")
@router.post("")
async def upload_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    token: dict = Depends(decode_access_token),
):
    return await data_upload(file=file, token=token, background_tasks=background_tasks)

@router.get("/datasets")
@router.get("")
def get_user_datasets(
    token: dict = Depends(decode_access_token),
    db: Session = Depends(get_db),
):
    """
    Returns all datasets uploaded by the authenticated user or available in the workspace.
    Enables cross-session history persistence when users sign in or explore as analyst.
    """
    import duckdb
    from app.services.duckdb_service import DB_PATH

    user_id = token.get("user_id")
    if not user_id:
        return []

    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user_id)
        .order_by(Dataset.id.desc())
        .all()
    )

    # Pre-open DuckDB once for efficiency if it exists
    duckdb_tables = set()
    duckdb_con = None
    try:
        if DB_PATH.exists():
            duckdb_con = duckdb.connect(str(DB_PATH), read_only=True)
            tbl_rows = duckdb_con.execute("SELECT table_name FROM information_schema.tables").fetchall()
            duckdb_tables = {r[0] for r in tbl_rows}
    except Exception as e:
        print(f"[DuckDB Connection Notice]: {e}")

    results = []
    for ds in datasets:
        analysis = db.query(Analysis).filter_by(dataset_id=ds.id).first()

        total_rows = ds.row_count or 0
        total_cols = ds.column_count or 0
        quality_score = 95.0
        columns = []

        if analysis and analysis.profile and isinstance(analysis.profile, dict):
            raw_p = dict(analysis.profile)
            if isinstance(raw_p.get("shape"), dict):
                total_rows = raw_p["shape"].get("rows", total_rows)
                total_cols = raw_p["shape"].get("columns", total_cols)
            total_rows = raw_p.get("total_rows", total_rows)
            total_cols = raw_p.get("total_columns", total_cols)
            quality_score = raw_p.get("quality_score") or (analysis.quality.get("quality_score") if analysis.quality else 95.0) or (analysis.quality.get("score") if analysis.quality else 95.0) or 95.0
            columns = raw_p.get("columns", [])
            raw_p["total_rows"] = total_rows
            raw_p["total_columns"] = total_cols
            raw_p["quality_score"] = quality_score
            profile = raw_p
        else:
            profile = {
                "total_rows": total_rows,
                "total_columns": total_cols,
                "quality_score": quality_score,
                "columns": []
            }

        # Retrieve records from DuckDB
        sample_records = []
        tbl_name = f"dataset_{ds.id}"
        if duckdb_con and tbl_name in duckdb_tables:
            try:
                sample_df = duckdb_con.execute(f"SELECT * FROM {tbl_name} LIMIT 100").df()
                sample_records = sample_df.to_dict(orient="records")
            except Exception as ex:
                print(f"[DuckDB fetch notice ds={ds.id}]: {ex}")

        results.append({
            "id": str(ds.id),
            "backend_id": ds.id,
            "dataset_id": ds.id,
            "filename": ds.name,
            "file_size": f"{ds.file_type.upper()} Dataset",
            "uploaded_at": ds.created_at.isoformat() if ds.created_at else None,
            "row_count": total_rows,
            "column_count": total_cols,
            "status": ds.status or "READY",
            "profile": profile,
            "records": sample_records
        })

    if duckdb_con:
        try:
            duckdb_con.close()
        except Exception:
            pass

    return results

@router.delete("/datasets/{dataset_id}")
def delete_user_dataset(
    dataset_id: int,
    token: dict = Depends(decode_access_token),
    db: Session = Depends(get_db),
):
    user_id = token.get("user_id", 1)
    dataset = db.query(Dataset).filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    db.delete(dataset)
    db.commit()
    return {"success": True, "message": f"Dataset {dataset_id} deleted."}
