import { db } from '../db/database';
import { crmService } from '../db/crmService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CRMLead, DuplicateAnalysisItem, DuplicateAnalysisResult, DuplicateStrategy } from '../types/crm';

function mapLeadToSupabase(lead: CRMLead) {
  return {
    id: lead.id,
    composite_key: lead.compositeKey,
    entity_id: lead.entityId,
    entity_type: lead.entityType,
    name: lead.name,
    state: lead.state,
    district: lead.district,
    roc: lead.roc,
    nic_code: lead.nicCode,
    nic_label: lead.nicLabel,
    class_of_company: lead.classOfCompany,
    date_of_incorporation: lead.dateOfIncorporation,
    paid_up_capital: lead.paidUpCapital,
    email: lead.email,
    director_name: lead.directorName,
    director_email: lead.directorEmail,
    director_mobile: lead.directorMobile,
    authorized_capital: lead.authorizedCapital,
    status: lead.status,
    notes: lead.notes,
    batch_id: lead.batchId,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt
  };
}

/**
 * Analyzes incoming items against current DB records to detect duplicates
 */
export async function analyzeDuplicates(
  incomingItems: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]
): Promise<DuplicateAnalysisResult> {
  const existingLeads = await crmService.getLeads();
  const existingMap = new Map<string, CRMLead>();

  existingLeads.forEach(lead => {
    existingMap.set(lead.compositeKey, lead);
  });

  const newItems: CRMLead[] = [];
  const duplicateItems: DuplicateAnalysisItem[] = [];

  const now = new Date().toISOString();

  // Keys accepted from this same file, so repeated rows inside one upload are
  // caught too — not just collisions against what is already stored.
  const seenInThisFile = new Set<string>();

  incomingItems.forEach(item => {
    const existing = existingMap.get(item.compositeKey);

    if (existing || seenInThisFile.has(item.compositeKey)) {
      duplicateItems.push({
        incomingRecord: item as CRMLead, // Casting as we don't have id/dates yet, they will be generated
        existingRecord: existing,
        isDuplicate: true,
        statusConflict: Boolean(existing && existing.status !== 'New')
      });
    } else {
      seenInThisFile.add(item.compositeKey);
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
      } as CRMLead;
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
 * Commits the batch to IndexedDB (and Supabase if configured) applying the user's chosen duplicate strategy
 */
export async function commitImportBatch(
  analysis: DuplicateAnalysisResult,
  strategy: DuplicateStrategy
): Promise<{ added: number; updated: number; skipped: number }> {
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const now = new Date().toISOString();
  const dbUpdates: CRMLead[] = [];
  const dbAdds: CRMLead[] = [...analysis.newItems];

  // 1. Add all brand new items
  if (analysis.newItems.length > 0) {
    addedCount += analysis.newItems.length;
  }

  // 2. Handle duplicate items according to strategy
  for (const [dupIndex, dup] of analysis.duplicateItems.entries()) {
    if (strategy === 'skip') {
      skippedCount++;
    } else if (strategy === 'update' && !dup.existingRecord) {
      // A repeat of a row from this same file — there is no stored record to
      // update, so the later copy is dropped.
      skippedCount++;
    } else if (strategy === 'update' && dup.existingRecord && dup.existingRecord.id) {
      const updatedLead: CRMLead = {
        ...(dup.incomingRecord as any),
        id: dup.existingRecord.id, // KEEP the existing ID to update it
        status: dup.existingRecord.status, // Preserve pipeline status
        compositeKey: dup.existingRecord.compositeKey,
        notes: [
          ...dup.existingRecord.notes,
          {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            text: `Updated via monthly CSV import (${dup.incomingRecord.batchId}).`,
            createdAt: now,
            author: 'System'
          }
        ],
        createdAt: dup.existingRecord.createdAt,
        updatedAt: now
      };
      
      dbUpdates.push(updatedLead);
      updatedCount++;
    } else if (strategy === 'keep_all') {
      // Index keeps the key unique even when several variants land in the same millisecond.
      const newVariantKey = `${dup.incomingRecord.compositeKey}_DUP_${Date.now()}_${dupIndex}`;
      const duplicateVariant: CRMLead = {
        ...(dup.incomingRecord as any),
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
      
      dbAdds.push(duplicateVariant);
      addedCount++;
    }
  }

  // Execute Supabase batch operations if active
  if (isSupabaseConfigured && supabase) {
    if (dbAdds.length > 0) {
      await supabase.from('leads').insert(dbAdds.map(mapLeadToSupabase));
    }
    if (dbUpdates.length > 0) {
      await supabase.from('leads').upsert(dbUpdates.map(mapLeadToSupabase));
    }
  }

  // Execute IndexedDB batch operations
  if (dbAdds.length > 0) {
    await db.leads.bulkAdd(dbAdds);
  }
  
  if (dbUpdates.length > 0) {
    // Dexie bulkPut acts like upsert and updates existing records by primary key (id)
    await db.leads.bulkPut(dbUpdates);
  }

  return { added: addedCount, updated: updatedCount, skipped: skippedCount };
}
