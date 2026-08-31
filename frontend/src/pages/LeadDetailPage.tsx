import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastContext";
import { fetchLeadById, updateLead, convertLead } from "../api/leadApi";
import { fetchUsers } from "../api/userApi";
import type { Lead, LeadStatus, LeadSource } from "../types/lead";
import type { User, ApiErrorResponse } from "../types/auth";

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [reps, setReps] = useState<User[]>([]);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState<LeadSource>("Website");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [ownerId, setOwnerId] = useState<number>(0);

  // Convert Modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDealValue, setConvertDealValue] = useState<string>("10000");
  const [convertCloseDate, setConvertCloseDate] = useState<string>(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [isConverting, setIsConverting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!leadId || isNaN(leadId)) {
      return;
    }

    Promise.all([
      fetchLeadById(leadId),
      user?.role === "manager" ? fetchUsers() : Promise.resolve([])
    ])
      .then(([leadData, usersData]) => {
        if (isMounted) {
          setLead(leadData);
          setReps(usersData);

          // Populate form fields
          setCompanyName(leadData.companyName);
          setContactName(leadData.contactName);
          setContactEmail(leadData.contactEmail);
          setContactPhone(leadData.contactPhone || "");
          setSource(leadData.source);
          setStatus(leadData.status);
          setDisqualifyReason(leadData.disqualifyReason || "");
          setOwnerId(leadData.ownerId);
          setErrorMessage(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const apiErr = err as ApiErrorResponse;
          const msg = apiErr.message || "This record could not be found.";
          setErrorMessage(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [leadId, user?.role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (status === "Disqualified" && (!disqualifyReason || disqualifyReason.trim().length < 5)) {
      const msg = "Disqualify reason must be at least 5 characters long.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateLead(leadId, {
        companyName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        source,
        status,
        disqualifyReason: status === "Disqualified" ? disqualifyReason : null,
        ...(user?.role === "manager" && { ownerId })
      });

      setLead(updated);
      if (status === "Disqualified") {
        toast.success("Lead marked as disqualified");
      } else {
        toast.success("Lead updated");
      }
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to update lead.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmConvert = async () => {
    if (!lead) return;
    setIsConverting(true);
    setErrorMessage(null);

    try {
      const dealVal = parseFloat(convertDealValue) || 10000;
      const res = await convertLead(lead.id, {
        dealValue: dealVal,
        expectedCloseDate: convertCloseDate ? new Date(convertCloseDate).toISOString() : undefined
      });
      setShowConvertModal(false);
      // Section C Toast Trigger
      toast.success("Converted to customer — opportunity created");
      navigate(`/opportunities/${res.opportunity.id}`);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to convert lead.";
      setErrorMessage(msg);
      toast.error(msg);
      setShowConvertModal(false);
    } finally {
      setIsConverting(false);
    }
  };

  const isInvalidId = !leadId || isNaN(leadId);

  if (isLoading && !isInvalidId) {
    return (
      <Layout pageTitle="Lead Details">
        <div className="loading-container p-5">
          <div className="spinner"></div>
          <p>Loading lead details...</p>
        </div>
      </Layout>
    );
  }

  if (isInvalidId || (errorMessage && !lead)) {
    return (
      <Layout pageTitle="Lead Details">
        <div className="card raised p-5 text-center">
          <h2>Lead Not Found</h2>
          <p className="text-muted">{errorMessage || "This record could not be found."}</p>
          <button type="button" className="btn btn-primary mt-3" onClick={() => navigate("/leads")}>
            &larr; Back to Leads List
          </button>
        </div>
      </Layout>
    );
  }

  const canConvert = status === "Contacted" || status === "Qualified";

  return (
    <Layout pageTitle={`Lead — ${lead?.companyName}`}>
      <div className="breadcrumb-bar mb-3">
        <Link to="/leads" className="text-accent">
          &larr; Back to Leads
        </Link>
      </div>

      <div className="detail-header card raised p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <Avatar name={lead?.contactName || "L"} size="lg" />
          <div>
            <div className="header-meta d-flex gap-2 mb-1">
              <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
              <span className="source-tag">{source}</span>
            </div>
            <h1 className="detail-title m-0">{lead?.companyName}</h1>
            <p className="detail-subtitle text-muted m-0">Contact: {lead?.contactName}</p>
          </div>
        </div>

        {canConvert && (
          <div className="action-button-group">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowConvertModal(true)}
              id="convert-lead-btn"
            >
              Convert to Opportunity
            </button>
          </div>
        )}
      </div>

      {/* Convert Confirmation Dialog Modal */}
      {showConvertModal && (
        <div className="modal-overlay">
          <div className="modal-content card raised p-4" style={{ maxWidth: 480 }}>
            <h3>Confirm Lead Conversion</h3>
            <p className="my-2 text-muted">
              Are you sure you want to convert <strong>{lead?.companyName}</strong>? Converting will
              create a Customer record and open an Opportunity in the sales pipeline.
            </p>

            <div className="form-group my-3">
              <label htmlFor="convert-deal-val">Initial Deal Value ($):</label>
              <input
                type="number"
                id="convert-deal-val"
                className="inset form-control"
                value={convertDealValue}
                onChange={(e) => setConvertDealValue(e.target.value)}
                min="0"
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="convert-close-date">Expected Close Date:</label>
              <input
                type="date"
                id="convert-close-date"
                className="inset form-control"
                value={convertCloseDate}
                onChange={(e) => setConvertCloseDate(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConvertModal(false)}
                disabled={isConverting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmConvert}
                disabled={isConverting}
                id="confirm-convert-btn"
              >
                {isConverting ? "Converting..." : "Yes, Convert Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="alert-banner error mb-4" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="detail-grid">
        {/* Edit Form */}
        <div className="card raised p-4">
          <h3 className="mb-4">Edit Lead Information</h3>
          <form onSubmit={handleSubmit} className="lead-edit-form">
            <div className="form-row d-flex gap-3 mb-3 flex-wrap">
              <div className="form-group flex-1">
                <label htmlFor="edit-company-name">Company Name *</label>
                <input
                  id="edit-company-name"
                  type="text"
                  className="inset"
                  maxLength={100}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="edit-contact-name">Contact Name *</label>
                <input
                  id="edit-contact-name"
                  type="text"
                  className="inset"
                  maxLength={100}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row d-flex gap-3 mb-3 flex-wrap">
              <div className="form-group flex-1">
                <label htmlFor="edit-contact-email">Contact Email *</label>
                <input
                  id="edit-contact-email"
                  type="email"
                  className="inset"
                  maxLength={100}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="edit-contact-phone">Contact Phone</label>
                <input
                  id="edit-contact-phone"
                  type="text"
                  className="inset"
                  maxLength={20}
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(e.target.value.replace(/[^0-9\s+\-()]/g, "").slice(0, 20))
                  }
                  placeholder="e.g. (555) 123-4567"
                />
              </div>
            </div>

            <div className="form-row d-flex gap-3 mb-3 flex-wrap">
              <div className="form-group flex-1">
                <label htmlFor="edit-source">Lead Source *</label>
                <select
                  id="edit-source"
                  className="inset"
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="edit-status">Lead Status *</label>
                <select
                  id="edit-status"
                  className="inset"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  disabled={status === "Converted"}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
                {status === "Converted" && (
                  <span className="field-hint text-muted fs-small d-block mt-1">
                    Status can&apos;t be changed after conversion.
                  </span>
                )}
              </div>
            </div>

            {/* Conditional Disqualify Reason */}
            {status === "Disqualified" && (
              <div className="form-group mb-3 highlight-box">
                <label htmlFor="disqualify-reason-input">
                  Disqualify Reason * (min 5 characters)
                </label>
                <textarea
                  id="disqualify-reason-input"
                  className="inset"
                  rows={3}
                  maxLength={500}
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  placeholder="Provide a specific reason for disqualification..."
                  required
                />
              </div>
            )}

            {/* Manager Owner Reassignment */}
            {user?.role === "manager" && (
              <div className="form-group mb-4">
                <label htmlFor="edit-owner-select">Assigned Sales Owner (Manager Only)</label>
                <select
                  id="edit-owner-select"
                  className="inset"
                  value={ownerId}
                  onChange={(e) => setOwnerId(Number(e.target.value))}
                >
                  {reps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.role === "manager" ? "Manager" : "Rep"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={isSaving || status === "Converted"}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
