import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  Columns3,
  Wand2
} from 'lucide-react';
import {
  analyzeCSVStructure,
  buildLeadsFromRows,
  mappingFromColumns,
  FIELD_LABELS,
  REQUIRED_ANY_OF,
  type CsvAnalysis,
  type ColumnMapping,
  type MappableField
} from '../../utils/csvParser';
import { analyzeDuplicates, commitImportBatch } from '../../utils/deduplication';
import type { DuplicateAnalysisResult, DuplicateStrategy } from '../../types/crm';
import { db } from '../../db/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { RAW_SAMPLE_CSV_TEXT } from '../../mockData/sampleData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Select Dataset', 'Map Columns', 'Deduplication', 'Summary'];

const ALL_FIELDS = Object.keys(FIELD_LABELS) as MappableField[];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [batchName, setBatchName] = useState<string>(`Batch - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [analysisResult, setAnalysisResult] = useState<DuplicateAnalysisResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Re-projects the retained rows on every mapping change so the wizard can show
  // a live "N rows will import" count before anything is committed.
  const buildPreview = useMemo(() => {
    if (!analysis) return null;
    return buildLeadsFromRows(analysis.rows, mapping, batchName);
  }, [analysis, mapping, batchName]);

  const mappedFields = useMemo(
    () => new Set(Object.values(mapping).filter(Boolean) as MappableField[]),
    [mapping]
  );

  const hasRequiredField = REQUIRED_ANY_OF.some(f => mappedFields.has(f));

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setFile(null);
    setRawText('');
    setAnalysis(null);
    setMapping({});
    setAnalysisResult(null);
    setImportSummary(null);
    setErrors([]);
    setIsProcessing(false);
    setDuplicateStrategy('skip');
    setUploadProgress(0);
  };

  const resetAndClose = () => {
    resetState();
    onClose();
  };

  /** Step 1 -> 2: read the file once and auto-detect its columns. */
  const handleInspectSource = async (overrideSource?: File | string) => {
    const source = overrideSource ?? (file || rawText);
    if (!source) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await analyzeCSVStructure(source);

      if (result.headers.length === 0 || result.rowCount === 0) {
        setErrors([
          ...result.parseErrors,
          result.headers.length === 0
            ? 'No column headers were detected. Make sure the first row of the file lists the column names.'
            : 'The file has headers but no data rows.'
        ]);
        setIsProcessing(false);
        return;
      }

      setAnalysis(result);
      setMapping(mappingFromColumns(result.columns));
      setErrors(result.parseErrors);
      setStep(2);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'The file could not be parsed.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    // Clearing the value lets the same file be picked again after a failed attempt.
    e.target.value = '';
    if (!selectedFile) return;
    setFile(selectedFile);
    setRawText('');
    handleInspectSource(selectedFile);
  };

  const handleLoadSampleData = () => {
    setFile(null);
    setRawText(RAW_SAMPLE_CSV_TEXT);
    handleInspectSource(RAW_SAMPLE_CSV_TEXT);
  };

  /** Assigning a field steals it from whichever column held it before. */
  const handleMappingChange = (header: string, field: MappableField | null) => {
    setMapping(prev => {
      const next: ColumnMapping = { ...prev };
      if (field) {
        Object.keys(next).forEach(h => {
          if (next[h] === field) next[h] = null;
        });
      }
      next[header] = field;
      return next;
    });
  };

  const handleResetMapping = () => {
    if (analysis) setMapping(mappingFromColumns(analysis.columns));
  };

  /** Step 2 -> 3: project rows through the mapping and diff against the database. */
  const handleCheckDuplicates = async () => {
    if (!analysis || !buildPreview) return;
    setIsProcessing(true);

    try {
      if (buildPreview.leads.length === 0) {
        setErrors([
          'No importable rows were produced by this mapping. Check that Entity ID or Company Name points at a column that actually holds values.',
          ...buildPreview.errors
        ]);
        setIsProcessing(false);
        return;
      }

      const result = await analyzeDuplicates(buildPreview.leads);
      setAnalysisResult(result);
      setErrors(buildPreview.errors);
      setStep(3);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Duplicate analysis failed.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!analysisResult) return;
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const summary = await commitImportBatch(
        analysisResult, 
        duplicateStrategy,
        (progress) => setUploadProgress(progress)
      );
      setImportSummary(summary);

      const batchRecord = {
        id: `batch-${Date.now()}`,
        batchName,
        uploadDate: new Date().toISOString(),
        totalRowsInFile: analysisResult.totalIncoming,
        newRecordsCount: summary.added,
        duplicateRecordsCount: analysisResult.duplicateCount,
        duplicateStrategyUsed: duplicateStrategy,
        fileName: file ? file.name : 'Pasted Text / Sample.csv'
      };

      if (isSupabaseConfigured && supabase) {
        const { error: batchError } = await supabase.from('batches').insert({
          id: batchRecord.id,
          batch_name: batchRecord.batchName,
          upload_date: batchRecord.uploadDate,
          total_rows_in_file: batchRecord.totalRowsInFile,
          new_records_count: batchRecord.newRecordsCount,
          duplicate_records_count: batchRecord.duplicateRecordsCount,
          duplicate_strategy_used: batchRecord.duplicateStrategyUsed,
          file_name: batchRecord.fileName
        });
        if (batchError) throw new Error(`Supabase Batch Insert Error: ${batchError.message}`);
      }

      await db.batches.add(batchRecord);

      setErrors([]);
      setStep(4);
      onImportComplete();
    } catch (err) {
      setErrors(['Failed to commit data to the database: ' + (err instanceof Error ? err.message : String(err))]);
    } finally {
      setIsProcessing(false);
    }
  };

  const autoDetectedCount = analysis ? analysis.columns.filter(c => c.field).length : 0;

  return (
    <div className="overlay" onClick={resetAndClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-ttl">
              <Upload size={18} />
              Monthly CSV Import Wizard
            </h3>
            <p className="muted text-xs" style={{ marginTop: '2px' }}>
              Step {step} of 4 • {STEP_LABELS[step - 1]}
            </p>
          </div>

          <button onClick={resetAndClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="step-bar">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              <span>{i + 1}. {label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body">

          {errors.length > 0 && (
            <div className="info-banner error stack" style={{ marginBottom: '16px' }}>
              <div className="flex-center gap-2 fwb">
                <AlertTriangle size={16} /> Import Alerts ({errors.length})
              </div>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: Choose a source */}
          {step === 1 && (
            <div className="stack gap-6">
              <div className="fg">
                <label>Batch Tag / Month Label</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. August 2026 Corporate Import"
                />
              </div>

              <div className="fg">
                <label>Upload CSV / TSV File</label>
                <div className="file-drop">
                  <input
                    type="file"
                    accept=".csv, .tsv, .txt"
                    onChange={handleFileChange}
                    aria-label="Upload CSV or TSV file"
                  />
                  <FileText size={24} />
                  <p>{file ? file.name : 'Click or Drag & Drop your CSV/TSV dataset'}</p>
                  <small>
                    Any column names work — you'll confirm how they map to CRM fields in the next step.
                  </small>
                </div>
              </div>

              <div className="fg">
                <div className="flex-center justify-between">
                  <label>Or Paste Raw CSV Data / Load Sample</label>
                  <button type="button" onClick={handleLoadSampleData} className="lnk lnk-t text-xs">
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

              <div className="info-banner info">
                <ShieldCheck size={16} />
                <div>
                  <span className="fwb">Automatic Sanitization:</span> Leading backticks (like <code>`9797836641</code>) in
                  mobile numbers are stripped automatically, and composite deduplication keys are generated for you.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Confirm how each column maps onto a CRM field */}
          {step === 2 && analysis && buildPreview && (
            <div className="stack gap-4">
              <div className="info-banner info">
                <Wand2 size={16} />
                <div>
                  Auto-detected <span className="fwb">{autoDetectedCount} of {analysis.headers.length}</span> columns from{' '}
                  <span className="fwb">{analysis.rowCount.toLocaleString()}</span> rows. Correct anything that looks wrong
                  below — columns set to <em>Ignore</em> are not imported.
                  {analysis.truncated && ' Only the first 50,000 rows of this file were read.'}
                </div>
              </div>

              {!hasRequiredField && (
                <div className="info-banner warn">
                  <AlertTriangle size={16} />
                  <div>
                    Map at least one column to <span className="fwb">Entity ID / CIN</span> or{' '}
                    <span className="fwb">Company Name</span> to continue.
                  </div>
                </div>
              )}

              <div className="flex-center justify-between">
                <span className="fsec-ttl" style={{ border: 'none', margin: 0, padding: 0 }}>
                  <Columns3 size={16} className="ca" /> Column Mapping
                </span>
                <button type="button" onClick={handleResetMapping} className="lnk text-xs">
                  Reset to auto-detected
                </button>
              </div>

              <div className="map-table-wrap">
                <table className="map-table">
                  <thead>
                    <tr>
                      <th>Column In Your File</th>
                      <th>Sample Value</th>
                      <th>Imports Into</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.columns.map((col) => {
                      const current = mapping[col.header] ?? null;
                      return (
                        <tr key={col.header}>
                          <td className="map-header-cell">{col.header}</td>
                          <td className="map-sample-cell">{col.sample || <span className="muted">(empty)</span>}</td>
                          <td>
                            <div className="flex-center gap-2">
                              <select
                                value={current ?? ''}
                                onChange={(e) =>
                                  handleMappingChange(col.header, (e.target.value || null) as MappableField | null)
                                }
                                className="filter-sel map-select"
                                aria-label={`Map column ${col.header}`}
                              >
                                <option value="">— Ignore this column —</option>
                                {ALL_FIELDS.map(f => (
                                  <option key={f} value={f}>
                                    {FIELD_LABELS[f]}
                                    {mappedFields.has(f) && current !== f ? ' (in use)' : ''}
                                  </option>
                                ))}
                              </select>
                              {current && col.confidence === 'guess' && (
                                <span className="badge b-crr" title="Best guess — please confirm">guess</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="stats stats-3">
                <div className="stat">
                  <div className="stat-n">{analysis.rowCount.toLocaleString()}</div>
                  <div className="stat-l">Rows In File</div>
                </div>
                <div className="stat">
                  <div className="stat-n cg">{buildPreview.leads.length.toLocaleString()}</div>
                  <div className="stat-l cg">Will Import</div>
                </div>
                <div className="stat">
                  <div className="stat-n co">{buildPreview.skippedCount.toLocaleString()}</div>
                  <div className="stat-l co">Will Be Skipped</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate review and strategy */}
          {step === 3 && analysisResult && (
            <div className="stack gap-6">
              <div className="stats stats-3">
                <div className="stat">
                  <div className="stat-n">{analysisResult.totalIncoming}</div>
                  <div className="stat-l">Rows To Import</div>
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

              <div className="stack gap-3">
                <span className="fsec-ttl" style={{ border: 'none', margin: 0, padding: 0 }}>
                  <Layers size={16} className="ca" /> Choose Duplicate Resolution Strategy
                </span>

                <div className="strategy-grid">
                  {([
                    ['skip', 'Skip Duplicates', 'Ignore duplicate records. Only import brand new entities.'],
                    ['update', 'Update Existing', 'Overwrite existing records with newest contact & capital data.'],
                    ['keep_all', 'Keep All Variants', 'Import everything, creating unique composite entries.']
                  ] as [DuplicateStrategy, string, string][]).map(([value, title, desc]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDuplicateStrategy(value)}
                      aria-pressed={duplicateStrategy === value}
                      className={`strategy-card ${duplicateStrategy === value ? 'active' : ''}`}
                    >
                      <span className="strategy-card-ttl">
                        {duplicateStrategy === value && <CheckCircle2 size={14} />}
                        {title}
                      </span>
                      <span className="strategy-card-desc">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {analysisResult.duplicateCount > 0 && (
                <div className="stack gap-2">
                  <span className="fsec-ttl" style={{ border: 'none', margin: 0, padding: 0 }}>
                    Duplicate Preview (first 5)
                  </span>
                  <div className="map-table-wrap">
                    <table className="map-table">
                      <thead>
                        <tr>
                          <th>Entity ID</th>
                          <th>Company</th>
                          <th>Director</th>
                          <th>Collides With</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisResult.duplicateItems.slice(0, 5).map((dup, i) => (
                          <tr key={i}>
                            <td className="map-header-cell">{dup.incomingRecord.entityId}</td>
                            <td className="map-sample-cell">{dup.incomingRecord.name}</td>
                            <td className="map-sample-cell">{dup.incomingRecord.directorName}</td>
                            <td>
                              <span className={`badge ${dup.existingRecord ? 'b-part' : 'b-crr'}`}>
                                {dup.existingRecord ? 'Existing record' : 'Earlier row in this file'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {isProcessing && uploadProgress > 0 && (
                <div style={{ marginTop: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="text-sm font-semibold text-gray-700">Uploading to Cloud Database...</span>
                    <span className="text-sm font-bold" style={{ color: '#007AFF' }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#E5E5EA', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: '#007AFF', 
                        width: `${uploadProgress}%`,
                        transition: 'width 0.3s ease-out'
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Result */}
          {step === 4 && importSummary && (
              <div className="flex-center" style={{ flexDirection: 'column', textAlign: 'center', marginBottom: '24px' }}>
                <div className="success-icon mb-4">
                  <CheckCircle2 size={32} color="#34C759" />
                </div>
                <h3 className="text-xl font-bold">Cloud Import Successful (Supabase Sync)</h3>
                <p className="muted text-sm mt-1">Your corporate dataset has been committed to the CRM database and the cloud.</p>
              </div>

              <div className="stats stats-3">
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

        {/* Footer Controls */}
        <div className="modal-foot">
          {step === 1 && (
            <>
              <button onClick={resetAndClose} className="btn btn-ghost btn-sm">Cancel</button>
              <button
                onClick={() => handleInspectSource()}
                disabled={(!file && !rawText.trim()) || isProcessing}
                className="btn btn-primary btn-sm"
              >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
                Read File & Detect Columns
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setErrors([]); }} className="btn btn-ghost btn-sm">Back</button>
              <button
                onClick={handleCheckDuplicates}
                disabled={isProcessing || !hasRequiredField || !buildPreview || buildPreview.leads.length === 0}
                className="btn btn-primary btn-sm"
              >
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
                Check Duplicates ({buildPreview ? buildPreview.leads.length.toLocaleString() : 0} rows)
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button onClick={() => { setStep(2); setErrors([]); }} className="btn btn-ghost btn-sm">Back</button>
              <button onClick={handleCommitImport} disabled={isProcessing} className="btn btn-primary btn-sm">
                {isProcessing ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                Commit Import ({analysisResult?.totalIncoming.toLocaleString()} records)
              </button>
            </>
          )}

          {step === 4 && (
            <button onClick={resetAndClose} className="btn btn-primary btn-sm" style={{ margin: '0 auto' }}>
              Done & View CRM Grid
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
