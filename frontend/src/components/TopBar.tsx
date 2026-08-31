import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";

interface TopBarProps {
  onOpenCommandPalette: () => void;
  pageTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    navigate("/login", { replace: true });
    await logout();
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <h2 className="topbar-page-title">{pageTitle || "Workspace"}</h2>
      </div>

      <div className="topbar-right">
        {/* Global Search Input Box styled per .inset */}
        <div className="topbar-search-box inset" onClick={onOpenCommandPalette}>
          <svg className="topbar-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="topbar-search-placeholder">Search leads, customers...</span>
          <kbd className="topbar-search-kbd">⌘K</kbd>
        </div>

        {/* User Profile & Avatar */}
        {user && (
          <div className="topbar-user-menu">
            <div className="topbar-user-profile" onClick={() => setShowDropdown(!showDropdown)}>
              <Avatar name={user.name} size="md" />
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.name}</span>
                <span className={`role-badge ${user.role}`}>
                  {user.role === "manager" ? "Sales Manager" : "Sales Rep"}
                </span>
              </div>
              <svg
                className="dropdown-chevron"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {showDropdown && (
              <div className="topbar-dropdown-menu raised" onClick={() => setShowDropdown(false)}>
                <Link to="/profile" className="dropdown-item">
                  <svg
                    className="dropdown-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Profile & Account</span>
                </Link>
                <button
                  type="button"
                  className="dropdown-item logout"
                  onClick={handleLogout}
                  id="logout-button"
                >
                  <svg
                    className="dropdown-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
