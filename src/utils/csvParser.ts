import Papa from 'papaparse';
import type { CRMLead } from '../types/crm';
import { generateCompositeKey, parseNumber, sanitizePhone, sanitizeString } from './formatters';

/** Every CRM field an uploaded column can be mapped onto. */
export type MappableField =
  | 'entityId' | 'entityType' | 'name' | 'state' | 'district' | 'roc'
  | 'nicCode' | 'nicLabel' | 'classOfCompany' | 'dateOfIncorporation'
  | 'paidUpCapital' | 'email' | 'directorName' | 'directorEmail'
  | 'directorMobile' | 'authorizedCapital';

interface FieldDef {
  field: MappableField;
  label: string;
  /** Fully normalized header strings that identify this field outright. */
  exact: string[];
  /** Token naming the attribute itself — "email", "mobile", "capital". */
  attr?: string[];
  /** Token naming whose attribute it is — "director", "company". Boosts confidence. */
  owner?: string[];
  /** When true an owner token must be present, not just the attribute. */
  ownerRequired?: boolean;
  /** A header carrying any of these tokens can never map to this field. */
  reject?: string[];
}

const DIRECTOR_OWNERS = ['director', 'directors', 'signatory', 'partner', 'promoter', 'din', 'contact', 'person'];

/**
 * Ordered most-specific first. Director-qualified fields are declared before the
 * generic company ones so an ambiguous header resolves the safer way.
 */
const FIELD_DEFS: FieldDef[] = [
  {
    field: 'entityId',
    label: 'Entity ID / CIN',
    exact: ['cin', 'llpin', 'entityid', 'cinno', 'cinnumber', 'llpinno', 'companyid', 'registrationno', 'registrationnumber', 'regno', 'corporateidentificationnumber', 'corporateidentitynumber'],
    attr: ['cin', 'llpin'],
    reject: ['director', 'din']
  },
  {
    field: 'directorEmail',
    label: 'Director Email',
    exact: ['directoremail', 'directoremailid', 'directoremailaddress', 'signatoryemail', 'partneremail', 'contactemail', 'dinemail'],
    attr: ['email', 'mail', 'emailid'],
    owner: DIRECTOR_OWNERS,
    ownerRequired: true
  },
  {
    field: 'directorMobile',
    label: 'Director Mobile',
    exact: ['directormobile', 'directorphone', 'directormobileno', 'mobile', 'mobileno', 'mobilenumber', 'phone', 'phoneno', 'phonenumber', 'contactno', 'contactnumber', 'cellno'],
    attr: ['mobile', 'mob', 'phone', 'cell', 'tel', 'telephone', 'whatsapp'],
    owner: DIRECTOR_OWNERS
  },
  {
    field: 'directorName',
    label: 'Director Name',
    exact: ['director', 'directorname', 'directors', 'signatory', 'signatoryname', 'partnername', 'promotername', 'contactperson', 'dinname', 'nameofdirector'],
    attr: ['name', 'person'],
    owner: DIRECTOR_OWNERS,
    ownerRequired: true
  },
  {
    field: 'name',
    label: 'Company Name',
    exact: ['name', 'company', 'companyname', 'entityname', 'firmname', 'legalname', 'businessname', 'nameofcompany', 'organisationname', 'organizationname'],
    attr: ['company', 'entity', 'firm', 'organisation', 'organization', 'business'],
    reject: [...DIRECTOR_OWNERS, 'email', 'mail', 'mobile', 'phone', 'type', 'class', 'category', 'id', 'cin', 'status', 'capital', 'state', 'district', 'roc']
  },
  {
    field: 'email',
    label: 'Company Email',
    exact: ['email', 'emailid', 'emailaddress', 'companyemail', 'mail', 'mailid', 'registeredemail'],
    attr: ['email', 'mail'],
    reject: DIRECTOR_OWNERS
  },
  {
    field: 'paidUpCapital',
    label: 'Paid-Up Capital',
    exact: ['paidupcapital', 'paidcapital', 'paidup'],
    attr: ['capital', 'paidup'],
    owner: ['paid', 'paidup'],
    ownerRequired: true
  },
  {
    field: 'authorizedCapital',
    label: 'Authorized Capital',
    exact: ['authorizedcapital', 'authorisedcapital', 'authcapital'],
    attr: ['capital'],
    owner: ['authorized', 'authorised', 'auth'],
    ownerRequired: true
  },
  {
    field: 'dateOfIncorporation',
    label: 'Date of Incorporation',
    exact: ['dateofincorporation', 'incorporationdate', 'doi', 'registrationdate', 'dateofregistration'],
    attr: ['incorporation', 'incorporated'],
    reject: []
  },
  {
    field: 'nicCode',
    label: 'NIC Code',
    exact: ['niccode', 'nic', 'industrialcode', 'activitycode'],
    attr: ['nic'],
    owner: ['code'],
    ownerRequired: true
  },
  {
    field: 'nicLabel',
    label: 'Industry / NIC Sector',
    exact: ['niclabel', 'nicdescription', 'industry', 'industrysector', 'sector', 'nicsector', 'businessactivity', 'activitydescription'],
    attr: ['industry', 'sector', 'activity'],
    reject: ['code']
  },
  {
    field: 'classOfCompany',
    label: 'Class of Company',
    exact: ['classofcompany', 'class', 'companyclass', 'category', 'companycategory', 'subcategory'],
    attr: ['class', 'category'],
    reject: []
  },
  {
    field: 'entityType',
    label: 'Entity Type',
    exact: ['entitytype', 'companytype', 'type', 'entitycategory'],
    attr: ['type'],
    reject: ['class']
  },
  {
    field: 'roc',
    label: 'ROC Office',
    exact: ['roc', 'rocname', 'rocoffice', 'registrarofcompanies'],
    attr: ['roc', 'registrar'],
    reject: []
  },
  {
    field: 'state',
    label: 'State',
    exact: ['state', 'companystate', 'registeredstate'],
    attr: ['state'],
    reject: []
  },
  {
    field: 'district',
    label: 'District / City',
    exact: ['district', 'city', 'companydistrict', 'registereddistrict', 'town'],
    attr: ['district', 'city', 'town'],
    reject: []
  }
];

