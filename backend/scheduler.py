import os
import json
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
import models
from gmail_service import send_task_email, poll_replies
from reschedule import reschedule_task, check_and_reschedule_expired_tasks
from dotenv import load_dotenv

load_dotenv()

scheduler = BackgroundScheduler()

def get_db_session():
    return SessionLocal()

def job_send_daily_emails(force_slot: str = None, force_date: str = None):
    """
    Runs at 10:45 AM and 5:45 PM — 15 minutes before the calendar slot starts.
    Pass force_slot='morning'|'evening' to bypass time check (debug use).
    Pass force_date='YYYY-MM-DD' to override today's date (debug use when tasks have old dates).
    """
    db = get_db_session()
    today_str = force_date if force_date else datetime.now().strftime("%Y-%m-%d")

    if force_slot:
        target_slot = force_slot
    else:
        # APScheduler already fires this job at exactly 10:45 and 17:45.
        # Just use the hour to determine the slot — no minute range needed.
        current_hour = datetime.now().hour
        if current_hour == 10:
            target_slot = "morning"
        elif current_hour == 17:
            target_slot = "evening"
        else:
            target_slot = None

        if not target_slot:
            db.close()
            return

    print(f"📬 Sending daily emails for slot='{target_slot}', date={today_str}")

    tasks = db.query(models.Task).join(models.Project).filter(
        models.Project.status == "active",
        models.Project.slot == target_slot,
        models.Task.scheduled_date == today_str,
        models.Task.status == "pending"
    ).all()

    print(f"   Found {len(tasks)} task(s) to email.")

    for task in tasks:
        # Check if email already sent today
        existing_log = db.query(models.EmailLog).filter(models.EmailLog.task_id == task.id).first()
        if existing_log:
            print(f"   ⏭ Task {task.id} already emailed — skipping.")
            continue

        # Format sub_todos for email
        sub_todos = []
        try:
            sub_todos = json.loads(task.sub_todos)
        except Exception:
            pass

        desc = task.description
        if sub_todos:
            desc += "<br><br><b>Sub-tasks:</b><ul>"
            for st in sub_todos:
                desc += f"<li>{st.get('todo', '')} ({st.get('estimated_minutes', 0)} min)</li>"
            desc += "</ul>"

        task_dict = {
            "day": task.day,
            "name": task.name,
            "phase": task.phase,
            "task_type": task.task_type,
            "youtube_query": task.youtube_query,
            "duration": task.duration,
            "description": desc
        }

        to_email = os.getenv("YOUR_EMAIL", "narlavenkatadurgabhavyasri@gmail.com")
        
        try:
            send_task_email(to_email, task_dict)
            log = models.EmailLog(task_id=task.id, sent_at=datetime.now())
            db.add(log)
            db.commit()
            print(f"   📧 Sent email for Task {task.id} — Day {task.day}: {task.name}")
        except Exception as e:
            print(f"   ❌ Failed to send email for task {task.id}: {e}")

    db.close()


def job_poll_inbox(force: bool = False):
    """
    Runs every 30 minutes.
    Checks the inbox for replies to tasks that were emailed.
    Respects project slot: only polls tasks whose slot is currently active.
      - morning slot: 11:00 – 17:59 (poll from send time until evening)
      - evening slot: 18:00 – 23:59 and 00:00 – 02:59 (overnight grace)

    Pass force=True to bypass the slot-time window check (used by debug endpoint).
    """
    db = get_db_session()
    current_hour = datetime.now().hour

    # Determine which slots are currently in their active reply window
    active_slots = []
    if not force:
        if 11 <= current_hour < 18:
            active_slots.append("morning")
        if current_hour >= 18 or current_hour < 3:
            active_slots.append("evening")

    # Find email logs without replies
    logs = db.query(models.EmailLog).filter(models.EmailLog.replied_at == None).all()
    print(f"🔍 Polling inbox — {len(logs)} unreplied log(s) found. force={force}")

    for log in logs:
        task = db.query(models.Task).filter(models.Task.id == log.task_id).first()
        if not task or task.status == "done":
            continue

        # Only poll if the project's slot is currently active (skip check if force=True)
        project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
        if not force and project and active_slots and project.slot not in active_slots:
            continue  # not the right time window — skip until next poll

        print(f"   Checking reply for Task {task.id} (Day {task.day}): {task.name}")
        reply = poll_replies(task.day)
        print(f"   → reply: {reply}")

        if reply == "done":
            task.status = "done"
            log.replied_at = datetime.now()
            log.reply_type = "done"
            db.commit()
            print(f"   ✅ Task {task.id} (Day {task.day}) marked DONE via email reply.")

        elif reply == "reschedule":
            reschedule_task(task.id, db)
            log.replied_at = datetime.now()
            log.reply_type = "reschedule"
            db.commit()
            print(f"   🔄 Task {task.id} (Day {task.day}) RESCHEDULED via email reply.")

    db.close()


def job_auto_reschedule():
    """
    Runs daily at 2 AM. Auto-reschedules tasks from yesterday.
    """
    db = get_db_session()
    check_and_reschedule_expired_tasks(db)
    db.close()


def start_scheduler():
    # Send emails 15 min before each calendar slot:
    #   10:45 AM → morning slot (calendar at 11:00 AM)
    #   05:45 PM → evening slot (calendar at 06:00 PM)
    # replace_existing=True prevents duplicate jobs when uvicorn --reload restarts.
    scheduler.add_job(
        job_send_daily_emails, 'cron',
        hour='10,17', minute=45,
        id='send_daily_emails', replace_existing=True
    )
    scheduler.add_job(
        job_poll_inbox, 'interval',
        minutes=30,
        id='poll_inbox', replace_existing=True
    )
    scheduler.add_job(
        job_auto_reschedule, 'cron',
        hour=2,
        id='auto_reschedule', replace_existing=True
    )
    scheduler.start()
    print("⏳ Background scheduler started. Cron jobs are active.")
    print(f"   send_daily_emails → 10:45 AM and 5:45 PM daily")
    print(f"   poll_inbox        → every 30 minutes")
    print(f"   auto_reschedule   → 2:00 AM daily")

def stop_scheduler():
    scheduler.shutdown()
    print("🛑 Background scheduler stopped.")
