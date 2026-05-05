from claude_planner import generate_plan

plan = generate_plan(
    project_name="Second Brain Voice Journal",
    description="A voice journaling app where you talk and it transcribes, tags your mood, and lets you query past entries using AI",
    stack=["Whisper API", "React", "FastAPI", "Gemini API"],
    daily_hours=2,
    start_date="2025-05-06",
    existing_skills=["React", "FastAPI"],   # skips learning days for these
    available_days="weekdays"               # skips weekends
)

print(f"✅ Plan generated!")
print(f"Total days  : {plan['total_days']}")
print(f"Est. weeks  : {plan['estimated_weeks']}")
print(f"\nFull task list:")
for task in plan["tasks"]:
    if task["task_type"] == "learn":
        icon = "📺"
    elif task["task_type"] == "buffer":
        icon = "🔄"
    else:
        icon = "💻"

    print(f"\n  Day {task['day']:02d} | {icon} | [{task['phase']}] {task['name']} — {task['scheduled_date']}")

    if task["sub_todos"]:
        for todo in task["sub_todos"]:
            print(f"           ↳ {todo['todo']} ({todo['estimated_minutes']} min)")

    if task["youtube_query"]:
        print(f"           📎 Search: {task['youtube_query']}")