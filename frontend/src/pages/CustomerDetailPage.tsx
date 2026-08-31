import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Avatar } from "../components/Avatar";
import { useToast } from "../components/ToastContext";
import { getCustomerDetail, addContactPerson, logCustomerActivity } from "../api/customerApi";
import type { CustomerDetailResponse, ActivityType } from "../types/customer";
import type { ApiErrorResponse } from "../types/auth";

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Contact Form State
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [contactFormError, setContactFormError] = useState<string | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);

  // New Activity Form State
  const [showActivityForm, setShowActivityForm] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [activityNotes, setActivityNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [activityOppId, setActivityOppId] = useState<string>("");
  const [activityFormError, setActivityFormError] = useState<string | null>(null);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerDetail(parseInt(id, 10));
      setCustomer(data);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.message || "Failed to load customer profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getCustomerDetail(parseInt(id, 10));
        if (!ignore) {
          setCustomer(data);
        }
      } catch (err) {
        if (!ignore) {
          const apiErr = err as ApiErrorResponse;
          setError(apiErr.message || "Failed to load customer profile.");
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

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!contactName.trim()) {
      const msg = "Contact name is required.";
      setContactFormError(msg);
      toast.error(msg);
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      const msg = "Enter a valid email address.";
      setContactFormError(msg);
      toast.error(msg);
      return;
    }

    setSubmittingContact(true);
    setContactFormError(null);

    try {
      await addContactPerson(customer.id, {
        name: contactName.trim(),
        title: contactTitle.trim() || undefined,
        email: contactEmail.trim(),
        phone: contactPhone.trim() || undefined,
        isPrimary
      });
      await fetchDetail();
      toast.success(`Contact ${contactName.trim()} added`);
      setShowContactForm(false);
      setContactName("");
      setContactTitle("");
      setContactEmail("");
      setContactPhone("");
      setIsPrimary(false);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to add contact.";
      setContactFormError(msg);
      toast.error(msg);
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleLogActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (activityNotes.trim().length < 3) {
      const msg = "Notes must be at least 3 characters long.";
      setActivityFormError(msg);
      toast.error(msg);
      return;
    }

    setSubmittingActivity(true);
    setActivityFormError(null);

    try {
      await logCustomerActivity(customer.id, {
        type: activityType,
        notes: activityNotes.trim(),
        nextFollowUpDate: nextFollowUpDate || undefined,
        opportunityId: activityOppId ? parseInt(activityOppId, 10) : undefined
      });
      await fetchDetail();
      toast.success("Activity logged");
      setShowActivityForm(false);
      setActivityNotes("");
      setNextFollowUpDate("");
      setActivityOppId("");
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.message || "Failed to log activity.";
      setActivityFormError(msg);
      toast.error(msg);
    } finally {
      setSubmittingActivity(false);
    }
  };

  if (loading) {
    return (
      <Layout pageTitle="Customer Details">
        <div className="loading-state py-5 text-center text-muted">Loading customer profile...</div>
      </Layout>
    );
  }

  if (error || !customer) {
    return (
      <Layout pageTitle="Customer Details">
        <div className="alert-banner error mb-4">
          <span>{error || "Customer record not found."}</span>
          <button type="button" className="btn btn-secondary btn-sm ms-3" onClick={fetchDetail}>
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle={`Customer — ${customer.companyName}`}>
      <div className="page-header d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="m-0">{customer.companyName}</h1>
          <p className="page-subtitle text-muted m-0">Customer Profile #{customer.id}</p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowActivityForm(!showActivityForm)}
          >
            {showActivityForm ? "Cancel Activity" : "Log Activity"}
          </button>
        </div>
      </div>

      {showActivityForm && (
        <div className="card raised mb-4 p-4">
          <h3 className="mb-3">Log New Activity</h3>
          <form onSubmit={handleLogActivitySubmit}>
            {activityFormError && (
              <div className="alert-banner error mb-3">{activityFormError}</div>
            )}

            <div className="grid-2-col d-flex gap-3 flex-wrap">
              <div className="form-group flex-1">
                <label htmlFor="activity-type" className="font-semibold mb-1 d-block">
                  Activity Type <span className="text-danger">*</span>:
                </label>
                <select
                  id="activity-type"
                  className="inset form-control"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                >
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="activity-opp" className="font-semibold mb-1 d-block">
                  Link to Opportunity (Optional):
                </label>
                <select
                  id="activity-opp"
                  className="inset form-control"
                  value={activityOppId}
                  onChange={(e) => setActivityOppId(e.target.value)}
                >
                  <option value="">-- None --</option>
                  {customer.opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      Opp #{opp.id} - {opp.stage} ({formatCurrency(opp.dealValue)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group my-3">
              <label htmlFor="activity-notes" className="font-semibold mb-1 d-block">
                Notes <span className="text-danger">*</span>:
              </label>
              <textarea
                id="activity-notes"
                className="inset form-control"
                rows={3}
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Enter call outcome, meeting notes, or follow-up details (min 3 chars)..."
              />
            </div>

            <div className="form-group mb-4">
              <label htmlFor="next-followup" className="font-semibold mb-1 d-block">
                Next Follow-up Date (Optional):
              </label>
              <input
                type="date"
                id="next-followup"
                className="inset form-control"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={submittingActivity}>
                {submittingActivity ? "Saving..." : "Save Activity"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowActivityForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2-col d-flex gap-4 flex-wrap">
        <div className="d-flex flex-column gap-4 flex-1" style={{ minWidth: 320 }}>
          <div className="card raised p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Contact Persons</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowContactForm(!showContactForm)}
              >
                {showContactForm ? "Cancel" : "Add Contact"}
              </button>
            </div>

            {showContactForm && (
              <form onSubmit={handleAddContactSubmit} className="mb-4 p-3 inset rounded">
                {contactFormError && (
                  <div className="alert-banner error mb-3">{contactFormError}</div>
                )}
                <div className="form-group mb-2">
                  <label className="fs-small font-semibold">Name *</label>
                  <input
                    type="text"
                    className="inset form-control"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="fs-small font-semibold">Title</label>
                  <input
                    type="text"
                    className="inset form-control"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="fs-small font-semibold">Email *</label>
                  <input
                    type="email"
                    className="inset form-control"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="fs-small font-semibold">Phone</label>
                  <input
                    type="text"
                    className="inset form-control"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="form-check mb-3 mt-2">
                  <label className="checkbox-label d-flex align-items-center gap-2 fs-small">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Set as Primary Contact
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingContact}
                >
                  {submittingContact ? "Saving..." : "Save Contact"}
                </button>
              </form>
            )}

            <div className="contacts-list d-flex flex-column gap-2">
              {customer.contacts.length === 0 ? (
                <div className="text-muted py-2 fs-small">No contact persons registered.</div>
              ) : (
                customer.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="contact-item p-3 raised rounded d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Avatar name={contact.name} size="sm" />
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <strong className="font-semibold">{contact.name}</strong>
                          {contact.title && (
                            <span className="text-muted fs-small"> — {contact.title}</span>
                          )}
                          {contact.isPrimary && (
                            <span className="badge badge-primary fs-small">Primary</span>
                          )}
                        </div>
                        <div className="fs-small text-muted mt-1">
                          <span>{contact.email}</span>
                          {contact.phone && <span className="ms-2">• {contact.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card raised p-4">
            <h3 className="mb-3">Linked Opportunities</h3>
            <div className="opportunities-list d-flex flex-column gap-2">
              {customer.opportunities.length === 0 ? (
                <div className="text-muted py-2 fs-small">No opportunities linked.</div>
              ) : (
                customer.opportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/opportunities/${opp.id}`}
                    className="opp-link-item raised p-3 rounded d-flex justify-content-between align-items-center text-decoration-none text-ink"
                  >
                    <div>
                      <strong className="font-semibold">Opportunity #{opp.id}</strong>
                      <div className="fs-small text-muted">
                        Value: {formatCurrency(opp.dealValue)}
                      </div>
                    </div>
                    <span className={`status-pill ${opp.stage.toLowerCase()}`}>{opp.stage}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card raised flex-1 p-4" style={{ minWidth: 320 }}>
          <h3 className="m-0">Activity History Timeline</h3>
          <p className="text-muted fs-small mb-4">Reverse-chronological log of interactions</p>

          <div className="activity-timeline">
            {customer.activities.length === 0 ? (
              /* Section D.4 Activity Timeline Zero State */
              <div className="empty-state-box inset p-4 text-center rounded my-3">
                <h4 className="m-0 font-semibold mb-1">No activity recorded yet</h4>
                <p className="text-muted fs-small m-0">
                  Logged calls, meetings, and notes will appear in this timeline.
                </p>
              </div>
            ) : (
              customer.activities.map((act) => (
                <div key={act.id} className="timeline-item pb-3 mb-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`status-pill ${act.type}`}>{act.type.toUpperCase()}</span>
                    <span className="fs-small text-muted">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="activity-notes my-2 text-ink">{act.notes}</p>
                  <div className="d-flex justify-content-between align-items-center fs-small text-muted mt-2">
                    <div className="user-name-with-avatar">
                      <Avatar name={act.owner?.name || `User #${act.ownerId}`} size="sm" />
                      <span>{act.owner?.name || `User #${act.ownerId}`}</span>
                    </div>
                    {act.nextFollowUpDate && (
                      <span className="text-accent font-semibold">
                        Follow-up: {new Date(act.nextFollowUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
