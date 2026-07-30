import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Table, 
  History, 
  Building2, 
  Download,
  Sparkles,
  ShieldCheck,
  LogOut,
  ChevronUp,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: 'dashboard' | 'datagrid' | 'batches';
  setActiveTab: (tab: 'dashboard' | 'datagrid' | 'batches') => void;
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

  const handleTabSelect = (tab: 'dashboard' | 'datagrid' | 'batches') => {
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
        <div className="sb-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '64px', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sb-logo">
              <Building2 size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span className="sb-name" style={{ fontSize: '14.5px', fontWeight: 800, color: '#1C1C1E', whiteSpace: 'nowrap' }}>Khatabook CRM</span>
              <span className="sb-sub" style={{ fontSize: '10.5px', color: '#6E6E73', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                <Sparkles size={11} className="text-indigo-600" />
                <span>Monthly Data Hub</span>
              </span>
            </div>
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
              onClick={() => handleTabSelect('batches')}
              className={`ni ${activeTab === 'batches' ? 'active' : ''}`}
            >
              <History size={18} />
              <span className="ni-txt">Monthly Upload Logs</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions & User Profile Section */}
        <div className="sb-bottom-wrapper" style={{ padding: '14px 12px', gap: '10px' }}>
          {/* Export All Leads */}
          <button
            onClick={() => {
              onExportCSV();
              if (onCloseMobileMenu) onCloseMobileMenu();
            }}
            className="btn btn-ghost w-full flex items-center justify-center gap-2"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600 }}
          >
            <Download size={14} />
            <span>Export All Leads (.CSV)</span>
          </button>

          {/* User Account Profile Card */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ width: '100%' }}
              >
                <div className="flex items-center gap-2.5 min-w-0" style={{ overflow: 'hidden' }}>
                  <div className="av shrink-0" style={{ width: '34px', height: '34px', fontSize: '13px', borderRadius: '10px' }}>
                    {user.email ? user.email[0].toUpperCase() : 'A'}
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight" style={{ overflow: 'hidden' }}>
                    <span className="font-bold text-xs text-gray-900 truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name || 'Khatabook Admin'}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 mt-0.5 truncate">
                      <ShieldCheck size={10} className="shrink-0" /> {user.role}
                    </span>
                  </div>
                </div>

                <ChevronUp size={14} className="text-gray-400 shrink-0 ml-1" />
              </div>

              {/* Profile Menu Popup (Opens upwards) */}
              {showProfileMenu && (
                <div 
                  className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-2xl p-3 shadow-xl border border-gray-200 z-50 flex flex-col gap-2"
                  style={{ animation: 'sheetIn 0.15s ease-out' }}
                >
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                    <div className="font-bold text-xs text-gray-900">{user.name || 'Khatabook Admin'}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-1">
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
