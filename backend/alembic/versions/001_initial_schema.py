"""Initial schema for repositories, github_issues, investigations, agent_runs, approval_decisions

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-23 11:00:00.000000

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
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("owner", sa.String(length=128), nullable=False),
        sa.Column("github_url", sa.String(length=512), nullable=False),
        sa.Column("default_branch", sa.String(length=64), nullable=False, server_default="main"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_repositories_id"), "repositories", ["id"], unique=False)
    op.create_index(op.f("ix_repositories_name"), "repositories", ["name"], unique=True)

    # 2. github_issues
    op.create_table(
        "github_issues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("issue_key", sa.String(length=64), nullable=False),
        sa.Column("repository_id", sa.Integer(), nullable=False),
        sa.Column("github_issue_number", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("author", sa.String(length=128), nullable=False, server_default="developer"),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="open"),
        sa.Column("priority", sa.String(length=32), nullable=False, server_default="high"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_github_issues_id"), "github_issues", ["id"], unique=False)
    op.create_index(op.f("ix_github_issues_issue_key"), "github_issues", ["issue_key"], unique=True)

    # 3. investigations
    op.create_table(
        "investigations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("issue_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="in_progress"),
        sa.Column("root_cause_summary", sa.Text(), nullable=True),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("proposed_plan", sa.JSON(), nullable=True),
        sa.Column("code_diff", sa.Text(), nullable=True),
        sa.Column("test_results", sa.JSON(), nullable=True),
        sa.Column("review_audit", sa.JSON(), nullable=True),
        sa.Column("documentation", sa.JSON(), nullable=True),
        sa.Column("branch_name", sa.String(length=128), nullable=True),
        sa.Column("target_commit", sa.String(length=64), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["issue_id"], ["github_issues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_investigations_id"), "investigations", ["id"], unique=False)

    # 4. agent_runs
    op.create_table(
        "agent_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("investigation_id", sa.Integer(), nullable=False),
        sa.Column("stage", sa.String(length=64), nullable=False),
        sa.Column("agent_name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="pending"),
        sa.Column("model", sa.String(length=64), nullable=False, server_default="Gemini 1.5 Pro"),
        sa.Column("duration", sa.String(length=32), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("artifacts", sa.JSON(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_runs_id"), "agent_runs", ["id"], unique=False)

    # 5. approval_decisions
    op.create_table(
        "approval_decisions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("investigation_id", sa.Integer(), nullable=False),
        sa.Column("decision", sa.String(length=32), nullable=False),
        sa.Column("reviewer", sa.String(length=128), nullable=False, server_default="developer"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["investigation_id"], ["investigations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_approval_decisions_id"), "approval_decisions", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("approval_decisions")
    op.drop_table("agent_runs")
    op.drop_table("investigations")
    op.drop_table("github_issues")
    op.drop_table("repositories")
