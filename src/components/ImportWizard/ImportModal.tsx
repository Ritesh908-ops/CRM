import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  RefreshCw
} from 'lucide-react';
import { parseCSVFile } from '../../utils/csvParser';
import { analyzeDuplicates, commitImportBatch } from '../../utils/deduplication';
import type { DuplicateAnalysisResult, DuplicateStrategy } from '../../types/crm';
import { db } from '../../db/database';
import { RAW_SAMPLE_CSV_TEXT } from '../../mockData/sampleData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [batchName, setBatchName] = useState<string>(`Batch - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DuplicateAnalysisResult | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    setFile(null);
    setRawText(RAW_SAMPLE_CSV_TEXT);
  };

  const handleAnalyzeCSV = async () => {
    if (!file && !rawText) return;

    setIsProcessing(true);
    setParseErrors([]);

    try {
      const source = file || rawText;
      const parseRes = await parseCSVFile(source, batchName);
      
      if (parseRes.errors && parseRes.errors.length > 0) {
        setParseErrors(parseRes.errors);
      }

      if (parseRes.leads.length === 0) {
        setIsProcessing(false);
        return;
      }

      const analysis = await analyzeDuplicates(parseRes.leads);
      setAnalysisResult(analysis);
      setStep(2); // Move to duplicate review step
    } catch (err: any) {
      setParseErrors([err.message || 'Failed to parse CSV file.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!analysisResult) return;
    setIsProcessing(true);

    try {
      const summary = await commitImportBatch(analysisResult, duplicateStrategy);
      setImportSummary(summary);

      // Save batch record to IndexedDB
      await db.batches.add({
        id: `batch-${Date.now()}`,
        batchName,
        uploadDate: new Date().toISOString(),
        totalRowsInFile: analysisResult.totalIncoming,
        newRecordsCount: summary.added,
        duplicateRecordsCount: analysisResult.duplicateCount,
        duplicateStrategyUsed: duplicateStrategy,
        fileName: file ? file.name : 'Pasted Text/Sample.csv'
      });

      setStep(3); // Success step
      onImportComplete();
    } catch (err: any) {
      setParseErrors(['Failed to commit data to database: ' + err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFile(null);
    setRawText('');
    setAnalysisResult(null);
    setImportSummary(null);
    onClose();
  };

  return (
    <div className="overlay">
      <div className="modal large">
        
        {/* Modal Header */}
        <div className="modal-header flex-center justify-between">
          <div>
            <h3 className="modal-ttl">
              <Upload size={18} />
              Monthly CSV Import Wizard
            </h3>
            <p className="muted text-xs" style={{ marginTop: '-8px' }}>
              Step {step} of 3 • Smart Duplicate Detection
            </p>
          </div>
          
          <button onClick={resetAndClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="step-bar">
          <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
            <span>1. Select Dataset</span>
          </div>
          <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
            <span>2. Deduplication Review</span>
          </div>
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <span>3. Import Summary</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          
          {/* Parse Errors Notification */}
          {parseErrors.length > 0 && (
            <div className="info-banner error flex-col gap-2" style={{ marginBottom: '16px' }}>
              <div className="flex-center gap-2 fwb">
                <AlertTriangle size={16} /> Parsing Alerts ({parseErrors.length})
              </div>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: Upload File or Paste Raw Text */}
          {step === 1 && (
            <div className="flex-col gap-6">
              {/* Batch Tag Input */}
              <div className="fg">
                <label>Batch Tag / Month Label</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. August 2026 Corporate Import"
                />
              </div>

              {/* Dropzone */}
              <div className="fg">
                <label>Upload CSV / TSV File</label>
                <div className="file-drop">
                  <input
                    type="file"
                    accept=".csv, .tsv, .txt"
                    onChange={handleFileChange}
                  />
                  <FileText size={24} />
                  <p>{file ? file.name : 'Click or Drag & Drop your CSV/TSV dataset'}</p>
                  <small>
                    Supports standard columns (entityId, entityType, name, state, directorName, directorEmail, directorMobile, paidUpCapital)
                  </small>
                </div>
              </div>

              {/* Alternative: Raw text input or Load Sample */}
              <div className="fg">
                <div className="flex-center justify-between">
                  <label>Or Paste Raw CSV Data / Load Sample</label>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="lnk lnk-t text-xs"
                  >
                    Load Sample Prompt Data
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setFile(null);
                  }}
                  rows={4}
                  placeholder="Paste TSV/CSV formatted string here..."
                />
              </div>

              {/* Info banner */}
              <div className="info-banner info">
                <ShieldCheck size={16} />
                <div>
                  <span className="fwb">Automatic Sanitization:</span> Leading backticks (like `` `9797836641 ``) in mobile numbers will be stripped automatically. Composite deduplication keys will be auto-generated.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Duplicate Check & Conflict Preview */}
          {step === 2 && analysisResult && (
            <div className="flex-col gap-6">
              {/* Summary Badges / Stats */}
              <div className="stats">
                <div className="stat">
                  <div className="stat-n">{analysisResult.totalIncoming}</div>
                  <div className="stat-l">Total Rows Parsed</div>
                </div>
                <div className="stat">
                  <div className="stat-n cg">{analysisResult.newCount}</div>
                  <div className="stat-l cg">New Records</div>
                </div>
                <div className="stat">
                  <div className="stat-n co">{analysisResult.duplicateCount}</div>
                  <div className="stat-l co">Duplicates Detected</div>
                </div>
              </div>

              {/* Duplicate Strategy Selector */}
              <div className="flex-col gap-3">
                <label className="fsec-ttl flex-center gap-2" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                  <Layers size={16} className="ca" />
                  Choose Duplicate Resolution Strategy
                </label>
                <div className="fgrid-3">
                  <label className="fsec" style={{ cursor: 'pointer', marginBottom: 0, borderColor: duplicateStrategy === 'skip' ? 'var(--accent)' : undefined }}>
                    <div className="flex-center gap-2">
                      <input 
                        type="radio" 
                        name="dupStrategy" 
                        value="skip" 
                        checked={duplicateStrategy === 'skip'} 
                        onChange={() => setDuplicateStrategy('skip')} 
                      />
                      <span className="fwb text-sm">Skip Duplicates</span>
                    </div>
                    <p className="muted text-xs" style={{ marginTop: '8px' }}>
                      Keep existing database records untouched. Ignore incoming duplicates.
                    </p>
                  </label>

                  <label className="fsec" style={{ cursor: 'pointer', marginBottom: 0, borderColor: duplicateStrategy === 'update' ? 'var(--accent)' : undefined }}>
                    <div className="flex-center gap-2">
                      <input 
                        type="radio" 
                        name="dupStrategy" 
                        value="update" 
                        checked={duplicateStrategy === 'update'} 
                        onChange={() => setDuplicateStrategy('update')} 
                      />
                      <span className="fwb text-sm">Update Existing</span>
                    </div>
                    <p className="muted text-xs" style={{ marginTop: '8px' }}>
                      Overwrite existing lead data with latest monthly CSV updates while preserving pipeline status.
                    </p>
                  </label>

                  <label className="fsec" style={{ cursor: 'pointer', marginBottom: 0, borderColor: duplicateStrategy === 'keep_all' ? 'var(--accent)' : undefined }}>
                    <div className="flex-center gap-2">
                      <input 
                        type="radio" 
                        name="dupStrategy" 
                        value="keep_all" 
                        checked={duplicateStrategy === 'keep_all'} 
                        onChange={() => setDuplicateStrategy('keep_all')} 
                      />
                      <span className="fwb text-sm">Import All</span>
                    </div>
                    <p className="muted text-xs" style={{ marginTop: '8px' }}>
                      Create separate duplicate entries without overwriting existing data.
                    </p>
                  </label>
                </div>
              </div>

              {/* Side-by-Side Duplicate Conflict Table */}
              {analysisResult.duplicateCount > 0 && (
                <div className="flex-col gap-2">
                  <div className="flex-center justify-between">
                    <h4 className="fsec-ttl co flex-center gap-2" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                      <AlertTriangle size={14} />
                      Duplicate Conflict Inspection Table
                    </h4>
                    <span className="muted text-xs">
                      Matched by Entity ID + Director Name
                    </span>
                  </div>

                  <div className="card">
                    <div className="tbl-wrap" style={{ maxHeight: '240px' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Entity ID</th>
                            <th>Company Name</th>
                            <th>Director Name</th>
                            <th>Existing Status</th>
                            <th className="tr">Conflict Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.duplicateItems.map((dup, idx) => (
                            <tr key={idx}>
                              <td className="fwb ca">{dup.incomingRecord.entityId}</td>
                              <td className="fw5">{dup.incomingRecord.name}</td>
                              <td>{dup.incomingRecord.directorName}</td>
                              <td>
                                <span className="badge b-crr">
                                  {dup.existingRecord?.status || 'Existing'}
                                </span>
                              </td>
                              <td className="tr fwb co">
                                {duplicateStrategy === 'skip' ? 'Will Skip' : duplicateStrategy === 'update' ? 'Will Overwrite' : 'Will Add Copy'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Completion Summary */}
          {step === 3 && importSummary && (
            <div className="tc flex-col gap-6" style={{ padding: '32px 0' }}>
              <div className="flex-center" style={{ justifyContent: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(48,209,88,0.15)',
                  border: '1px solid var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green)'
                }}>
                  <CheckCircle2 size={32} />
                </div>
              </div>
              <div className="flex-col gap-2">
                <h3 className="text-lg fwb">Monthly Import Completed Successfully!</h3>
                <p className="muted text-sm">Your CRM dataset and IndexedDB storage have been updated.</p>
              </div>

              <div className="stats" style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div className="stat">
                  <div className="stat-n cg">{importSummary.added}</div>
                  <div className="stat-l cg">New Added</div>
                </div>
                <div className="stat">
                  <div className="stat-n ct">{importSummary.updated}</div>
                  <div className="stat-l ct">Updated</div>
                </div>
                <div className="stat">
                  <div className="stat-n muted">{importSummary.skipped}</div>
                  <div className="stat-l muted">Skipped</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-foot">
          {step === 1 && (
            <>
              <button onClick={resetAndClose} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                onClick={handleAnalyzeCSV}
                disabled={(!file && !rawText) || isProcessing}
                className="btn btn-primary btn-sm"
              >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
                Analyze CSV & Check Duplicates
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="btn btn-ghost btn-sm">
                Back
              </button>
              <button
                onClick={handleCommitImport}
                disabled={isProcessing}
                className="btn btn-primary btn-sm"
              >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                Commit Import ({analysisResult?.totalIncoming} records)
              </button>
            </>
          )}

          {step === 3 && (
            <button onClick={resetAndClose} className="btn btn-primary btn-sm" style={{ margin: '0 auto' }}>
              Done & View CRM Grid
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
