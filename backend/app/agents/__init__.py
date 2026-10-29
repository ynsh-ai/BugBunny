"""BugBunny Multi-Agent Orchestration Package.

Exports specialist agent creators, model provider abstractions, and the orchestration workflow.
"""

from app.agents.code_reviewer import create_code_reviewer_agent, generate_demo_review
from app.agents.codebase_investigator import create_investigator_agent, generate_demo_investigation
from app.agents.model_provider import ModelProvider, model_provider
from app.agents.patch_engineer import create_patch_agent, generate_demo_patch
from app.agents.requirements_analyst import create_requirements_agent, generate_demo_requirements
from app.agents.solution_planner import create_planner_agent, generate_demo_plan
from app.agents.test_runner import create_test_runner_agent, generate_demo_test_report

__all__ = [
    "ModelProvider",
    "create_code_reviewer_agent",
    "create_investigator_agent",
    "create_patch_agent",
    "create_planner_agent",
    "create_requirements_agent",
    "create_test_runner_agent",
    "generate_demo_investigation",
    "generate_demo_patch",
    "generate_demo_plan",
    "generate_demo_requirements",
    "generate_demo_review",
    "generate_demo_test_report",
    "model_provider",
]
