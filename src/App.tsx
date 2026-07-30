import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Papa from 'papaparse';
import { initializeDatabase } from './db/database';
import { crmService } from './db/crmService';
import type { CRMLead, LeadStatus } from './types/crm';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { LeadsTable } from './components/DataGrid/LeadsTable';
import { LeadDetailDrawer } from './components/DetailDrawer/LeadDetailDrawer';
import { ImportModal } from './components/ImportWizard/ImportModal';
import { BatchHistoryView } from './components/BatchHistory/BatchHistoryView';
import { LoginModal } from './components/Auth/LoginModal';

function MainCRMApp() {
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'datagrid' | 'batches'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  // Initialize Dexie DB
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Live Query from Dexie IndexedDB
  const leads = useLiveQuery(() => crmService.getLeads(), []) || [];
  const batches = useLiveQuery(() => crmService.getBatches(), []) || [];

  // If unauthenticated, show Admin Login Modal
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  // Status update
  const handleUpdateStatus = async (leadId: number, newStatus: LeadStatus) => {
    await crmService.updateLeadStatus(leadId, newStatus);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Add Note
  const handleAddNote = async (leadId: number, noteText: string) => {
    await crmService.addNote(leadId, noteText);
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: number) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await crmService.deleteLead(leadId);
      setSelectedLead(null);
    }
  };

  // Export CSV
  const handleExportCSV = (leadsToExport: CRMLead[]) => {
    const exportData = leadsToExport.map(l => ({
      'Entity ID': l.entityId,
      'Entity Type': l.entityType,
      'Company Name': l.name,
      'State': l.state,
      'District': l.district,
      'ROC': l.roc,
      'NIC Code': l.nicCode,
      'NIC Sector': l.nicLabel,
      'Class of Company': l.classOfCompany,
      'Date of Incorporation': l.dateOfIncorporation,
      'Paid Up Capital (INR)': l.paidUpCapital,
      'Company Email': l.email,
      'Director Name': l.directorName,
      'Director Email': l.directorEmail,
      'Director Mobile': l.directorMobile,
      'Authorized Capital (INR)': l.authorizedCapital,
      'Pipeline Status': l.status,
      'Upload Batch': l.batchId
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CRM_Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Sample Data
  const handleResetSampleData = async () => {
    if (window.confirm('Reset database to initial sample records?')) {
      await crmService.resetToSampleData();
      setSelectedLead(null);
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeadsCount={leads.length}
        onExportCSV={() => handleExportCSV(leads)}
      />

      {/* Main Content Workspace */}
      <div className="main">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (activeTab !== 'datagrid') setActiveTab('datagrid');
          }}
          openImportModal={() => setIsImportModalOpen(true)}
          onResetSampleData={handleResetSampleData}
        />

        {/* View Switcher */}
        <div className="content">
          {activeTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              batches={batches}
              onNavigateToDataGrid={() => setActiveTab('datagrid')}
            />
          )}

          {activeTab === 'datagrid' && (
            <LeadsTable
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onUpdateStatus={handleUpdateStatus}
              selectedBatch={selectedBatch}
              setSelectedBatch={setSelectedBatch}
              onExportFilteredCSV={handleExportCSV}
            />
          )}

          {activeTab === 'batches' && (
            <BatchHistoryView
              batches={batches}
              openImportModal={() => setIsImportModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Profile Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onDeleteLead={handleDeleteLead}
      />

      {/* Monthly Import Wizard Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setActiveTab('datagrid');
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainCRMApp />
    </AuthProvider>
  );
}

export default App;
