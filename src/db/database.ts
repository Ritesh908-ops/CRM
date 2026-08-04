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

export const INITIAL_BATCH_ID = 'Batch - July 2026 Initial';

export function buildInitialBatch(): MonthlyBatch {
  return {
    id: INITIAL_BATCH_ID,
    batchName: 'July 2026 Initial Batch',
    uploadDate: new Date().toISOString(),
    totalRowsInFile: INITIAL_SAMPLE_LEADS.length,
    newRecordsCount: INITIAL_SAMPLE_LEADS.length,
    duplicateRecordsCount: 0,
    duplicateStrategyUsed: 'skip',
    fileName: 'sample_july_2026.csv'
  };
}

/**
 * Cached so React's StrictMode double-invoked effect (and any other concurrent
 * caller) awaits one seed instead of racing a second one in.
 */
let seedPromise: Promise<void> | null = null;

// Seed initial sample data if database is empty
export function initializeDatabase(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch(err => {
      // Let a later attempt retry rather than caching the failure forever.
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function seedIfEmpty(): Promise<void> {
  // A single readwrite transaction makes the count-then-insert atomic, so two
  // overlapping calls cannot both observe an empty table and both seed.
  await db.transaction('rw', db.leads, db.batches, async () => {
    if (await db.leads.count() > 0) return;

    await db.leads.bulkAdd(INITIAL_SAMPLE_LEADS);
    await db.batches.put(buildInitialBatch());
    console.log('CRM Database initialized with sample data.');
  });
}
