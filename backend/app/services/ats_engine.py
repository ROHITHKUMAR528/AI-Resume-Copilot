"""
ATS Audit Engine — Sprint 5
Checks resume formatting, keyword density, section structure, and ATS compatibility.
"""
import re
from typing import Any
import structlog

log = structlog.get_logger()

REQUIRED_SECTIONS = ["experience", "education", "skills"]
RECOMMENDED_SECTIONS = ["summary", "certifications", "projects"]
ATS_UNFRIENDLY_PATTERNS = [
    (r'<table', "Tables are not ATS-friendly"),
    (r'\|', "Pipe characters may confuse ATS parsers"),
    (r'[^\x00-\x7F]', "Non-ASCII characters may cause parsing issues"),
]


class ATSAuditEngine:
    """Analyzes resumes for ATS compatibility and formatting issues."""

    def audit(self, resume_text: str, resume_data: dict, jd_keywords: list[str]) -> dict[str, Any]:
        """
        Run a full ATS audit on the resume.
        Returns an audit report with score and issues.
        """
        issues = []
        score = 100.0
        deductions = []

        # 1. Length check
        word_count = len(resume_text.split())
        if word_count < 300:
            issues.append({
                "category": "Length",
                "severity": "High",
                "message": f"Resume is too short ({word_count} words). ATS systems prefer 400-700 words.",
                "suggestion": "Expand your experience bullets and add more detail to each role.",
            })
            deductions.append(15)
        elif word_count > 1000:
            issues.append({
                "category": "Length",
                "severity": "Medium",
                "message": f"Resume is too long ({word_count} words). Keep it under 700 words for most roles.",
                "suggestion": "Condense older roles and remove irrelevant experience.",
            })
            deductions.append(8)

        # 2. Required sections check
        text_lower = resume_text.lower()
        for section in REQUIRED_SECTIONS:
            if section not in text_lower:
                issues.append({
                    "category": "Section Structure",
                    "severity": "High",
                    "message": f"Missing required section: '{section.title()}'",
                    "suggestion": f"Add a clear '{section.title()}' section heading.",
                })
                deductions.append(10)

        # 3. Keyword density
        if jd_keywords:
            matched_kw = [kw for kw in jd_keywords if kw.lower() in text_lower]
            density = len(matched_kw) / len(jd_keywords) * 100
            if density < 40:
                issues.append({
                    "category": "Keyword Density",
                    "severity": "High",
                    "message": f"Low keyword match ({density:.0f}%). ATS will likely filter this resume.",
                    "suggestion": "Incorporate more job-specific keywords naturally into your bullets.",
                })
                deductions.append(15)
            elif density < 60:
                issues.append({
                    "category": "Keyword Density",
                    "severity": "Medium",
                    "message": f"Moderate keyword match ({density:.0f}%). Consider improving.",
                    "suggestion": "Add 3-5 more role-specific keywords to strengthen your match.",
                })
                deductions.append(7)

        # 4. Contact info check
        email = resume_data.get("email")
        phone = resume_data.get("phone")
        if not email:
            issues.append({
                "category": "Contact Info",
                "severity": "High",
                "message": "No email address detected.",
                "suggestion": "Add a professional email address at the top of your resume.",
            })
            deductions.append(10)
        if not phone:
            issues.append({
                "category": "Contact Info",
                "severity": "Medium",
                "message": "No phone number detected.",
                "suggestion": "Add a phone number for recruiter contact.",
            })
            deductions.append(5)

        # 5. Skills section
        skills = resume_data.get("skills", [])
        if len(skills) < 5:
            issues.append({
                "category": "Skills",
                "severity": "Medium",
                "message": f"Only {len(skills)} skills detected. ATS expects a robust skills list.",
                "suggestion": "Add a dedicated Skills section with 10-15 relevant technical skills.",
            })
            deductions.append(8)

        # 6. Bullet point usage
        bullet_count = len(re.findall(r'[•·▪▸\-–]\s', resume_text))
        if bullet_count < 5:
            issues.append({
                "category": "Formatting",
                "severity": "Low",
                "message": "Few or no bullet points detected.",
                "suggestion": "Use bullet points to structure experience descriptions for better readability.",
            })
            deductions.append(5)

        # 7. Quantification check
        has_numbers = bool(re.search(r'\d+[%$xk+]|\$\d+|\d+ (users|customers|teams|projects)', resume_text, re.IGNORECASE))
        if not has_numbers:
            issues.append({
                "category": "Impact",
                "severity": "Medium",
                "message": "No quantified achievements found.",
                "suggestion": "Add metrics like '↑20% performance', '$50K saved', 'managed 5-person team'.",
            })
            deductions.append(8)

        # Calculate final score
        total_deduction = min(sum(deductions), 60)  # Max 60 point deduction
        final_score = max(40.0, score - total_deduction)

        return {
            "ats_score": round(final_score, 1),
            "issues": issues,
            "word_count": word_count,
            "keyword_density": round(density if jd_keywords else 0, 1),
            "sections_found": [s for s in REQUIRED_SECTIONS if s in text_lower],
            "recommendations": self._generate_recommendations(issues),
        }

    def _generate_recommendations(self, issues: list[dict]) -> list[str]:
        """Generate prioritized recommendations."""
        high = [i["suggestion"] for i in issues if i["severity"] == "High"]
        medium = [i["suggestion"] for i in issues if i["severity"] == "Medium"]
        return (high + medium)[:5]

    def extract_jd_keywords(self, jd_text: str) -> list[str]:
        """Extract key terms from job description for ATS matching."""
        # Remove common stop words and extract meaningful terms
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
                      "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
                      "have", "has", "had", "do", "does", "did", "will", "would", "shall",
                      "should", "may", "might", "must", "can", "could", "you", "we", "our",
                      "your", "their", "this", "that", "these", "those", "it", "its"}

        words = re.findall(r'\b[a-z][a-z\+\#\.]+\b', jd_text.lower())
        filtered = [w for w in words if w not in stop_words and len(w) > 2]

        # Count frequency and return top keywords
        from collections import Counter
        freq = Counter(filtered)
        return [word for word, _ in freq.most_common(50)]
