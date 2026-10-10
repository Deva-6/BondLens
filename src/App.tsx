/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ReportPage } from './pages/ReportPage';
import { RisksPage } from './pages/RisksPage';
import { ClausesPage } from './pages/ClausesPage';
import { DeadlinesPage } from './pages/DeadlinesPage';
import { ObligationsPage } from './pages/ObligationsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ComparePage } from './pages/ComparePage';
import { SettingsPage } from './pages/SettingsPage';
import { StorageService } from './services/storageService';
import { DocumentAnalysis } from './types/analysis';

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [activeDoc, setActiveDoc] = useState<DocumentAnalysis | null>(null);

  // If on a report page, track active document for top nav
  useEffect(() => {
    const reportMatch = location.pathname.match(/^\/report\/([^/]+)$/);
    if (reportMatch) {
      const docId = reportMatch[1];
      StorageService.getDocument(docId).then((doc) => {
        if (doc) setActiveDoc(doc);
      });
    } else {
      // Find most recent document if available
      StorageService.getAllDocuments().then((docs) => {
        if (docs.length > 0) setActiveDoc(docs[0]);
      });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-[#f3f3f1] flex flex-col font-sans selection:bg-[#F5E6A8]/20 selection:text-[#F5E6A8]">
      {!isHome && (
        <Navbar
          activeDocTitle={activeDoc?.title}
          activeDocId={activeDoc?.id}
        />
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/report/:id" element={<ReportPage />} />
          <Route path="/risks" element={<RisksPage />} />
          <Route path="/clauses" element={<ClausesPage />} />
          <Route path="/deadlines" element={<DeadlinesPage />} />
          <Route path="/obligations" element={<ObligationsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {!isHome && (
        <footer className="border-t border-[#1a1a1a] py-6 px-4 bg-black text-center text-xs text-stone-400">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-display text-stone-400">
              BondLens · Contract Intelligence & Risk Engine
            </span>
            <span>
              All analysis computed & stored securely on-device in browser IndexedDB.
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
