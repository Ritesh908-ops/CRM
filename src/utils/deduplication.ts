import { db } from '../db/database';
import type { CRMLead, DuplicateAnalysisItem, DuplicateAnalysisResult, DuplicateStrategy } from '../types/crm';

/**
 * Analyzes incoming items against current DB records to detect duplicates
 */
export async function analyzeDuplicates(
  incomingItems: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]
): Promise<DuplicateAnalysisResult> {
  const existingLeads = await db.leads.toArray();
  const existingMap = new Map<string, CRMLead>();

  existingLeads.forEach(lead => {
    existingMap.set(lead.compositeKey, lead);
  });

  const newItems: CRMLead[] = [];
  const duplicateItems: DuplicateAnalysisItem[] = [];

  const now = new Date().toISOString();

  incomingItems.forEach(item => {
    const existing = existingMap.get(item.compositeKey);

    if (existing) {
      duplicateItems.push({
        incomingRecord: item,
        existingRecord: existing,
        isDuplicate: true,
        statusConflict: existing.status !== 'New'
      });
    } else {
      const fullLead: CRMLead = {
        ...item,
        status: item.status || 'New',
        notes: [
          {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            text: `Imported in batch "${item.batchId}" on ${new Date().toLocaleDateString()}`,
            createdAt: now,
            author: 'System'
          }
        ],
        createdAt: now,
        updatedAt: now
      };
      newItems.push(fullLead);
    }
  });

  return {
    newItems,
    duplicateItems,
    totalIncoming: incomingItems.length,
    newCount: newItems.length,
    duplicateCount: duplicateItems.length
  };
}

/**
 * Commits the batch to IndexedDB applying the user's chosen duplicate strategy
 */
export async function commitImportBatch(
  analysis: DuplicateAnalysisResult,
  strategy: DuplicateStrategy
): Promise<{ added: number; updated: number; skipped: number }> {
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const now = new Date().toISOString();

  // 1. Add all brand new items
  if (analysis.newItems.length > 0) {
    await db.leads.bulkAdd(analysis.newItems);
    addedCount += analysis.newItems.length;
  }

  // 2. Handle duplicate items according to strategy
  for (const dup of analysis.duplicateItems) {
    if (strategy === 'skip') {
      skippedCount++;
    } else if (strategy === 'update' && dup.existingRecord && dup.existingRecord.id) {
      const updatedLead: Partial<CRMLead> = {
        ...dup.incomingRecord,
        status: dup.existingRecord.status, // Preserve pipeline status
        notes: [
          ...dup.existingRecord.notes,
          {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            text: `Updated via monthly CSV import (${dup.incomingRecord.batchId}).`,
            createdAt: now,
            author: 'System'
          }
        ],
        updatedAt: now
      };
      await db.leads.update(dup.existingRecord.id, updatedLead);
      updatedCount++;
    } else if (strategy === 'keep_all') {
      const newVariantKey = `${dup.incomingRecord.compositeKey}_DUP_${Date.now()}`;
      const duplicateVariant: CRMLead = {
        ...dup.incomingRecord,
        status: dup.existingRecord?.status || 'New',
        compositeKey: newVariantKey,
        notes: [
          {
            id: `note-${Date.now()}`,
            text: `Imported as duplicate entry in batch "${dup.incomingRecord.batchId}"`,
            createdAt: now,
            author: 'System'
          }
        ],
        createdAt: now,
        updatedAt: now
      };
      await db.leads.add(duplicateVariant);
      addedCount++;
    }
  }

  return { added: addedCount, updated: updatedCount, skipped: skippedCount };
}
