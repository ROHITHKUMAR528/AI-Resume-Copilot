"""
Learning Service — Sprint 7
Generates personalized upskill roadmaps using GPT-4o.
"""
import json
from typing import Any
import structlog
from openai import AsyncOpenAI

from app.core.config import settings

log = structlog.get_logger()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Curated fallback resources for common skills
FALLBACK_RESOURCES: dict[str, list[dict]] = {
    "docker": [
        {"type": "docs", "title": "Docker Official Documentation", "url": "https://docs.docker.com", "platform": "Docker"},
        {"type": "video", "title": "Docker Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "platform": "YouTube"},
        {"type": "course", "title": "Docker for the Absolute Beginner", "url": "https://www.udemy.com/course/learn-docker/", "platform": "Udemy"},
    ],
    "kubernetes": [
        {"type": "docs", "title": "Kubernetes Official Docs", "url": "https://kubernetes.io/docs/", "platform": "Kubernetes"},
        {"type": "course", "title": "Kubernetes for Beginners", "url": "https://www.udemy.com/course/learn-kubernetes/", "platform": "Udemy"},
    ],
    "python": [
        {"type": "docs", "title": "Python Official Docs", "url": "https://docs.python.org/3/", "platform": "Python.org"},
        {"type": "course", "title": "Python for Everybody", "url": "https://www.coursera.org/specializations/python", "platform": "Coursera"},
    ],
    "react": [
        {"type": "docs", "title": "React Official Docs", "url": "https://react.dev", "platform": "React"},
        {"type": "course", "title": "React - The Complete Guide", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", "platform": "Udemy"},
    ],
    "aws": [
        {"type": "docs", "title": "AWS Documentation", "url": "https://docs.aws.amazon.com", "platform": "AWS"},
        {"type": "course", "title": "AWS Certified Solutions Architect", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", "platform": "Udemy"},
        {"type": "article", "title": "AWS Free Tier Hands-On", "url": "https://aws.amazon.com/free/", "platform": "AWS"},
    ],
}


class LearningService:
    """Generates AI-powered learning roadmaps for skill gaps."""

    async def generate_roadmap(
        self,
        skill_name: str,
        importance: str,
        context: str = "",
    ) -> dict[str, Any]:
        """Generate a step-by-step learning roadmap for a skill."""
        if settings.OPENAI_API_KEY:
            return await self._gpt_roadmap(skill_name, importance, context)
        return self._fallback_roadmap(skill_name, importance)

    async def _gpt_roadmap(self, skill_name: str, importance: str, context: str) -> dict[str, Any]:
        """Use GPT-4o to generate a personalized roadmap."""
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert technical learning advisor. Create practical, actionable learning roadmaps.
Always include free and paid resources. Focus on hands-on learning.""",
                    },
                    {
                        "role": "user",
                        "content": f"""Create a learning roadmap for: {skill_name}
Importance: {importance}
Context: {context[:300] if context else 'General software engineering role'}

Return this exact JSON:
{{
  "skill": "{skill_name}",
  "estimated_time": "X weeks",
  "steps": [
    {{
      "step": 1,
      "title": "Step Title",
      "description": "What to do and why",
      "resources": [
        {{
          "type": "docs|video|course|article|project",
          "title": "Resource Title",
          "url": "https://...",
          "platform": "Platform Name",
          "duration": "optional duration"
        }}
      ]
    }}
  ]
}}

Include 3-5 steps. Each step should have 1-3 real, valid resources.""",
                    },
                ],
                max_tokens=1200,
                temperature=0.3,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            log.error("GPT roadmap generation failed", skill=skill_name, error=str(e))
            return self._fallback_roadmap(skill_name, importance)

    def _fallback_roadmap(self, skill_name: str, importance: str) -> dict[str, Any]:
        """Generate a generic roadmap when OpenAI is unavailable."""
        skill_lower = skill_name.lower()
        resources = FALLBACK_RESOURCES.get(skill_lower, [
            {"type": "docs", "title": f"{skill_name} Official Documentation", "url": f"https://www.google.com/search?q={skill_name}+documentation", "platform": "Web"},
            {"type": "video", "title": f"{skill_name} Tutorial", "url": f"https://www.youtube.com/results?search_query={skill_name}+tutorial", "platform": "YouTube"},
            {"type": "course", "title": f"{skill_name} Course", "url": f"https://www.udemy.com/courses/search/?q={skill_name}", "platform": "Udemy"},
        ])

        return {
            "skill": skill_name,
            "estimated_time": "2-4 weeks",
            "steps": [
                {
                    "step": 1,
                    "title": "Read the Documentation",
                    "description": f"Start with the official {skill_name} documentation to understand core concepts.",
                    "resources": [r for r in resources if r["type"] == "docs"][:1],
                },
                {
                    "step": 2,
                    "title": "Watch Tutorial Videos",
                    "description": f"Follow along with video tutorials to see {skill_name} in action.",
                    "resources": [r for r in resources if r["type"] == "video"][:1],
                },
                {
                    "step": 3,
                    "title": "Take a Structured Course",
                    "description": f"Enroll in a comprehensive {skill_name} course for structured learning.",
                    "resources": [r for r in resources if r["type"] == "course"][:1],
                },
                {
                    "step": 4,
                    "title": "Build a Mini Project",
                    "description": f"Apply your knowledge by building a small project using {skill_name}.",
                    "resources": [],
                },
            ],
        }
