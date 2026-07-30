import Papa from 'papaparse';
import type { CRMLead } from '../types/crm';
import { generateCompositeKey, parseNumber, sanitizePhone, sanitizeString } from './formatters';

// Map common CSV header variants to standard CRM fields
const HEADER_MAPPINGS: Record<string, keyof Omit<CRMLead, 'id' | 'compositeKey' | 'notes' | 'status' | 'batchId' | 'createdAt' | 'updatedAt'>> = {
  'entityid': 'entityId',
  'entity_id': 'entityId',
  'cin': 'entityId',
  'llpin': 'entityId',

  'entitytype': 'entityType',
  'entity_type': 'entityType',
  'companytype': 'entityType',

  'name': 'name',
  'companyname': 'name',
  'company_name': 'name',

  'state': 'state',
  'district': 'district',
  'roc': 'roc',

  'niccode': 'nicCode',
  'nic_code': 'nicCode',

  'niclabel': 'nicLabel',
  'nic_label': 'nicLabel',
  'industry': 'nicLabel',

  'classofcompany': 'classOfCompany',
  'class_of_company': 'classOfCompany',

  'dateofincorporation': 'dateOfIncorporation',
  'incorporation_date': 'dateOfIncorporation',

  'paidupcapital': 'paidUpCapital',
  'paid_up_capital': 'paidUpCapital',

  'email': 'email',
  'companyemail': 'email',

  'directorname': 'directorName',
  'director_name': 'directorName',

  'directoremail': 'directorEmail',
  'director_email': 'directorEmail',

  'directormobile': 'directorMobile',
  'director_mobile': 'directorMobile',
  'directorphone': 'directorMobile',

  'authorizedcapital': 'authorizedCapital',
  'authorized_capital': 'authorizedCapital'
};

export interface ParseResult {
  leads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[];
  errors: string[];
}

export function parseCSVFile(fileOrText: File | string, batchId: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(fileOrText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const parsedLeads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[] = [];
        const errors: string[] = [];

        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(err => errors.push(`Line ${err.row}: ${err.message}`));
        }

        const dataRows = results.data as Record<string, any>[];

        dataRows.forEach((row, idx) => {
          // Normalize object keys
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            const mappedField = HEADER_MAPPINGS[cleanKey] || key;
            normalizedRow[mappedField] = row[key];
          });

          const entityId = sanitizeString(normalizedRow.entityId || normalizedRow.CIN || normalizedRow.LLPIN || '');
          const directorName = sanitizeString(normalizedRow.directorName || '');
          const directorEmail = sanitizeString(normalizedRow.directorEmail || '');

          if (!entityId && !normalizedRow.name) {
            errors.push(`Row ${idx + 1} skipped: Missing Entity ID and Company Name.`);
            return;
          }

          const compositeKey = generateCompositeKey(entityId, directorName, directorEmail);

          const leadItem: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> = {
            compositeKey,
            entityId: entityId || `AUTO-${Date.now()}-${idx}`,
            entityType: sanitizeString(normalizedRow.entityType || 'company').toLowerCase(),
            name: sanitizeString(normalizedRow.name || 'UNKNOWN ENTITY'),
            state: sanitizeString(normalizedRow.state || 'N/A'),
            district: sanitizeString(normalizedRow.district || 'N/A'),
            roc: sanitizeString(normalizedRow.roc || 'N/A'),
            nicCode: sanitizeString(normalizedRow.nicCode || 'N/A'),
            nicLabel: sanitizeString(normalizedRow.nicLabel || 'N/A'),
            classOfCompany: sanitizeString(normalizedRow.classOfCompany || 'Private'),
            dateOfIncorporation: sanitizeString(normalizedRow.dateOfIncorporation || 'N/A'),
            paidUpCapital: parseNumber(normalizedRow.paidUpCapital),
            email: sanitizeString(normalizedRow.email || ''),
            directorName: directorName || 'N/A',
            directorEmail: directorEmail || '',
            directorMobile: sanitizePhone(normalizedRow.directorMobile),
            authorizedCapital: parseNumber(normalizedRow.authorizedCapital),
            status: 'New',
            batchId: batchId || `Batch-${new Date().toISOString().slice(0, 7)}`
          };

          parsedLeads.push(leadItem);
        });

        resolve({ leads: parsedLeads, errors });
      },
      error: (error) => {
        resolve({ leads: [], errors: [error.message] });
      }
    });
  });
}
