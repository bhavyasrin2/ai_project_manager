/**
 * AppLogo — shared logo component used across all pages.
 * size: pixel size for the img tag (default 28).
 * textSize: font size for the wordmark (default 16).
 */
export default function AppLogo({ size = 28, textSize = 16 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <img
        src="/logo.svg"
        alt="AI Project Manager logo"
        width={size}
        height={size}
        style={{ borderRadius: 8, display: "block" }}
      />
      <span style={{ fontSize: textSize, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
        <span className="gradient-text">AI</span> Manager
      </span>
    </div>
  );
}
