import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastContext";
import { createLead } from "../api/leadApi";
import { fetchUsers } from "../api/userApi";
import type { LeadSource } from "../types/lead";
import type { User, ApiErrorResponse } from "../types/auth";

export const NewLeadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState<LeadSource>("Website");
  const [ownerId, setOwnerId] = useState<number>(0);

  const [reps, setReps] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation errors
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "manager") {
      navigate("/leads", { replace: true });
      return;
    }

    const loadReps = async () => {
      try {
        const users = await fetchUsers();
        setReps(users);
        if (users.length > 0) {
          setOwnerId(users[0].id);
        }
      } catch {
        const msg = "Failed to load list of sales reps.";
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadReps();
  }, [user?.role, navigate, toast]);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailBlur = () => {
    if (contactEmail && !validateEmail(contactEmail)) {
      setEmailFieldError("Enter a valid email address");
    } else {
      setEmailFieldError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setEmailFieldError(null);

    if (!validateEmail(contactEmail)) {
      setEmailFieldError("Enter a valid email address");
      return;
    }

    if (!companyName || !contactName || !ownerId) {
      const msg = "Please complete all required fields.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      await createLead({
        companyName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || undefined,
        source,
        ownerId
      });
      // Section C Toast trigger
      toast.success(`Lead created for ${companyName}`);
      navigate("/leads");
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr.fields && apiErr.fields.length > 0) {
        apiErr.fields.forEach((f) => {
          if (f.field === "contactEmail") setEmailFieldError(f.message);
        });
      }
      const msg = apiErr.message || "Failed to create lead.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout pageTitle="New Lead">
      <div className="breadcrumb-bar mb-3">
        <Link to="/leads" className="text-accent">
          &larr; Back to Leads List
        </Link>
      </div>

      <div className="page-header">
        <h1>Create New Lead</h1>
        <p className="page-subtitle">Add a new prospect to the pipeline and assign an owner</p>
      </div>

      {errorMessage && (
        <div className="alert-banner error mb-4" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="card raised max-width-600 p-4">
        <form onSubmit={handleSubmit} className="new-lead-form">
          <div className="form-group mb-3">
            <label htmlFor="new-company-name">Company Name *</label>
            <input
              id="new-company-name"
              type="text"
              className="inset"
              placeholder="e.g. Acme Corporation"
              maxLength={100}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="new-contact-name">Contact Person Name *</label>
            <input
              id="new-contact-name"
              type="text"
              className="inset"
              placeholder="e.g. Jane Doe"
              maxLength={100}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="new-contact-email">Contact Email *</label>
            <input
              id="new-contact-email"
              type="email"
              placeholder="jane@acme.com"
              maxLength={100}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              onBlur={handleEmailBlur}
              required
              disabled={isSubmitting}
              className={`inset ${emailFieldError ? "input-error" : ""}`}
            />
            {emailFieldError && (
              <span className="inline-field-error text-danger fs-small">{emailFieldError}</span>
            )}
          </div>

          <div className="form-group mb-3">
            <label htmlFor="new-contact-phone">Contact Phone</label>
            <input
              id="new-contact-phone"
              type="text"
              className="inset"
              placeholder="e.g. (555) 123-4567"
              maxLength={20}
              value={contactPhone}
              onChange={(e) =>
                setContactPhone(e.target.value.replace(/[^0-9\s+\-()]/g, "").slice(0, 20))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="new-source">Lead Source *</label>
            <select
              id="new-source"
              className="inset"
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              disabled={isSubmitting}
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Trade Show">Trade Show</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label htmlFor="new-owner-id">Assigned Sales Owner *</label>
            {isLoadingUsers ? (
              <p className="text-muted">Loading reps...</p>
            ) : (
              <select
                id="new-owner-id"
                className="inset"
                value={ownerId}
                onChange={(e) => setOwnerId(Number(e.target.value))}
                disabled={isSubmitting}
                required
              >
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.role === "manager" ? "Manager" : "Rep"})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-actions d-flex gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/leads")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="save-new-lead-btn"
              disabled={isSubmitting || isLoadingUsers}
            >
              {isSubmitting ? "Creating Lead..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
