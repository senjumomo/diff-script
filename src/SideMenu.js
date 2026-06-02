import React from "react";
import { FaGithub } from "react-icons/fa";

const icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/>
    </svg>
  ),
  compare: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
    </svg>
  ),
  existence: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  email: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  validation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const menuItems = [
  { label: "Diff Script",           page: "home",       icon: icons.home },
  { label: "Compare Plans",         page: "compare",    icon: icons.compare },
  { label: "Existence Check",       page: "existence",  icon: icons.existence },
  { label: "Deployment Email",      page: "email",      icon: icons.email },
  { label: "Deployment Validation", page: "validation", icon: icons.validation },
];

function SideMenu({ currentPage, onNavigate }) {
  return (
    <aside className="nav-rail" aria-label="Main navigation">
      <div className="nav-rail__brand">
        <div className="nav-rail__logo" aria-hidden="true">DS</div>
        <div>
          <div className="nav-rail__title">DiffScript</div>
          <div className="nav-rail__subtitle">Deployment suite</div>
        </div>
      </div>

      <nav className="nav-rail__nav">
        {menuItems.map((item) => (
          <button
            key={item.page}
            type="button"
            onClick={() => onNavigate(item.page)}
            className={`nav-item${currentPage === item.page ? " nav-item--active" : ""}`}
            aria-current={currentPage === item.page ? "page" : undefined}
          >
            <span className="nav-item__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="nav-rail__footer">
        <span className="nav-rail__version">v2 · prism</span>
        <a
          href="https://github.com/senjumomo/diff-script"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-rail__github"
          aria-label="GitHub repository"
        >
          <FaGithub size={16} />
        </a>
      </div>
    </aside>
  );
}

export default SideMenu;
