"""
Analysis routes: trigger analysis, get results, history.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import Analysis
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisListItem,
)
from app.services.analyzer import AnalyzerService

router = APIRouter()
analyzer_service = AnalyzerService()


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_resume(
    payload: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a resume against a job description.
    Returns match score, ATS score, skill gaps, and more.
    """
    # Verify resume belongs to user
    result = await db.execute(
        select(Resume).where(
            Resume.id == payload.resume_id,
            Resume.user_id == current_user.id,
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if not resume.parsed_json:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume has not been parsed yet. Please re-upload.",
        )

    # Create analysis record (status=processing)
    analysis = Analysis(
        resume_id=resume.id,
        job_description=payload.job_description,
        job_title=payload.job_title,
        company_name=payload.company_name,
        status="processing",
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    # Run full analysis
    analysis_result = await analyzer_service.run_full_analysis(
        resume_data=resume.parsed_json,
        job_description=payload.job_description,
        job_title=payload.job_title,
    )

    # Update analysis record with results
    analysis.match_percentage = analysis_result.get("match_percentage")
    analysis.ats_score = analysis_result.get("ats_score")
    analysis.semantic_score = analysis_result.get("semantic_score")
    analysis.matched_skills = analysis_result.get("matched_skills", [])
    analysis.missing_skills = analysis_result.get("missing_skills", [])
    analysis.ats_audit_json = analysis_result.get("ats_audit", {})
    analysis.resume_morphing_json = analysis_result.get("resume_morphing", [])
    analysis.career_intelligence_json = analysis_result.get("career_intelligence", {})
    analysis.analysis_json = analysis_result
    analysis.status = "completed"

    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return _map_analysis_response(analysis)


@router.get("/history", response_model=list[AnalysisListItem])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """Get the analysis history for the current user."""
    result = await db.execute(
        select(Analysis)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(Resume.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    analyses = result.scalars().all()
    return [AnalysisListItem.model_validate(a) for a in analyses]


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific analysis result by ID."""
    result = await db.execute(
        select(Analysis)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(Analysis.id == analysis_id, Resume.user_id == current_user.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return _map_analysis_response(analysis)


def _map_analysis_response(analysis: Analysis) -> AnalysisResponse:
    """Map ORM analysis to response schema."""
    from app.schemas.analysis import SkillGap, ATSIssue, ResumeBulletRevision, CareerIntelligence

    missing = [
        SkillGap(**s) if isinstance(s, dict) else s
        for s in (analysis.missing_skills or [])
    ]
    ats_issues = [
        ATSIssue(**i) if isinstance(i, dict) else i
        for i in (analysis.ats_audit_json or {}).get("issues", [])
    ]
    morphing = [
        ResumeBulletRevision(**r) if isinstance(r, dict) else r
        for r in (analysis.resume_morphing_json or [])
    ]
    ci_data = analysis.career_intelligence_json or {}
    ci = CareerIntelligence(**ci_data) if ci_data else None

    full_data = analysis.analysis_json or {}

    return AnalysisResponse(
        id=analysis.id,
        resume_id=analysis.resume_id,
        job_title=analysis.job_title,
        company_name=analysis.company_name,
        match_percentage=analysis.match_percentage,
        ats_score=analysis.ats_score,
        semantic_score=analysis.semantic_score,
        matched_skills=analysis.matched_skills or [],
        missing_skills=missing,
        skill_coverage=full_data.get("skill_coverage"),
        experience_coverage=full_data.get("experience_coverage"),
        keyword_coverage=full_data.get("keyword_coverage"),
        ats_issues=ats_issues,
        resume_morphing=morphing,
        career_intelligence=ci,
        status=analysis.status,
        created_at=analysis.created_at,
    )
