import React, { useState, useMemo } from 'react';
import type { CRMLead, LeadStatus } from '../../types/crm';
import { formatCurrency, getStatusSelectClass } from '../../utils/formatters';
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  User, 
  SlidersHorizontal,
  XCircle,
  Download,
  Eye,
  MapPin,
  Building2,
  Search
} from 'lucide-react';

interface LeadsTableProps {
  leads: CRMLead[];
  onSelectLead: (lead: CRMLead) => void;
  onUpdateStatus: (leadId: number, newStatus: LeadStatus) => void;
  selectedBatch: string;
  setSelectedBatch: (batch: string) => void;
  onExportFilteredCSV: (filteredLeads: CRMLead[]) => void;
  /** Owned by App so the navbar's global search drives this table. */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
  selectedBatch,
  setSelectedBatch,
  onExportFilteredCSV,
  searchQuery,
  setSearchQuery
}) => {
  // Filter States
  const search = searchQuery;
  const setSearch = setSearchQuery;
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [rocFilter, setRocFilter] = useState('');
  const [nicFilter, setNicFilter] = useState('');
  
  // Sort State
  const [sortField, setSortField] = useState<keyof CRMLead>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Rows for Bulk Action
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Unique Lists for Dropdowns
  const uniqueStates = useMemo(() => Array.from(new Set(leads.map(l => l.state).filter(Boolean))).sort(), [leads]);
  const uniqueROCs = useMemo(() => Array.from(new Set(leads.map(l => l.roc).filter(Boolean))).sort(), [leads]);
  const uniqueNICs = useMemo(() => Array.from(new Set(leads.map(l => l.nicLabel).filter(Boolean))).sort(), [leads]);
  const uniqueBatches = useMemo(() => Array.from(new Set(leads.map(l => l.batchId).filter(Boolean))).sort(), [leads]);

  // Filtering Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Global Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesQuery = 
          lead.name?.toLowerCase().includes(q) ||
          lead.entityId?.toLowerCase().includes(q) ||
          lead.directorName?.toLowerCase().includes(q) ||
          lead.directorEmail?.toLowerCase().includes(q) ||
          lead.directorMobile?.toLowerCase().includes(q) ||
          lead.state?.toLowerCase().includes(q) ||
          lead.nicLabel?.toLowerCase().includes(q);
        
        if (!matchesQuery) return false;
      }

      if (entityTypeFilter && (lead.entityType || "").toLowerCase() !== entityTypeFilter.toLowerCase()) return false;
      if (statusFilter && lead.status !== statusFilter) return false;
      if (stateFilter && lead.state !== stateFilter) return false;
      if (rocFilter && lead.roc !== rocFilter) return false;
      if (nicFilter && lead.nicLabel !== nicFilter) return false;
      if (selectedBatch && lead.batchId !== selectedBatch) return false;

      return true;
    });
  }, [leads, search, entityTypeFilter, statusFilter, stateFilter, rocFilter, nicFilter, selectedBatch]);

  // Sorting Logic
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;
  // Clamped at render time so deleting or filtering down never strands the user
  // on a page that no longer exists.
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, safePage, pageSize]);

  const handleSort = (field: keyof CRMLead) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedLeads.map(l => l.id!).filter(Boolean);
    const allSelected = pageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSearch('');
    setEntityTypeFilter('');
    setStatusFilter('');
    setStateFilter('');
    setRocFilter('');
    setNicFilter('');
    setSelectedBatch('');
  };

  const hasActiveFilters = Boolean(search || entityTypeFilter || statusFilter || stateFilter || rocFilter || nicFilter || selectedBatch);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter Bar Header */}
      <div className="fsec">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={16} className="text-indigo-600" />
            <span className="font-bold text-sm text-gray-900">Multi-Field Filter & Search</span>
            <span className="badge b-part" style={{ marginLeft: '4px' }}>
              {filteredLeads.length} of {leads.length} Records
            </span>
          </div>

          {/* Right Action Area (Matches User Red Box) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters} 
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <XCircle size={14} /> Clear Filters
              </button>
            )}

            <button
              onClick={() => onExportFilteredCSV(filteredLeads)}
              className="btn btn-ghost btn-sm"
            >
              <Download size={14} />
              <span>Export Filtered ({filteredLeads.length})</span>
            </button>
          </div>
        </div>

        {/* In-table search — mirrors the navbar's global search box */}
        <div className="sw" style={{ marginBottom: '12px' }}>
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search company, entity ID, director, phone, email, state or sector..."
            style={{ paddingLeft: '36px' }}
            aria-label="Search leads"
          />
        </div>

        {/* Dropdown Filters Grid (Side-by-Side 6 Columns) */}
        <div className="filter-grid">
          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All Entity Types</option>
            <option value="company">Company</option>
            <option value="llp">LLP</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All Pipeline Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Discussion">In Discussion</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Unresponsive">Unresponsive</option>
          </select>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All States ({uniqueStates.length})</option>
            {uniqueStates.map(st => <option key={st} value={st}>{st}</option>)}
          </select>

          {/* ROC Filter */}
          <select
            value={rocFilter}
            onChange={(e) => { setRocFilter(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All ROCs ({uniqueROCs.length})</option>
            {uniqueROCs.map(roc => <option key={roc} value={roc}>{roc}</option>)}
          </select>

          {/* NIC Industry Filter */}
          <select
            value={nicFilter}
            onChange={(e) => { setNicFilter(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All Industry Sectors</option>
            {uniqueNICs.map(nic => <option key={nic} value={nic}>{nic}</option>)}
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
            className="filter-sel"
          >
            <option value="">All Upload Batches</option>
            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar — only present while rows are selected */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.length} selected</span>

          <div className="flex-center gap-2 ml-auto flex-wrap">
            <select
              value=""
              onChange={(e) => {
                const next = e.target.value as LeadStatus;
                if (!next) return;
                selectedIds.forEach(id => onUpdateStatus(id, next));
                e.target.value = '';
              }}
              className="filter-sel"
              aria-label="Set pipeline stage for selected leads"
            >
              <option value="">Set stage for selected…</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Discussion">In Discussion</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>

            <button
              onClick={() => onExportFilteredCSV(leads.filter(l => l.id && selectedIds.includes(l.id)))}
              className="btn btn-ghost btn-sm"
            >
              <Download size={14} />
              <span>Export Selected</span>
            </button>

            <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm">
              <XCircle size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table Panel */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th className="tc" style={{ width: '44px', padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && paginatedLeads.every(l => Boolean(l.id && selectedIds.includes(l.id)))}
                    onChange={handleSelectAllOnPage}
                  />
                </th>
                <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('entityId')}>
                  <div className="flex items-center gap-1.5">
                    <span>ENTITY ID / TYPE</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>COMPANY NAME</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('state')}>
                  <div className="flex items-center gap-1.5">
                    <span>LOCATION & ROC</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('directorName')}>
                  <div className="flex items-center gap-1.5">
                    <span>DIRECTOR CONTACT</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th className="tr" style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('paidUpCapital')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>PAID-UP CAP</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    <span>PIPELINE STAGE</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th className="tc" style={{ padding: '12px 16px' }}>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const isSelected = lead.id ? selectedIds.includes(lead.id) : false;
                  return (
                    <tr 
                      key={lead.id || lead.compositeKey}
                      className={isSelected ? 'selected-row' : ''}
                    >
                      <td className="tc" style={{ padding: '14px 12px', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => lead.id && handleToggleRow(lead.id)}
                        />
                      </td>

                      {/* Entity ID & Type */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>
                            {lead.entityId}
                          </span>
                          <span className={`badge ${(lead.entityType || "").toLowerCase() === 'company' ? 'b-part' : 'b-plant'}`}>
                            {(lead.entityType || "company").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Company Name & Sector */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <button
                            onClick={() => onSelectLead(lead)}
                            style={{ display: 'block', width: '100%', fontWeight: 700, fontSize: '13px', color: '#1C1C1E', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: '1.3' }}
                            className="hover:text-indigo-600"
                          >
                            {lead.name}
                          </button>
                          <span style={{ display: 'block', width: '100%', fontSize: '11px', fontWeight: 500, color: '#6E6E73', lineHeight: '1.2' }}>
                            {lead.nicLabel || 'Unclassified Sector'}
                          </span>
                        </div>
                      </td>

                      {/* Location & ROC */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#1C1C1E' }}>
                            <MapPin size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                            <span>{lead.district}, {lead.state}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6E6E73' }}>
                            <Building2 size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                            <span>{lead.roc}</span>
                          </div>
                        </div>
                      </td>

                      {/* Director & Contact Info */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#1C1C1E' }}>
                            <User size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
                            <span>{lead.directorName}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', marginTop: '2px' }}>
                            {lead.directorMobile && (
                              <a 
                                href={`tel:${lead.directorMobile}`} 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#0F766E', textDecoration: 'none' }}
                                className="hover:underline"
                              >
                                <Phone size={11} style={{ flexShrink: 0 }} />
                                <span>{lead.directorMobile}</span>
                              </a>
                            )}
                            {lead.directorEmail && (
                              <a 
                                href={`mailto:${lead.directorEmail}`} 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6E6E73', textDecoration: 'none', maxWidth: '170px' }}
                                className="hover:text-indigo-600"
                              >
                                <Mail size={11} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.directorEmail}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Paid-Up Financials */}
                      <td className="tr" style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#15803D' }}>
                          {formatCurrency(lead.paidUpCapital)}
                        </span>
                      </td>

                      {/* Inline Status Stage Selector */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <select
                          value={lead.status}
                          onChange={(e) => lead.id && onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`status-sel ${getStatusSelectClass(lead.status)}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Discussion">In Discussion</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Converted">Converted</option>
                          <option value="Unresponsive">Unresponsive</option>
                        </select>
                      </td>

                      {/* Action Button */}
                      <td className="tc" style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="btn btn-ghost btn-sm flex items-center gap-1 mx-auto"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                    No matching leads found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#4B5563', flexWrap: 'wrap' }}>
            <span>
              Showing {paginatedLeads.length > 0 ? (safePage - 1) * pageSize + 1 : 0} to {Math.min(safePage * pageSize, sortedLeads.length)} of {sortedLeads.length} entries
            </span>
            <span style={{ color: '#D1D5DB' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ height: '30px', padding: '0 8px', fontSize: '11.5px', fontWeight: 600, color: '#374151', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', outline: 'none', width: '64px', display: 'inline-block' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="btn btn-ghost btn-sm disabled:opacity-40"
              style={{ padding: '5px 10px', height: '30px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#111827', padding: '0 4px' }}>Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="btn btn-ghost btn-sm disabled:opacity-40"
              style={{ padding: '5px 10px', height: '30px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
