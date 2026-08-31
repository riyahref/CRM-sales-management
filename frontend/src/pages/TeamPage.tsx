import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastContext";
import { fetchUsers, updateUserStatus } from "../api/userApi";
import type { User, ApiErrorResponse } from "../types/auth";

export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers(true);
      setUsers(data);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.message || "Failed to load team users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsers(true);
        if (!ignore) {
          setUsers(data);
        }
      } catch (err) {
        if (!ignore) {
          const apiErr = err as ApiErrorResponse;
          setError(apiErr.message || "Failed to load team users.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleStatus = async (userToToggle: User) => {
    const newStatus = !userToToggle.isActive;
    setUpdatingId(userToToggle.id);
    try {
      const updated = await updateUserStatus(userToToggle.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      // Section C Toast Trigger
      toast.success(`User ${userToToggle.name} ${newStatus ? "activated" : "deactivated"}`);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to update user status.";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (currentUser?.role !== "manager") {
    return (
      <Layout pageTitle="Team Management">
        <div className="alert-banner error mb-4">
          You don&apos;t have access to this screen. Team management is reserved for Sales Managers.
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Team Management">
      <div className="page-header mb-4">
        <div>
          <h1>Team & User Management</h1>
          <p className="page-subtitle text-muted">
            Manage sales rep accounts and activation status
          </p>
        </div>
      </div>

      {loading && (
        <div className="loading-state py-4 text-center text-muted">Loading team list...</div>
      )}

      {!loading && error && (
        <div className="alert-banner error mb-4">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm ms-3" onClick={loadTeam}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="card raised p-0 table-responsive">
          <table className="data-table table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-name-with-avatar">
                      <Avatar name={u.name} size="sm" />
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`status-pill ${u.role === "manager" ? "qualified" : "new"}`}>
                      {u.role === "manager" ? "Sales Manager" : "Sales Rep"}
                    </span>
                  </td>
                  <td>
                    {u.isActive ? (
                      <span className="status-pill won">Active</span>
                    ) : (
                      <span className="status-pill lost">Inactive</span>
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.id === currentUser.id ? (
                      <span className="text-muted fs-small">(Your Account)</span>
                    ) : (
                      <button
                        type="button"
                        className={`btn btn-sm ${u.isActive ? "btn-secondary" : "btn-primary"}`}
                        disabled={updatingId === u.id}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {updatingId === u.id
                          ? "Updating..."
                          : u.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};
