"""
Main Analyzer Service — Sprint 3
Orchestrates all analysis modules: skill matching, ATS audit, resume morphing,
career intelligence using GPT-4o with structured JSON output.
"""
import json
from typing import Any
import structlog
from openai import AsyncOpenAI

from app.core.config import settings
from app.services.graph_matcher import SemanticSkillMatcher
from app.services.ats_engine import ATSAuditEngine

log = structlog.get_logger()

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
skill_matcher = SemanticSkillMatcher()
ats_engine = ATSAuditEngine()


class AnalyzerService:
    """Orchestrates the full resume analysis pipeline."""

    async def run_full_analysis(
        self,
        resume_data: dict[str, Any],
        job_description: str,
        job_title: str | None = None,
    ) -> dict[str, Any]:
        """
        Run the complete analysis pipeline:
        1. Extract JD skills
        2. Semantic skill matching
        3. ATS audit
        4. GPT-4o deep analysis
        5. Resume morphing
        6. Career intelligence
        """
        resume_skills = resume_data.get("skills", [])
        raw_text = resume_data.get("raw_text", "")

        # Step 1: Extract skills from JD
        jd_skills = await self._extract_jd_skills(job_description, job_title)
        jd_keywords = ats_engine.extract_jd_keywords(job_description)

        # Step 2: Semantic skill matching
        skill_match = skill_matcher.compute_match_score(resume_skills, jd_skills)

        # Step 3: ATS audit
        ats_result = ats_engine.audit(raw_text, resume_data, jd_keywords)

        # Step 4: GPT-4o deep analysis
        gpt_analysis = await self._gpt_deep_analysis(
            resume_data=resume_data,
            job_description=job_description,
            job_title=job_title,
            skill_match=skill_match,
        )

        # Step 5: Resume morphing
        experience = resume_data.get("experience", [])
        morphing = await self._rewrite_bullets(experience, job_description, job_title)

        # Step 6: Career intelligence
        career_intel = await self._career_intelligence(resume_data, job_description, job_title)

        # Compute final match %
        gpt_match = gpt_analysis.get("match_percentage", 0)
        semantic_match = skill_match["final_score"]
        final_match = round((gpt_match * 0.6) + (semantic_match * 0.4), 1)

        # Categorize missing skills
        missing_skills = self._categorize_missing_skills(
            skill_match["missing_skills"],
            gpt_analysis.get("critical_missing", []),
        )

        return {
            "match_percentage": final_match,
            "ats_score": ats_result["ats_score"],
            "semantic_score": skill_match["final_score"],
            "matched_skills": skill_match["direct_matches"],
            "missing_skills": missing_skills,
            "skill_coverage": skill_match["direct_score"],
            "experience_coverage": gpt_analysis.get("experience_coverage", 0),
            "keyword_coverage": ats_result.get("keyword_density", 0),
            "ats_audit": ats_result,
            "resume_morphing": morphing,
            "career_intelligence": career_intel,
            "gpt_insights": gpt_analysis.get("insights", []),
            "strengths": gpt_analysis.get("strengths", []),
            "weaknesses": gpt_analysis.get("weaknesses", []),
        }

    async def _extract_jd_skills(self, jd_text: str, job_title: str | None) -> list[str]:
        """Use GPT-4o to extract required skills from the job description."""
        if not settings.OPENAI_API_KEY:
            return self._basic_skill_extraction(jd_text)

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert technical recruiter. Extract all required and preferred skills from job descriptions.",
                    },
                    {
                        "role": "user",
                        "content": f"""Extract all technical skills, tools, frameworks, and technologies from this job description.
Job Title: {job_title or 'Not specified'}

Job Description:
{jd_text[:3000]}

Return JSON: {{"required_skills": [], "preferred_skills": [], "bonus_skills": []}}""",
                    },
                ],
                max_tokens=500,
                temperature=0.1,
            )
            data = json.loads(response.choices[0].message.content)
            all_skills = (
                data.get("required_skills", [])
                + data.get("preferred_skills", [])
                + data.get("bonus_skills", [])
            )
            return all_skills
        except Exception as e:
            log.error("GPT skill extraction failed", error=str(e))
            return self._basic_skill_extraction(jd_text)

    async def _gpt_deep_analysis(
        self,
        resume_data: dict,
        job_description: str,
        job_title: str | None,
        skill_match: dict,
    ) -> dict[str, Any]:
        """Use GPT-4o for deep resume vs JD analysis."""
        if not settings.OPENAI_API_KEY:
            return {"match_percentage": skill_match["final_score"], "experience_coverage": 50}

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert AI resume analyst. Analyze resumes against job descriptions with precision.
Always return valid JSON with exact field names specified.""",
                    },
                    {
                        "role": "user",
                        "content": f"""Analyze this resume against the job description.

