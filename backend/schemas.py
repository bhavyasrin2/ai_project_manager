from pydantic import BaseModel, field_validator
from typing import List, Optional, Any
import json

# ──────────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────────

class PlanRequest(BaseModel):
    project_name: str
    description: str
    stack: List[str]
    daily_hours: int = 2
    start_date: str
    existing_skills: List[str] = []
    available_days: str = "all days"
    slot: str = "morning"


class SubTodoSchema(BaseModel):
    todo: str
    estimated_minutes: int


class TaskSchema(BaseModel):
    day: int
    name: str
    phase: str
    task_type: str
    description: str = ""
    youtube_query: str = ""
    duration: str = ""
    scheduled_date: str
    sub_todos: List[SubTodoSchema] = []


class ConfirmPlanRequest(BaseModel):
    project_name: str
    description: str
    stack: List[str]
    existing_skills: List[str] = []
    available_days: str = "all days"
    slot: str = "morning"
    start_date: str
    daily_hours: int = 2
    tasks: List[TaskSchema]


# ──────────────────────────────────────────────
# Shared task response (used in multiple endpoints)
# ──────────────────────────────────────────────

class TaskOut(BaseModel):
    """Full task detail — used in project detail & plan views."""
    id: int
    day: int
    name: str
    phase: str
    task_type: str
    description: str
    youtube_query: str
    duration: str
    scheduled_date: str
    status: str
    sub_todos: Any

    @field_validator("sub_todos", mode="before")
    @classmethod
    def parse_sub_todos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# GET /api/projects  — list all projects
# ──────────────────────────────────────────────

class ProjectSummary(BaseModel):
    """Lightweight card shown in the projects list."""
    id: int
    name: str
    description: str
    status: str
    completion_percent: float
    total_tasks: int
    done_tasks: int
    stack: str
    start_date: str
    daily_hours: int
    total_days: int = 0
    estimated_weeks: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectSummary]
    total: int


# ──────────────────────────────────────────────
# GET /api/projects/{project_id}  — project detail
# ──────────────────────────────────────────────

class TodayTask(BaseModel):
    """The single task scheduled for today (or the next pending one)."""
    id: int
    day: int
    name: str
    phase: str
    task_type: str
    description: str
    scheduled_date: str
    status: str
    sub_todos: Any

    @field_validator("sub_todos", mode="before")
    @classmethod
    def parse_sub_todos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    """Returned by GET /api/projects/{id} — everything the detail page needs."""
    id: int
    name: str
    description: str
    stack: str
    status: str
    start_date: str
    daily_hours: int
    total_days: int = 0
    estimated_weeks: int = 0
    # computed
    total_tasks: int
    done_tasks: int
    completion_percent: float
    days_left: int                    # pending tasks remaining
    streak: int                       # consecutive done days (simple calc)
    xp: int                           # 50 XP per done task
    today_task: Optional[TodayTask]   # the task due today / next pending
    upcoming_tasks: List[TaskOut]     # next 5 pending tasks (timeline)
    calendar_synced: bool = False     # True if at least one task has a calendar_event_id

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# GET /api/projects/{project_id}/plan  — full plan
# ──────────────────────────────────────────────

class PlanStats(BaseModel):
    total_tasks: int
    done_tasks: int
    pending_tasks: int
    completion_percent: float
    days_left: int


class ProjectPlanResponse(BaseModel):
    """Returned by GET /api/projects/{id}/plan — full task list with progress."""
    project_id: int
    project_name: str
    status: str
    stats: PlanStats
    tasks: List[TaskOut]


# ──────────────────────────────────────────────
# POST /api/tasks/{task_id}/complete  — toggle task
# ──────────────────────────────────────────────

class TaskCompleteResponse(BaseModel):
    message: str
    task_id: int
    new_status: str


# ──────────────────────────────────────────────
# Legacy — kept so existing /api/dashboard still works
# ──────────────────────────────────────────────

class DashboardTask(BaseModel):
    id: int
    day: int
    name: str
    phase: str
    task_type: str
    description: str
    youtube_query: str
    duration: str
    scheduled_date: str
    status: str
    sub_todos: Any

    @field_validator("sub_todos", mode="before")
    @classmethod
    def parse_sub_todos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    project_id: int
    project_name: str
    status: str
    streak: int
    completion_percent: float
    tasks: List[DashboardTask]


# ----------------------------------------------
# Task edit / delete schemas
# ----------------------------------------------

class TaskUpdateRequest(BaseModel):
    name: str = None
    description: str = None
    phase: str = None
    task_type: str = None
    duration: str = None
    scheduled_date: str = None
    youtube_query: str = None
    sub_todos: Any = None


class TaskUpdateResponse(BaseModel):
    message: str
    task: TaskOut


class TaskDeleteResponse(BaseModel):
    message: str
    task_id: int
