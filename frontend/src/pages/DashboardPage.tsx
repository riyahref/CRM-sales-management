import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { getDashboardSummary } from "../api/dashboardApi";
import type { DashboardSummary } from "../types/dashboard";
import type { ApiErrorResponse } from "../types/auth";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.message || "Failed to load dashboard summary metrics.");
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
        const summary = await getDashboardSummary();
        if (!ignore) {
          setData(summary);
        }
      } catch (err) {
        if (!ignore) {
          const apiErr = err as ApiErrorResponse;
          setError(apiErr.message || "Failed to load dashboard summary metrics.");
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  const isZeroState = data && data.openLeads === 0 && data.openOpportunities === 0;

  return (
    <Layout pageTitle="Sales Dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong> (
            {user?.role === "manager" ? "Team Overview" : "Personal Overview"})
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchSummary}
          disabled={loading}
        >
          Refresh Data
        </button>
      </div>

      {loading && (
        <div className="dashboard-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card skeleton-card">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line tall"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchSummary}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* First Login Checklist (Section D.5) when zero total leads exist */}
          {user?.role === "manager" && isZeroState && (
            <div className="card raised mb-4 p-4 border-accent-left">
              <h3>Get Started with Ridgeline CRM</h3>
              <p className="text-muted fs-small mb-3">
                Complete these 3 steps to build your sales pipeline:
              </p>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-primary">Step 1</span>
                  <Link to="/leads/new" className="font-semibold text-accent">
                    Create your first lead &rarr;
                  </Link>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="badge badge-secondary">Step 2</span>
                  <span>Assign lead ownership to a sales rep</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="badge badge-secondary">Step 3</span>
                  <span>Watch deals progress through the pipeline</span>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-grid">
            <div className="card metric-card">
              <span className="metric-label">Open Leads</span>
              <span className="metric-value">{data.openLeads}</span>
              <span className="metric-subtext">
                {data.openLeads === 0 ? "No leads assigned yet" : "Active prospect leads"}
              </span>
              <Link to="/leads" className="metric-link mt-2">
                View leads &rarr;
              </Link>
            </div>

            <div className="card metric-card">
              <span className="metric-label">Open Opportunities</span>
              <span className="metric-value">{data.openOpportunities}</span>
              <span className="metric-subtext">
                {data.openOpportunities === 0 ? "No active opportunities" : "Active pipeline deals"}
              </span>
              <Link to="/pipeline" className="metric-link mt-2">
                View pipeline &rarr;
              </Link>
            </div>

            <div className="card metric-card">
              <span className="metric-label">Open Pipeline Value</span>
              <span className="metric-value highlight">
                {formatCurrency(data.openPipelineValue)}
              </span>
              <span className="metric-subtext">
                {data.openPipelineValue === 0
                  ? "No active deal potential"
                  : "Active deal potential"}
              </span>
            </div>

            <div className="card metric-card">
              <span className="metric-label">Follow-ups Due Today</span>
              <span className={`metric-value ${data.followUpsDueToday > 0 ? "warning" : ""}`}>
                {data.followUpsDueToday}
              </span>
              <span className="metric-subtext">
                {data.followUpsDueToday > 0
                  ? "Action required today"
                  : "All caught up — nothing due today"}
              </span>
            </div>

            <div className="card metric-card">
              <span className="metric-label">Won / Lost (This Month)</span>
              <div className="metric-split">
                <span className="text-success">{data.wonThisMonth} Won</span>
                <span className="text-muted">/</span>
                <span className="text-danger">{data.lostThisMonth} Lost</span>
              </div>
              <span className="metric-subtext">Current calendar month</span>
            </div>

            <div className="card metric-card">
              <span className="metric-label">Conversion Rate</span>
              <span className="metric-value">
                {data.conversionRate !== null
                  ? `${(data.conversionRate * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className="metric-subtext">
                {data.conversionRate !== null
                  ? "Current calendar month"
                  : "No deals closed yet this month"}
              </span>
            </div>
          </div>

          {user?.role === "manager" && data.perRep && (
            <section className="section-block mt-4">
              <h2>Team Performance Breakdown</h2>
              <div className="table-responsive card p-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sales Representative</th>
                      <th>Open Leads</th>
                      <th>Open Pipeline Value</th>
                      <th>Won Deals (This Month)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perRep.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">
                          No active reps found.
                        </td>
                      </tr>
                    ) : (
                      data.perRep.map((rep) => (
                        <tr key={rep.repId}>
                          <td>
                            <div className="user-name-with-avatar">
                              <Avatar name={rep.repName} size="sm" />
                              <strong>{rep.repName}</strong>
                            </div>
                          </td>
                          <td>{rep.openLeads}</td>
                          <td>{formatCurrency(rep.openPipelineValue)}</td>
                          <td>
                            <span className="badge badge-success">{rep.wonThisMonth} Won</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </Layout>
  );
};
