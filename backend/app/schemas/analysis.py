"""
Analysis Pydantic schemas.
"""
from uuid import UUID
from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


# ─── Request ──────────────────────────────────────────────────────────────────
class AnalysisRequest(BaseModel):
    resume_id: UUID
    job_description: str = Field(..., min_length=50, max_length=20000)
    job_title: str | None = Field(None, max_length=255)
    company_name: str | None = Field(None, max_length=255)


# ─── Sub-schemas ──────────────────────────────────────────────────────────────
class SkillGap(BaseModel):
    skill_name: str
    importance: Literal["Critical", "High", "Medium", "Low"]
    category: str | None = None


class ResumeBulletRevision(BaseModel):
    original: str
    suggested_revision: str
    reason: str


class ATSIssue(BaseModel):
    category: str
    severity: Literal["High", "Medium", "Low"]
    message: str
    suggestion: str


class CareerIntelligence(BaseModel):
    salary_range: dict[str, Any] | None = None
    career_paths: list[str] = []
    recommended_skills: list[str] = []
    role_readiness_score: float | None = None
    role_readiness_label: str | None = None


# ─── Response ─────────────────────────────────────────────────────────────────
class AnalysisResponse(BaseModel):
    id: UUID
    resume_id: UUID
    job_title: str | None
    company_name: str | None
    match_percentage: float | None
    ats_score: float | None
    semantic_score: float | None
    matched_skills: list[str] = []
    missing_skills: list[SkillGap] = []
    skill_coverage: float | None = None
    experience_coverage: float | None = None
    keyword_coverage: float | None = None
    ats_issues: list[ATSIssue] = []
    resume_morphing: list[ResumeBulletRevision] = []
    career_intelligence: CareerIntelligence | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisListItem(BaseModel):
    id: UUID
    job_title: str | None
    company_name: str | None
    match_percentage: float | None
    ats_score: float | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Interview ────────────────────────────────────────────────────────────────
class InterviewRequest(BaseModel):
    analysis_id: UUID


class InterviewResponse(BaseModel):
    id: UUID
    analysis_id: UUID
    technical: list[str] = []
    behavioral: list[str] = []
    gap_based: list[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Roadmap ──────────────────────────────────────────────────────────────────
class RoadmapResource(BaseModel):
    type: str  # "video" | "article" | "course" | "docs"
    title: str
    url: str
    platform: str | None = None
    duration: str | None = None


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    resources: list[RoadmapResource] = []


class RoadmapResponse(BaseModel):
    id: UUID
    analysis_id: UUID
    skill_name: str
    importance: str
    steps: list[RoadmapStep] = []
    estimated_time: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
