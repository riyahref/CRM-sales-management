import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand-link" title="View Ridgeline Landing Page">
          <svg className="logo-mark" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 19L9 6L13 14L16 9L22 19H2Z" fill="#2E5BFF" />
          </svg>
          <div className="sidebar-brand-text">
            <span className="sidebar-app-name">Ridgeline</span>
            <span className="sidebar-app-sub">Sales Pipeline</span>
          </div>
        </NavLink>
      </div>

      {user?.role === "manager" && (
        <div className="sidebar-action-container">
          <NavLink to="/leads/new" className="sidebar-new-lead-btn raised">
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Lead</span>
          </NavLink>
        </div>
      )}

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")}
          end
        >
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/leads"
          className={({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")}
        >
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Leads</span>
        </NavLink>

        <NavLink
          to="/pipeline"
          className={({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")}
        >
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span>Pipeline</span>
        </NavLink>

        {user?.role === "manager" && (
          <NavLink
            to="/team"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Team</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};
