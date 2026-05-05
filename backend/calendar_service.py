import os
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

TOKEN_PATH = os.getenv("GOOGLE_TOKEN_PATH", "google_auth/token.json")
SCOPES = ["https://www.googleapis.com/auth/calendar"]

SLOT_TIMES = {
    "morning": {"start": "11:00", "end": "13:00"},
    "evening": {"start": "18:00", "end": "21:00"},
}

PHASE_COLORS = {
    "Tech Stack Learning": "7",   # peacock blue
    "Frontend":           "2",   # sage green
    "Backend":            "6",   # tangerine
    "Integration":        "3",   # grape
    "Testing & Deploy":   "4",   # flamingo
}


def get_calendar_service():
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("calendar", "v3", credentials=creds)


def create_events(tasks: list, slot: str, start_date: str):
    """
    tasks = list of task dicts from claude_planner
    slot  = "morning" or "evening"
    start_date = "2024-01-15"

    Returns: list of {task_id, event_id, scheduled_date}
    """
    service = get_calendar_service()
    slot_time = SLOT_TIMES[slot]
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    created = []

    for task in tasks:
        date_str = current_date.strftime("%Y-%m-%d")
        start_dt = f"{date_str}T{slot_time['start']}:00"
        end_dt   = f"{date_str}T{slot_time['end']}:00"

        youtube_link = ""
        if task.get("youtube_query"):
            query = task["youtube_query"].replace(" ", "+")
            youtube_link = f"\n📺 Watch: https://www.youtube.com/results?search_query={query}"

        event_body = {
            "summary": f"[LIFEOS] Day {task['day']} — {task['name']}",
            "description": (
                f"Phase: {task['phase']}\n"
                f"Type: {task['task_type']}\n"
                f"Task: {task.get('description', task['name'])}"
                f"{youtube_link}"
            ),
            "start": {"dateTime": start_dt, "timeZone": "Asia/Kolkata"},
            "end":   {"dateTime": end_dt,   "timeZone": "Asia/Kolkata"},
            "colorId": PHASE_COLORS.get(task["phase"], "1"),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup",  "minutes": 10},
                    {"method": "email",  "minutes": 30},
                ],
            },
        }

        result = service.events().insert(
            calendarId="primary", body=event_body
        ).execute()

        created.append({
            "task_id":        task["day"],
            "event_id":       result["id"],
            "scheduled_date": date_str,
        })

        print(f"📅 Created: Day {task['day']} — {task['name']} on {date_str}")
        current_date += timedelta(days=1)

    return created


def update_event(event_id: str, new_date: str, slot: str):
    """
    Moves an existing calendar event to a new date.
    Called by reschedule.py when user replies RESCHEDULE.
    """
    service = get_calendar_service()
    slot_time = SLOT_TIMES[slot]

    start_dt = f"{new_date}T{slot_time['start']}:00"
    end_dt   = f"{new_date}T{slot_time['end']}:00"

    event = service.events().get(
        calendarId="primary", eventId=event_id
    ).execute()

    event["start"] = {"dateTime": start_dt, "timeZone": "Asia/Kolkata"}
    event["end"]   = {"dateTime": end_dt,   "timeZone": "Asia/Kolkata"}

    updated = service.events().update(
        calendarId="primary", eventId=event_id, body=event
    ).execute()

    print(f"🔄 Event moved to {new_date}: {updated['summary']}")
    return updated["id"]


def delete_event(event_id: str):
    service = get_calendar_service()
    service.events().delete(
        calendarId="primary", eventId=event_id
    ).execute()
    print(f"🗑️ Event deleted: {event_id}")


def find_next_free_date(from_date: str, existing_dates: list):
    """
    Finds the next date not already occupied by a task.
    existing_dates = list of "YYYY-MM-DD" strings already scheduled.
    """
    current = datetime.strptime(from_date, "%Y-%m-%d") + timedelta(days=1)
    while True:
        candidate = current.strftime("%Y-%m-%d")
        if candidate not in existing_dates:
            return candidate
        current += timedelta(days=1)