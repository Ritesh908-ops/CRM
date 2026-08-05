import React from 'react';
import { Search, RefreshCw, FileText, Upload, Menu, X } from 'lucide-react';
import { RAW_SAMPLE_CSV_TEXT } from '../mockData/sampleData';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openImportModal: () => void;
  onResetSampleData: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  openImportModal,
  onResetSampleData,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const handleDownloadSampleCSV = () => {
    const blob = new Blob([RAW_SAMPLE_CSV_TEXT], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_corporate_data_upload.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="topbar">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="tb-l flex items-center gap-2">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="mobile-only-btn btn btn-ghost"
            title="Toggle Menu"
            style={{ width: '38px', height: '38px', borderRadius: '10px', padding: 0, background: 'rgba(120,120,128,0.12)', border: 'none' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div className="sw">
          <Search size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity, director..."
            className="tsearch"
          />
        </div>
      </div>

      {/* Right Controls - Sleek Icon-Only Buttons */}
      <div className="tb-r flex items-center gap-2">
        {/* Download Sample CSV */}
        <button
          onClick={handleDownloadSampleCSV}
          title="Download Sample TSV"
          className="btn btn-ghost"
          style={{ width: '36px', height: '36px', borderRadius: '980px', padding: 0, background: 'rgba(120,120,128,0.12)', border: 'none' }}
        >
          <FileText size={16} />
        </button>

        {/* Reset Database */}
        <button
          onClick={onResetSampleData}
          title="Reset Sample Data"
          className="btn btn-ghost"
          style={{ width: '36px', height: '36px', borderRadius: '980px', padding: 0, background: 'rgba(120,120,128,0.12)', border: 'none' }}
        >
          <RefreshCw size={16} />
        </button>

        {/* Upload Monthly CSV (Icon-Only Primary Action) */}
        <button
          onClick={openImportModal}
          title="Upload Monthly CSV"
          className="btn btn-primary"
          style={{ width: '36px', height: '36px', borderRadius: '980px', padding: 0, border: 'none' }}
        >
          <Upload size={16} />
        </button>
      </div>
    </header>
  );
};
