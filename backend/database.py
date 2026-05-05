import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH      = os.getenv("DB_PATH", "./life_os.db")   # override via Render env var
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def init_db():
    import models
    Base.metadata.create_all(bind=engine)
    _migrate_db()


def _migrate_db():
    """Apply lightweight schema migrations for columns added after initial deploy."""
    with engine.connect() as conn:
        # Fetch existing columns in the projects table
        result = conn.execute(text("PRAGMA table_info(projects)"))
        existing_columns = {row[1] for row in result}

        migrations = [
            ("total_days",      "ALTER TABLE projects ADD COLUMN total_days INTEGER DEFAULT 0"),
            ("estimated_weeks", "ALTER TABLE projects ADD COLUMN estimated_weeks INTEGER DEFAULT 0"),
        ]
        for col_name, sql in migrations:
            if col_name not in existing_columns:
                conn.execute(text(sql))
                print(f"[migrate] Added column '{col_name}' to projects table.")
        conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()