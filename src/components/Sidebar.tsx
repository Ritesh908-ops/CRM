import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Table,
  Download,
  ShieldCheck,
  LogOut,
  ChevronUp,
  X,
  FileText,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { crmService } from '../db/crmService';
import { useConfirm } from './ConfirmDialog';

interface SidebarProps {
  activeTab: 'dashboard' | 'datagrid' | 'batches' | 'invoice';
  setActiveTab: (tab: 'dashboard' | 'datagrid' | 'batches' | 'invoice') => void;
  totalLeadsCount: number;
  onExportCSV: () => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalLeadsCount,
  onExportCSV,
  isMobileMenuOpen,
  onCloseMobileMenu
}) => {
  const { user, logout, isSupabaseActive } = useAuth();
  const { confirm } = useConfirm();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabSelect = (tab: 'dashboard' | 'datagrid' | 'batches' | 'invoice') => {
    setActiveTab(tab);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={onCloseMobileMenu}
          className="sidebar-backdrop"
        />
      )}

      <aside className={`sb ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sb-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '20px 16px 12px 16px', borderBottom: '0.5px solid rgba(60,60,67,0.12)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <img src="/logo.png" alt="Khataview CRM" style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Close button ONLY rendered on mobile when drawer is open */}
          {isMobileMenuOpen && (
            <button 
              onClick={onCloseMobileMenu} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280', display: 'flex', alignItems: 'center' }}
              title="Close Sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="sb-nav-wrapper">
          <div className="nsec">Navigation</div>

          <nav className="sb-nav">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`ni ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              <span className="ni-txt">Analytics Dashboard</span>
            </button>

            <button
              onClick={() => handleTabSelect('datagrid')}
              className={`ni ${activeTab === 'datagrid' ? 'active' : ''}`}
            >
              <Table size={18} />
              <span className="ni-txt">Leads & Companies</span>
              <span className="ni-bd">{totalLeadsCount}</span>
            </button>

            <button
              onClick={() => handleTabSelect('invoice')}
              className={`ni ${activeTab === 'invoice' ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span className="ni-txt">Invoice Generator</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions & User Profile Section */}
        <div className="sb-bottom-wrapper" style={{ padding: '12px', gap: '10px', flexShrink: 0 }}>
          {/* Bottom Actions Row: Export and Delete Icons */}
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
            <button
              title="Export All Leads (.CSV)"
              onClick={() => {
                onExportCSV();
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className="btn btn-ghost"
              style={{ flex: 1, padding: '10px 0', display: 'flex', justifyContent: 'center' }}
            >
              <Download size={18} />
            </button>
            
            <button
              title="Delete All Data"
              onClick={async () => {
                const isConfirmed = await confirm({
                  title: 'Delete All Data',
                  message: 'Are you sure you want to completely wipe the entire CRM database? This will delete all leads, batches, and notes permanently. This action cannot be undone.',
                  confirmLabel: 'Yes, Delete Everything',
                  cancelLabel: 'Cancel',
                  variant: 'danger'
                });
                
                if (isConfirmed) {
                  try {
                    await crmService.deleteAllData();
                    window.location.reload();
                  } catch (err) {
                    console.error('Failed to wipe database:', err);
                    alert('Error wiping database. See console.');
                  }
                }
              }}
              className="btn"
              style={{ 
                flex: 1, 
                padding: '10px 0', 
                display: 'flex', 
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                color: 'rgb(255, 59, 48)',
                border: 'none'
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* User Account Profile Card with Rock-Solid Single-Row Flex Layout */}
          {user && (
            <div className="relative" ref={dropdownRef} style={{ width: '100%' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '8px 10px', 
                  background: '#FFFFFF', 
                  border: '0.5px solid rgba(60,60,67,0.12)', 
                  borderRadius: '13px', 
                  boxShadow: 'var(--shadow-1)' 
                }}
              >
                {/* Left: Avatar + Text */}
                <div 
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '980px', background: 'linear-gradient(135deg, #007AFF, #5856D6)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                    {user.email ? user.email[0].toUpperCase() : 'A'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name || 'Khataview Admin'}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#007AFF', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      <ShieldCheck size={10} style={{ flexShrink: 0 }} /> {user.role}
                    </span>
                  </div>
                </div>

                {/* Right: Direct Logout Button + Chevron Menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginLeft: '4px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCloseMobileMenu) onCloseMobileMenu();
                      logout();
                    }}
                    title="Log Out"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FF3B30', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
                  >
                    <LogOut size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(prev => !prev)}
                    title="Menu"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>

              {/* Profile Menu Popup (Opens upwards) */}
              {showProfileMenu && (
                <div 
                  className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-[13px] p-3 z-50 flex flex-col gap-2"
                  style={{ animation: 'sheetIn 0.15s ease-out', border: '0.5px solid rgba(60,60,67,0.12)', boxShadow: 'var(--shadow-2)' }}
                >
                  <div className="p-2.5 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(242,242,247,0.6)', border: '0.5px solid rgba(60,60,67,0.12)' }}>
                    <div className="font-bold text-xs text-gray-900">{user.name || 'Khataview Admin'}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="text-[10px] font-bold flex items-center gap-1 mt-1" style={{ color: '#007AFF' }}>
                      <ShieldCheck size={12} /> System Role: {user.role}
                    </div>
                  </div>

                  <div className="px-2 text-[11px] font-semibold text-gray-500">
                    Mode: {isSupabaseActive ? 'Supabase Connected' : 'Local Admin Fallback'}
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onCloseMobileMenu) onCloseMobileMenu();
                      logout();
                    }}
                    className="w-full btn btn-danger btn-sm flex items-center justify-center gap-2 mt-1"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