export const FIELD_LABELS: Record<MappableField, string> = FIELD_DEFS.reduce((acc, d) => {
  acc[d.field] = d.label;
  return acc;
}, {} as Record<MappableField, string>);

/** Fields that must be mapped for an import to produce usable rows. */
export const REQUIRED_ANY_OF: MappableField[] = ['entityId', 'name'];

/** "Paid Up Capital (Rs)" -> "paidupcapitalrs" */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** "Paid Up Capital (Rs)" -> ["paid","up","capital","rs"] */
function tokenizeHeader(header: string): string[] {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}

/** 0 = no match, 100 = certain, 70/50 = progressively weaker guesses. */
function scoreHeader(def: FieldDef, header: string): number {
  const normalized = normalizeHeader(header);
  const tokens = tokenizeHeader(header);
  const hasAny = (list?: string[]) => Boolean(list && list.some(t => tokens.includes(t)));

  if (hasAny(def.reject)) return 0;
  if (def.exact.includes(normalized)) return 100;

  if (!hasAny(def.attr)) return 0;

  const ownerMatched = hasAny(def.owner);
  if (def.ownerRequired && !ownerMatched) return 0;

  return ownerMatched ? 70 : 50;
}

export interface DetectedColumn {
  /** The header exactly as it appears in the file. */
  header: string;
  /** Auto-detected target field, or null when nothing matched. */
  field: MappableField | null;
  confidence: 'exact' | 'guess' | 'none';
  /** First non-empty value in this column, shown to help the user confirm. */
  sample: string;
}

export interface CsvAnalysis {
  headers: string[];
  columns: DetectedColumn[];
  rows: Record<string, string>[];
  rowCount: number;
  /** True when the file exceeded MAX_ROWS and was cut short. */
  truncated: boolean;
  parseErrors: string[];
}

/** Guard against a multi-hundred-MB export locking up the tab. */
const MAX_ROWS = 50000;

/**
 * Auto-maps headers to CRM fields, greedily assigning the highest-confidence
 * pairs first so each header and each field is claimed at most once.
 */
function autoDetectColumns(headers: string[], rows: Record<string, string>[]): DetectedColumn[] {
  const candidates: { header: string; field: MappableField; score: number; defIndex: number }[] = [];

  headers.forEach(header => {
    FIELD_DEFS.forEach((def, defIndex) => {
      const score = scoreHeader(def, header);
      if (score > 0) candidates.push({ header, field: def.field, score, defIndex });
    });
  });

  // Highest score wins; ties fall to the more specific (earlier) field definition.
  candidates.sort((a, b) => b.score - a.score || a.defIndex - b.defIndex);

  const headerToField = new Map<string, { field: MappableField; score: number }>();
  const claimedFields = new Set<MappableField>();

  candidates.forEach(c => {
    if (headerToField.has(c.header) || claimedFields.has(c.field)) return;
    headerToField.set(c.header, { field: c.field, score: c.score });
    claimedFields.add(c.field);
  });

  return headers.map(header => {
    const match = headerToField.get(header);
    const sampleRow = rows.find(r => sanitizeString(r[header]).length > 0);
    return {
      header,
      field: match ? match.field : null,
      confidence: match ? (match.score === 100 ? 'exact' : 'guess') : 'none',
      sample: sampleRow ? sanitizeString(sampleRow[header]).slice(0, 40) : ''
    };
  });
}

