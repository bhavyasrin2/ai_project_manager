import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Database URL ──────────────────────────────────────────────
# Local dev:   uses SQLite (default)
# Production:  set DATABASE_URL env var to your Neon/PostgreSQL URL
#              e.g. postgresql://user:pass@host/dbname?sslmode=require
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.getenv('DB_PATH', './life_os.db')}")

IS_SQLITE = DATABASE_URL.startswith("sqlite")

# SQLite needs check_same_thread=False; PostgreSQL does not
connect_args = {"check_same_thread": False} if IS_SQLITE else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def init_db():
    import models
    Base.metadata.create_all(bind=engine)
    _migrate_db()


def _migrate_db():
    """Apply lightweight schema migrations for columns added after initial deploy."""
    inspector = inspect(engine)

    # Check if 'projects' table exists yet
    if "projects" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("projects")}

    migrations = [
        ("total_days",      "ALTER TABLE projects ADD COLUMN total_days INTEGER DEFAULT 0"),
        ("estimated_weeks", "ALTER TABLE projects ADD COLUMN estimated_weeks INTEGER DEFAULT 0"),
    ]

    with engine.connect() as conn:
        for col_name, sql in migrations:
            if col_name not in existing_columns:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"[migrate] Added column '{col_name}' to projects table.")
                except Exception as e:
                    print(f"[migrate] Skipped '{col_name}': {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()