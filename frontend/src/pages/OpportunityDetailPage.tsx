import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { useToast } from "../components/ToastContext";
import { getOpportunityById, transitionOpportunityStage } from "../api/opportunityApi";
import type { Opportunity, OpportunityStage } from "../types/opportunity";
import type { ApiErrorResponse } from "../types/auth";

const STAGE_ORDER: OpportunityStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won"
];

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [targetStage, setTargetStage] = useState<OpportunityStage | "">("");
  const [lostReason, setLostReason] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getOpportunityById(parseInt(id, 10));
        if (!ignore) {
          setOpp(data);
        }
      } catch (err) {
        if (!ignore) {
          const apiErr = err as ApiErrorResponse;
          setError(apiErr.message || "Failed to load opportunity details.");
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
  }, [id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <Layout pageTitle="Opportunity Details">
        <div className="loading-state py-5 text-center text-muted">
          Loading opportunity details...
        </div>
      </Layout>
    );
  }

  if (error || !opp) {
    return (
      <Layout pageTitle="Opportunity Details">
        <div className="alert-banner error mb-4">
          <span>{error || "Opportunity not found."}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm ms-3"
            onClick={() => navigate("/pipeline")}
          >
            Back to Pipeline
          </button>
        </div>
      </Layout>
    );
  }

  const isTerminal = opp.stage === "Won" || opp.stage === "Lost";
  const currentIndex = STAGE_ORDER.indexOf(opp.stage);
  const nextSequentialStage =
    currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1
      ? STAGE_ORDER[currentIndex + 1]
      : null;

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStage) return;

    if (targetStage === "Lost" && lostReason.trim().length < 3) {
      const msg = "Lost reason must be at least 3 characters.";
      setActionError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await transitionOpportunityStage(opp.id, {
        toStage: targetStage,
        lostReason: targetStage === "Lost" ? lostReason.trim() : undefined
      });
      setOpp(updated);
      // Section C Toast Triggers
      if (targetStage === "Won") {
        toast.success("🎉 Marked as Won");
      } else if (targetStage === "Lost") {
        toast.success("Marked as Lost");
      } else {
        toast.success(`Moved to ${targetStage}`);
      }
      setTargetStage("");
      setLostReason("");
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to transition stage.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const ownerName =
    opp.owner?.name || (opp.ownerId === 1 ? "Alice Manager" : `Rep #${opp.ownerId}`);

  return (
    <Layout pageTitle={`Opportunity #${opp.id}`}>
      <div className="page-header">
        <div>
          <div className="mb-2">
            <Link to="/pipeline" className="text-accent text-decoration-none fs-small">
              &larr; Back to Pipeline
            </Link>
          </div>
          <div className="opp-title-row d-flex align-items-center gap-3">
            <h1 className="page-title m-0">Opportunity #{opp.id}</h1>
            <span className={`status-pill ${opp.stage.toLowerCase()}`}>{opp.stage}</span>
          </div>
          <p className="page-subtitle mt-1 text-muted">
            Customer:{" "}
            <Link to={`/customers/${opp.customerId}`} className="link-highlight font-semibold">
              {opp.customer?.companyName || `Customer #${opp.customerId}`}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid-2-col d-flex gap-4 flex-wrap">
        <div className="card raised flex-1 p-4" style={{ minWidth: 320 }}>
          <h3 className="mb-3">Deal Overview</h3>
          <div className="detail-list d-flex flex-column gap-3">
            <div className="detail-item d-flex justify-content-between border-bottom pb-2">
              <span className="detail-label text-muted">Deal Value</span>
              <span className="detail-value font-semibold text-accent fs-large">
                {formatCurrency(opp.dealValue)}
              </span>
            </div>

            <div className="detail-item d-flex justify-content-between border-bottom pb-2">
              <span className="detail-label text-muted">Owning Representative</span>
              <div className="user-name-with-avatar">
                <Avatar name={ownerName} size="sm" />
                <span className="font-semibold">{ownerName}</span>
              </div>
            </div>

            <div className="detail-item d-flex justify-content-between border-bottom pb-2">
              <span className="detail-label text-muted">Expected Close Date</span>
              <span className="detail-value font-semibold">
                {new Date(opp.expectedCloseDate).toLocaleDateString()}
              </span>
            </div>

            <div className="detail-item d-flex justify-content-between border-bottom pb-2">
              <span className="detail-label text-muted">Current Stage</span>
              <span className="detail-value font-semibold">{opp.stage}</span>
            </div>

            {opp.lostReason && (
              <div className="detail-item d-flex justify-content-between border-bottom pb-2">
                <span className="detail-label text-danger">Lost Reason</span>
                <span className="detail-value text-danger font-semibold">{opp.lostReason}</span>
              </div>
            )}

            <div className="detail-item d-flex justify-content-between pt-1">
              <span className="detail-label text-muted">Created At</span>
              <span className="detail-value text-muted fs-small">
                {new Date(opp.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="card raised flex-1 p-4" style={{ minWidth: 320 }}>
          <h3 className="mb-3">Stage Transition Control</h3>
          {isTerminal ? (
            <div className="inset p-3 rounded text-muted mt-3">
              This deal is in a terminal stage (<strong>{opp.stage}</strong>). No further stage
              transitions can be made.
            </div>
          ) : (
            <form onSubmit={handleStageSubmit} className="mt-3">
              {actionError && <div className="alert-banner error mb-3">{actionError}</div>}

              <div className="flex-col mb-4">
                <label htmlFor="target-stage" className="field-label font-semibold mb-2 d-block">
                  Select Next Stage
                </label>
                <select
                  id="target-stage"
                  className="inset form-select"
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as OpportunityStage)}
                >
                  <option value="">-- Choose allowed transition --</option>
                  {nextSequentialStage && (
                    <option value={nextSequentialStage}>
                      Advance to &apos;{nextSequentialStage}&apos;
                    </option>
                  )}
                  <option value="Lost">Mark as &apos;Lost&apos;</option>
                </select>
                <p className="helper-text text-muted fs-small mt-1">
                  Only forward-sequential transitions or marking &apos;Lost&apos; are permitted.
                </p>
              </div>

              {targetStage === "Lost" && (
                <div className="flex-col mb-4">
                  <label htmlFor="lost-reason" className="field-label font-semibold mb-2 d-block">
                    Lost Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="lost-reason"
                    className="inset form-textarea"
                    rows={3}
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="Explain why this opportunity was lost (min 3 chars)..."
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !targetStage}
              >
                {submitting ? "Updating..." : "Update Stage"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OpportunityDetailPage;