/**
 * Reads the file once and reports its structure. Rows are retained so the user
 * can remap columns without re-uploading.
 */
export function analyzeCSVStructure(fileOrText: File | string): Promise<CsvAnalysis> {
  return new Promise((resolve) => {
    Papa.parse(fileOrText as never, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const parseErrors: string[] = [];

        // Papa reports a delimiter-mismatch error per row; one summary line is enough.
        const fieldMismatches = results.errors.filter(e => e.code === 'TooFewFields' || e.code === 'TooManyFields');
        if (fieldMismatches.length > 0) {
          parseErrors.push(
            `${fieldMismatches.length} row(s) had a different column count than the header and may be misaligned.`
          );
        }
        results.errors
          .filter(e => e.code !== 'TooFewFields' && e.code !== 'TooManyFields')
          .slice(0, 5)
          .forEach(e => parseErrors.push(e.row != null ? `Line ${e.row + 2}: ${e.message}` : e.message));

        const allRows = (results.data as Record<string, string>[]).filter(row =>
          Object.values(row).some(v => sanitizeString(v).length > 0)
        );
        const truncated = allRows.length > MAX_ROWS;
        const rows = truncated ? allRows.slice(0, MAX_ROWS) : allRows;

        const headers = (results.meta.fields || []).filter(h => h && h.trim().length > 0);

        if (headers.length === 0) {
          parseErrors.push('No column headers were found. The first row of the file must contain column names.');
        }

        resolve({
          headers,
          columns: autoDetectColumns(headers, rows),
          rows,
          rowCount: rows.length,
          truncated,
          parseErrors
        });
      },
      error: (error: Error) => {
        resolve({
          headers: [], columns: [], rows: [], rowCount: 0, truncated: false,
          parseErrors: [error.message || 'The file could not be read.']
        });
      }
    });
  });
}

export type ColumnMapping = Record<string, MappableField | null>;

/** Turns the auto-detected columns into the editable mapping the wizard drives. */
export function mappingFromColumns(columns: DetectedColumn[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  columns.forEach(c => { mapping[c.header] = c.field; });
  return mapping;
}

export interface BuildResult {
  leads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[];
  /** Capped for display — see skippedCount for the true total. */
  errors: string[];
  skippedCount: number;
}

/** How many per-row errors to surface before collapsing into a summary line. */
const MAX_ROW_ERRORS_SHOWN = 8;

/**
 * Projects raw rows onto CRM leads using the (possibly user-edited) mapping.
 * Cheap enough to re-run on every mapping change.
 */
export function buildLeadsFromRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  batchId: string
): BuildResult {
  const leads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[] = [];
  const errors: string[] = [];
  let skippedCount = 0;

  // Invert once: field -> source header.
  const fieldToHeader = new Map<MappableField, string>();
  Object.entries(mapping).forEach(([header, field]) => {
    if (field && !fieldToHeader.has(field)) fieldToHeader.set(field, header);
  });

  const resolvedBatchId = batchId.trim() || `Batch-${new Date().toISOString().slice(0, 7)}`;

  rows.forEach((row, idx) => {
    const read = (field: MappableField): string => {
      const header = fieldToHeader.get(field);
      return header ? sanitizeString(row[header]) : '';
    };

    const entityId = read('entityId');
    const name = read('name');

    if (!entityId && !name) {
      skippedCount++;
      if (errors.length < MAX_ROW_ERRORS_SHOWN) {
        errors.push(`Row ${idx + 2} skipped: both Entity ID and Company Name are empty.`);
      }
      return;
    }

    const directorName = read('directorName');
    const directorEmail = read('directorEmail');

    leads.push({
      compositeKey: generateCompositeKey(entityId, directorName, directorEmail),
      entityId: entityId || `AUTO-${resolvedBatchId}-${idx}`,
      entityType: (read('entityType') || 'company').toLowerCase(),
      name: name || 'UNKNOWN ENTITY',
      state: read('state') || 'N/A',
      district: read('district') || 'N/A',
      roc: read('roc') || 'N/A',
      nicCode: read('nicCode') || 'N/A',
      nicLabel: read('nicLabel') || 'N/A',
      classOfCompany: read('classOfCompany') || 'Private',
      dateOfIncorporation: read('dateOfIncorporation') || 'N/A',
      paidUpCapital: parseNumber(read('paidUpCapital')),
      email: read('email'),
      directorName: directorName || 'N/A',
      directorEmail,
      directorMobile: sanitizePhone(read('directorMobile')),
      authorizedCapital: parseNumber(read('authorizedCapital')),
      status: 'New',
      batchId: resolvedBatchId
    });
  });

  if (skippedCount > errors.length) {
    errors.push(`…and ${skippedCount - errors.length} more row(s) skipped for the same reason.`);
  }

  return { leads, errors, skippedCount };
}
