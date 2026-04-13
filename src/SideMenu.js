import React, { useState } from "react";
// Material icons CDN for demo (or use SVGs)
const icons = {
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>
  ),
  compare: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M8 12h8M12 8v8"/></svg>
  ),
  existance: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
  ),
  email: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
};

const menuItems = [
  { label: "Diff Script", page: "home", icon: icons.home },
  { label: "Compare Plans", page: "compare", icon: icons.compare },
  { label: "Existence Check", page: "existance", icon: icons.existance },
  { label: "Deployment Email", page: "email", icon: icons.email },
  { label: "Deployment Validation", page: "validation", icon: icons.compare },
];

function SideMenu({ currentPage, onNavigate }) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 220,
          background: "#23243a",
          boxShadow: "2px 0 16px #0008",
          zIndex: 2000,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          paddingTop: 80,
        }}
        aria-label="Main navigation"
      >
        {menuItems.map((item, idx) => (
          <button
            key={item.page}
            onClick={() => { onNavigate(item.page); }}
            aria-label={item.label}
            style={{
              background: currentPage === item.page ? "#3a8bff" : "transparent",
              color: currentPage === item.page ? "#fff" : "#b0b8d8",
              border: "none",
              borderRadius: 8,
              width: "90%",
              margin: "8px auto",
              height: 48,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 22,
              fontWeight: 600,
              boxShadow: currentPage === item.page ? "0 2px 8px #3a8bff80" : "none",
              cursor: "pointer",
              outline: "none",
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              padding: "0 1rem",
            }}
          >
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default SideMenu;
