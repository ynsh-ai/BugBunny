from enum import Enum


class IssueStatusEnum(str, Enum):
    INVESTIGATION_COMPLETE = "Investigation complete"
    IN_PROGRESS = "In progress"
    REVIEW_REQUIRED = "Review required"
    TESTING = "Testing"
    QUEUED = "Queued"
    FAILED = "Failed"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class IssuePriorityEnum(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class InvestigationStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentStageEnum(str, Enum):
    REQUIREMENTS_ANALYSIS = "Requirements Analysis"
    BUG_INVESTIGATION = "Bug Investigation"
    CODING_ASSISTANT = "Coding Assistant"
    TESTING = "Testing"
    CODE_REVIEW = "Code Review"
    DOCUMENTATION = "Documentation"


class RunStatusEnum(str, Enum):
    COMPLETE = "complete"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    FAILED = "failed"


class ApprovalDecisionEnum(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    COMMENT = "comment"


class ArtifactTypeEnum(str, Enum):
    DIFF = "diff"
    PLAN = "plan"
    EVIDENCE = "evidence"
    TEST_RESULTS = "test_results"
    REVIEW = "review"
    DOCUMENTATION = "documentation"
    LOG = "log"


class MemoryRoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    AGENT = "agent"
