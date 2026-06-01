"""
Resume upload and management routes.
"""
import io
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import Analysis
from app.schemas.resume import ResumeUploadResponse, ResumeListItem, ParsedResumeData
from app.services.parser import ResumeParserService
from app.services.storage import S3StorageService

router = APIRouter()
parser_service = ResumeParserService()
storage_service = S3StorageService()


@router.post("/upload-resume", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and parse a resume file (PDF or DOCX)."""
    # Validate file extension
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Validate file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({size_mb:.1f}MB) exceeds the {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    # Parse the resume
    parsed_data: ParsedResumeData = await parser_service.parse(
        content=content, file_type=ext
    )

    # Upload to S3
    file_url: str | None = None
    try:
        file_url = await storage_service.upload(
            content=content,
            filename=filename,
            user_id=str(current_user.id),
            content_type=file.content_type or "application/octet-stream",
        )
    except Exception:
        # S3 upload is optional — continue without it
        pass

    # Save to DB
    resume = Resume(
        user_id=current_user.id,
        file_url=file_url,
        original_filename=filename,
        file_type=ext,
        raw_text=parsed_data.model_dump().get("raw_text"),
        parsed_json=parsed_data.model_dump(),
        candidate_name=parsed_data.name,
        candidate_email=parsed_data.email,
        candidate_phone=parsed_data.phone,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)

    return ResumeUploadResponse(
        id=resume.id,
        user_id=resume.user_id,
        file_url=resume.file_url,
        original_filename=resume.original_filename,
        file_type=resume.file_type,
        parsed_data=parsed_data,
        version=resume.version,
        created_at=resume.created_at,
    )


@router.get("/resumes", response_model=list[ResumeListItem])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """List all resumes uploaded by the current user."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    resumes = result.scalars().all()

    items = []
    for r in resumes:
        # Count analyses
        count_result = await db.execute(
            select(func.count()).where(Analysis.resume_id == r.id)
        )
        analysis_count = count_result.scalar() or 0
        items.append(ResumeListItem(
            id=r.id,
            original_filename=r.original_filename,
            candidate_name=r.candidate_name,
            file_type=r.file_type,
            version=r.version,
            created_at=r.created_at,
            analysis_count=analysis_count,
        ))

    return items


@router.get("/resumes/{resume_id}", response_model=ResumeUploadResponse)
async def get_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific resume by ID."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    parsed_data = ParsedResumeData.model_validate(resume.parsed_json or {})

    return ResumeUploadResponse(
        id=resume.id,
        user_id=resume.user_id,
        file_url=resume.file_url,
        original_filename=resume.original_filename,
        file_type=resume.file_type,
        parsed_data=parsed_data,
        version=resume.version,
        created_at=resume.created_at,
    )


@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resume and all associated analyses."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    await db.delete(resume)
