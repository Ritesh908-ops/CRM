import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Papa from 'papaparse';
import { RefreshCw } from 'lucide-react';
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
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog';
import { InvoiceGeneratorView } from './components/Invoice/InvoiceGeneratorView';

function MainCRMApp() {
  const { isAuthenticated } = useAuth();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'datagrid' | 'batches' | 'invoice'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  // Only the id is held in state; the record itself is read from the live query
  // below so the drawer reflects edits (new notes, status) as they are saved.
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize Dexie DB
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Live Query from Dexie IndexedDB
  const leads = useLiveQuery(() => crmService.getLeads(), []);
  const batches = useLiveQuery(() => crmService.getBatches(), []) || [];

  const isLoading = leads === undefined;
  const leadList = leads || [];
  const selectedLead = selectedLeadId === null
    ? null
    : leadList.find(l => l.id === selectedLeadId) ?? null;

  // If unauthenticated, show Admin Login Modal
  if (!isAuthenticated) {
    return <LoginModal />;
  }

  // Status update
  const handleUpdateStatus = async (leadId: number, newStatus: LeadStatus) => {
    await crmService.updateLeadStatus(leadId, newStatus);
  };

  // Add Note
  const handleAddNote = async (leadId: number, noteText: string) => {
    await crmService.addNote(leadId, noteText);
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: number) => {
    const confirmed = await confirm({
      title: 'Delete Lead',
      message: 'Are you sure you want to delete this lead? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    
    if (confirmed) {
      await crmService.deleteLead(leadId);
      setSelectedLeadId(null);
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
    URL.revokeObjectURL(url);
  };

  // Reset Sample Data
  const handleResetSampleData = async () => {
    const confirmed = await confirm({
      title: 'Reset Database',
      message: 'Are you sure you want to reset the database to the initial sample records? All your current data will be lost.',
      confirmLabel: 'Reset',
      variant: 'warning'
    });

    if (confirmed) {
      await crmService.resetToSampleData();
      setSelectedLeadId(null);
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeadsCount={leadList.length}
        onExportCSV={() => handleExportCSV(leadList)}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
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
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* View Switcher */}
        <div className="content">
          {isLoading ? (
            <div className="empty">
              <RefreshCw size={40} className="spin" />
              <h3>Loading CRM records…</h3>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  leads={leadList}
                  batches={batches}
                  onNavigateToDataGrid={() => setActiveTab('datagrid')}
                />
              )}

              {activeTab === 'datagrid' && (
                <LeadsTable
                  leads={leadList}
                  onSelectLead={(l) => setSelectedLeadId(l.id ?? null)}
                  onUpdateStatus={handleUpdateStatus}
                  selectedBatch={selectedBatch}
                  setSelectedBatch={setSelectedBatch}
                  onExportFilteredCSV={handleExportCSV}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}

              {activeTab === 'batches' && (
                <BatchHistoryView
                  batches={batches}
                  openImportModal={() => setIsImportModalOpen(true)}
                />
              )}

              {activeTab === 'invoice' && (
                <InvoiceGeneratorView />
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
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
      <ConfirmProvider>
        <MainCRMApp />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
