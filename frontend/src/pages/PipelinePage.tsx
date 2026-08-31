import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getOpportunities } from "../api/opportunityApi";
import type { Opportunity, OpportunityStage } from "../types/opportunity";
import type { ApiErrorResponse } from "../types/auth";

const STAGES: OpportunityStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost"
];

export const PipelinePage: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [mineOnly, setMineOnly] = useState<boolean>(true);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOpportunities({
        pageSize: 100,
        stage: selectedStage || undefined,
        mine: user?.role === "manager" ? mineOnly : undefined
      });
      setOpportunities(response.data);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.message || "Failed to load pipeline opportunities.");
    } finally {
      setLoading(false);
    }
  }, [selectedStage, mineOnly, user]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getOpportunities({
          pageSize: 100,
          stage: selectedStage || undefined,
          mine: user?.role === "manager" ? mineOnly : undefined
        });
        if (!ignore) {
          setOpportunities(response.data);
        }
      } catch (err) {
        if (!ignore) {
          const apiErr = err as ApiErrorResponse;
          setError(apiErr.message || "Failed to load pipeline opportunities.");
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
  }, [selectedStage, mineOnly, user?.role]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Grouping by stage
  const groupedStages = STAGES.map((stage) => {
    const stageOpps = opportunities.filter((o) => o.stage === stage);
    const stageTotalValue = stageOpps.reduce((sum, o) => sum + o.dealValue, 0);
    return {
      stage,
      opps: stageOpps,
      count: stageOpps.length,
      totalValue: stageTotalValue
    };
  });

  return (
    <Layout pageTitle="Sales Pipeline">
      <div className="page-header">
        <div>
          <h1>Sales Pipeline</h1>
          <p className="page-subtitle">Track deal progress across stages</p>
        </div>
      </div>

      <div className="filter-bar card raised mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3 p-3">
        <div className="filter-group d-flex align-items-center gap-2">
          <label htmlFor="stage-filter" className="font-semibold fs-small">
            Stage Filter:
          </label>
          <select
            id="stage-filter"
            className="inset form-control"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {user?.role === "manager" && (
          <div className="filter-group">
            <label className="checkbox-label d-flex align-items-center gap-2 fs-small">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
              />
              Show only my assigned deals
            </label>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-state py-4 text-center text-muted">Loading pipeline...</div>
      )}

      {!loading && error && (
        <div className="alert-banner error mb-4">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm ms-2" onClick={fetchPipeline}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && opportunities.length === 0 && (
        <div className="card raised text-center py-5 p-4">
          <h3>No opportunities match these filters</h3>
          <p className="text-muted fs-small">
            Try clearing filters or converting leads into deals.
          </p>
          {selectedStage && (
            <button
              type="button"
              className="btn btn-secondary btn-sm mt-3"
              onClick={() => setSelectedStage("")}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && opportunities.length > 0 && (
        <div className="pipeline-board d-flex gap-3 overflow-x-auto pb-3">
          {groupedStages
            .filter((group) => !selectedStage || group.stage === selectedStage)
            .map((group) => (
              <div
                key={group.stage}
                className="pipeline-column card raised flex-1"
                style={{ minWidth: 260 }}
              >
                <div className="column-header mb-3 pb-2 border-bottom d-flex justify-content-between align-items-center">
                  <span className="column-title font-semibold">{group.stage}</span>
                  <span className="column-metrics text-muted fs-small">
                    {group.count} | {formatCurrency(group.totalValue)}
                  </span>
                </div>
                <div className="column-cards d-flex flex-column gap-3">
                  {group.opps.length === 0 ? (
                    <div className="empty-stage-column inset text-muted text-center py-4 fs-small border-radius-sm">
                      No deals
                    </div>
                  ) : (
                    group.opps.map((opp) => (
                      <Link
                        key={opp.id}
                        to={`/opportunities/${opp.id}`}
                        className="pipeline-card-item raised p-3 rounded text-decoration-none text-ink d-block"
                      >
                        <div className="opp-company font-semibold mb-1">
                          {opp.customer?.companyName || `Customer #${opp.customerId}`}
                        </div>
                        <div className="opp-value text-accent font-semibold fs-large mb-2">
                          {formatCurrency(opp.dealValue)}
                        </div>
                        <div className="opp-footer text-muted fs-small border-top pt-2">
                          <span>
                            Est. close: {new Date(opp.expectedCloseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </Layout>
  );
};
