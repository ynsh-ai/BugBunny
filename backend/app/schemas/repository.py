from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RepositoryBase(BaseModel):
    name: str
    owner: str = "ynsh-ai"
    github_url: str
    default_branch: str = "main"
    is_active: bool = True


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryResponse(RepositoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
