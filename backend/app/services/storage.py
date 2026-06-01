"""
S3 Storage Service for resume file uploads.
"""
import uuid
from typing import Optional
import structlog
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from app.core.config import settings

log = structlog.get_logger()


class S3StorageService:
    """Handles file uploads to AWS S3."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if not self._client:
            if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
                raise ValueError("AWS credentials not configured")
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
        return self._client

    async def upload(
        self,
        content: bytes,
        filename: str,
        user_id: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload file to S3 and return the public URL."""
        try:
            s3 = self._get_client()
            key = f"resumes/{user_id}/{uuid.uuid4()}/{filename}"

            s3.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType=content_type,
            )

            url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            log.info("File uploaded to S3", key=key)
            return url

        except (NoCredentialsError, ClientError, ValueError) as e:
            log.warning("S3 upload failed", error=str(e))
            raise

    async def delete(self, file_url: str) -> bool:
        """Delete a file from S3 by URL."""
        try:
            s3 = self._get_client()
            # Extract key from URL
            key = file_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
            s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            return True
        except Exception as e:
            log.error("S3 delete failed", error=str(e))
            return False

    async def get_presigned_url(self, file_url: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a pre-signed URL for secure file access."""
        try:
            s3 = self._get_client()
            key = file_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
            url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
                ExpiresIn=expires_in,
            )
            return url
        except Exception as e:
            log.error("Presigned URL generation failed", error=str(e))
            return None
