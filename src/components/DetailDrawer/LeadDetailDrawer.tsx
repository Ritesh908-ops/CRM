import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquarePlus, 
  Copy, 
  Check, 
  Trash2
} from 'lucide-react';
import type { CRMLead, LeadStatus } from '../../types/crm';
import { formatCurrency } from '../../utils/formatters';

interface LeadDetailDrawerProps {
  lead: CRMLead | null;
  onClose: () => void;
  onUpdateStatus: (leadId: number, status: LeadStatus) => void;
  onAddNote: (leadId: number, noteText: string) => void;
  onDeleteLead: (leadId: number) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onUpdateStatus,
  onAddNote,
  onDeleteLead
}) => {
  const [newNote, setNewNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !lead.id) return;
    onAddNote(lead.id, newNote.trim());
    setNewNote('');
  };

  const statuses: LeadStatus[] = ['New', 'Contacted', 'In Discussion', 'Qualified', 'Converted', 'Unresponsive'];

  return (
    <div className="drawer-overlay">
      <div className="drawer">
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-2.5">
            <span className={`badge ${(lead.entityType || "").toLowerCase() === 'company' ? 'b-part' : 'b-plant'}`}>
              {(lead.entityType || "company").toUpperCase()}
            </span>
            <span className="text-xs font-mono font-bold text-gray-500">{lead.entityId}</span>
          </div>

          <div className="flex items-center gap-2">
            {lead.id && (
              <button 
                onClick={() => onDeleteLead(lead.id!)} 
                title="Delete Lead"
                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm" title="Close Drawer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          
          {/* Header Title & Location Info */}
          <div className="profile-section">
            <div className="profile-section-ttl">
              <Building2 size={14} className="text-indigo-600" /> Lead Overview
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug mb-3">
              {lead.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="dr">
                <span className="dk">Location</span>
                <span className="dv flex items-center gap-1.5">
                  <MapPin size={13} className="text-teal-600 shrink-0" />
                  <span>{lead.district}, {lead.state}</span>
                </span>
              </div>
              <div className="dr">
                <span className="dk">ROC Office</span>
                <span className="dv flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-600 shrink-0" />
                  <span>{lead.roc}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Status Pipeline Picker */}
          <div className="profile-section">
            <div className="profile-section-ttl">Pipeline Stage</div>
            <div className="pipeline-chips">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => lead.id && onUpdateStatus(lead.id, st)}
                  className={`pipeline-chip ${lead.status === st ? 'active' : ''}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Director Contact Card */}
          <div className="profile-section">
            <div className="profile-section-ttl">
              <User size={14} className="text-indigo-600" /> Director / Contact Person
            </div>
            
            <div className="flex flex-col gap-3">
              <div>
                <div className="dk">Director Name</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">
                  {lead.directorName || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                {/* Mobile Phone */}
                <div className="p-2.5 rounded-xl bg-white flex items-center justify-between shadow-sm" style={{ borderRadius: '13px' }}>
                  {lead.directorMobile ? (
                    <>
                      <a href={`tel:${lead.directorMobile}`} className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline">
                        <Phone size={13} className="shrink-0" />
                        <span>{lead.directorMobile}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lead.directorMobile, 'mobile')}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        title="Copy Phone"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {copiedField === 'mobile' ? <Check size={14} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No phone listed</span>
                  )}
                </div>

                {/* Email Address */}
                <div className="p-2.5 rounded-xl bg-white flex items-center justify-between shadow-sm" style={{ borderRadius: '13px' }}>
                  {lead.directorEmail ? (
                    <>
                      <a href={`mailto:${lead.directorEmail}`} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline truncate max-w-[170px]">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{lead.directorEmail}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lead.directorEmail, 'email')}
                        className="text-gray-400 hover:text-gray-700 p-1 shrink-0 ml-1"
                        title="Copy Email"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {copiedField === 'email' ? <Check size={14} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No director email</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financials Grid */}
          <div className="profile-section">
            <div className="profile-section-ttl">Financial Capital</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm" style={{ borderRadius: '13px' }}>
                <span className="dk">Paid-Up Capital</span>
                <div className="text-lg font-bold text-green-600 mt-0.5">
                  {formatCurrency(lead.paidUpCapital)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white shadow-sm" style={{ borderRadius: '13px' }}>
                <span className="dk">Authorized Capital</span>
                <div className="text-lg font-bold text-indigo-600 mt-0.5">
                  {formatCurrency(lead.authorizedCapital)}
                </div>
              </div>
            </div>
          </div>

          {/* NIC Info & Metadata */}
          <div className="profile-section">
            <div className="profile-section-ttl">Industry & Registration</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="dr">
                <span className="dk">NIC Code</span>
                <span className="dv font-bold text-teal-700">{lead.nicCode || 'N/A'}</span>
              </div>
              <div className="dr">
                <span className="dk">Industry Sector</span>
                <span className="dv">{lead.nicLabel || 'Unclassified Industry Sector'}</span>
              </div>
              <div className="dr">
                <span className="dk">Date of Incorporation</span>
                <span className="dv">{lead.dateOfIncorporation || 'N/A'}</span>
              </div>
              <div className="dr">
                <span className="dk">Company Email</span>
                <span className="dv">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="dr">
                <span className="dk">Upload Batch ID</span>
                <span className="dv font-bold text-amber-700">{lead.batchId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Notes & Activity Log (Refactored Red Box Area) */}
          <div className="profile-section">
            <div className="profile-section-ttl">
              <MessageSquarePlus size={14} className="text-indigo-600" /> Notes & Activity History ({lead.notes?.length || 0})
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleNoteSubmit} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a call log note or follow-up comment..."
                className="input-field text-xs py-2"
              />
              <button type="submit" className="btn btn-primary btn-sm shrink-0 font-bold">
                Add Note
              </button>
            </form>

            {/* Note History Cards */}
            {lead.notes && lead.notes.length > 0 ? (
              <div className="flex flex-col gap-2.5 pt-1">
                {lead.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-white shadow-sm flex flex-col gap-1" style={{ borderRadius: '13px' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600">{note.author}</span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed mt-0.5">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 italic bg-white rounded-xl shadow-sm" style={{ borderRadius: '13px' }}>
                No notes added yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
