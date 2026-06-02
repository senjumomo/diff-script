import React from "react";

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/>
    </svg>
  ),
  compare: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M8 12h8M12 8v8"/>
    </svg>
  ),
  existence: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  email: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  validation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

const menuItems = [
  { label: "Diff Script",          page: "home",       icon: icons.home },
  { label: "Compare Plans",        page: "compare",    icon: icons.compare },
  { label: "Existence Check",      page: "existence",  icon: icons.existence },
  { label: "Deployment Email",     page: "email",      icon: icons.email },
  { label: "Deployment Validation",page: "validation", icon: icons.validation },
];

function SideMenu({ currentPage, onNavigate }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: 232,
        background: "rgba(13,14,26,0.85)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        padding: "0 12px 24px",
      }}
      aria-label="Main navigation"
    >
      {/* Logo / Header */}
      <div style={{
        padding: "24px 8px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 12,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,0.5)",
            fontSize: 16,
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#f1f5f9", letterSpacing: "-0.01em" }}>DiffScript</div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Deployment Tools</div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {menuItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              aria-label={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 14px",
                border: "1px solid",
                borderColor: isActive ? "rgba(99,102,241,0.4)" : "transparent",
                borderRadius: 10,
                background: isActive
                  ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.12))"
                  : "transparent",
                color: isActive ? "#c7d2fe" : "#64748b",
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.88rem",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.01em",
                textAlign: "left",
                width: "100%",
                transition: "all 0.18s ease",
                boxShadow: isActive ? "0 2px 12px rgba(99,102,241,0.2)" : "none",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: isActive ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                color: isActive ? "#818cf8" : "inherit",
                flexShrink: 0,
                transition: "all 0.18s",
              }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "12px 8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: "0.7rem", color: "#334155", textAlign: "center", letterSpacing: "0.04em" }}>
          v1.0.0 · senjumomo
        </div>
      </div>
    </div>
  );
}

export default SideMenu;
