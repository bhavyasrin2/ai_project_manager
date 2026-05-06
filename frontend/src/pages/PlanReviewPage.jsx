import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectPlan, completeTask } from "../api/client";
import AppLogo from "../components/AppLogo";

// ── Phase colour map ──────────────────────────────────────────────────────────
const PHASE_COLOR = {
  "Tech Stack Learning": { color: "#61dafb", bg: "rgba(97,218,251,0.12)", border: "rgba(97,218,251,0.3)" },
  Frontend:             { color: "#a855f7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)" },
  Backend:              { color: "#f97316", bg: "rgba(249,115,22,0.12)",   border: "rgba(249,115,22,0.3)" },
  Integration:          { color: "#22d3ee", bg: "rgba(34,211,238,0.12)",   border: "rgba(34,211,238,0.3)" },
  "Testing & Deploy":   { color: "#4ade80", bg: "rgba(74,222,128,0.12)",   border: "rgba(74,222,128,0.3)" },
  Buffer:               { color: "#6b7280", bg: "rgba(107,114,128,0.12)",  border: "rgba(107,114,128,0.25)" },
};
const phaseStyle = (phase) => PHASE_COLOR[phase] || { color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)" };

const TYPE_ICON  = { learn: "📖", code: "💻", buffer: "☕" };
const TYPE_LABEL = { learn: "Learn", code: "Code", buffer: "Buffer" };

// ── Helpers ───────────────────────────────────────────────────────────────────
const FILTERS = ["All", "Pending", "Done", "Buffer"];

