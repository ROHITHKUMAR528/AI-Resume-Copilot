"""
Analysis ORM model.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Scores
    match_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    ats_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    semantic_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Rich analysis data
    analysis_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    matched_skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    missing_skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    ats_audit_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    resume_morphing_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    career_intelligence_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="analyses")
    roadmaps: Mapped[list["LearningRoadmap"]] = relationship(
        "LearningRoadmap", back_populates="analysis", cascade="all, delete-orphan"
    )
    interview_sessions: Mapped[list["InterviewSession"]] = relationship(
        "InterviewSession", back_populates="analysis", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Analysis id={self.id} match={self.match_percentage}%>"
