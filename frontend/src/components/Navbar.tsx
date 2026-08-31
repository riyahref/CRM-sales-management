import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate("/login", { replace: true });
    await logout();
  };

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="navbar-brand">
          <div className="navbar-logo-icon">CRM</div>
          <span className="navbar-title">Sales Management Portal</span>
        </div>

        {user && (
          <nav className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/leads"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Leads
            </NavLink>
            <NavLink
              to="/pipeline"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Pipeline
            </NavLink>
            {user.role === "manager" && (
              <>
                <NavLink
                  to="/leads/new"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  + New Lead
                </NavLink>
                <NavLink
                  to="/team"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Team
                </NavLink>
              </>
            )}
          </nav>
        )}
      </div>

      {user && (
        <div className="navbar-user-section">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`role-badge ${user.role}`}>
              {user.role === "manager" ? "Sales Manager" : "Sales Rep"}
            </span>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout} id="logout-button">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};
