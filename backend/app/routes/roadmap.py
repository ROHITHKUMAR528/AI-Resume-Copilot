"""
Learning Roadmap routes.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.resume import Resume, LearningRoadmap
from app.models.analysis import Analysis
from app.schemas.analysis import RoadmapResponse, RoadmapStep, RoadmapResource
from app.services.learning_service import LearningService

router = APIRouter()
learning_service = LearningService()


@router.post("/upskill-roadmap/{analysis_id}", response_model=list[RoadmapResponse])
async def generate_roadmap(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a learning roadmap for all missing skills in an analysis."""
    # Validate access
    result = await db.execute(
        select(Analysis)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(Analysis.id == analysis_id, Resume.user_id == current_user.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    missing_skills = analysis.missing_skills or []
    if not missing_skills:
        return []

    roadmaps = []
    for skill_data in missing_skills:
        skill_name = skill_data.get("skill_name") if isinstance(skill_data, dict) else str(skill_data)
        importance = skill_data.get("importance", "Medium") if isinstance(skill_data, dict) else "Medium"

        # Generate roadmap via AI
        roadmap_data = await learning_service.generate_roadmap(
            skill_name=skill_name,
            importance=importance,
            context=analysis.job_description[:500],
        )

        # Save to DB
        roadmap_record = LearningRoadmap(
            analysis_id=analysis_id,
            skill_name=skill_name,
            importance=importance,
            resources_json=roadmap_data,
        )
        db.add(roadmap_record)
        await db.flush()
        await db.refresh(roadmap_record)

        steps = [RoadmapStep(**s) for s in roadmap_data.get("steps", [])]
        roadmaps.append(RoadmapResponse(
            id=roadmap_record.id,
            analysis_id=analysis_id,
            skill_name=skill_name,
            importance=importance,
            steps=steps,
            estimated_time=roadmap_data.get("estimated_time"),
            created_at=roadmap_record.created_at,
        ))

    return roadmaps


@router.get("/roadmaps/{analysis_id}", response_model=list[RoadmapResponse])
async def get_roadmaps(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get existing roadmaps for an analysis."""
    result = await db.execute(
        select(LearningRoadmap)
        .join(Analysis, LearningRoadmap.analysis_id == Analysis.id)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(LearningRoadmap.analysis_id == analysis_id, Resume.user_id == current_user.id)
    )
    records = result.scalars().all()

    roadmaps = []
    for r in records:
        data = r.resources_json or {}
        steps = [RoadmapStep(**s) for s in data.get("steps", [])]
        roadmaps.append(RoadmapResponse(
            id=r.id,
            analysis_id=r.analysis_id,
            skill_name=r.skill_name,
            importance=r.importance,
            steps=steps,
            estimated_time=data.get("estimated_time"),
            created_at=r.created_at,
        ))

    return roadmaps
