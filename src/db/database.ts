import Dexie, { type Table } from 'dexie';
import type { CRMLead, MonthlyBatch } from '../types/crm';
import { INITIAL_SAMPLE_LEADS } from '../mockData/sampleData';

export class CRMDatabase extends Dexie {
  leads!: Table<CRMLead, number>;
  batches!: Table<MonthlyBatch, string>;

  constructor() {
    super('CRM_Monthly_Database');
    
    // Schema definition
    this.version(1).stores({
      leads: '++id, compositeKey, entityId, entityType, name, state, district, roc, nicLabel, status, batchId, directorName, directorEmail, directorMobile',
      batches: 'id, batchName, uploadDate'
    });
  }
}

export const db = new CRMDatabase();

// Seed initial sample data if database is empty
export async function initializeDatabase() {
  const count = await db.leads.count();
  if (count === 0) {
    await db.leads.bulkAdd(INITIAL_SAMPLE_LEADS);
    await db.batches.add({
      id: 'Batch - July 2026 Initial',
      batchName: 'July 2026 Initial Batch',
      uploadDate: new Date().toISOString(),
      totalRowsInFile: INITIAL_SAMPLE_LEADS.length,
      newRecordsCount: INITIAL_SAMPLE_LEADS.length,
      duplicateRecordsCount: 0,
      duplicateStrategyUsed: 'skip',
      fileName: 'sample_july_2026.csv'
    });
    console.log('CRM Database initialized with sample data.');
  }
}
