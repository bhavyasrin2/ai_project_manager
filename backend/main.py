import os
import json

from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from database import init_db, get_db
import models
import schemas
from claude_planner import generate_plan
from calendar_service import create_events, delete_event
from scheduler import start_scheduler, stop_scheduler



# ──────────────────────────────────────────────────────────────
# Helper utilities
# ──────────────────────────────────────────────────────────────

def _completion(tasks: list[models.Task]) -> float:
    """Return completion percentage (0–100) for a task list."""
    if not tasks:
        return 0.0
    done = sum(1 for t in tasks if t.status == "done")
    return round((done / len(tasks)) * 100, 1)


def _streak(tasks: list[models.Task]) -> int:
    """
    Count consecutive days (from today backwards) where every
    task scheduled on that date was marked done.
    """
    today = date.today()
    streak = 0
    check_date = today

    # Build a dict: date -> list[tasks]
    by_date: dict[str, list[models.Task]] = {}
    for t in tasks:
        by_date.setdefault(t.scheduled_date, []).append(t)

    for _ in range(365):  # max 1-year lookback
        key = check_date.strftime("%Y-%m-%d")
        day_tasks = by_date.get(key)
        if day_tasks is None:
            # No tasks on this date — stop (gap in schedule)
            break
        if all(t.status == "done" for t in day_tasks):
            streak += 1
        else:
            break
        check_date -= timedelta(days=1)

    return streak


def _today_task(tasks: list[models.Task]) -> Optional[models.Task]:
    """
    Return the best 'today' task:
    1. A non-done task whose scheduled_date == today
    2. Otherwise, the first pending task (next up)
    """
    today_str = date.today().strftime("%Y-%m-%d")
    for t in tasks:
        if t.scheduled_date == today_str and t.status != "done":
            return t
    # Fallback — first pending task in order
    for t in sorted(tasks, key=lambda x: x.day):
        if t.status != "done":
            return t
    return None


def _upcoming(tasks: list[models.Task], n: int = 5) -> list[models.Task]:
    """Return up to n pending tasks ordered by day (excludes today's task)."""
    today_str = date.today().strftime("%Y-%m-%d")
    pending = [
        t for t in sorted(tasks, key=lambda x: x.day)
        if t.status != "done" and t.scheduled_date != today_str
    ]
    return pending[:n]


def _days_left(tasks: list[models.Task]) -> int:
    """Count tasks that are still pending."""
    return sum(1 for t in tasks if t.status != "done")


def _xp(tasks: list[models.Task]) -> int:
    """50 XP per completed task."""
    return sum(1 for t in tasks if t.status == "done") * 50


# ──────────────────────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database...")
    init_db()
    start_scheduler()
    yield
    stop_scheduler()
    print("Shutting down...")


