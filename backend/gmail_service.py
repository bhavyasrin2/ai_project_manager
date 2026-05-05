import os
import base64
import re
from email.message import EmailMessage
from datetime import datetime, timezone, timedelta

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

TOKEN_PATH = os.getenv("GOOGLE_TOKEN_PATH", "google_auth/token.json")
SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
]


def get_gmail_service():
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("gmail", "v1", credentials=creds)


def send_task_email(to_email: str, task: dict):
    """
    task = {
        "day": 3,
        "name": "Learn Whisper API basics",
        "phase": "Tech Stack Learning",
        "task_type": "learn",
        "youtube_query": "whisper api python tutorial",
        "duration": "2 hours",
        "description": "Watch intro to Whisper API..."
    }
    """
    service = get_gmail_service()

    youtube_link = f"https://www.youtube.com/results?search_query={task['youtube_query'].replace(' ', '+')}"

    if task["task_type"] == "learn":
        action_line = f"📺 Watch: <a href='{youtube_link}'>{task['youtube_query']}</a>"
    else:
        action_line = f"💻 Today you code: <b>{task['description']}</b>"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1a73e8;">Life OS — Day {task['day']} Briefing</h2>
        <hr/>
        <p><b>Phase:</b> {task['phase']}</p>
        <p><b>Task:</b> {task['name']}</p>
        <p><b>Estimated time:</b> {task['duration']}</p>
        <p>{action_line}</p>
        <hr/>
        <p style="color: #555;">When you're done, reply to this email with one of these:</p>
        <p>
            <span style="background:#34a853;color:white;padding:6px 14px;border-radius:4px;">DONE</span>
            &nbsp;&nbsp;
            <span style="background:#ea4335;color:white;padding:6px 14px;border-radius:4px;">RESCHEDULE</span>
        </p>
        <p style="color:#aaa;font-size:12px;">Just reply with the word DONE or RESCHEDULE — nothing else needed.</p>
    </div>
    """

    msg = EmailMessage()
    msg["To"] = to_email
    msg["From"] = to_email
    msg["Subject"] = f"[LIFEOS-DAY-{task['day']}] {task['name']}"
    msg.add_alternative(html_body, subtype="html")

    encoded = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    service.users().messages().send(
        userId="me", body={"raw": encoded}
    ).execute()

    print(f"✅ Email sent for Day {task['day']}: {task['name']}")


def poll_replies(day: int):
    """
    Checks inbox for a reply to today's LIFEOS email.
    Returns: 'done', 'reschedule', or None
    """
    service = get_gmail_service()
    subject_tag = f"LIFEOS-DAY-{day}"

    # Search inbox for any message with this subject tag in last 24h
    query = f"subject:{subject_tag} in:inbox newer_than:1d"
    results = service.users().messages().list(
        userId="me", q=query
    ).execute()

    messages = results.get("messages", [])
    if not messages:
        return None

    for msg_meta in messages:
        msg = service.users().messages().get(
            userId="me", id=msg_meta["id"], format="full"
        ).execute()

        headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}

        # Only process REPLIES — they must have an In-Reply-To header.
        # Skip the original outbound email we sent (no In-Reply-To).
        if "In-Reply-To" not in headers:
            continue

        # Extract body — try plain text first, fall back to HTML
        body = _extract_body(msg["payload"])
        body_upper = body.upper().strip()

        if "DONE" in body_upper:
            return "done"
        elif "RESCHEDULE" in body_upper:
            return "reschedule"

    return None


def _extract_body(payload: dict) -> str:
    """Recursively extract readable text from a Gmail message payload."""
    body = ""
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] in ("text/plain", "text/html"):
                data = part["body"].get("data", "")
                if data:
                    body += base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
            elif "parts" in part:          # nested multipart
                body += _extract_body(part)
    else:
        data = payload.get("body", {}).get("data", "")
        if data:
            body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    return body