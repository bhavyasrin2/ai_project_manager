import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProject, completeTask, syncCalendar } from "../api/client";

const TYPE_ICON = { learn: "📖", code: "💻", buffer: "☕" };
const PHASE_COLOR = {
  "Tech Stack Learning": "#61dafb",
  Frontend:             "#a855f7",
  Backend:              "#f97316",
  Integration:          "#22d3ee",
  "Testing & Deploy":   "#4ade80",
  Buffer:               "#6b7280",
};
const phaseColor = (phase) => PHASE_COLOR[phase] || "#a855f7";

export default function ProjectDetailDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proj, setProj]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [marking, setMarking]   = useState(false);
  const [showAll, setShowAll]   = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState(null); // success message after sync

  const load = () => {
    setLoading(true);
    getProject(id)
      .then(setProj)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleMarkDone = async () => {
    if (!proj?.today_task) return;
    setMarking(true);
    try {
      await completeTask(proj.today_task.id);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setMarking(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncCalendar(id);
      setSyncMsg(`✓ ${res.synced_tasks} events added to Google Calendar`);
      load(); // refresh so calendar_synced flips to true
    } catch (e) {
      alert(`Calendar sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={s.muted}>Loading project…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={s.page}>
      <div style={s.center}>
        <p style={{ color: "#f87171", marginBottom: 16 }}>⚠️ {error}</p>
        <button style={s.backBtn} onClick={() => navigate("/projects")}>← Back</button>
      </div>
    </div>
  );

  const color       = phaseColor(proj.today_task?.phase || "");
  const accentColor = "#a855f7";
  const progress    = proj.completion_percent ?? 0;
  const isDone      = proj.status === "completed";
  const stacks      = proj.stack.split(",").map((s) => s.trim());
  const upcomingVisible = showAll ? proj.upcoming_tasks : proj.upcoming_tasks?.slice(0, 3);

  return (
    <div style={s.page}>
      <div style={{ ...s.orb, background: `${accentColor}20`, top: -120, right: -100 }} />
      <div style={{ ...s.orb, width: 300, height: 300, background: "rgba(59,130,246,0.08)", bottom: 60, left: -80 }} />

      {/* Nav */}
      <nav style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate("/projects")}>← All Projects</button>
        <div style={s.navLogo}>
          <div style={s.logoIcon}>✦</div>
          <span style={s.logoText}><span className="gradient-text">AI</span> Manager</span>
        </div>
        <button style={s.calBtn} onClick={() => navigate(`/project/${id}/plan`)}>📋 Full Plan</button>
      </nav>

      <div style={s.content}>

        {/* ── Hero ── */}
        <div className="anim-fade-up" style={s.hero}>
          <div style={s.stackRow}>
            {stacks.map((st) => (
              <span key={st} style={s.stackPill}>{st}</span>
            ))}
            <span style={{ ...s.statusBadge, background: isDone ? "rgba(74,222,128,0.12)" : "rgba(168,85,247,0.12)", color: isDone ? "#4ade80" : "#c084fc", borderColor: isDone ? "rgba(74,222,128,0.3)" : "rgba(168,85,247,0.3)" }}>
              {isDone ? "✓ Completed" : "● Active"}
            </span>
          </div>
          <h1 style={s.heading}>{proj.name}</h1>
          <p style={s.sub}>{proj.description}</p>
          <div style={s.metaRow}>
            <span style={s.metaPill}>📅 Started {proj.start_date}</span>
            {proj.total_days > 0 && <span style={s.metaPill}>🗓 {proj.total_days} days</span>}
            {proj.estimated_weeks > 0 && <span style={s.metaPill}>📆 {proj.estimated_weeks} weeks</span>}
            <span style={s.metaPill}>⏰ {proj.daily_hours}h/day</span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div style={s.progressCard} className="anim-fade-up anim-delay-1">
          <div style={s.progressHeader}>
            <span style={s.progressLabel}>Overall Progress</span>
            <span style={{ ...s.progressPct, color: isDone ? "#4ade80" : accentColor }}>
              {progress.toFixed(1)}%{isDone && " ✓"}
            </span>
          </div>
          <div style={s.progressTrack}>
            <div style={{
              ...s.progressFill,
              width: `${progress}%`,
              background: isDone ? "linear-gradient(90deg,#4ade80,#22d3ee)" : `linear-gradient(90deg,${accentColor},#6366f1)`,
              boxShadow: `0 0 12px ${accentColor}88`,
            }} />
          </div>
          <div style={s.progressMeta}>
            <span style={s.muted}>{proj.done_tasks} of {proj.total_tasks} tasks done</span>
            <span style={s.muted}>{proj.days_left} remaining</span>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={s.statsRow} className="anim-fade-up anim-delay-2">
          {[
            { icon: "📈", label: "Progress",   value: `${progress.toFixed(1)}%` },
            { icon: "🔥", label: "Streak",     value: `${proj.streak} days` },
            { icon: "⚡", label: "XP Earned",  value: `${proj.xp} XP` },
            { icon: "📅", label: "Days Left",  value: proj.days_left },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statIcon}>{st.icon}</div>
              <div style={{ ...s.statVal, color: accentColor }}>{st.value}</div>
              <div style={s.statLbl}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* ── Two col: Today's task + Quick info ── */}
        <div style={s.twoCol} className="anim-fade-up anim-delay-3">

          {/* Today's Task */}
          <div style={{ ...s.card, borderColor: `${color}33` }}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Today's Task</h3>
              <span style={s.liveBadge}>● Live</span>
            </div>

            {proj.today_task ? (
              <>
                <div style={s.todayTask}>
                  <div style={{ ...s.taskIcon, background: `${color}22`, borderColor: `${color}44` }}>
                    {TYPE_ICON[proj.today_task.task_type] || "🎯"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.taskTitle}>{proj.today_task.name}</p>
                    <p style={s.taskSub}>
                      {proj.today_task.phase} &nbsp;·&nbsp; Day {proj.today_task.day}
                      &nbsp;·&nbsp; {proj.today_task.scheduled_date}
                    </p>
                    <span style={{ ...s.typeBadge, color, borderColor: `${color}44`, background: `${color}15` }}>
                      {proj.today_task.task_type}
                    </span>
                  </div>
                </div>

                {proj.today_task.sub_todos?.length > 0 && (
                  <div style={s.subTodos}>
                    {proj.today_task.sub_todos.map((st, i) => (
                      <div key={i} style={s.subTodoItem}>
                        <div style={s.subTodoDot} />
                        <span style={s.subTodoText}>{st.todo} <span style={s.mins}>~{st.estimated_minutes}m</span></span>
                      </div>
                    ))}
                  </div>
                )}

                {/* <button
                  id="mark-done-btn"
                  disabled={marking || proj.today_task.status === "done"}
                  style={{
                    ...s.markBtn,
                    background: proj.today_task.status === "done"
                      ? "rgba(74,222,128,0.15)"
                      : `linear-gradient(135deg, ${accentColor}, #6366f1)`,
                    color: proj.today_task.status === "done" ? "#4ade80" : "#fff",
                  }}
                  onClick={handleMarkDone}
                >
                  {proj.today_task.status === "done" ? "✓ Done" : marking ? "Saving…" : "✓ Mark as Done"}
                </button> */}

                  {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <button style={s.syncBtn} onClick={() => navigate(`/project/${id}/plan`)}>
                📋 View Full Plan →
                  </button>

                  { !proj.calendar_synced && (
                     <p style={s.taskTitle}>Add to your calendar to get tasks informed daily</p>
                  )}
                 
              <button
                id="sync-calendar-btn"
                disabled={syncing}
                style={{
                  ...s.calSyncBtn,
                  background: proj.calendar_synced
                    ? "rgba(74,222,128,0.12)"
                    : "rgba(168,85,247,0.15)",
                  borderColor: proj.calendar_synced
                    ? "rgba(74,222,128,0.35)"
                    : "rgba(168,85,247,0.4)",
                  color: proj.calendar_synced ? "#4ade80" : "#c084fc",
                }}
                onClick={handleSync}
              >
                {syncing
                  ? "Syncing…"
                  : proj.calendar_synced
                  ? "✓ Calendar Synced  (Re-sync)"
                  : "🗓 Sync to Calendar"}
              </button>
              {syncMsg && <p style={{ fontSize: 12, color: "#4ade80", textAlign: "center" }}>{syncMsg}</p>}
            </div>
              </>
            ) : (
              <div style={s.emptyTask}>
                <span style={{ fontSize: 32 }}>🎉</span>
                <p style={s.muted}>All tasks complete for today!</p>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Project Info</h3>
            <div style={s.infoGrid}>
              {[
                ["Status",     proj.status.charAt(0).toUpperCase() + proj.status.slice(1)],
                ["Start Date", proj.start_date],
                ["Total Days", proj.total_days || proj.total_tasks],
                ["Est. Weeks", proj.estimated_weeks || "—"],
                ["Daily Hours",`${proj.daily_hours}h`],
                ["Tasks Done", `${proj.done_tasks} / ${proj.total_tasks}`],
              ].map(([k, v]) => (
                <div key={k} style={s.infoRow}>
                  <span style={s.infoKey}>{k}</span>
                  <span style={s.infoVal}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <p style={{ ...s.muted, marginBottom: 8 }}>Stack</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {stacks.map((st) => (
                  <span key={st} style={s.stackPill}>{st}</span>
                ))}
              </div>
            </div>

           
          </div>
        </div>

        {/* ── Upcoming Tasks ── */}
        <div style={s.card} className="anim-fade-up anim-delay-4">
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Upcoming Tasks</h3>
            <span style={s.muted}>{proj.upcoming_tasks?.length ?? 0} pending</span>
          </div>

          {proj.upcoming_tasks?.length === 0 ? (
            <p style={s.muted}>No upcoming tasks.</p>
          ) : (
            <>
              <div style={s.taskList}>
                {upcomingVisible?.map((t, i) => {
                  const tc = phaseColor(t.phase);
                  return (
                    <div key={t.id} style={s.taskRow}>
                      <div style={s.timelineLeft}>
                        <div style={{ ...s.dot, background: t.status === "done" ? "#4ade80" : tc, boxShadow: `0 0 8px ${tc}88` }} />
                        {i < upcomingVisible.length - 1 && <div style={s.line} />}
                      </div>
                      <div style={s.taskBody}>
                        <div style={s.taskRowTop}>
                          <span style={s.dayTag}>Day {t.day}</span>
                          <span style={{ ...s.phasePill, color: tc, borderColor: `${tc}44`, background: `${tc}15` }}>{t.phase}</span>
                          <span style={s.typeTag}>{TYPE_ICON[t.task_type]} {t.task_type}</span>
                          {t.status === "done" && <span style={s.donePill}>✓ Done</span>}
                        </div>
                        <p style={{ ...s.taskName, textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.5 : 1 }}>
                          {t.name}
                        </p>
                        <div style={s.taskMeta}>
                          <span style={s.muted}>📅 {t.scheduled_date}</span>
                          {t.duration && <span style={s.muted}>⏱ {t.duration}</span>}
                          {t.youtube_query && (
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t.youtube_query)}`}
                              target="_blank" rel="noreferrer"
                              style={s.ytLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              📺 Watch
                            </a>
                          )}
                        </div>
                        {t.sub_todos?.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                            {t.sub_todos.map((st, si) => (
                              <div key={si} style={s.subTodoItem}>
                                <div style={{ ...s.subTodoDot, background: tc }} />
                                <span style={s.subTodoText}>{st.todo} <span style={s.mins}>~{st.estimated_minutes}m</span></span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {proj.upcoming_tasks?.length > 3 && (
                <div style={s.viewMoreRow}>
                  <button style={s.viewMoreBtn} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "▲ Show Less" : `▼ View More (${proj.upcoming_tasks.length - 3} more)`}
                  </button>
                  <button style={s.fullPlanBtn} onClick={() => navigate(`/project/${id}/plan`)}>
                    Full Plan →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", background: "linear-gradient(170deg,#08050f 0%,#0d0820 50%,#08050f 100%)", fontFamily: "'Inter',sans-serif", position: "relative", overflow: "hidden" },
  orb:  { position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  spinner: { width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #a855f7", animation: "spin 0.8s linear infinite" },
  muted: { fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 },
  nav: { position: "sticky", top: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,64px)", background: "rgba(8,5,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  backBtn: { background: "transparent", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  calBtn:  { background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  navLogo: { display: "flex", alignItems: "center", gap: 9 },
  logoIcon: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  logoText: { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" },
  content: { maxWidth: 960, margin: "0 auto", padding: "56px clamp(16px,4vw,48px) 80px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 24 },
  hero: { display: "flex", flexDirection: "column", gap: 12 },
  stackRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" },
  stackPill: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 999 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999, border: "1px solid", letterSpacing: "0.04em" },
  heading: { fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#fff" },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 580 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  metaPill: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 999 },
  progressCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 10 },
  progressHeader: { display: "flex", justifyContent: "space-between" },
  progressLabel: { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" },
  progressPct: { fontSize: 14, fontWeight: 700 },
  progressTrack: { width: "100%", height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" },
  progressMeta: { display: "flex", justifyContent: "space-between" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },
  statCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 14px", textAlign: "center", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" },
  statIcon: { fontSize: 22 },
  statVal:  { fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" },
  statLbl:  { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", gap: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  liveBadge: { fontSize: 11, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.12)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(74,222,128,0.25)" },
  todayTask: { display: "flex", gap: 14, alignItems: "flex-start" },
  taskIcon: { width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "1px solid" },
  taskTitle: { fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 },
  taskSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 },
  typeBadge: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid", letterSpacing: "0.06em" },
  subTodos: { display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" },
  subTodoItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  subTodoDot: { width: 6, height: 6, borderRadius: "50%", background: "#a855f7", marginTop: 5, flexShrink: 0 },
  subTodoText: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 },
  mins: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  markBtn: { padding: "12px 20px", fontSize: 14, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.25s" },
  emptyTask: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0" },
  infoGrid: { display: "flex", flexDirection: "column", gap: 10 },
  infoRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 },
  infoKey:  { fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 500 },
  infoVal:  { fontSize: 13, color: "#fff", fontWeight: 600 },
  syncBtn:    { padding: "10px 18px", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#6366f1)", color: "#fff", borderRadius: 10, border: "none", cursor: "pointer", marginTop: 4 },
  calSyncBtn: { padding: "10px 18px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "1px solid", cursor: "pointer", transition: "all 0.25s", textAlign: "center" },
  taskList: { display: "flex", flexDirection: "column", gap: 0 },
  taskRow:  { display: "flex", gap: 16 },
  timelineLeft: { display: "flex", flexDirection: "column", alignItems: "center", width: 14, flexShrink: 0 },
  dot:  { width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 5 },
  line: { flex: 1, width: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, margin: "4px 0", minHeight: 20 },
  taskBody: { flex: 1, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 6 },
  taskRowTop: { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  dayTag:   { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", minWidth: 40 },
  phasePill:{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "1px solid" },
  typeTag:  { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 },
  donePill: { fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(74,222,128,0.25)" },
  taskName: { fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500, lineHeight: 1.5 },
  taskMeta: { display: "flex", gap: 14, flexWrap: "wrap" },
  ytLink:   { fontSize: 12, color: "#f87171", fontWeight: 600, textDecoration: "none" },
  viewMoreRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  viewMoreBtn: { fontSize: 13, fontWeight: 600, color: "#c084fc", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", padding: "8px 18px", borderRadius: 999, cursor: "pointer" },
  fullPlanBtn: { fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", padding: "8px 20px", borderRadius: 999, cursor: "pointer" },
};