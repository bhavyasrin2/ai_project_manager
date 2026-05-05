from calendar_service import create_events, update_event

# Fake 3 tasks — same shape Claude will return later
test_tasks = [
    {
        "day": 1,
        "name": "Learn Whisper API basics",
        "phase": "Tech Stack Learning",
        "task_type": "learn",
        "youtube_query": "whisper api python tutorial 2024",
        "description": "Understand Whisper transcription",
    },
    {
        "day": 2,
        "name": "Learn React hooks",
        "phase": "Tech Stack Learning",
        "task_type": "learn",
        "youtube_query": "react hooks tutorial 2024",
        "description": "useEffect and useState deep dive",
    },
    {
        "day": 3,
        "name": "Build recording UI",
        "phase": "Frontend",
        "task_type": "code",
        "youtube_query": "",
        "description": "Create the mic button and waveform display in React",
    },
]

# Change start_date to tomorrow so events appear upcoming
created = create_events(
    tasks=test_tasks,
    slot="evening",
    start_date="2025-05-05"
)

print("\n✅ All events created!")
print("Event IDs saved:", [c["event_id"] for c in created])

# Test reschedule — move day 1 event to a new date
print("\n🔄 Testing reschedule on Day 1 event...")
update_event(
    event_id=created[0]["event_id"],
    new_date="2025-05-08",
    slot="evening"
)