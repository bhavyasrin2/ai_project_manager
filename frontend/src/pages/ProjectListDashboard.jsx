import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, deleteProject } from "../api/client";
import AppLogo from "../components/AppLogo";

// ── colour palette per stack keyword ─────────────────────────────────────────
const STACK_COLORS = {
  react:      "#61dafb",
  vue:        "#42b883",
  angular:    "#dd1b16",
  next:       "#ffffff",
  node:       "#68a063",
  python:     "#f7d64e",
  fastapi:    "#009688",
  django:     "#092e20",
  postgres:   "#336791",
  mongo:      "#4db33d",
  tailwind:   "#38bdf8",
  typescript: "#3178c6",
  flutter:    "#54c5f8",
  default:    "#a855f7",
};

function stackColor(stackStr = "") {
  const lower = stackStr.toLowerCase();
  for (const [key, color] of Object.entries(STACK_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return STACK_COLORS.default;
}

function stackLabel(stackStr = "") {
  const parts = stackStr.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[0] || "Project";
}

// ── pagination config ─────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectListDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState("all"); // "all" | "active" | "completed"
  const [deleting, setDeleting]   = useState(null);  // project id being deleted

  // Fetch from backend
  useEffect(() => {
    setLoading(true);
    getProjects()
      .then(({ projects, total }) => {
        setProjects(projects);
        setTotal(total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // don't navigate to project detail
    if (!window.confirm(`Delete "${name}" and all its tasks? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // Filtered + paginated slice
  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats derived from all projects
  const avgProgress = projects.length
    ? Math.round(projects.reduce((a, p) => a + p.completion_percent, 0) / projects.length)
    : 0;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const totalTasks     = projects.reduce((a, p) => a + p.total_tasks, 0);

  // Reset page when filter changes
  const handleFilter = (f) => { setFilter(f); setPage(1); };

  return (
    <div style={s.page}>
      {/* Background orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <AppLogo size={28} textSize={16} />
        </div>
        <div style={s.navActions}>
          <button style={s.newBtn} id="new-project-btn" onClick={() => navigate("/setup")}>
            + New Project
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={s.content}>

        {/* Header */}
        <div style={s.header} className="anim-fade-up">
          <div style={s.heroPill}>📁 &nbsp;My Workspace</div>
          <h1 style={s.heading}>
            Your <span className="gradient-text">Projects</span>
          </h1>
          <p style={s.sub}>
            {loading ? "Loading…" : `${total} project${total !== 1 ? "s" : ""} — keep the streak alive 🔥`}
          </p>
        </div>

        {/* Summary Stats */}
        <div style={s.statsRow} className="anim-fade-up anim-delay-1">
          {[
            { label: "Total Projects",  value: total },
            { label: "Avg Progress",    value: `${avgProgress}%` },
            { label: "Total Tasks",     value: totalTasks },
            { label: "Completed",       value: completedCount },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statVal}>{loading ? "—" : st.value}</div>
              <div style={s.statLbl}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={s.filterRow} className="anim-fade-up anim-delay-1">
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              onClick={() => handleFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={s.filterCount}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div style={s.stateBox}>
            <div style={s.spinner} />
            <p style={s.stateText}>Fetching your projects…</p>
          </div>
        )}
        {!loading && error && (
          <div style={s.stateBox}>
            <div style={s.errorIcon}>⚠️</div>
            <p style={s.stateText}>{error}</p>
            <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={s.stateBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
            <p style={s.stateText}>No projects yet. Start by creating one!</p>
            <button style={s.newBtn} onClick={() => navigate("/setup")}>+ New Project</button>
          </div>
        )}

        {/* Project grid */}
        {!loading && !error && paginated.length > 0 && (
          <div style={s.grid}>
            {paginated.map((project, i) => {
              const color    = stackColor(project.stack);
              const tag      = stackLabel(project.stack);
              const progress = project.completion_percent;
              const isDone   = project.status === "completed" || progress === 100;

              return (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                  style={{ ...s.card, animationDelay: `${i * 0.08}s` }}
                  className="anim-fade-up"
                  onClick={() => navigate(`/project/${project.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform   = "translateY(-4px)";
                    e.currentTarget.style.borderColor = `${color}44`;
                    e.currentTarget.style.boxShadow   = `0 16px 48px rgba(0,0,0,0.5), 0 0 24px ${color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform   = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                >
                  {/* Card top */}
                  <div style={s.cardTop}>
                    <div style={{ ...s.cardIconWrap, background: `${color}22`, border: `1px solid ${color}44` }}>
                      <div style={{ ...s.cardIcon, background: color }} />
                    </div>
                    <div style={s.cardTopRight}>
                      <span style={{ ...s.cardTag, color, background: `${color}18`, borderColor: `${color}33` }}>
                        {tag}
                      </span>
                      <span style={{ ...s.statusDot, background: isDone ? "#4ade80" : "#a855f7" }} title={project.status} />
                    </div>
                  </div>

                  {/* Name & desc */}
                  <div>
                    <h3 style={s.cardTitle}>{project.name}</h3>
                    <p style={s.cardDesc}>{project.description}</p>
                  </div>

                  {/* Meta pills */}
                  <div style={s.metaRow}>
                    {project.total_days > 0 && (
                      <span style={s.metaPill}>📅 {project.total_days}d</span>
                    )}
                    {project.estimated_weeks > 0 && (
                      <span style={s.metaPill}>🗓 {project.estimated_weeks}w</span>
                    )}
                    <span style={s.metaPill}>⏰ {project.daily_hours}h/day</span>
                    <span style={s.metaPill}>
                      ✅ {project.done_tasks}/{project.total_tasks}
                    </span>
                  </div>

                  {/* Progress */}
                  <div style={s.progressSection}>
                    <div style={s.progressRow}>
                      <span style={s.progressLbl}>Progress</span>
                      <span style={{ ...s.progressPct, color: isDone ? "#4ade80" : color }}>
                        {progress.toFixed(1)}%{isDone && " ✓"}
                      </span>
                    </div>
                    <div style={s.progressTrack}>
                      <div
                        style={{
                          ...s.progressFill,
                          width: `${progress}%`,
                          background: isDone
                            ? "linear-gradient(90deg, #4ade80, #22d3ee)"
                            : `linear-gradient(90deg, ${color}, ${color}bb)`,
                          boxShadow: `0 0 10px ${color}66`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={s.cardFooter}>
                    <span style={s.startDate}>🗓 Started {project.start_date}</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        id={`delete-project-${project.id}`}
                        style={s.deleteBtn}
                        disabled={deleting === project.id}
                        onClick={(e) => handleDelete(e, project.id, project.name)}
                      >
                        {deleting === project.id ? "…" : "🗑"}
                      </button>
                      <span style={{ ...s.openBtn, color }}>Open →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div style={s.pagination} className="anim-fade-up">
            <button
              id="page-prev"
              style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDisabled : {}) }}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>

            <div style={s.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  id={`page-${n}`}
                  style={{ ...s.pageNum, ...(n === page ? s.pageNumActive : {}) }}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              id="page-next"
              style={{ ...s.pageBtn, ...(page === totalPages ? s.pageBtnDisabled : {}) }}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}

        {/* Page info */}
        {!loading && !error && totalPages > 1 && (
          <p style={s.pageInfo}>
            Page {page} of {totalPages} &nbsp;·&nbsp; showing {paginated.length} of {filtered.length} projects
          </p>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(170deg, #08050f 0%, #0d0820 50%, #08050f 100%)",
    fontFamily: "'Inter', sans-serif",
    position: "relative", overflow: "hidden",
  },
  orb1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "rgba(124,58,237,0.13)", filter: "blur(100px)",
    top: 0, right: -80, pointerEvents: "none",
  },
  orb2: {
    position: "absolute", width: 350, height: 350, borderRadius: "50%",
    background: "rgba(59,130,246,0.08)", filter: "blur(80px)",
    bottom: 100, left: -80, pointerEvents: "none",
  },

  // Nav
  nav: {
    position: "sticky", top: 0, zIndex: 100, height: 64,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 clamp(20px,4vw,64px)",
    background: "rgba(8,5,15,0.8)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
  },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" },
  navActions: { display: "flex", gap: 12 },
  newBtn: {
    padding: "9px 20px", fontSize: 14, fontWeight: 700,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    color: "#fff", borderRadius: 999, border: "none", cursor: "pointer",
    boxShadow: "0 0 18px rgba(124,58,237,0.35)", transition: "all 0.25s",
  },

  // Layout
  content: {
    maxWidth: 1100, margin: "0 auto",
    padding: "60px clamp(16px,4vw,48px) 80px",
    position: "relative", zIndex: 1,
  },
  header: { marginBottom: 48 },
  heroPill: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 14px", borderRadius: 999, marginBottom: 16,
    fontSize: 12, fontWeight: 600, color: "#c084fc",
    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)",
    letterSpacing: "0.04em",
  },
  heading: { fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 12, color: "#fff" },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.5)" },

  // Stats
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
    gap: 16, marginBottom: 32,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "20px 18px", textAlign: "center",
    backdropFilter: "blur(20px)",
  },
  statVal: {
    fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em",
    background: "linear-gradient(90deg, #c084fc, #818cf8)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  statLbl: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" },

  // Filter
  filterRow: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 32,
  },
  filterBtn: {
    padding: "7px 18px", fontSize: 13, fontWeight: 600, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "rgba(124,58,237,0.18)", borderColor: "rgba(124,58,237,0.4)",
    color: "#c084fc",
  },
  filterCount: {
    marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.3)",
    fontWeight: 500,
  },

  // State (loading/error/empty)
  stateBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 16, padding: "80px 0",
    color: "rgba(255,255,255,0.4)",
  },
  stateText: { fontSize: 15, color: "rgba(255,255,255,0.4)" },
  errorIcon: { fontSize: 36 },
  retryBtn: {
    padding: "8px 20px", fontSize: 13, fontWeight: 700,
    background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)",
    color: "#c084fc", borderRadius: 999, cursor: "pointer",
  },
  spinner: {
    width: 36, height: 36, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.08)",
    borderTop: "3px solid #a855f7",
    animation: "spin 0.8s linear infinite",
  },

  // Grid
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
    gap: 24, marginBottom: 40,
  },

  // Card
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: "24px",
    backdropFilter: "blur(24px)",
    cursor: "pointer", transition: "all 0.3s",
    display: "flex", flexDirection: "column", gap: 14,
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTopRight: { display: "flex", alignItems: "center", gap: 8 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cardIcon: { width: 16, height: 16, borderRadius: "50%" },
  cardTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "3px 10px", borderRadius: 999, border: "1px solid",
  },
  statusDot: {
    width: 8, height: 8, borderRadius: "50%",
    boxShadow: "0 0 6px currentColor",
  },
  cardTitle: { fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 },

  // Meta pills
  metaRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  metaPill: {
    fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
    padding: "3px 9px", borderRadius: 999,
  },

  // Progress
  progressSection: { display: "flex", flexDirection: "column", gap: 8 },
  progressRow: { display: "flex", justifyContent: "space-between" },
  progressLbl: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase" },
  progressPct: { fontSize: 12, fontWeight: 700 },
  progressTrack: {
    width: "100%", height: 5, borderRadius: 999,
    background: "rgba(255,255,255,0.07)", overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 999, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
  },

  // Card footer
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  startDate: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 },
  openBtn: { fontSize: 13, fontWeight: 700 },

  // Pagination
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 16,
  },
  pageBtn: {
    padding: "8px 20px", fontSize: 13, fontWeight: 700, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
    color: "#c084fc", cursor: "pointer", transition: "all 0.2s",
  },
  pageBtnDisabled: {
    opacity: 0.3, cursor: "not-allowed",
    color: "rgba(255,255,255,0.3)",
  },
  pageNumbers: { display: "flex", gap: 6 },
  pageNum: {
    width: 36, height: 36, borderRadius: 10, fontSize: 13, fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  pageNumActive: {
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    borderColor: "transparent", color: "#fff",
    boxShadow: "0 0 16px rgba(124,58,237,0.5)",
  },
  pageInfo: {
    textAlign: "center", fontSize: 12,
    color: "rgba(255,255,255,0.25)", fontWeight: 500,
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171",
    borderRadius: 8,
    width: 30, height: 30,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, cursor: "pointer",
    transition: "all 0.2s",
    padding: 0,
  },
};