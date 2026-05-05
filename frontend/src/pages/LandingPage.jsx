import { useNavigate } from "react-router-dom";

/* ─── Partner logos ─── */
const partners = ["Linear", "Notion", "Vercel", "Supabase", "Stripe", "GitHub"];

/* ─── Feature cards ─── */
const features = [
  {
    icon: "🤖",
    title: "AI-Driven Planning",
    desc: "Generate intelligent, day-by-day project plans tailored to your schedule and tech stack.",
  },
  {
    icon: "📅",
    title: "Google Calendar Sync",
    desc: "Auto-schedule tasks directly into your calendar — never miss a work session again.",
  },
  {
    icon: "📊",
    title: "Progress Analytics",
    desc: "Track streaks, XP, and completion rates with real-time visual dashboards.",
  },
  {
    icon: "⚡",
    title: "Automated Task Lists",
    desc: "Break down any project into actionable steps so you know exactly what to build next.",
  },
  {
    icon: "🔗",
    title: "Gmail Integration",
    desc: "Receive daily task summaries and reminders right in your inbox.",
  },
  {
    icon: "🚀",
    title: "AI-Powered Workflow",
    desc: "Streamline day-to-day operations by automating repetitive planning tasks.",
  },
];

/* ─── Stats ─── */
const stats = [
  { value: "4.9+", label: "Average Rating" },
  { value: "20k+", label: "Projects Created" },
  { value: "98%", label: "On-Time Delivery" },
  { value: "3x", label: "Faster Planning" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.logoIcon}>✦</div>
          <span style={s.logoText}>
            <span className="gradient-text">AI</span> Manager
          </span>
        </div>
        {/* <ul style={s.navLinks}>
          {["Features", "Pricing", "Docs", "Blog"].map((l) => (
            <li key={l}>
              <a href="#" style={s.navLink}>{l}</a>
            </li>
          ))}
        </ul> */}
        <div style={s.navActions}>
        
          <button className="btn-primary" style={s.navCta} onClick={() => navigate("/setup")}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={s.hero}>
        {/* Glow decorations */}
        <div style={{ ...s.orb, width: 500, height: 500, background: "#7c3aed", top: -100, left: "50%", transform: "translateX(-50%)", opacity: 0.18 }} />
        <div style={{ ...s.orb, width: 300, height: 300, background: "#ec4899", top: 80, right: "10%", opacity: 0.12 }} />
        <div style={{ ...s.orb, width: 250, height: 250, background: "#3b82f6", bottom: 0, left: "8%", opacity: 0.1 }} />

        <div style={s.heroInner}>
          {/* Label pill */}
          <div style={s.heroPill} className="anim-fade-up">
            <span style={s.pillDot} />
            New &nbsp;·&nbsp; AI-powered project planning
          </div>

          {/* Headline */}
          <h1 style={s.heroH1} className="anim-fade-up anim-delay-1">
            How AI is&nbsp;
            <span className="gradient-text">Redefining</span>
            <br />
            Project Success.
          </h1>

          {/* Sub */}
          <p style={s.heroSub} className="anim-fade-up anim-delay-2">
            Harness the power of AI to plan, track, and ship every project on time.
            <br />
            From idea to deployment — automated.
          </p>

          {/* CTA row */}
          <div style={s.ctaRow} className="anim-fade-up anim-delay-3">
            <button
              className="btn-primary"
              style={s.ctaPrimary}
              onClick={() => navigate("/setup")}
            >
              Start for Free
            </button>
            <button
              className="btn-secondary"
              style={s.ctaSecondary}
              onClick={() => navigate("/projects")}
            >
              ▶ &nbsp;See How It Works
            </button>
          </div>

          {/* Stats row */}
          <div style={s.heroStats} className="anim-fade-up anim-delay-4">
            {stats.slice(0, 2).map((st) => (
              <div key={st.label} style={s.heroStat}>
                <span style={s.heroStatVal}>{st.value}</span>
                <span style={s.heroStatLbl}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual card */}
        <div style={s.heroCard} className="anim-float">
          <div style={s.heroCardInner}>
            <div style={s.cardTopRow}>
              <div style={s.cardTag}>⚡ AI Plan Generated</div>
              <div style={s.cardBadge}>Live</div>
            </div>
            <div style={s.cardTitle}>AI Project Manager</div>
            <div style={s.cardProgress}>
              <div style={s.progressRow}>
                <span style={s.progressLbl}>Overall Progress</span>
                <span style={s.progressPct}>65%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "65%" }} />
              </div>
            </div>
            {["Set up Auth", "Build Dashboard", "Integrate Gemini"].map((t, i) => (
              <div key={t} style={{ ...s.taskRow, opacity: i === 0 ? 1 : 0.55 }}>
                <div style={{ ...s.taskDot, background: i === 0 ? "#a855f7" : "rgba(255,255,255,0.2)" }} />
                <span style={s.taskText}>{t}</span>
                {i === 0 && <span style={s.taskBadge}>Today</span>}
              </div>
            ))}
            <div style={s.cardFooter}>
              <span style={s.xpPill}>⚡ +420 XP</span>
              <span style={s.streakPill}>🔥 7-day streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNER STRIP ── */}
      {/* <section style={s.partners}>
        <p style={s.partnersLabel}>Trusted by teams using</p>
        <div style={s.partnerRow}>
          {partners.map((p) => (
            <span key={p} style={s.partnerItem}>{p}</span>
          ))}
        </div>
      </section> */}

      {/* ── FEATURES ── */}
      <section style={s.featuresSection}>
        <div style={s.sectionOrb} />
        <div style={s.sectionCenter}>
          <div style={s.sectionLabel}>FEATURES</div>
          <h2 style={s.sectionH2}>
            Solutions for Accelerated
            <br />
            <span className="gradient-text">Project Growth</span>
          </h2>
          <p style={s.sectionSub}>
            Harness the power of AI to plan every project. Our suite of tools is
            designed to help you scale and succeed.
          </p>
        </div>

        <div style={s.featureGrid}>
          {features.map((f, i) => (
            <div key={f.title} className="card anim-fade-up" style={{ ...s.featureCard, animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={s.ctaBanner}>
        <div style={s.ctaBannerOrb1} />
        <div style={s.ctaBannerOrb2} />
        <div style={s.sectionCenter}>
          <h2 style={s.ctaBannerH2}>
            Start Growing{" "}
            <span className="gradient-text">Smarter & Faster</span>
            <br />
            with Our All-in-One AI-Powered Solutions
          </h2>
          <p style={s.ctaBannerSub}>
            All-in-one AI project manager that simplifies planning, task
            tracking, and delivery — so you can focus on building.
          </p>
          {/* <div style={s.ctaRow}>
            <button className="btn-primary" style={s.ctaPrimary} onClick={() => navigate("/setup")}>
              Get Started
            </button>
            <button className="btn-secondary" style={s.ctaSecondary} onClick={() => navigate("/projects")}>
              ▶ &nbsp;How it works
            </button>
          </div> */}
             <section  style={s.statsBand}>
        {stats.map((st) => (
          <div key={st.label} style={s.statItem}>
            <div className="stat-value">{st.value}</div>
            <div className="stat-label">{st.label}</div>
          </div>
        ))}
      </section>
        </div>
      </section>

      {/* ── STATS BAND ── */}
   

      {/* ── DEAL CARD ── */}
      {/* <section style={s.dealSection}>
        <div className="card-accent" style={s.dealCard}>
          <div style={s.dealLeft}>
            <div style={s.dealTag}>LAUNCH OFFER</div>
            <h2 style={s.dealH2}>
              Unlock Exclusive Access to
              <br />
              <span className="gradient-text">AI Project Manager</span>
            </h2>
            <p style={s.dealSub}>
              Start automating your project workflow today — free plan available,
              no credit card required.
            </p>
            <button className="btn-primary" style={s.ctaPrimary} onClick={() => navigate("/setup")}>
              Get Started →
            </button>
          </div>
          <div style={s.dealRight}>
            <div style={s.dealVisual}>
              <div style={s.dealChart}>
                <div style={s.chartBar1} />
                <div style={s.chartBar2} />
                <div style={s.chartBar3} />
                <div style={s.chartArrow}>↗</div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <div style={s.logoIcon}>✦</div>
          <span style={s.logoText}>
            <span className="gradient-text">AI</span> Manager
          </span>
        </div>
        <p style={s.footerCopy}>© 2026 AI Project Manager</p>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════
   STYLES
═══════════════════════════════════ */
const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(170deg, #08050f 0%, #0d0820 40%, #08050f 100%)",
    fontFamily: "'Inter', sans-serif",
    overflowX: "hidden",
  },

  /* NAV */
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    height: 64,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 clamp(20px,4vw,64px)",
    background: "rgba(8,5,15,0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, boxShadow: "0 0 14px rgba(124,58,237,0.5)",
  },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.04em" },
  navLinks: { display: "flex", alignItems: "center", gap: 32, listStyle: "none" },
  navLink: { fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color 0.2s", textDecoration: "none" },
  navActions: { display: "flex", alignItems: "center", gap: 10 },
  navGhost: {
    background: "transparent", color: "rgba(255,255,255,0.65)",
    padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 500,
    border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
    transition: "all 0.2s",
  },
  navCta: { padding: "9px 20px", fontSize: 14 },

  /* HERO */
  hero: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 48,
    padding: "100px clamp(20px,6vw,80px) 80px",
    position: "relative", overflow: "hidden",
  },
  orb: {
    position: "absolute", borderRadius: "50%",
    filter: "blur(90px)", pointerEvents: "none",
  },
  heroInner: { flex: 1, maxWidth: 560, zIndex: 1 },
  heroPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "5px 14px", borderRadius: 999, marginBottom: 28,
    fontSize: 12, fontWeight: 600, color: "#c084fc",
    background: "rgba(168,85,247,0.12)",
    border: "1px solid rgba(168,85,247,0.3)",
    letterSpacing: "0.04em",
  },
  pillDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#c084fc", display: "inline-block",
  },
  heroH1: {
    fontSize: "clamp(2.4rem,5vw,4rem)", fontWeight: 800,
    lineHeight: 1.1, letterSpacing: "-0.035em",
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 16, color: "rgba(255,255,255,0.6)",
    lineHeight: 1.7, marginBottom: 36,
  },
  ctaRow: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 },
  ctaPrimary: {
    padding: "13px 28px", fontSize: 15, borderRadius: 999,
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    color: "#fff", fontWeight: 700, border: "none", cursor: "pointer",
    boxShadow: "0 0 24px rgba(124,58,237,0.45)",
    transition: "all 0.25s", display: "inline-flex", alignItems: "center", gap: 8,
  },
  ctaSecondary: {
    padding: "12px 24px", fontSize: 15, borderRadius: 999,
    background: "transparent", color: "#fff", fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
    transition: "all 0.25s", display: "inline-flex", alignItems: "center", gap: 8,
  },
  heroStats: { display: "flex", gap: 36 },
  heroStat: { display: "flex", flexDirection: "column", gap: 2 },
  heroStatVal: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" },
  heroStatLbl: { fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" },

  /* HERO CARD */
  heroCard: {
    flex: "0 0 340px", maxWidth: 340, zIndex: 1,
    borderRadius: 20, padding: 2,
    background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(99,102,241,0.3))",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.2)",
  },
  heroCardInner: {
    background: "rgba(14,10,26,0.92)", borderRadius: 18,
    padding: "24px", backdropFilter: "blur(20px)",
    display: "flex", flexDirection: "column", gap: 18,
  },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTag: { fontSize: 11, fontWeight: 600, color: "#c084fc", letterSpacing: "0.06em" },
  cardBadge: {
    fontSize: 10, fontWeight: 700, color: "#4ade80",
    background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
    padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#fff" },
  cardProgress: { display: "flex", flexDirection: "column", gap: 8 },
  progressRow: { display: "flex", justifyContent: "space-between" },
  progressLbl: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  progressPct: { fontSize: 12, fontWeight: 700, color: "#c084fc" },
  taskRow: {
    display: "flex", alignItems: "center", gap: 10,
    transition: "opacity 0.2s",
  },
  taskDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  taskText: { fontSize: 13, color: "rgba(255,255,255,0.8)", flex: 1 },
  taskBadge: {
    fontSize: 10, fontWeight: 600, color: "#a855f7",
    background: "rgba(168,85,247,0.15)", padding: "2px 8px", borderRadius: 999,
  },
  cardFooter: { display: "flex", gap: 10, paddingTop: 4 },
  xpPill: {
    fontSize: 11, fontWeight: 600,
    background: "rgba(99,102,241,0.18)", color: "#818cf8",
    padding: "3px 10px", borderRadius: 999,
    border: "1px solid rgba(99,102,241,0.3)",
  },
  streakPill: {
    fontSize: 11, fontWeight: 600,
    background: "rgba(251,191,36,0.12)", color: "#fbbf24",
    padding: "3px 10px", borderRadius: 999,
    border: "1px solid rgba(251,191,36,0.25)",
  },

  /* PARTNERS */
  partners: {
    padding: "32px clamp(20px,6vw,80px)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    textAlign: "center",
  },
  partnersLabel: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20, letterSpacing: "0.06em" },
  partnerRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 40, flexWrap: "wrap", opacity: 0.4,
  },
  partnerItem: { fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" },

  /* FEATURES */
  featuresSection: {
    padding: "100px clamp(20px,6vw,80px)",
    position: "relative", overflow: "hidden",
  },
  sectionOrb: {
    position: "absolute", width: 600, height: 600,
    background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)",
    borderRadius: "50%", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)", pointerEvents: "none",
  },
  sectionCenter: { textAlign: "center", marginBottom: 60 },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "#a855f7", marginBottom: 14, display: "block",
  },
  sectionH2: { fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 },
  sectionSub: { fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20, position: "relative", zIndex: 1,
  },
  featureCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: "28px 24px",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    display: "flex", flexDirection: "column", gap: 14,
    transition: "all 0.3s",
    cursor: "default",
  },
  featureTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  featureDesc: { fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 },

  /* CTA BANNER */
  ctaBanner: {
    padding: "100px clamp(20px,6vw,80px)",
    textAlign: "center", position: "relative", overflow: "hidden",
    background: "rgba(124,58,237,0.05)",
    borderTop: "1px solid rgba(124,58,237,0.15)",
    borderBottom: "1px solid rgba(124,58,237,0.15)",
  },
  ctaBannerOrb1: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "rgba(124,58,237,0.18)", filter: "blur(100px)",
    top: "-20%", left: "20%", pointerEvents: "none",
  },
  ctaBannerOrb2: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "rgba(236,72,153,0.12)", filter: "blur(80px)",
    bottom: "-10%", right: "15%", pointerEvents: "none",
  },
  ctaBannerH2: { fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20 },
  ctaBannerSub: { fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 },

  /* STATS BAND */
  statsBand: {
  
    padding: "60px clamp(20px,6vw,80px)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 32, textAlign: "center",
    
  },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },

  /* DEAL */
  dealSection: { padding: "80px clamp(20px,6vw,80px)" },
  dealCard: {
    background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.07))",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 24, padding: "56px clamp(32px,4vw,64px)",
    display: "flex", alignItems: "center", gap: 48,
    position: "relative", overflow: "hidden",
    backdropFilter: "blur(24px)",
  },
  dealLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 20 },
  dealTag: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
    color: "#c084fc", textTransform: "uppercase",
  },
  dealH2: { fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.03em" },
  dealSub: { fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 420 },
  dealRight: { flex: "0 0 220px", display: "flex", justifyContent: "center" },
  dealVisual: {
    width: 180, height: 180, borderRadius: 20,
    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 40px rgba(124,58,237,0.2)",
  },
  dealChart: { display: "flex", alignItems: "flex-end", gap: 8, position: "relative" },
  chartBar1: {
    width: 24, height: 60, borderRadius: 6,
    background: "linear-gradient(to top, #7c3aed, #a855f7)",
    opacity: 0.6,
  },
  chartBar2: {
    width: 24, height: 90, borderRadius: 6,
    background: "linear-gradient(to top, #7c3aed, #a855f7)",
    opacity: 0.8,
  },
  chartBar3: {
    width: 24, height: 120, borderRadius: 6,
    background: "linear-gradient(to top, #7c3aed, #ec4899)",
  },
  chartArrow: {
    fontSize: 32, color: "#ec4899", fontWeight: 900,
    position: "absolute", top: -24, right: -16,
  },

  /* FOOTER */
  footer: {
    padding: "40px clamp(20px,6vw,80px)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    flexWrap: "wrap", gap: 16,
  },
  footerLogo: { display: "flex", alignItems: "center", gap: 10 },
  footerCopy: { fontSize: 13, color: "rgba(255,255,255,0.35)" },
};