import { DocumentAnalysis, ChatMessage } from '../types/analysis';

const DB_NAME = 'bondlens_db';
const DB_VERSION = 1;
const STORE_DOCS = 'documents';
const STORE_SETTINGS = 'settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  async getAllDocuments(): Promise<DocumentAnalysis[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOCS, 'readonly');
        const store = tx.objectStore(STORE_DOCS);
        const request = store.getAll();

        request.onsuccess = () => {
          const docs: DocumentAnalysis[] = request.result || [];
          docs.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(docs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('StorageService.getAllDocuments error:', err);
      return [];
    }
  },

  async getDocument(id: string): Promise<DocumentAnalysis | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOCS, 'readonly');
        const store = tx.objectStore(STORE_DOCS);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('StorageService.getDocument error:', err);
      return null;
    }
  },

  async saveDocument(doc: DocumentAnalysis): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteDocument(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveChatMessage(docId: string, message: ChatMessage): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    if (!doc.chatHistory) doc.chatHistory = [];
    doc.chatHistory.push(message);
    doc.updatedAt = Date.now();
    await this.saveDocument(doc);
  },

  async saveChatHistory(docId: string, history: ChatMessage[]): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    doc.chatHistory = history;
    doc.updatedAt = Date.now();
    await this.saveDocument(doc);
  },

  async clearChatHistory(docId: string): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    doc.chatHistory = [];
    doc.updatedAt = Date.now();
    await this.saveDocument(doc);
  },

  async updateMessageFeedback(docId: string, messageId: string, feedback: 'up' | 'down' | null): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc || !doc.chatHistory) return;
    const msg = doc.chatHistory.find((m) => m.id === messageId);
    if (msg) {
      msg.feedback = feedback;
      await this.saveDocument(doc);
    }
  },

  async addDocumentNote(docId: string, text: string, source = 'BondLens Assistant'): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    if (!doc.reportNotes) doc.reportNotes = [];
    doc.reportNotes.push({
      id: 'note-' + Date.now(),
      text,
      createdAt: Date.now(),
      source,
    });
    doc.updatedAt = Date.now();
    await this.saveDocument(doc);
  },

  async getDocumentNotes(docId: string) {
    const doc = await this.getDocument(docId);
    return doc?.reportNotes || [];
  },

  async updateClauseNotes(docId: string, clauseId: string, notes: string): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    const clause = doc.keyClauses.find((c) => c.id === clauseId);
    if (clause) {
      clause.userNotes = notes;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }
  },

  async toggleClauseReviewed(docId: string, clauseId: string): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    const clause = doc.keyClauses.find((c) => c.id === clauseId);
    if (clause) {
      clause.isReviewed = !clause.isReviewed;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }
  },

  async updateRiskStatus(docId: string, riskId: string, status: 'Open' | 'Mitigated' | 'Accepted'): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    const risk = doc.risks.find((r) => r.id === riskId);
    if (risk) {
      risk.status = status;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }
  },

  async updateDeadlineStatus(docId: string, deadlineId: string, status: 'Pending' | 'Completed' | 'Snoozed', snoozedUntil?: string): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    const deadline = doc.deadlines.find((d) => d.id === deadlineId);
    if (deadline) {
      deadline.status = status;
      if (snoozedUntil) deadline.snoozedUntil = snoozedUntil;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }
  },

  async updateObligationStatus(docId: string, obligationId: string, status: 'Pending' | 'In Progress' | 'Fulfilled' | 'Waived'): Promise<void> {
    const doc = await this.getDocument(docId);
    if (!doc) return;
    const ob = doc.obligations.find((o) => o.id === obligationId);
    if (ob) {
      ob.status = status;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }
  },

  async clearAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DOCS, STORE_SETTINGS], 'readwrite');
      tx.objectStore(STORE_DOCS).clear();
      tx.objectStore(STORE_SETTINGS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async exportAllDataJSON(): Promise<string> {
    const docs = await this.getAllDocuments();
    return JSON.stringify({
      app: 'BondLens',
      exportedAt: new Date().toISOString(),
      documents: docs,
    }, null, 2);
  },
};
