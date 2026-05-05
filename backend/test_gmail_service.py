from gmail_service import send_task_email, poll_replies
import time

test_task = {
    "day": 1,
    "name": "Learn Whisper API basics",
    "phase": "Tech Stack Learning",
    "task_type": "learn",
    "youtube_query": "whisper api python tutorial 2024",
    "duration": "2 hours",
    "description": "Understand how Whisper transcription works"
}

# Comment this out if you already sent the email
# send_task_email("narlavenkatadurgabhavyasri@gmail.com", test_task)

print("⏳ Polling for your reply... (checking every 10 seconds)")
print("Go reply DONE or RESCHEDULE to the email now!\n")

for i in range(12):  # checks 12 times = 2 minutes max
    result = poll_replies(day=1)
    
    if result == "done":
        print("✅ Reply detected: DONE — marking task complete!")
        break
    elif result == "reschedule":
        print("🔄 Reply detected: RESCHEDULE — will move to next slot!")
        break
    else:
        print(f"  No reply yet... check {i+1}/12")
        time.sleep(10)

if result is None:
    print("⏰ No reply found in 2 minutes — in real app, scheduler retries later.")