app = FastAPI(
    title="AI Project Manager API",
    version="2.0.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
    # ↑ local dev default. On Render, set ALLOWED_ORIGINS=https://your-app.vercel.app
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# GET /health  —  uptime ping (UptimeRobot / keep-alive)
# ──────────────────────────────────────────────────────────────

@app.get("/health", summary="Health check — used by UptimeRobot to keep the server awake")
def health_check():
    return {
        "status": "ok",
        "scheduler": "running",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ──────────────────────────────────────────────────────────────
# POST /api/debug/send-emails  —  TESTING ONLY

#   Force-triggers the daily email job immediately, regardless of
#   the current time. Remove this route before going to production.
# ──────────────────────────────────────────────────────────────

@app.post("/api/debug/send-emails", summary="[DEBUG] Manually trigger daily task emails")
def debug_send_emails(slot: str = "evening"):
    """
    Force-triggers job_send_daily_emails() right now, bypassing the cron schedule.
    Pass ?slot=morning or ?slot=evening (default: evening).
    REMOVE THIS ENDPOINT BEFORE GOING TO PRODUCTION.
    """
    from scheduler import job_send_daily_emails
    if slot not in ("morning", "evening"):
        raise HTTPException(status_code=400, detail="slot must be 'morning' or 'evening'")
    try:
        job_send_daily_emails(force_slot=slot)
        return {"message": f"Triggered for slot='{slot}' — check server logs and your inbox."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/debug/poll-inbox", summary="[DEBUG] Manually trigger inbox reply polling")
def debug_poll_inbox():
    """Force-triggers job_poll_inbox() bypassing the slot-time window guard."""
    from scheduler import job_poll_inbox
    try:
        job_poll_inbox(force=True)
        return {"message": "poll_inbox triggered — check server logs for results."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/debug/status", summary="[DEBUG] Show email logs and task statuses")
def debug_status(db: Session = Depends(get_db)):
    """Shows all EmailLog rows and the current status of their linked tasks."""
    logs = db.query(models.EmailLog).all()
    result = []
    for log in logs:
        task = db.query(models.Task).filter(models.Task.id == log.task_id).first()
        result.append({
            "log_id":       log.id,
            "task_id":      log.task_id,
            "task_name":    task.name if task else "NOT FOUND",
            "task_day":     task.day if task else None,
            "task_status":  task.status if task else "N/A",
            "scheduled_date": task.scheduled_date if task else None,
            "sent_at":      str(log.sent_at),
            "replied_at":   str(log.replied_at) if log.replied_at else None,
            "reply_type":   log.reply_type,
        })
    return {"email_logs": result, "total": len(result)}


@app.delete("/api/debug/email-logs/{log_id}", summary="[DEBUG] Delete a test EmailLog so the cron can re-send it")
def debug_delete_email_log(log_id: int, db: Session = Depends(get_db)):
    """Removes an EmailLog row so the cron job treats the task as un-emailed."""
    log = db.query(models.EmailLog).filter(models.EmailLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"message": f"EmailLog {log_id} deleted — cron will re-send at next trigger."}


@app.post("/api/debug/test-poll-replies/{day}", summary="[DEBUG] Directly test poll_replies for a day number")
def debug_test_poll_replies(day: int):
    """
    Calls poll_replies(day) directly and returns the raw result.
    Use this to verify Gmail reply detection works regardless of EmailLog state.
    """
    from gmail_service import poll_replies
    try:
        result = poll_replies(day)
        return {"day": day, "reply_detected": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/debug/send-emails", summary="[DEBUG] Manually trigger daily task emails")
def debug_send_emails_v2(slot: str = "evening", force_date: str = None):
    """
    Force-triggers job_send_daily_emails() bypassing cron and optionally the date filter.
    - slot: 'morning' or 'evening'
    - force_date: override today's date e.g. '2024-06-01' to match old task dates
    """
    from scheduler import job_send_daily_emails
    if slot not in ("morning", "evening"):
        raise HTTPException(status_code=400, detail="slot must be 'morning' or 'evening'")
    try:
        job_send_daily_emails(force_slot=slot, force_date=force_date)
        return {"message": f"Triggered for slot='{slot}', date='{force_date or 'today'}' — check server logs."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────
# POST /api/plan  —  generate AI plan & save to SQLite
# ──────────────────────────────────────────────────────────────

@app.post("/api/plan")
def api_generate_plan(request: schemas.PlanRequest, db: Session = Depends(get_db)):
    # ── 1. Call the AI to generate the plan ──────────────────────
    try:
        plan = generate_plan(
            project_name=request.project_name,
            description=request.description,
            stack=request.stack,
            daily_hours=request.daily_hours,
            start_date=request.start_date,
            existing_skills=request.existing_skills,
            available_days=request.available_days,
            slot=request.slot,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # plan shape: { total_days, estimated_weeks, phases, tasks: [...] }
    tasks_data: list = plan.get("tasks", [])
    total_days: int = plan.get("total_days", len(tasks_data))
    estimated_weeks: int = plan.get("estimated_weeks", 0)

    # ── 2. Persist the Project row ───────────────────────────────
    new_project = models.Project(
        name=request.project_name,
        description=request.description,
        stack=",".join(request.stack),
        existing_skills=",".join(request.existing_skills),
        available_days=request.available_days,
        slot=request.slot,
        start_date=request.start_date,
        daily_hours=request.daily_hours,
        status="active",
        total_days=total_days,
        estimated_weeks=estimated_weeks,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # ── 3. Persist each Task row ─────────────────────────────────
    for task_data in tasks_data:
        sub_todos_raw = task_data.get("sub_todos", [])
        db_task = models.Task(
            project_id=new_project.id,
            day=task_data.get("day", 1),
            name=task_data.get("name", ""),
            phase=task_data.get("phase", ""),
            task_type=task_data.get("task_type", "code"),
            description=task_data.get("description", ""),
            youtube_query=task_data.get("youtube_query", ""),
            duration=task_data.get("duration", ""),
            scheduled_date=task_data.get("scheduled_date", request.start_date),
            sub_todos=json.dumps(sub_todos_raw),
            calendar_event_id="",
        )
        db.add(db_task)

    db.commit()

    return {
        "project_id": new_project.id,
        "message": f"Plan generated and saved — {len(tasks_data)} tasks across {total_days} days ({estimated_weeks} weeks)",
        "total_days": total_days,
        "estimated_weeks": estimated_weeks,
        "phases": plan.get("phases", []),
        "tasks_saved": len(tasks_data),
        "plan": plan,
    }


# ──────────────────────────────────────────────────────────────
# DELETE /api/projects/{project_id}  —  remove project + all data
# ──────────────────────────────────────────────────────────────

@app.delete(
    "/api/projects/{project_id}",
    summary="Delete a project and all its tasks and email logs",
)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # ── 1. Delete Google Calendar events for synced tasks (best-effort) ──
    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .all()
    )
    calendar_deleted = 0
    calendar_errors  = 0
    for task in tasks:
        if task.calendar_event_id:
            try:
                delete_event(task.calendar_event_id)
                calendar_deleted += 1
            except Exception as e:
                print(f"[calendar] Could not delete event {task.calendar_event_id}: {e}")
                calendar_errors += 1

    # ── 2. Delete project row (cascades to tasks + email_logs) ──
    project_name = proj.name   # capture before delete
    db.delete(proj)
    db.commit()

    return {
        "message": f"Project '{project_name}' (id={project_id}) deleted successfully",
        "project_id": project_id,
        "calendar_events_deleted": calendar_deleted,
        "calendar_errors": calendar_errors,
    }


# ──────────────────────────────────────────────────────────────
# POST /api/projects/{project_id}/sync-calendar
#   Loads project + tasks from DB and pushes them to Google Calendar.
#   User only needs to provide the project_id (in the URL).
# ──────────────────────────────────────────────────────────────

@app.post(
    "/api/projects/{project_id}/sync-calendar",
    summary="Sync all project tasks to Google Calendar",
)
def sync_calendar(project_id: int, db: Session = Depends(get_db)):
    # Load project
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Load all tasks ordered by day
    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.day)
        .all()
    )
    if not tasks:
        raise HTTPException(status_code=404, detail="No tasks found for this project")

    # Build the list of task dicts that create_events expects
    tasks_for_calendar = [
        {
            "day":           t.day,
            "name":          t.name,
            "phase":         t.phase,
            "task_type":     t.task_type,
            "description":   t.description,
            "youtube_query": t.youtube_query,
            "duration":      t.duration,
            "scheduled_date": t.scheduled_date,
        }
        for t in tasks
    ]

    # Call Google Calendar
    try:
        created_events = create_events(
            tasks=tasks_for_calendar,
            slot=proj.slot,
            start_date=proj.start_date,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google Calendar sync failed: {e}",
        )

    # Write event IDs back to the task rows
    event_map = {ev["task_id"]: ev["event_id"] for ev in created_events}  # keyed by day
    synced = 0
    for t in tasks:
        if t.day in event_map:
            t.calendar_event_id = event_map[t.day]
            synced += 1
    db.commit()

    return {
        "message": f"Synced {synced} tasks to Google Calendar for project ‘{proj.name}’",
        "project_id": project_id,
        "synced_tasks": synced,
        "total_tasks": len(tasks),
        "events": created_events,
    }




# ──────────────────────────────────────────────────────────────
# GET /api/projects  —  list all projects with summary stats
#   Also aliased at GET /api/dashboard for backward compat
# ──────────────────────────────────────────────────────────────

@app.get(
    "/api/projects",
    response_model=schemas.ProjectListResponse,
    summary="List all projects with summary stats",
)
@app.get(
    "/api/dashboard",
    response_model=schemas.ProjectListResponse,
    summary="Alias of /api/projects (dashboard view)",
    include_in_schema=False,
)
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).order_by(models.Project.id.desc()).all()

    summaries: list[schemas.ProjectSummary] = []
    for proj in projects:
        tasks = (
            db.query(models.Task)
            .filter(models.Task.project_id == proj.id)
            .order_by(models.Task.day)
            .all()
        )
        done = sum(1 for t in tasks if t.status == "done")
        summaries.append(
            schemas.ProjectSummary(
                id=proj.id,
                name=proj.name,
                description=proj.description,
                status=proj.status,
                completion_percent=_completion(tasks),
                total_tasks=len(tasks),
                done_tasks=done,
                stack=proj.stack,
                start_date=proj.start_date,
                daily_hours=proj.daily_hours,
                total_days=proj.total_days or 0,
                estimated_weeks=proj.estimated_weeks or 0,
            )
        )

    return schemas.ProjectListResponse(projects=summaries, total=len(summaries))


# ──────────────────────────────────────────────────────────────
# GET /api/projects/{project_id}  —  full project detail
# ──────────────────────────────────────────────────────────────

@app.get(
    "/api/projects/{project_id}",
    response_model=schemas.ProjectDetailResponse,
    summary="Full detail for a single project",
)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.day)
        .all()
    )

    today_task_obj = _today_task(tasks)
    upcoming = _upcoming(tasks, n=5)
    done_count = sum(1 for t in tasks if t.status == "done")
    calendar_synced = any(t.calendar_event_id for t in tasks)

    return schemas.ProjectDetailResponse(
        id=proj.id,
        name=proj.name,
        description=proj.description,
        stack=proj.stack,   
        status=proj.status,
        start_date=proj.start_date,
        daily_hours=proj.daily_hours,
        total_days=proj.total_days or 0,
        estimated_weeks=proj.estimated_weeks or 0,
        total_tasks=len(tasks),
        done_tasks=done_count,
        completion_percent=_completion(tasks),
        days_left=_days_left(tasks),
        streak=_streak(tasks),
        xp=_xp(tasks),
        today_task=today_task_obj,
        upcoming_tasks=upcoming,
        calendar_synced=calendar_synced,
    )


# ──────────────────────────────────────────────────────────────
# GET /api/projects/{project_id}/plan  —  full task list
# ──────────────────────────────────────────────────────────────

@app.get(
    "/api/projects/{project_id}/plan",
    response_model=schemas.ProjectPlanResponse,
    summary="Full ordered task list for a project with progress stats",
)
def get_project_plan(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.day)
        .all()
    )

    done_count = sum(1 for t in tasks if t.status == "done")
    pending_count = len(tasks) - done_count

    return schemas.ProjectPlanResponse(
        project_id=proj.id,
        project_name=proj.name,
        status=proj.status,
        stats=schemas.PlanStats(
            total_tasks=len(tasks),
            done_tasks=done_count,
            pending_tasks=pending_count,
            completion_percent=_completion(tasks),
            days_left=_days_left(tasks),
        ),
        tasks=tasks,
    )


# ──────────────────────────────────────────────────────────────
# POST /api/tasks/{task_id}/complete  —  toggle done / pending
# ──────────────────────────────────────────────────────────────

@app.post(
    "/api/tasks/{task_id}/complete",
    response_model=schemas.TaskCompleteResponse,
    summary="Toggle a task between done and pending",
)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Toggle: if already done → revert to pending; if pending → done
    new_status = "pending" if task.status == "done" else "done"
    task.status = new_status
    db.commit()
    db.refresh(task)

    return schemas.TaskCompleteResponse(
        message=f"Task {'marked as done' if new_status == 'done' else 'reverted to pending'}",
        task_id=task_id,
        new_status=new_status,
    )
