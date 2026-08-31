import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { fetchLeads } from "../api/leadApi";
import type { Lead, LeadStatus, LeadSource } from "../types/lead";
import type { ApiErrorResponse } from "../types/auth";

export const LeadsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;

    fetchLeads({
      page,
      pageSize,
      status: statusFilter,
      source: sourceFilter,
      q: debouncedSearch
    })
      .then((data) => {
        if (isMounted) {
          setLeads(data.data);
          setTotal(data.total);
          setErrorMessage(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const apiErr = err as ApiErrorResponse;
          setErrorMessage(apiErr.message || "Failed to load leads list.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, statusFilter, sourceFilter, debouncedSearch, reloadToken]);

  const handleClearFilters = () => {
    setStatusFilter("");
    setSourceFilter("");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
    setIsLoading(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setReloadToken((prev) => prev + 1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasActiveFilters = Boolean(statusFilter || sourceFilter || debouncedSearch);

  return (
    <Layout pageTitle="Leads Directory">
      <div className="leads-page-header">
        <div>
          <h1 className="page-title">Leads Management</h1>
          <p className="page-subtitle">
            {user?.role === "manager"
              ? "View, track, and assign leads across the sales team"
              : "Manage and work your assigned prospective leads"}
          </p>
        </div>
        {user?.role === "manager" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/leads/new")}
            id="create-lead-btn"
          >
            Create New Lead
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-card card raised mb-4">
        <div className="filter-group search">
          <label htmlFor="lead-search-input">Search Leads</label>
          <input
            id="lead-search-input"
            type="text"
            className="inset"
            placeholder="Search by company or contact name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter-select">Status</label>
          <select
            id="status-filter-select"
            className="inset"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeadStatus | "");
              setPage(1);
              setIsLoading(true);
            }}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Disqualified">Disqualified</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="source-filter-select">Source</label>
          <select
            id="source-filter-select"
            className="inset"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as LeadSource | "");
              setPage(1);
              setIsLoading(true);
            }}
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="filter-group clear-action">
            <button
              type="button"
              className="btn btn-secondary text-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={handleRetry} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        /* Empty State per PRD FR-2.3 & Section D.2 */
        <div className="empty-state-box card raised text-center p-5">
          <svg
            className="empty-icon mx-auto mb-3 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ width: 48, height: 48 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3>{hasActiveFilters ? "No leads match these filters" : "No leads assigned yet"}</h3>
          <p className="text-muted fs-small">
            {hasActiveFilters
              ? "Try clearing filters or search terms."
              : "When new leads are created or assigned, they will appear here."}
          </p>
          {hasActiveFilters && (
            <button type="button" className="btn btn-primary mt-3" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Leads Table with Owner Avatar Column */
        <div className="table-responsive card raised p-0">
          <table className="data-table table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Assigned Rep</th>
                <th>Source</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const ownerName =
                  lead.owner?.name ||
                  (lead.ownerId === 1 ? "Alice Manager" : `Rep #${lead.ownerId}`);
                return (
                  <tr key={lead.id}>
                    <td className="font-semibold">{lead.companyName}</td>
                    <td>{lead.contactName}</td>
                    <td>
                      <div className="user-name-with-avatar">
                        <Avatar name={ownerName} size="sm" />
                        <span>{ownerName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="source-tag">{lead.source}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${lead.status.toLowerCase()}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/leads/${lead.id}`} className="view-link">
                        View & Edit &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && leads.length > 0 && (
        <div className="pagination-bar mt-4">
          <span className="pagination-info text-muted fs-small">
            Showing page {page} of {totalPages} ({total} total leads)
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => {
                setIsLoading(true);
                setPage((p) => Math.max(p - 1, 1));
              }}
            >
              &larr; Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              disabled={page >= totalPages}
              onClick={() => {
                setIsLoading(true);
                setPage((p) => Math.min(p + 1, totalPages));
              }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};
