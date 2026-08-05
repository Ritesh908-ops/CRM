import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db, buildInitialBatch } from './database';
import type { CRMLead, MonthlyBatch, LeadStatus, DuplicateStrategy } from '../types/crm';
import { INITIAL_SAMPLE_LEADS } from '../mockData/sampleData';

/**
 * Service Abstraction for Database CRUD operations
 * Uses Supabase Cloud DB when configured, or Dexie IndexedDB in local mode.
 */
export const crmService = {
  /**
   * Fetch all CRM leads
   */
  async getLeads(): Promise<CRMLead[]> {
    // Track dependency for Dexie so useLiveQuery automatically re-runs when local DB is mutated
    await db.leads.limit(1).toArray();

    if (isSupabaseConfigured && supabase) {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('updated_at', { ascending: false })
            .range(from, from + step - 1);

          if (error) {
            console.error('Supabase fetch error, falling back to IndexedDB:', error);
            return db.leads.toArray();
          }

          if (data && data.length > 0) {
            allData = allData.concat(data);
          }

          if (!data || data.length < step) {
            fetchMore = false;
          } else {
            from += step;
          }
        }

        // Map snake_case DB columns to CRMLead properties
        return allData.map(row => ({
        id: row.id,
        compositeKey: row.composite_key,
        entityId: row.entity_id,
        entityType: row.entity_type,
        name: row.name,
        state: row.state,
        district: row.district,
        roc: row.roc,
        nicCode: row.nic_code,
        nicLabel: row.nic_label,
        classOfCompany: row.class_of_company,
        dateOfIncorporation: row.date_of_incorporation,
        paidUpCapital: Number(row.paid_up_capital || 0),
        email: row.email,
        directorName: row.director_name,
        directorEmail: row.director_email,
        directorMobile: row.director_mobile,
        authorizedCapital: Number(row.authorized_capital || 0),
        status: row.status as LeadStatus,
        notes: row.notes || [],
        batchId: row.batch_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    }

    return db.leads.toArray();
  },

  /**
   * Fetch all monthly batches
   */
  async getBatches(): Promise<MonthlyBatch[]> {
    // Track dependency for Dexie so useLiveQuery automatically re-runs when local DB is mutated
    await db.batches.limit(1).toArray();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(15000);

      if (!error && data) {
        return data.map(b => ({
          id: b.id,
          batchName: b.batch_name,
          uploadDate: b.upload_date,
          totalRowsInFile: b.total_rows_in_file,
          newRecordsCount: b.new_records_count,
          duplicateRecordsCount: b.duplicate_records_count,
          duplicateStrategyUsed: b.duplicate_strategy_used as DuplicateStrategy,
          fileName: b.file_name
        }));
      }
    }

    return db.batches.toArray();
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: number, status: LeadStatus): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      // Get existing notes first
      const { data: existing } = await supabase.from('leads').select('notes').eq('id', leadId).single();
      const currentNotes = existing?.notes || [];
      const updatedNotes = [
        ...currentNotes,
        {
          id: `note-${Date.now()}`,
          text: `Status updated to "${status}"`,
          createdAt: now,
          author: 'Admin User'
        }
      ];

      await supabase
        .from('leads')
        .update({ status, notes: updatedNotes, updated_at: now })
        .eq('id', leadId);
    }

    // Always update local IndexedDB as well
    const lead = await db.leads.get(leadId);
    if (lead) {
      await db.leads.update(leadId, {
        status,
        updatedAt: now,
        notes: [
          ...lead.notes,
          {
            id: `note-${Date.now()}`,
            text: `Status updated to "${status}"`,
            createdAt: now,
            author: 'Admin User'
          }
        ]
      });
    }
  },

  /**
   * Add a note to a lead
   */
  async addNote(leadId: number, noteText: string): Promise<void> {
    const now = new Date().toISOString();
    const newNoteItem = {
      id: `note-${Date.now()}`,
      text: noteText,
      createdAt: now,
      author: 'Admin User'
    };

    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase.from('leads').select('notes').eq('id', leadId).single();
      const currentNotes = existing?.notes || [];
      await supabase
        .from('leads')
        .update({ notes: [...currentNotes, newNoteItem], updated_at: now })
        .eq('id', leadId);
    }

    const lead = await db.leads.get(leadId);
    if (lead) {
      await db.leads.update(leadId, {
        notes: [...lead.notes, newNoteItem],
        updatedAt: now
      });
    }
  },

  /**
   * Clear all upload batches (logs)
   */
  async clearBatches(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('batches').delete().neq('id', '0');
    }
    await db.batches.clear();
  },

  /**
   * Delete lead
   */
  async deleteLead(leadId: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('leads').delete().eq('id', leadId);
    }
    await db.leads.delete(leadId);
  },

  /**
   * Reset database to initial sample data
   */
  async resetToSampleData(): Promise<void> {
    await db.transaction('rw', db.leads, db.batches, async () => {
      await db.leads.clear();
      await db.batches.clear();
      await db.leads.bulkAdd(INITIAL_SAMPLE_LEADS);
      await db.batches.put(buildInitialBatch());
    });
  },

  /**
   * Permanently delete all leads and batches (Danger)
   */
  async deleteAllData(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // Supabase requires a filter for deletes. .neq('id', -1) will match all records.
      await supabase.from('leads').delete().neq('id', -1);
      await supabase.from('batches').delete().neq('id', '0');
    }
    
    // Clear local IndexedDB
    await db.transaction('rw', db.leads, db.batches, async () => {
      await db.leads.clear();
      await db.batches.clear();
    });
  }
};
