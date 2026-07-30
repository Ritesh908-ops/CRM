export type EntityType = 'company' | 'llp' | string;

export type LeadStatus = 'New' | 'Contacted' | 'In Discussion' | 'Qualified' | 'Converted' | 'Unresponsive';

export type UserRole = 'Admin' | 'Sales Rep' | 'Viewer';

export interface CRMUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatarUrl?: string;
}

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface CRMLead {
  id?: number; // Primary key
  compositeKey: string; // Unique string: entityId + '___' + directorName
  
  // Base fields from CSV
  entityId: string;
  entityType: EntityType;
  name: string;
  state: string;
  district: string;
  roc: string;
  nicCode: string;
  nicLabel: string;
  classOfCompany: string;
  dateOfIncorporation: string;
  paidUpCapital: number;
  email: string;
  directorName: string;
  directorEmail: string;
  directorMobile: string; // Cleaned phone string without backticks
  authorizedCapital: number;

  // CRM Metadata
  status: LeadStatus;
  notes: LeadNote[];
  batchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBatch {
  id: string;
  batchName: string;
  uploadDate: string;
  totalRowsInFile: number;
  newRecordsCount: number;
  duplicateRecordsCount: number;
  duplicateStrategyUsed: DuplicateStrategy;
  fileName: string;
}

export type DuplicateStrategy = 'skip' | 'update' | 'keep_all';

export interface DuplicateAnalysisItem {
  incomingRecord: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'status'>;
  existingRecord?: CRMLead;
  isDuplicate: boolean;
  statusConflict?: boolean;
}

export interface DuplicateAnalysisResult {
  newItems: CRMLead[];
  duplicateItems: DuplicateAnalysisItem[];
  totalIncoming: number;
  newCount: number;
  duplicateCount: number;
}

export interface FilterState {
  searchQuery: string;
  entityType: string;
  state: string;
  roc: string;
  nicLabel: string;
  status: string;
  batchId: string;
  minCapital: string;
  maxCapital: string;
}
