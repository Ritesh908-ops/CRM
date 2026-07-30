import React from 'react';
import type { MonthlyBatch } from '../../types/crm';
import { History, Calendar, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface BatchHistoryViewProps {
  batches: MonthlyBatch[];
  openImportModal: () => void;
}

export const BatchHistoryView: React.FC<BatchHistoryViewProps> = ({
  batches,
  openImportModal
}) => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="fsec">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'nowrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
              <History size={20} className="text-amber-600 shrink-0" />
              <span>Monthly Upload &amp; Deduplication History Log</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Track month-by-month dataset uploads, duplicate counts, and deduplication rules applied.
            </p>
          </div>

          {/* Right Action Button */}
          <button 
            onClick={openImportModal} 
            className="btn btn-primary btn-sm shrink-0"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            <span>Upload Next Month's CSV</span>
          </button>
        </div>
      </div>

      {/* Batches Cards */}
      <div className="space-y-4">
        {batches.length > 0 ? (
          batches.map((batch) => (
            <div key={batch.id} className="fsec">
              {/* Batch Card Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <h3 className="text-base font-extrabold text-gray-900">{batch.batchName}</h3>

                {/* Upload Timestamp (Moved to Far Right inside user's red box) */}
                <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium shrink-0" style={{ marginLeft: 'auto' }}>
                  <Calendar size={14} className="text-indigo-600 shrink-0" />
                  <span>Uploaded on {new Date(batch.uploadDate).toLocaleString()}</span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="fgrid-4">
                <div className="stat">
                  <div className="stat-ic ca">
                    <History size={20} />
                  </div>
                  <div className="stat-n ca">{batch.totalRowsInFile}</div>
                  <div className="stat-l">Total Rows Parsed</div>
                </div>

                <div className="stat">
                  <div className="stat-ic cg">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="stat-n cg">{batch.newRecordsCount}</div>
                  <div className="stat-l">New Records Added</div>
                </div>

                <div className="stat">
                  <div className="stat-ic co">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="stat-n co">{batch.duplicateRecordsCount}</div>
                  <div className="stat-l">Duplicates Flagged</div>
                </div>

                <div className="stat">
                  <div className="stat-ic cp">
                    <Layers size={20} />
                  </div>
                  <div className="stat-n cp text-md capitalize">
                    {batch.duplicateStrategyUsed === 'skip' ? 'Skip Duplicates' : batch.duplicateStrategyUsed === 'update' ? 'Update Existing' : 'Keep All Variants'}
                  </div>
                  <div className="stat-l">Strategy Used</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <History size={52} />
            <h3>No Upload History</h3>
            <p>Upload a monthly corporate CSV dataset to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
