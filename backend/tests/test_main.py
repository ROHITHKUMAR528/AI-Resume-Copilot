"""
Backend test suite — Sprint foundation tests.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test the health check endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root():
    """Test root endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200


class TestSkillMatcher:
    """Tests for the semantic skill graph matcher."""

    def setup_method(self):
        from app.services.graph_matcher import SemanticSkillMatcher
        self.matcher = SemanticSkillMatcher()

    def test_direct_match(self):
        result = self.matcher.compute_match_score(
            resume_skills=["React", "Python", "Docker"],
            jd_skills=["react", "python", "docker"]
        )
        assert result["direct_score"] == 100.0
        assert len(result["direct_matches"]) == 3

    def test_semantic_match(self):
        result = self.matcher.compute_match_score(
            resume_skills=["Vue", "Django"],  # Vue ~ React, Django ~ FastAPI
            jd_skills=["react", "fastapi"]
        )
        assert result["semantic_score"] > 0

    def test_formula_weighted(self):
        """Verify 70% direct + 30% semantic formula."""
        result = self.matcher.compute_match_score(
            resume_skills=["React"],
            jd_skills=["react", "missing-skill"]
        )
        # 1/2 direct = 50%, 0/2 semantic = 0%
        # Final = 50*0.70 + 0*0.30 = 35
        assert result["final_score"] == 35.0

    def test_empty_inputs(self):
        result = self.matcher.compute_match_score([], [])
        assert result["final_score"] == 0.0

    def test_get_related_skills(self):
        related = self.matcher.get_related_skills("react")
        assert "vue" in related or "angular" in related


class TestATSEngine:
    """Tests for the ATS Audit Engine."""

    def setup_method(self):
        from app.services.ats_engine import ATSAuditEngine
        self.engine = ATSAuditEngine()

    def test_audit_short_resume(self):
        result = self.engine.audit(
            resume_text="Hello world",
            resume_data={"skills": [], "email": None, "phone": None},
            jd_keywords=[]
        )
        assert result["ats_score"] < 80
        issue_categories = [i["category"] for i in result["issues"]]
        assert "Length" in issue_categories

    def test_audit_good_resume(self):
        resume_text = """
John Doe
john@example.com
+1-555-0100

EXPERIENCE
Senior Software Engineer at Acme Corp 2020-2024
• Built scalable React applications used by 10,000+ users
• Reduced API latency by 40% using Redis caching
• Led team of 5 engineers to deliver $2M project on time

SKILLS
Python, React, TypeScript, Docker, AWS, PostgreSQL, Redis

EDUCATION
BS Computer Science, State University 2019
""" * 3  # Repeat to get word count up

        result = self.engine.audit(
            resume_text=resume_text,
            resume_data={"email": "john@example.com", "phone": "+15550100", "skills": ["Python", "React"]},
            jd_keywords=["python", "react", "docker"]
        )
        assert result["ats_score"] > 50

    def test_keyword_extraction(self):
        jd = "We need a Python developer with FastAPI experience and Docker knowledge"
        keywords = self.engine.extract_jd_keywords(jd)
        assert "python" in keywords
        assert "fastapi" in keywords or "docker" in keywords


class TestResumeParser:
    """Tests for the resume parser service."""

    def setup_method(self):
        from app.services.parser import ResumeParserService
        self.parser = ResumeParserService()

    def test_email_extraction(self):
        text = "John Doe\njohn.doe@gmail.com\n+1 555 0100"
        assert self.parser._extract_email(text) == "john.doe@gmail.com"

    def test_phone_extraction(self):
        text = "Contact: +1 555-0100 or email"
        phone = self.parser._extract_phone(text)
        assert phone is not None

    def test_skill_extraction(self):
        text = "Experienced in Python, React, Docker, and AWS. Familiar with PostgreSQL."
        skills = self.parser._extract_skills(text)
        assert len(skills) > 0

    def test_empty_text(self):
        skills = self.parser._extract_skills("")
        assert skills == []