export default function PlanReviewPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState("All");
  const [expanded, setExpanded] = useState({});
  const [toggling, setToggling] = useState(null); // task id being toggled

  const load = () => {
    setLoading(true);
    getProjectPlan(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleExpand = (tid) =>
    setExpanded((prev) => ({ ...prev, [tid]: !prev[tid] }));

  const handleToggle = async (task) => {
    setToggling(task.id);
    try {
      await completeTask(task.id);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setToggling(null);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.tasks) return [];
    if (filter === "All")     return data.tasks;
    if (filter === "Done")    return data.tasks.filter((t) => t.status === "done");
    if (filter === "Pending") return data.tasks.filter((t) => t.status !== "done" && t.task_type !== "buffer");
    if (filter === "Buffer")  return data.tasks.filter((t) => t.task_type === "buffer");
    return data.tasks;
  }, [data, filter]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={s.muted}>Loading full plan…</p>
      </div>
    </div>
  );
  if (error) return (
    <div style={s.page}>
      <div style={s.center}>
        <p style={{ color: "#f87171", marginBottom: 16 }}>⚠️ {error}</p>
        <button style={s.backBtn} onClick={() => navigate(`/project/${id}`)}>← Back</button>
      </div>
    </div>
  );

  const { stats, project_name, status } = data;
  const pct = stats.completion_percent ?? 0;

  return (
    <div style={s.page}>
      <div style={s.orb1} />
      <div style={s.orb2} />

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate(`/project/${id}`)}>← Overview</button>
        <div style={s.navLogo}>
          <AppLogo size={28} textSize={16} />
        </div>
        <span style={{ ...s.statusBadge, color: status === "completed" ? "#4ade80" : "#c084fc", borderColor: status === "completed" ? "rgba(74,222,128,0.3)" : "rgba(168,85,247,0.3)", background: status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(168,85,247,0.1)" }}>
          {status === "completed" ? "✓ Completed" : "● Active"}
        </span>
      </nav>

      <div style={s.content}>

        {/* ── Hero ── */}
        <div className="anim-fade-up" style={s.hero}>
          <div style={s.heroPill}>📋 &nbsp;Full Project Plan</div>
          <h1 style={s.heading}>{project_name}</h1>
          <p style={s.sub}>Day-by-day roadmap · track progress · mark tasks complete</p>
        </div>

        {/* ── Progress bar ── */}
        <div style={s.progressCard} className="anim-fade-up anim-delay-1">
          <div style={s.progressHeader}>
            <span style={s.progressLabel}>Overall Progress</span>
            <span style={{ ...s.progressPct, color: pct === 100 ? "#4ade80" : "#a855f7" }}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <div style={s.progressTrack}>
            <div style={{
              ...s.progressFill,
              width: `${pct}%`,
              background: pct === 100 ? "linear-gradient(90deg,#4ade80,#22d3ee)" : "linear-gradient(90deg,#a855f7,#6366f1)",
              boxShadow: "0 0 12px rgba(168,85,247,0.6)",
            }} />
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={s.statsRow} className="anim-fade-up anim-delay-1">
          {[
            { label: "Total Tasks", value: stats.total_tasks },
            { label: "Done",        value: stats.done_tasks,    color: "#4ade80" },
            { label: "Pending",     value: stats.pending_tasks, color: "#f97316" },
            { label: "Days Left",   value: stats.days_left },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={{ ...s.statVal, color: st.color || "#c084fc" }}>{st.value}</div>
              <div style={s.statLbl}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={s.filterRow} className="anim-fade-up anim-delay-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-${f.toLowerCase()}`}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          <span style={s.filterCount}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Task Grid ── */}
        <div style={s.grid}>
          {filtered.map((task, i) => {
            const ps      = phaseStyle(task.phase);
            const done    = task.status === "done";
            const isBuffer= task.task_type === "buffer";
            const exp     = expanded[task.id];
            const busy    = toggling === task.id;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                style={{
                  ...s.card,
                  borderColor: done ? "rgba(74,222,128,0.25)" : isBuffer ? "rgba(107,114,128,0.2)" : "rgba(255,255,255,0.08)",
                  opacity: isBuffer ? 0.75 : 1,
                  animationDelay: `${(i % 6) * 0.06}s`,
                }}
                className="anim-fade-up"
              >
                {/* Card header row */}
                <div style={s.cardTop}>
                  <div style={s.dayBubble}>
                    {done ? "✓" : task.day}
                  </div>
                  <div style={s.cardTopMid}>
                    <span style={{ ...s.phasePill, color: ps.color, background: ps.bg, borderColor: ps.border }}>
                      {task.phase}
                    </span>
                  </div>
                  {done
                    ? <span style={s.doneBadge}>✓ Done</span>
                    : <span style={s.pendingBadge}>Pending</span>
                  }
                </div>

                {/* Task name */}
                <h3 style={{ ...s.taskName, textDecoration: done ? "line-through" : "none", opacity: done ? 0.55 : 1 }}>
                  {TYPE_ICON[task.task_type]} {task.name}
                </h3>

                {/* Meta row */}
                <div style={s.metaRow}>
                  <span style={s.metaPill}>📅 {task.scheduled_date}</span>
                  {task.duration && task.duration !== "flexible" && <span style={s.metaPill}>⏱ {task.duration}</span>}
                  <span style={{ ...s.metaPill, color: ps.color }}>{TYPE_LABEL[task.task_type] || task.task_type}</span>
                </div>

                {/* Description */}
                {task.description && (
                  <p style={s.desc}>{task.description}</p>
                )}

                {/* Sub-todos (expandable) */}
                {task.sub_todos?.length > 0 && (
                  <>
                    <button style={s.expandBtn} onClick={() => toggleExpand(task.id)}>
                      {exp ? "▲ Hide sub-tasks" : `▼ ${task.sub_todos.length} sub-tasks`}
                    </button>
                    {exp && (
                      <div style={s.subList}>
                        {task.sub_todos.map((st, si) => (
                          <div key={si} style={s.subItem}>
                            <div style={{ ...s.subDot, background: ps.color }} />
                            <span style={s.subText}>
                              {st.todo}
                              <span style={s.mins}> ~{st.estimated_minutes}m</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* YouTube link */}
                {task.youtube_query && (
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.youtube_query)}`}
                    target="_blank" rel="noreferrer"
                    style={s.ytLink}
                  >
                    📺 Watch on YouTube
                  </a>
                )}

                {/* Toggle button */}
                {/* {!isBuffer && (
                  <button
                    id={`toggle-task-${task.id}`}
                    disabled={busy}
                    style={{
                      ...s.toggleBtn,
                      background: done ? "rgba(74,222,128,0.12)" : `linear-gradient(135deg, ${ps.color}cc, #6366f1)`,
                      color: done ? "#4ade80" : "#fff",
                      border: done ? "1px solid rgba(74,222,128,0.3)" : "none",
                    }}
                    onClick={() => handleToggle(task)}
                  >
                    {busy ? "Saving…" : done ? "↩ Mark Pending" : "✓ Mark Done"}
                  </button>
                )} */}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={s.center}>
            <span style={{ fontSize: 36 }}>🎉</span>
            <p style={s.muted}>No tasks match this filter.</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = {
  page:    { minHeight: "100vh", background: "linear-gradient(170deg,#08050f 0%,#0d0820 50%,#08050f 100%)", fontFamily: "'Inter',sans-serif", position: "relative", overflow: "hidden" },
  orb1:    { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.13)", filter: "blur(100px)", top: -100, right: -100, pointerEvents: "none" },
  orb2:    { position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(236,72,153,0.07)", filter: "blur(80px)", bottom: 0, left: "20%", pointerEvents: "none" },
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  spinner: { width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #a855f7", animation: "spin 0.8s linear infinite" },
  muted:   { fontSize: 13, color: "rgba(255,255,255,0.38)" },
  nav: { position: "sticky", top: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,64px)", background: "rgba(8,5,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  backBtn: { background: "transparent", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  navLogo: { display: "flex", alignItems: "center", gap: 9 },
  logoText:{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, border: "1px solid" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "56px clamp(16px,4vw,48px) 80px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28 },
  hero:    { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  heroPill:{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#c084fc", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", letterSpacing: "0.04em" },
  heading: { fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#fff" },
  sub:     { fontSize: 15, color: "rgba(255,255,255,0.5)" },
  progressCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 24px", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 10 },
  progressHeader: { display: "flex", justifyContent: "space-between" },
  progressLabel:  { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" },
  progressPct:    { fontSize: 14, fontWeight: 700 },
  progressTrack:  { width: "100%", height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" },
  progressFill:   { height: "100%", borderRadius: 999, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },
  statCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 16px", textAlign: "center", backdropFilter: "blur(20px)" },
  statVal:  { fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 },
  statLbl:  { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" },
  filterRow:   { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  filterBtn:   { padding: "7px 18px", fontSize: 13, fontWeight: 600, borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" },
  filterActive: { background: "rgba(124,58,237,0.18)", borderColor: "rgba(124,58,237,0.4)", color: "#c084fc" },
  filterCount:  { marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid", borderRadius: 20, padding: "22px", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.2s" },
  cardTop:    { display: "flex", alignItems: "center", gap: 10 },
  cardTopMid: { flex: 1 },
  dayBubble:  { width: 36, height: 36, borderRadius: "50%", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#c084fc", flexShrink: 0 },
  phasePill:  { fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid", letterSpacing: "0.05em" },
  doneBadge:    { fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.12)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(74,222,128,0.3)", whiteSpace: "nowrap" },
  pendingBadge: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" },
  taskName: { fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.5 },
  metaRow:  { display: "flex", flexWrap: "wrap", gap: 6 },
  metaPill: { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 999 },
  desc:     { fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 },
  expandBtn:{ fontSize: 12, fontWeight: 600, color: "#a855f7", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 },
  subList:  { display: "flex", flexDirection: "column", gap: 7, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" },
  subItem:  { display: "flex", gap: 8, alignItems: "flex-start" },
  subDot:   { width: 5, height: 5, borderRadius: "50%", marginTop: 6, flexShrink: 0 },
  subText:  { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 },
  mins:     { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  ytLink:   { fontSize: 12, fontWeight: 600, color: "#f87171", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 },
  toggleBtn:{ padding: "9px 16px", fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", marginTop: "auto" },
};