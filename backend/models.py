# ============================================================
# CogniScan — PostgreSQL Database Models
# ============================================================
#
# Schema:
#   patients         — Patient demographics + caregiver info
#   scans            — Individual assessment sessions
#   scan_scores      — Per-category scores for each scan
#   risk_flags       — Detected risk indicators
#   alert_configs    — Notification rules per patient
#   alert_history    — Sent notification log
# ============================================================

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cogniscan.db")

# For SQLite, we need to disable same-thread checks for FastAPI's async compatibility
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- Enums ---
class GradeEnum(str, enum.Enum):
    normal = "normal"
    mild = "mild"
    moderate = "moderate"
    severe = "severe"

class AlertType(str, enum.Enum):
    sms = "sms"
    email = "email"
    push = "push"

class SeverityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


# --- Models ---
class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    caregiver_name = Column(String(255))
    caregiver_phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # HIPAA-lite: encrypted fields would use pgcrypto or app-level encryption
    # medical_record_number = Column(EncryptedString(255))

    scans = relationship("Scan", back_populates="patient", cascade="all, delete-orphan")
    alert_configs = relationship("AlertConfig", back_populates="patient", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    overall_score = Column(Integer, nullable=False)
    overall_grade = Column(SQLEnum(GradeEnum), nullable=False)
    recommendation = Column(Text)
    processing_time_ms = Column(Integer)
    
    # Raw data references (S3/GCS paths in production)
    audio_path = Column(String(500))
    video_frame_path = Column(String(500))
    
    # Full result JSON for archival
    raw_result = Column(JSON)

    patient = relationship("Patient", back_populates="scans")
    scores = relationship("ScanScore", back_populates="scan", cascade="all, delete-orphan")
    risk_flags = relationship("RiskFlag", back_populates="scan", cascade="all, delete-orphan")


class ScanScore(Base):
    __tablename__ = "scan_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    category = Column(String(50), nullable=False)  # speech, vision, memory, motor
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, default=100)
    grade = Column(SQLEnum(GradeEnum), nullable=False)
    details = Column(Text)
    indicators = Column(JSON)  # List of string indicators

    scan = relationship("Scan", back_populates="scores")


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    severity = Column(SQLEnum(SeverityEnum), nullable=False)
    category = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)

    scan = relationship("Scan", back_populates="risk_flags")


class AlertConfig(Base):
    __tablename__ = "alert_configs"

    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    type = Column(SQLEnum(AlertType), nullable=False)
    destination = Column(String(255), nullable=False)
    threshold = Column(Integer, default=60)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="alert_configs")
    history = relationship("AlertHistory", back_populates="config", cascade="all, delete-orphan")


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(String, ForeignKey("alert_configs.id"), nullable=False)
    scan_id = Column(String, ForeignKey("scans.id"))
    triggered_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer)
    message = Column(Text)
    provider_response = Column(JSON)  # Twilio/SendGrid/Firebase response
    success = Column(Boolean, default=True)

    config = relationship("AlertConfig", back_populates="history")


# --- Database initialization ---
def init_db():
    """Create all tables. Run once on first deployment."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Done! Tables created successfully.")
