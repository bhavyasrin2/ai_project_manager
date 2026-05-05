import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generatePlan } from "../api/client";

// Map the work-window dropdown label → { slot, daily_hours }
const WINDOW_MAP = {
  "11 AM – 1 PM (2 hrs)": { slot: "morning", daily_hours: 2 },
  "6 PM – 9 PM (3 hrs)":  { slot: "evening", daily_hours: 3 },
  "8 AM – 10 AM (2 hrs)": { slot: "morning", daily_hours: 2 },
  "9 PM – 11 PM (2 hrs)": { slot: "evening", daily_hours: 2 },
  "Flexible":              { slot: "evening", daily_hours: 2 },
};

// Map duration dropdown → approximate total_days
const DURATION_MAP = {
  "1 week":   7,
  "2 weeks":  14,
  "1 month":  30,
  "2 months": 60,
  "3 months": 90,
};

export default function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const windowLabel   = document.getElementById("work-window").value;
    const durationLabel = document.getElementById("duration").value;
    const { slot, daily_hours } = WINDOW_MAP[windowLabel] || { slot: "evening", daily_hours: 2 };
    const total_days = DURATION_MAP[durationLabel] || 14;

    const stackRaw = document.getElementById("tech-stack").value;
    const stack    = stackRaw ? stackRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

    // start_date = today
    const start_date = new Date().toISOString().split("T")[0];

    const payload = {
      project_name:    document.getElementById("project-name").value.trim(),
      description:     document.getElementById("project-desc").value.trim(),
      stack,
      daily_hours,
      start_date,
      existing_skills: [],
      available_days:  "all",
      slot,
      total_days,
    };

    try {
      const data = await generatePlan(payload);
      // Backend returns { project_id, ... }
      navigate(`/projects/${data.project_id}`);
    } catch (err) {
      setError(err.message || "Failed to generate plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      {/* Back link */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate("/")}>
          ← Back
        </button>
        <div style={s.topLogo}>
          <div style={s.logoIcon}>✦</div>
          <span style={s.logoText}>AI Manager</span>
        </div>
      </div>

      <div style={s.center}>
        {/* Header */}
        <div style={s.header} className="anim-fade-up">
          <div style={s.heroPill}>🚀 &nbsp;New Project Setup</div>
          <h1 style={s.heading}>
            Create Your{" "}
            <span className="gradient-text">AI-Powered</span>
            <br />
            Project Plan
          </h1>
          <p style={s.sub}>
            Tell us about your project and we'll generate an intelligent
            day-by-day roadmap tailored to your schedule.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={s.errorBanner}>⚠️ {error}</div>
        )}

        {/* Form card */}
        <form style={s.card} onSubmit={handleSubmit} className="anim-fade-up anim-delay-2">
          <div style={s.fieldGroup}>
            <label style={s.label}>Project Name</label>
            <input
              id="project-name"
              placeholder="e.g. AI Project Manager"
              style={s.input}
              required
              disabled={loading}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Project Description</label>
            <textarea
              id="project-desc"
              placeholder="Describe what you're building, the goals, and any constraints..."
              style={s.textarea}
              required
              disabled={loading}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Tech Stack</label>
            <input
              id="tech-stack"
              placeholder="e.g. React, FastAPI, PostgreSQL, Gemini AI"
              style={s.input}
              disabled={loading}
            />
          </div>

          <div style={s.row}>
            <div style={{ ...s.fieldGroup, flex: 1 }}>
              <label style={s.label}>Daily Work Window</label>
              <select id="work-window" style={s.select} disabled={loading}>
                <option>11 AM – 1 PM (2 hrs)</option>
                <option>6 PM – 9 PM (3 hrs)</option>
                <option>8 AM – 10 AM (2 hrs)</option>
                <option>9 PM – 11 PM (2 hrs)</option>
                <option>Flexible</option>
              </select>
            </div>

            <div style={{ ...s.fieldGroup, flex: 1 }}>
              <label style={s.label}>Target Duration</label>
              <select id="duration" style={s.select} disabled={loading}>
                <option>1 week</option>
                <option>2 weeks</option>
                <option>1 month</option>
                <option>2 months</option>
                <option>3 months</option>
              </select>
            </div>
          </div>

          <button
            id="generate-plan-btn"
            type="submit"
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
          >
            {loading ? "⏳ Generating AI Plan…" : "✦ Generate AI Plan"}
          </button>
        </form>
      </div>
    </div>
  );
}


const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(170deg, #08050f 0%, #0d0820 50%, #08050f 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  errorBanner: {
    maxWidth: 640,
    margin: "0 auto 16px",
    padding: "12px 20px",
    borderRadius: 10,
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#fca5a5",
    fontSize: 14,
  },
  orb1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "rgba(124,58,237,0.15)", filter: "blur(100px)",
    top: -100, right: -100, pointerEvents: "none",
  },
  orb2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "rgba(99,102,241,0.1)", filter: "blur(80px)",
    bottom: -80, left: -80, pointerEvents: "none",
  },
  topBar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 clamp(20px,4vw,48px)",
    background: "rgba(8,5,15,0.8)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  backBtn: {
    background: "transparent", color: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999,
    padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    transition: "all 0.2s",
  },
  topLogo: { display: "flex", alignItems: "center", gap: 9 },
  logoIcon: {
    width: 28, height: 28, borderRadius: 7,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
  },
  logoText: { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" },
  center: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "100px clamp(16px,4vw,40px) 60px",
    position: "relative", zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: 40, maxWidth: 560 },
  heroPill: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 14px", borderRadius: 999, marginBottom: 20,
    fontSize: 12, fontWeight: 600, color: "#c084fc",
    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)",
    letterSpacing: "0.04em",
  },
  heading: {
    fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800,
    lineHeight: 1.12, letterSpacing: "-0.035em", marginBottom: 14, color: "#fff",
  },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 },
  card: {
    width: "100%", maxWidth: 560,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 24, padding: "36px",
    backdropFilter: "blur(24px)",
    display: "flex", flexDirection: "column", gap: 22,
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, padding: "12px 16px",
    color: "#fff", fontSize: 14, outline: "none",
    transition: "all 0.22s", width: "100%",
    fontFamily: "'Inter', sans-serif",
  },
  textarea: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, padding: "12px 16px",
    color: "#fff", fontSize: 14, outline: "none",
    transition: "all 0.22s", width: "100%",
    fontFamily: "'Inter', sans-serif",
    resize: "vertical", minHeight: 96,
  },
  select: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, padding: "12px 16px",
    color: "#fff", fontSize: 14, outline: "none",
    width: "100%", fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
  },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  submitBtn: {
    padding: "14px 28px", fontSize: 15, fontWeight: 700,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    color: "#fff", borderRadius: 12, border: "none", cursor: "pointer",
    boxShadow: "0 0 28px rgba(124,58,237,0.45)",
    transition: "all 0.25s", letterSpacing: "0.01em",
    marginTop: 4,
  },
};