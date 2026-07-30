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
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: 'dashboard' | 'datagrid' | 'batches';
  setActiveTab: (tab: 'dashboard' | 'datagrid' | 'batches') => void;
  totalLeadsCount: number;
  onExportCSV: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalLeadsCount,
  onExportCSV
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

  return (
    <aside className="sb">
      {/* Brand Header */}
      <div className="sb-brand">
        <div className="sb-logo">
          <Building2 size={20} />
        </div>
        <div className="flex flex-col">
          <span className="sb-name">Khatabook CRM</span>
          <span className="sb-sub flex items-center gap-1">
            <Sparkles size={11} className="text-indigo-600" />
            <span>Monthly Data Hub</span>
          </span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="sb-nav-wrapper">
        <div className="nsec">Navigation</div>

        <nav className="sb-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`ni ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            <span className="ni-txt">Analytics Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('datagrid')}
            className={`ni ${activeTab === 'datagrid' ? 'active' : ''}`}
          >
            <Table size={18} />
            <span className="ni-txt">Leads & Companies</span>
            <span className="ni-bd">{totalLeadsCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
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
          onClick={onExportCSV}
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
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="av shrink-0" style={{ width: '36px', height: '36px', fontSize: '13px', borderRadius: '10px' }}>
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="font-bold text-xs text-gray-900 truncate">
                    {user.name || 'Admin User'}
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
                  <div className="font-bold text-xs text-gray-900">{user.name || 'Admin User'}</div>
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
  );
};
