import os
import json
import re  # 1. Added regex for safer parsing
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "planner_prompt.txt")

def load_prompt(project_name, description, stack, daily_hours, start_date, existing_skills, available_days, slot):
    # 2. Force encoding="utf-8" to fix the charmap error
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    return template.format(
        project_name=project_name,
        description=description,
        stack_str=", ".join(stack),
        daily_hours=daily_hours,
        start_date=start_date,
        existing_skills=", ".join(existing_skills) if existing_skills else "None",
        available_days=available_days,
        slot=slot
    )

def generate_plan(project_name, description, stack, daily_hours, start_date, existing_skills, available_days, slot):
    prompt = load_prompt(project_name, description, stack, daily_hours, start_date, existing_skills, available_days, slot)
    
    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    # 3. Robust Regex Extraction
    # This looks for the first '{' and the last '}'
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        raise ValueError("The model did not return a valid JSON object.")
    
    clean_json = match.group(0)
    plan = json.loads(clean_json)

    # Date Logic
    current_date = datetime.strptime(start_date, "%Y-%m-%d")
    for task in plan.get("tasks", []):
        if available_days == "weekdays":
            while current_date.weekday() >= 5: 
                current_date += timedelta(days=1)
        task["scheduled_date"] = current_date.strftime("%Y-%m-%d")
        current_date += timedelta(days=1)

    return plan