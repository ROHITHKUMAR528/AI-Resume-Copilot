"""
Semantic Skill Graph Matcher — Sprint 4
Implements a knowledge graph for semantic skill matching.
Formula: Final Score = 70% Direct Match + 30% Semantic Match
"""
from typing import Any
import structlog

log = structlog.get_logger()

# ─── Skill Knowledge Graph ────────────────────────────────────────────────────
SKILL_GRAPH: dict[str, dict] = {
    # Frontend
    "react": {"similar": ["vue", "angular", "next.js", "svelte", "preact"], "category": "frontend", "weight": 1.0},
    "vue": {"similar": ["react", "angular", "nuxt", "svelte"], "category": "frontend", "weight": 0.9},
    "angular": {"similar": ["react", "vue", "next.js"], "category": "frontend", "weight": 0.9},
    "next.js": {"similar": ["react", "nuxt", "gatsby", "remix"], "category": "frontend", "weight": 0.95},
    "typescript": {"similar": ["javascript", "flow"], "category": "language", "weight": 1.0},
    "javascript": {"similar": ["typescript", "coffeescript"], "category": "language", "weight": 0.95},
    "css": {"similar": ["scss", "sass", "less", "tailwindcss", "styled-components"], "category": "frontend", "weight": 0.8},
    "tailwindcss": {"similar": ["css", "scss", "bootstrap", "material-ui"], "category": "frontend", "weight": 0.85},

    # Backend
    "fastapi": {"similar": ["flask", "django", "express", "nest.js", "spring"], "category": "backend", "weight": 1.0},
    "django": {"similar": ["flask", "fastapi", "rails", "laravel"], "category": "backend", "weight": 0.9},
    "flask": {"similar": ["fastapi", "django", "express"], "category": "backend", "weight": 0.85},
    "node.js": {"similar": ["express", "nest.js", "deno", "bun"], "category": "backend", "weight": 0.95},
    "express": {"similar": ["node.js", "nest.js", "fastapi", "koa"], "category": "backend", "weight": 0.9},
    "spring": {"similar": ["fastapi", "django", "rails", "quarkus"], "category": "backend", "weight": 0.9},

    # Languages
    "python": {"similar": ["ruby", "go", "java"], "category": "language", "weight": 1.0},
    "java": {"similar": ["kotlin", "scala", "c#", "go"], "category": "language", "weight": 1.0},
    "go": {"similar": ["rust", "java", "python", "c++"], "category": "language", "weight": 1.0},
    "rust": {"similar": ["go", "c++", "c"], "category": "language", "weight": 1.0},
    "kotlin": {"similar": ["java", "scala", "swift"], "category": "language", "weight": 1.0},

    # Cloud & DevOps
    "aws": {"similar": ["gcp", "azure", "digitalocean", "heroku"], "category": "cloud", "weight": 1.0},
    "gcp": {"similar": ["aws", "azure", "firebase"], "category": "cloud", "weight": 0.95},
    "azure": {"similar": ["aws", "gcp", "microsoft"], "category": "cloud", "weight": 0.95},
    "docker": {"similar": ["podman", "containerd", "kubernetes"], "category": "devops", "weight": 1.0},
    "kubernetes": {"similar": ["docker", "helm", "ecs", "openshift"], "category": "devops", "weight": 1.0},
    "terraform": {"similar": ["ansible", "pulumi", "cdk", "cloudformation"], "category": "devops", "weight": 0.95},
    "jenkins": {"similar": ["github actions", "circleci", "gitlab ci", "travis ci"], "category": "devops", "weight": 0.9},
    "github actions": {"similar": ["jenkins", "circleci", "gitlab ci"], "category": "devops", "weight": 0.95},

    # Databases
    "postgresql": {"similar": ["mysql", "mariadb", "sqlite", "cockroachdb"], "category": "database", "weight": 1.0},
    "mysql": {"similar": ["postgresql", "mariadb", "sqlite"], "category": "database", "weight": 0.95},
    "mongodb": {"similar": ["couchdb", "firestore", "dynamodb", "cosmosdb"], "category": "database", "weight": 1.0},
    "redis": {"similar": ["memcached", "valkey", "dragonfly"], "category": "cache", "weight": 1.0},
    "elasticsearch": {"similar": ["opensearch", "solr", "meilisearch"], "category": "database", "weight": 0.95},

    # AI / ML
    "machine learning": {"similar": ["deep learning", "ai", "data science", "mlops"], "category": "ai_ml", "weight": 1.0},
    "pytorch": {"similar": ["tensorflow", "jax", "mxnet", "keras"], "category": "ai_ml", "weight": 1.0},
    "tensorflow": {"similar": ["pytorch", "keras", "jax"], "category": "ai_ml", "weight": 1.0},
    "openai": {"similar": ["anthropic", "langchain", "llm", "huggingface"], "category": "ai_ml", "weight": 0.9},
    "langchain": {"similar": ["llamaindex", "openai", "semantic kernel"], "category": "ai_ml", "weight": 0.95},

    # Data
    "pandas": {"similar": ["polars", "numpy", "dask"], "category": "data", "weight": 0.95},
    "spark": {"similar": ["flink", "hadoop", "databricks", "dbt"], "category": "data", "weight": 1.0},
}


class SemanticSkillMatcher:
    """
    Implements semantic skill matching using a knowledge graph.
    """

    def __init__(self):
        self._graph = SKILL_GRAPH
        self._build_reverse_index()

    def _build_reverse_index(self):
        """Build a reverse lookup: skill → all related skills."""
        self._related: dict[str, set[str]] = {}
        for skill, data in self._graph.items():
            if skill not in self._related:
                self._related[skill] = set()
            for sim in data.get("similar", []):
                self._related[skill].add(sim)
                if sim not in self._related:
                    self._related[sim] = set()
                self._related[sim].add(skill)

    def normalize(self, skill: str) -> str:
        return skill.lower().strip()

    def compute_match_score(
        self,
        resume_skills: list[str],
        jd_skills: list[str],
    ) -> dict[str, Any]:
        """
        Compute semantic match between resume skills and JD skills.
        Returns direct matches, semantic matches, and final score.
        """
        resume_norm = {self.normalize(s) for s in resume_skills}
        jd_norm = {self.normalize(s) for s in jd_skills}

        direct_matches = []
        semantic_matches = []
        missing = []

        for jd_skill in jd_norm:
            if jd_skill in resume_norm:
                direct_matches.append(jd_skill)
            else:
                # Check semantic similarity
                jd_related = self._related.get(jd_skill, set())
                semantic_hit = jd_related & resume_norm
                if semantic_hit:
                    semantic_matches.append({
                        "required": jd_skill,
                        "matched_via": list(semantic_hit)[0],
                        "score": 0.7,
                    })
                else:
                    missing.append(jd_skill)

        total_jd = len(jd_norm) or 1
        direct_score = len(direct_matches) / total_jd * 100
        semantic_score = len(semantic_matches) / total_jd * 100

        # Weighted formula: 70% direct + 30% semantic
        final_score = (direct_score * 0.70) + (semantic_score * 0.30)

        return {
            "direct_matches": direct_matches,
            "semantic_matches": semantic_matches,
            "missing_skills": missing,
            "direct_score": round(direct_score, 1),
            "semantic_score": round(semantic_score, 1),
            "final_score": round(final_score, 1),
        }

    def get_category(self, skill: str) -> str:
        return self._graph.get(self.normalize(skill), {}).get("category", "general")

    def get_related_skills(self, skill: str) -> list[str]:
        return list(self._related.get(self.normalize(skill), []))
