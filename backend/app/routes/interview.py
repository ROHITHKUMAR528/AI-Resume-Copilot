"""
Interview Simulator routes.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.resume import Resume, InterviewSession
from app.models.analysis import Analysis
from app.schemas.analysis import InterviewRequest, InterviewResponse
from app.services.interview_service import InterviewService

router = APIRouter()
interview_service = InterviewService()


@router.post("/interview", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def generate_interview_questions(
    payload: InterviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate tailored interview questions based on analysis results."""
    result = await db.execute(
        select(Analysis)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(Analysis.id == payload.analysis_id, Resume.user_id == current_user.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    # Generate questions via AI
    questions = await interview_service.generate_questions(
        job_description=analysis.job_description,
        matched_skills=analysis.matched_skills or [],
        missing_skills=analysis.missing_skills or [],
        job_title=analysis.job_title,
    )

    # Save session
    session = InterviewSession(
        analysis_id=analysis.id,
        questions_json=questions,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    return InterviewResponse(
        id=session.id,
        analysis_id=analysis.id,
        technical=questions.get("technical", []),
        behavioral=questions.get("behavioral", []),
        gap_based=questions.get("gap_based", []),
        created_at=session.created_at,
    )


@router.get("/interview/{analysis_id}", response_model=list[InterviewResponse])
async def get_interview_sessions(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all interview sessions for an analysis."""
    result = await db.execute(
        select(InterviewSession)
        .join(Analysis, InterviewSession.analysis_id == Analysis.id)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(InterviewSession.analysis_id == analysis_id, Resume.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    sessions = result.scalars().all()

    return [
        InterviewResponse(
            id=s.id,
            analysis_id=s.analysis_id,
            technical=(s.questions_json or {}).get("technical", []),
            behavioral=(s.questions_json or {}).get("behavioral", []),
            gap_based=(s.questions_json or {}).get("gap_based", []),
            created_at=s.created_at,
        )
        for s in sessions
    ]
