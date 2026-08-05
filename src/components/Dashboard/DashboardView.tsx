import React from 'react';
import type { CRMLead, MonthlyBatch } from '../../types/crm';
import { formatCurrency } from '../../utils/formatters';
import { 
  Building2, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  MapPin, 
  Briefcase,
  ArrowUpRight
} from 'lucide-react';

interface DashboardViewProps {
  leads: CRMLead[];
  batches: MonthlyBatch[];
  onNavigateToDataGrid: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  batches,
  onNavigateToDataGrid
}) => {
  // Metrics calculation
  const totalLeads = leads.length;
  const companiesCount = leads.filter(l => (l.entityType || '').toLowerCase() === 'company').length;
  const llpCount = leads.filter(l => (l.entityType || '').toLowerCase() === 'llp').length;

  const totalDirectors = leads.filter(l => l.directorName && l.directorName !== 'N/A').length;
  const reachableDirectors = leads.filter(l => l.directorMobile || l.directorEmail).length;
  const totalPaidUp = leads.reduce((sum, l) => sum + (l.paidUpCapital || 0), 0);
  const totalAuthorized = leads.reduce((sum, l) => sum + (l.authorizedCapital || 0), 0);

  // Newest by upload date — the two data sources return batches in different orders.
  const latestBatch = batches.length > 0
    ? [...batches].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0]
    : null;

  // States breakdown
  const stateCounts: Record<string, number> = {};
  leads.forEach(l => {
    const st = l.state || 'Unknown';
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  });
  const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);

  // Industry/NIC breakdown
  const nicCounts: Record<string, number> = {};
  leads.forEach(l => {
    const nic = l.nicLabel || 'Other';
    nicCounts[nic] = (nicCounts[nic] || 0) + 1;
  });
  const sortedNIC = Object.entries(nicCounts).sort((a, b) => b[1] - a[1]);

  // Status breakdown
  const statusCounts: Record<string, number> = {
    'New': 0,
    'Contacted': 0,
    'In Discussion': 0,
    'Qualified': 0,
    'Converted': 0,
    'Unresponsive': 0
  };
  leads.forEach(l => {
    if (statusCounts[l.status] !== undefined) {
      statusCounts[l.status]++;
    }
  });

  return (
    <div>
      {/* Header Banner */}
      <div className="fsec">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Corporate Registrations Overview
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Monthly dataset analytics, company metrics &amp; director contact pipeline.
          </p>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="stats">
        {/* Card 1: Total Entities */}
        <div className="stat">
          <div className="stat-ic ca">
            <Building2 size={22} />
          </div>
          <div className="stat-n ca">{totalLeads}</div>
          <div className="stat-l">Total Entities</div>
          <div className="text-xs muted flex-center gap-2 justify-center mt-2">
            <span className="accent fwb">{companiesCount} Companies</span>
            <span>•</span>
            <span className="teal fwb">{llpCount} LLPs</span>
          </div>
        </div>

        {/* Card 2: Director Contacts */}
        <div className="stat">
          <div className="stat-ic ct">
            <Users size={22} />
          </div>
          <div className="stat-n ct">{totalDirectors}</div>
          <div className="stat-l">Director Contacts</div>
          <div className="text-xs teal flex-center gap-1 mt-2 fwb">
            <CheckCircle2 size={12} />
            <span>{reachableDirectors} with phone or email</span>
          </div>
        </div>

        {/* Card 3: Paid-Up Capital */}
        <div className="stat">
          <div className="stat-ic cg">
            <IndianRupee size={22} />
          </div>
          <div className="stat-n cg">
            {formatCurrency(totalPaidUp)}
          </div>
          <div className="stat-l">Total Paid-Up Capital</div>
          <div className="text-xs muted mt-2">
            Auth Capital: <span className="fw6">{formatCurrency(totalAuthorized)}</span>
          </div>
        </div>

        {/* Card 4: Upload Batches */}
        <div className="stat">
          <div className="stat-ic co">
            <TrendingUp size={22} />
          </div>
          <div className="stat-n co">{batches.length}</div>
          <div className="stat-l">Monthly Batches</div>
          <div className="text-xs muted mt-2">
            Latest: <span className="co fw6">{latestBatch?.batchName || 'No batches yet'}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdowns Grid */}
      <div className="fgrid-3">
        {/* Column 1: Pipeline Stages */}
        <div className="fsec">
          <div className="fsec-ttl justify-between">
            <span className="flex-center gap-2">
              <PieChart size={16} className="ca" />
              Lead Pipeline Stages
            </span>
            <button onClick={onNavigateToDataGrid} className="btn btn-ghost btn-sm flex-center gap-1">
              <span>View All</span> <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(statusCounts).map(([st, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              const colorClass = 
                st === 'New' ? 'blue' :
                st === 'Contacted' ? 'amber' :
                st === 'In Discussion' ? 'purple' :
                st === 'Qualified' ? 'cyan' :
                st === 'Converted' ? 'green' : 'red';
              const badgeClass = 
                st === 'New' ? 'b-new' :
                st === 'Contacted' ? 'b-contacted' :
                st === 'In Discussion' ? 'b-discussion' :
                st === 'Qualified' ? 'b-qualified' :
                st === 'Converted' ? 'b-converted' : 'b-unresponsive';

              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className={`badge ${badgeClass}`}>{st}</span>
                    <span className="muted fwb">{count} leads ({pct}%)</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className={`progress-fill ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Top State Distribution */}
        <div className="fsec">
          <div className="fsec-ttl justify-between">
            <span className="flex-center gap-2">
              <MapPin size={16} className="ct" />
              Top State Distribution
            </span>
            <span className="text-xs muted">{sortedStates.length} States</span>
          </div>

          <div className="space-y-3">
            {sortedStates.slice(0, 5).map(([st, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={st} className="profile-section flex-center justify-between mb-0">
                  <div>
                    <div className="text-xs fwb">{st}</div>
                    <div className="text-xs muted">{pct}% of total records</div>
                  </div>
                  <span className="badge b-plant">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Top Industry Sectors (NIC) */}
        <div className="fsec">
          <div className="fsec-ttl justify-between">
            <span className="flex-center gap-2">
              <Briefcase size={16} className="cg" />
              Top Industry Sectors (NIC)
            </span>
          </div>

          <div className="space-y-3">
            {sortedNIC.slice(0, 5).map(([nic, count]) => {
              const pct = totalLeads > 0 ? Math.min(100, Math.round((count / totalLeads) * 100)) : 0;
              return (
                <div key={nic} className="profile-section space-y-1 mb-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs fwb line-clamp-1">{nic}</span>
                    <span className="badge b-ok">{count}</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill green" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