RESUME:
Name: {resume_data.get('name', 'Unknown')}
Skills: {', '.join(resume_data.get('skills', [])[:30])}
Experience: {json.dumps(resume_data.get('experience', [])[:3])}
Education: {json.dumps(resume_data.get('education', [])[:2])}

JOB DESCRIPTION:
{job_description[:2500]}

Return this exact JSON structure:
{{
  "match_percentage": <0-100 float>,
  "experience_coverage": <0-100 float>,
  "critical_missing": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "insights": ["insight1", "insight2", "insight3"],
  "fit_summary": "2-3 sentence summary"
}}""",
                    },
                ],
                max_tokens=800,
                temperature=0.2,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            log.error("GPT deep analysis failed", error=str(e))
            return {"match_percentage": skill_match["final_score"], "experience_coverage": 50}

    async def _rewrite_bullets(
        self, experience: list[dict], job_description: str, job_title: str | None
    ) -> list[dict]:
        """Use GPT-4o to rewrite resume bullets to better match the JD."""
        if not experience or not settings.OPENAI_API_KEY:
            return []

        bullets = []
        for exp in experience[:3]:
            desc = exp.get("description", "")
            if desc and len(desc) > 20:
                bullets.append(desc[:200])

        if not bullets:
            return []

        try:
            bullets_text = "\n".join([f"- {b}" for b in bullets[:5]])
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert resume writer. Rewrite resume bullets to be more impactful and relevant.
IMPORTANT: Never fabricate experience. Only enhance existing content with stronger action verbs and quantifiable impact.""",
                    },
                    {
                        "role": "user",
                        "content": f"""Rewrite these resume bullets to better match the target role.
Target Role: {job_title or 'Software Engineer'}

Original Bullets:
{bullets_text}

Return JSON:
{{
  "revisions": [
    {{
      "original": "...",
      "suggested_revision": "...",
      "reason": "..."
    }}
  ]
}}""",
                    },
                ],
                max_tokens=1000,
                temperature=0.3,
            )
            data = json.loads(response.choices[0].message.content)
            return data.get("revisions", [])
        except Exception as e:
            log.error("Resume morphing failed", error=str(e))
            return []

    async def _career_intelligence(
        self, resume_data: dict, job_description: str, job_title: str | None
    ) -> dict[str, Any]:
        """Generate career intelligence: salary, growth path, readiness."""
        if not settings.OPENAI_API_KEY:
            return {}

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert career counselor and market analyst.",
                    },
                    {
                        "role": "user",
                        "content": f"""Based on this resume and job description, provide career intelligence.

Skills: {', '.join(resume_data.get('skills', [])[:20])}
Experience Count: {len(resume_data.get('experience', []))}
Target Role: {job_title or 'Not specified'}

Return JSON:
{{
  "salary_range": {{"min": 0, "max": 0, "currency": "USD", "period": "annual"}},
  "career_paths": ["path1", "path2", "path3"],
  "recommended_skills": ["skill1", "skill2", "skill3"],
  "role_readiness_score": <0-100>,
  "role_readiness_label": "Ready|Almost Ready|Needs Work|Not Ready"
}}""",
                    },
                ],
                max_tokens=500,
                temperature=0.2,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            log.error("Career intelligence failed", error=str(e))
            return {}

    def _basic_skill_extraction(self, text: str) -> list[str]:
        """Fallback: basic keyword-based skill extraction when OpenAI is unavailable."""
        from app.services.graph_matcher import SKILL_GRAPH
        text_lower = text.lower()
        found = [s for s in SKILL_GRAPH.keys() if s in text_lower]
        return found

    def _categorize_missing_skills(
        self, semantic_missing: list[str], critical_missing: list[str]
    ) -> list[dict]:
        """Categorize missing skills by importance."""
        result = []
        critical_norm = {s.lower() for s in critical_missing}

        for skill in semantic_missing:
            importance = "Critical" if skill.lower() in critical_norm else "High"
            result.append({
                "skill_name": skill,
                "importance": importance,
                "category": skill_matcher.get_category(skill),
            })

        # Add critical missing that weren't in semantic missing
        for skill in critical_missing:
            if skill.lower() not in {s["skill_name"].lower() for s in result}:
                result.append({
                    "skill_name": skill,
                    "importance": "Critical",
                    "category": skill_matcher.get_category(skill),
                })

        return result[:15]  # Cap at 15
