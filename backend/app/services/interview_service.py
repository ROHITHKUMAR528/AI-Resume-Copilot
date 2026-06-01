"""
Interview Service — Sprint 8
Generates tailored interview questions using GPT-4o.
"""
import json
from typing import Any
import structlog
from openai import AsyncOpenAI

from app.core.config import settings

log = structlog.get_logger()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class InterviewService:
    """Generates tailored behavioral, technical, and gap-based interview questions."""

    async def generate_questions(
        self,
        job_description: str,
        matched_skills: list[str],
        missing_skills: list[dict],
        job_title: str | None = None,
    ) -> dict[str, Any]:
        """Generate interview questions based on analysis results."""
        if settings.OPENAI_API_KEY:
            return await self._gpt_questions(job_description, matched_skills, missing_skills, job_title)
        return self._fallback_questions(matched_skills, missing_skills, job_title)

    async def _gpt_questions(
        self,
        job_description: str,
        matched_skills: list[str],
        missing_skills: list[dict],
        job_title: str | None,
    ) -> dict[str, Any]:
        """Use GPT-4o to generate targeted interview questions."""
        missing_skill_names = [
            s.get("skill_name", s) if isinstance(s, dict) else s
            for s in missing_skills[:5]
        ]

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert technical interviewer. Generate realistic, challenging interview questions
that assess both technical depth and cultural fit. Focus on practical scenarios.""",
                    },
                    {
                        "role": "user",
                        "content": f"""Generate interview questions for this role.

Job Title: {job_title or 'Software Engineer'}
Candidate's Matched Skills: {', '.join(matched_skills[:15])}
Skills to Probe (Gaps): {', '.join(missing_skill_names)}

Job Description (excerpt):
{job_description[:1500]}

Return this exact JSON:
{{
  "technical": [
    "Technical question 1",
    "Technical question 2",
    "Technical question 3",
    "Technical question 4",
    "Technical question 5"
  ],
  "behavioral": [
    "Behavioral question 1",
    "Behavioral question 2",
    "Behavioral question 3",
    "Behavioral question 4",
    "Behavioral question 5"
  ],
  "gap_based": [
    "Gap question 1 (about missing skill)",
    "Gap question 2 (about missing skill)",
    "Gap question 3 (about missing skill)"
  ]
}}

Make questions specific to the role and skills, not generic.""",
                    },
                ],
                max_tokens=1000,
                temperature=0.4,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            log.error("GPT interview generation failed", error=str(e))
            return self._fallback_questions(matched_skills, missing_skills, job_title)

    def _fallback_questions(
        self,
        matched_skills: list[str],
        missing_skills: list[dict],
        job_title: str | None,
    ) -> dict[str, Any]:
        """Generate generic fallback questions."""
        primary_skill = matched_skills[0] if matched_skills else "programming"
        missing_names = [
            s.get("skill_name", s) if isinstance(s, dict) else s
            for s in missing_skills[:3]
        ]

        return {
            "technical": [
                f"Describe your experience with {primary_skill} in production environments.",
                f"How do you handle scalability challenges in {primary_skill}?",
                "Walk me through your approach to debugging a critical production issue.",
                "How do you ensure code quality and maintainability in your projects?",
                "Describe your experience with CI/CD pipelines and deployment automation.",
            ],
            "behavioral": [
                "Tell me about a time you had to deliver under a tight deadline.",
                "Describe a situation where you disagreed with a technical decision. How did you handle it?",
                "How do you approach learning new technologies?",
                "Tell me about your most challenging project and what you learned from it.",
                "How do you communicate technical concepts to non-technical stakeholders?",
            ],
            "gap_based": [
                f"We use {missing_names[0]} extensively. How would you approach learning it quickly?" if missing_names else "How do you stay current with emerging technologies?",
                f"Can you explain your understanding of {missing_names[1] if len(missing_names) > 1 else 'cloud infrastructure'}?",
                "What's your plan for closing skill gaps identified during this process?",
            ],
        }
