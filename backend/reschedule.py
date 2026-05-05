from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Task, Project
from calendar_service import update_event, find_next_free_date


def reschedule_task(task_id: int, db: Session):
    """
    Called when user replies RESCHEDULE to a task email.
    Moves the task to the next available date.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        print(f"❌ Task {task_id} not found")
        return None

    project = task.project

    # Get all scheduled dates for this project (excluding current task)
    existing_dates = [
        t.scheduled_date for t in db.query(Task).filter(
            Task.project_id == project.id,
            Task.id != task_id
        ).all()
    ]

    # Find next available date
    current_date = datetime.strptime(task.scheduled_date, "%Y-%m-%d")
    next_date = find_next_free_date(
        current_date.strftime("%Y-%m-%d"),
        existing_dates
    )

    # Handle weekend skip if weekdays only
    if project.available_days == "weekdays":
        next_dt = datetime.strptime(next_date, "%Y-%m-%d")
        while next_dt.weekday() >= 5:  # 5=Sat, 6=Sun
            next_dt += timedelta(days=1)
        next_date = next_dt.strftime("%Y-%m-%d")

    # Update task in database
    old_date = task.scheduled_date           # capture BEFORE overwriting
    task.scheduled_date = next_date
    task.status = "rescheduled"

    # Update calendar event if it exists
    if task.calendar_event_id:
        update_event(
            event_id=task.calendar_event_id,
            new_date=next_date,
            slot=project.slot
        )

    db.commit()

    print(f"✅ Task {task_id} rescheduled from {old_date} → {next_date}")
    return {
        "task_id":   task_id,
        "task_name": task.name,
        "old_date":  old_date,
        "new_date":  next_date,
    }


def check_and_reschedule_expired_tasks(db: Session):
    """
    Runs daily. Checks if any task's scheduled date has passed
    and user hasn't marked it done. Auto-reschedules to next slot.
    """
    today = datetime.now().strftime("%Y-%m-%d")

    expired_tasks = db.query(Task).filter(
        Task.scheduled_date < today,
        Task.status == "pending"
    ).all()

    rescheduled_count = 0
    for task in expired_tasks:
        reschedule_task(task.id, db)
        rescheduled_count += 1

    if rescheduled_count > 0:
        print(f"✅ Auto-rescheduled {rescheduled_count} expired tasks")

    return rescheduled_count