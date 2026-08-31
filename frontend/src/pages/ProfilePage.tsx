import React from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/Avatar";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Layout pageTitle="User Profile & Settings">
      <div className="profile-page-container">
        <div className="profile-card raised">
          <div className="profile-header">
            <Avatar name={user.name} size="lg" />
            <div className="profile-header-info">
              <h1 className="profile-name">{user.name}</h1>
              <span className={`role-badge ${user.role}`}>
                {user.role === "manager" ? "Sales Manager" : "Sales Rep"}
              </span>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-field">
              <label>Work Email</label>
              <div className="profile-value">{user.email}</div>
            </div>

            <div className="profile-field">
              <label>Assigned Role</label>
              <div className="profile-value text-capitalize">{user.role}</div>
            </div>

            <div className="profile-field">
              <label>Account ID</label>
              <div className="profile-value">#{user.id}</div>
            </div>

            <div className="profile-field">
              <label>System Status</label>
              <div className="profile-value text-success font-semibold">Active Member</div>
            </div>
          </div>

          <div className="profile-notice inset">
            <svg className="notice-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Account permissions and role assignments are managed by System Administration.
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};
