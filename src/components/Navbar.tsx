import React from 'react';
import { Search, RefreshCw, FileText, Upload } from 'lucide-react';
import { RAW_SAMPLE_CSV_TEXT } from '../mockData/sampleData';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openImportModal: () => void;
  onResetSampleData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  openImportModal,
  onResetSampleData
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
      {/* Global Search Bar */}
      <div className="tb-l">
        <div className="sw">
          <Search size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity, director, email..."
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
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
        >
          <FileText size={16} />
        </button>

        {/* Reset Database */}
        <button
          onClick={onResetSampleData}
          title="Reset Sample Data"
          className="btn btn-ghost"
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
        >
          <RefreshCw size={16} />
        </button>

        {/* Upload Monthly CSV (Icon-Only Primary Action) */}
        <button
          onClick={openImportModal}
          title="Upload Monthly CSV"
          className="btn btn-primary"
          style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
        >
          <Upload size={16} />
        </button>
      </div>
    </header>
  );
};
