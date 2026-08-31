import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeads } from "../api/leadApi";
import type { Lead } from "../types/lead";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced search backend fetch when query changes
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    const timer = setTimeout(() => {
      setIsLoading(true);
      fetchLeads(trimmed ? { q: trimmed, pageSize: 20 } : { pageSize: 20 })
        .then((res) => {
          setLeads(res.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectLead = (id: number) => {
    onClose();
    navigate(`/leads/${id}`);
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette-card raised" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search leads, companies... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        <div className="command-palette-body">
          {isLoading ? (
            <div className="command-palette-empty">Searching records...</div>
          ) : (
            <>
              {leads.length > 0 && (
                <div className="command-section">
                  <div className="command-section-title">Leads Directory</div>
                  {leads.map((lead) => (
                    <div
                      key={`lead-${lead.id}`}
                      className="command-item"
                      onClick={() => handleSelectLead(lead.id)}
                    >
                      <div className="command-item-main">
                        <span className="command-item-title">{lead.companyName}</span>
                        <span className="command-item-sub">Contact: {lead.contactName}</span>
                      </div>
                      <span className={`status-pill ${lead.status.toLowerCase()}`}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && leads.length === 0 && (
                <div className="command-palette-empty">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
