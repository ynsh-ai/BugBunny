"""Initial schema for repositories, issues, investigations, agent_runs, agent_artifacts, approval_decisions, conversation_memories

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-24 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. repositories
    op.create_table(
        "repositories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("owner", sa.String(length=128), nullable=False, server_default="ynsh-ai"),
        sa.Column("github_url", sa.String(length=512), nullable=False),
        sa.Column("default_branch", sa.String(length=64), nullable=False, server_default="main"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_repositories_id"), "repositories", ["id"], unique=False)
    op.create_index(op.f("ix_repositories_name"), "repositories", ["name"], unique=True)

    # 2. issues
    op.create_table(
        "issues",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("issue_key", sa.String(length=64), nullable=False),
        sa.Column("repository_id", sa.Uuid(), nullable=False),
        sa.Column("github_issue_number", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("author", sa.String(length=128), nullable=False, server_default="developer"),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="In progress"),
        sa.Column("priority", sa.String(length=32), nullable=False, server_default="high"),
        sa.Column("assigned_agent", sa.String(length=128), nullable=True),
        sa.Column("branch", sa.String(length=128), nullable=True),
        sa.Column("target_commit", sa.String(length=64), nullable=True),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_issues_id"), "issues", ["id"], unique=False)
    op.create_index(op.f("ix_issues_issue_key"), "issues", ["issue_key"], unique=True)

    # 3. investigations
    op.create_table(
        "investigations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("issue_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="in_progress"),
        sa.Column("root_cause_summary", sa.Text(), nullable=True),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("proposed_plan", sa.JSON(), nullable=True),
        sa.Column("code_diff", sa.Text(), nullable=True),
        sa.Column("diffs", sa.JSON(), nullable=True),
        sa.Column("test_results", sa.JSON(), nullable=True),
        sa.Column("review_audit", sa.JSON(), nullable=True),
        sa.Column("documentation", sa.JSON(), nullable=True),
        sa.Column("branch_name", sa.String(length=128), nullable=True),
        sa.Column("target_commit", sa.String(length=64), nullable=True),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_investigations_id"), "investigations", ["id"], unique=False)

    # 4. agent_runs
    op.create_table(
        "agent_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("investigation_id", sa.Uuid(), nullable=False),
        sa.Column("stage", sa.String(length=64), nullable=False),
        sa.Column("agent_name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="pending"),
        sa.Column("model", sa.String(length=64), nullable=False, server_default="Gemini 1.5 Pro"),
        sa.Column("duration", sa.String(length=32), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("artifacts", sa.JSON(), nullable=True),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_runs_id"), "agent_runs", ["id"], unique=False)

    # 5. agent_artifacts
    op.create_table(
        "agent_artifacts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("investigation_id", sa.Uuid(), nullable=False),
        sa.Column("agent_run_id", sa.Uuid(), nullable=True),
        sa.Column("artifact_type", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agent_run_id"], ["agent_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_artifacts_id"), "agent_artifacts", ["id"], unique=False)

    # 6. approval_decisions
    op.create_table(
        "approval_decisions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("investigation_id", sa.Uuid(), nullable=False),
        sa.Column("decision", sa.String(length=32), nullable=False),
        sa.Column("reviewer", sa.String(length=128), nullable=False, server_default="developer"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_approval_decisions_id"), "approval_decisions", ["id"], unique=False)

    # 7. conversation_memories
    op.create_table(
        "conversation_memories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("investigation_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("agent_name", sa.String(length=128), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("mode", sa.String(length=32), nullable=False, server_default="demo"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_conversation_memories_id"), "conversation_memories", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("conversation_memories")
    op.drop_table("approval_decisions")
    op.drop_table("agent_artifacts")
    op.drop_table("agent_runs")
    op.drop_table("investigations")
    op.drop_table("issues")
    op.drop_table("repositories")
