"""
Resume Pydantic schemas.
"""
from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ParsedResumeData(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    experience: list[dict[str, Any]] = []
    education: list[dict[str, Any]] = []
    certifications: list[str] = []
    projects: list[dict[str, Any]] = []
    summary: str | None = None


class ResumeUploadResponse(BaseModel):
    id: UUID
    user_id: UUID
    file_url: str | None
    original_filename: str | None
    file_type: str | None
    parsed_data: ParsedResumeData | None
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    id: UUID
    original_filename: str | None
    candidate_name: str | None
    file_type: str | None
    version: int
    created_at: datetime
    analysis_count: int = 0

    model_config = {"from_attributes": True}
