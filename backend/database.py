from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv() # Loads local variables if testing on your computer

# If DATABASE_URL is set (in Azure), use it. Otherwise, fall back to local SQLite for testing.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nagar_vikas_v2.db")

# PostgreSQL doesn't need "check_same_thread", so we handle it dynamically
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Fix for SQLAlchemy 1.4+ with Heroku/Azure postgres URLs
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()