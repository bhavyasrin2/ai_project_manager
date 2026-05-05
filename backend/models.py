from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import enum


class TaskType(str, enum.Enum):
    learn  = "learn"
    code   = "code"
    buffer = "buffer"        # new — buffer/catchup days


class TaskStatus(str, enum.Enum):
    pending     = "pending"
    done        = "done"
    rescheduled = "rescheduled"
    skipped     = "skipped"  # new — for buffer days user skips


class Project(Base):
    __tablename__ = "projects"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False)
    description      = Column(String, nullable=False)
    stack            = Column(String, nullable=False)    # comma-separated e.g. "Whisper,React"
    existing_skills  = Column(String, default="")        # comma-separated e.g. "React,FastAPI"
    available_days   = Column(String, default="all days")# "weekdays" or "all days"
    slot             = Column(String, nullable=False)    # "morning" or "evening"
    start_date       = Column(String, nullable=False)    # "YYYY-MM-DD"
    daily_hours      = Column(Integer, default=2)        # hours available per day
    status           = Column(String, default="active")  # "active" or "completed"
    total_days       = Column(Integer, default=0)        # from AI plan: total_days
    estimated_weeks  = Column(Integer, default=0)        # from AI plan: estimated_weeks

    tasks = relationship("Task", back_populates="project", cascade="all, delete")


class Task(Base):
    __tablename__ = "tasks"

    id                = Column(Integer, primary_key=True, index=True)
    project_id        = Column(Integer, ForeignKey("projects.id"), nullable=False)
    day               = Column(Integer, nullable=False)
    name              = Column(String, nullable=False)
    phase             = Column(String, nullable=False)
    task_type         = Column(String, nullable=False)  # "learn", "code", "buffer"
    description       = Column(String, default="")
    youtube_query     = Column(String, default="")
    duration          = Column(String, default="")      # e.g. "2 hours"
    sub_todos         = Column(Text, default="[]")      # JSON string of sub_todos list
    scheduled_date    = Column(String, nullable=False)  # "YYYY-MM-DD"
    calendar_event_id = Column(String, default="")      # Google Calendar event ID
    status            = Column(String, default="pending")

    project    = relationship("Project", back_populates="tasks")
    email_logs = relationship("EmailLog", back_populates="task", cascade="all, delete")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id         = Column(Integer, primary_key=True, index=True)
    task_id    = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    sent_at    = Column(DateTime, nullable=False)
    replied_at = Column(DateTime)
    reply_type = Column(String)   # "done" or "reschedule"

    task = relationship("Task", back_populates="email_logs")