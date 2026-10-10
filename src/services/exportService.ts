import { DocumentAnalysis, DeadlineItem, RiskFinding } from '../types/analysis';

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 50);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ExportService = {
  getFilename(doc: DocumentAnalysis, ext: string): string {
    const cleanName = sanitizeFilename(doc.title || 'Analysis');
    const dateStr = new Date(doc.createdAt).toISOString().split('T')[0];
    return `BondLens-${cleanName}-${dateStr}.${ext}`;
  },

  /**
   * Generates and triggers download of an iCalendar (.ics) file
   */
  exportICS(deadlines: DeadlineItem[], documentTitle: string) {
    if (!deadlines || deadlines.length === 0) {
      throw new Error('No valid deadlines available to export.');
    }

    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BondLens//Contract Intelligence//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    deadlines.forEach((dl, index) => {
      const targetDateStr = dl.resolvedDate || dl.date;
      if (!targetDateStr) return;

      const dateParts = targetDateStr.split('-');
      if (dateParts.length < 3) return;

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      const dtstart = `${year}${pad(month)}${pad(day)}`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:bondlens-${Date.now()}-${index}@bondlens.local`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `SUMMARY:BondLens: ${dl.label} (${documentTitle})`,
        `DESCRIPTION:Contractual Deadline: ${dl.label}\\nType: ${dl.type}\\nConsequence if missed: ${dl.consequenceIfMissed || 'None specified'}\\nExact quote: "${(dl.exactQuote || '').replace(/\n/g, ' ')}"`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${dl.label}`,
        'TRIGGER:-P7D',
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const filename = `BondLens-${sanitizeFilename(documentTitle)}-deadlines.ics`;
    triggerDownload(blob, filename);
  },

  /**
   * Generates a printable PDF report using browser print styling
   * Header uses the active accent color, with clean black-on-white body text and page numbers
   */
  exportPDFReport(doc: DocumentAnalysis) {
    const activeAccent =
      typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F5E6A8'
        : '#F5E6A8';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BondLens-${sanitizeFilename(doc.title)}-${new Date(doc.createdAt).toISOString().split('T')[0]}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #777;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.45;
      color: #111;
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
      font-size: 10.5pt;
    }
    .header-banner {
      border-bottom: 3px solid ${activeAccent};
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 700;
      color: #000;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 10pt;
      color: #555;
      margin-bottom: 12px;
    }
    .doc-meta {
      font-size: 9.5pt;
      color: #444;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
      margin-bottom: 12px;
      background: #fafafa;
      padding: 10px;
      border: 1px solid #eaeaea;
      border-radius: 6px;
    }
    .score-box {
      border: 1px solid #ddd;
      border-left: 4px solid ${
        doc.overallRiskScore > 75 ? '#c53030' : doc.overallRiskScore > 50 ? '#dd6b20' : '#2f855a'
      };
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      background: #fafafa;
    }
    .score-title {
      font-size: 15pt;
      font-weight: bold;
      color: #111;
      margin: 0 0 6px 0;
    }
    .summary-text {
      font-size: 10pt;
      color: #222;
      line-height: 1.45;
      margin: 0;
    }
    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #111;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    .item {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dotted #e5e5e5;
      page-break-inside: avoid;
    }
    .item-title {
      font-weight: 600;
      font-size: 10.5pt;
      color: #111;
      margin-bottom: 3px;
    }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 8.5pt;
      font-weight: bold;
      border-radius: 3px;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #dcfce7; color: #166534; }
    .quote {
      font-style: italic;
      font-family: Georgia, serif;
      background: #f7f7f7;
      padding: 6px 10px;
      border-left: 2px solid #bbb;
      font-size: 9.5pt;
      color: #333;
      margin: 4px 0;
    }
    .action-note {
      font-size: 9pt;
      color: #0369a1;
      margin-top: 3px;
    }
    .disclaimer {
      font-size: 8.5pt;
      color: #666;
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="brand-title">BondLens Legal Analysis: ${doc.title}</div>
    <div class="brand-subtitle">Understand every clause before you sign.</div>
  </div>

  <div class="doc-meta">
    <div><strong>Document Name:</strong> ${doc.title}</div>
    <div><strong>Date:</strong> ${new Date(doc.createdAt).toLocaleDateString()}</div>
    <div><strong>Selected Party:</strong> ${doc.userPartyRole}</div>
    <div><strong>Risk Score & Level:</strong> ${doc.overallRiskScore} / 100 (${doc.riskLevel})</div>
  </div>

  <div class="score-box">
    <div class="score-title">Risk Assessment: ${doc.overallRiskScore} / 100 (${doc.riskLevel})</div>
    <p class="summary-text"><strong>Plain-Language Summary:</strong> ${doc.summary}</p>
  </div>

  <h2>Document Metadata</h2>
  <div class="doc-meta">
    <div><strong>Type:</strong> ${doc.documentType}</div>
    <div><strong>Parties:</strong> ${doc.metadata?.parties?.map((p: any) => `${p.name} (${p.role})`).join(', ') || 'Identified in agreement'}</div>
    <div><strong>Effective Date:</strong> ${doc.metadata?.effectiveDate || 'Not specified'}</div>
    <div><strong>Term:</strong> ${doc.metadata?.termLength || 'Not specified'}</div>
    <div><strong>Governing Law:</strong> ${doc.metadata?.governingLaw || 'Not specified'}</div>
    ${doc.metadata?.jurisdiction ? `<div><strong>Jurisdiction:</strong> ${doc.metadata.jurisdiction}</div>` : ''}
  </div>

  ${
    doc.scoreBreakdown && doc.scoreBreakdown.length > 0
      ? `
  <h2>Category Risk Breakdown</h2>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 12px;">
    ${doc.scoreBreakdown
      .map(
        (b) => `
      <div style="background: #fafafa; border: 1px solid #eee; padding: 6px 8px; border-radius: 4px; font-size: 9pt;">
        <strong>${b.category}:</strong> ${b.score}/100 - <span style="color: #666;">${b.reason}</span>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <h2>Risks (${doc.risks?.length || 0})</h2>
  ${doc.risks
    .map(
      (r) => `
    <div class="item">
      <div class="item-title">
        <span class="badge badge-${r.severity.toLowerCase()}">${r.severity}</span>
        ${r.title} [${r.category}]
        ${r.confidence !== undefined ? `<span style="font-size: 8.5pt; color: #666; font-weight: normal; margin-left: 6px;">(Confidence: ${Math.round(r.confidence * 100)}%)</span>` : ''}
      </div>
      <div style="font-size: 9.5pt; color: #222;"><strong>Explanation:</strong> ${r.description}</div>
      ${r.exactQuote ? `<div class="quote">"${r.exactQuote}"</div>` : ''}
      <div class="action-note"><strong>Suggestion:</strong> ${r.recommendation}</div>
    </div>
  `
    )
    .join('')}

  <h2>Key Clauses (${doc.keyClauses?.length || 0})</h2>
  ${doc.keyClauses
    .map(
      (c) => `
    <div class="item">
      <div class="item-title">[${c.category}] ${c.title} - ${c.riskLevel} Risk</div>
      <div style="font-size: 9.5pt; color: #333;"><strong>Explanation:</strong> ${c.plainExplanation}</div>
      ${c.exactQuote ? `<div class="quote">"${c.exactQuote}" <small>(${c.location})</small></div>` : ''}
      <div style="font-size: 9pt; color: #555;"><strong>Negotiation Tip:</strong> ${c.negotiationTip}</div>
    </div>
  `
    )
    .join('')}

  <h2>Deadlines (${doc.deadlines?.length || 0})</h2>
  <ul>
    ${doc.deadlines
      .map(
        (d) => `
      <li style="margin-bottom: 8px; font-size: 9.5pt;">
        <strong>Date:</strong> ${d.resolvedDate || d.date || d.relativeRule || 'Pending date'} | 
        <strong>Action:</strong> ${d.label} [${d.type}] | 
        <strong>Who:</strong> ${d.responsibleParty || doc.userPartyRole}
        ${d.exactQuote ? `<div class="quote" style="margin: 2px 0;">"${d.exactQuote}"</div>` : ''}
        <div style="font-size: 8.5pt; color: #0369a1;"><strong>Reminder Note:</strong> ${d.consequenceIfMissed || d.reminderNote || 'None'}</div>
      </li>
    `
      )
      .join('')}
  </ul>

  <h2>Obligations (${doc.obligations?.length || 0})</h2>
  <ul>
    ${doc.obligations
      .map(
        (o) => `
      <li style="margin-bottom: 8px; font-size: 9.5pt;">
        <strong>Party:</strong> ${o.belongsToUser ? 'You / User' : o.responsibleParty} | 
        <strong>Duty:</strong> ${o.description} (${o.dueDate || 'Ongoing'})
        ${o.exactQuote ? `<div class="quote" style="margin: 2px 0;">"${o.exactQuote}"</div>` : ''}
        <div style="font-size: 8.5pt; color: #b91c1c;"><strong>Consequence of breach:</strong> ${o.consequenceOfBreach || 'Standard contractual breach'}</div>
      </li>
    `
      )
      .join('')}
  </ul>

  ${
    doc.missingProtections && doc.missingProtections.length > 0
      ? `
  <h2>Missing Protections (${doc.missingProtections.length})</h2>
  ${doc.missingProtections
    .map(
      (m) => `
    <div class="item">
      <div class="item-title">Missing: ${m.title} [${m.severity || 'Medium'} Severity]</div>
      <div style="font-size: 9.5pt; color: #444;"><strong>Why Needed:</strong> ${m.whyItMatters}</div>
      <div class="quote"><strong>Recommendation:</strong> "${m.suggestedWording}"</div>
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  <div class="disclaimer">
    BondLens provides informational analysis, not legal advice. Generated on ${new Date().toLocaleString()}.
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  },

  /**
   * Generates and downloads full analysis as Markdown (.md)
   */
  exportMarkdown(doc: DocumentAnalysis) {
    const lines: string[] = [
      `# BondLens Legal Analysis: ${doc.title}`,
      `*Date:* ${new Date(doc.createdAt).toLocaleDateString()}`,
      `*Selected Party Perspective:* ${doc.userPartyRole}`,
      `*Risk Score & Level:* ${doc.overallRiskScore} / 100 (${doc.riskLevel})`,
      '',
      `## Executive Summary`,
      doc.summary,
      '',
      `## Document Metadata`,
      `- **Document Type:** ${doc.documentType}`,
      `- **Parties:** ${doc.metadata?.parties?.map((p: any) => `${p.name} (${p.role})`).join(', ') || 'Identified in document'}`,
      doc.metadata?.effectiveDate ? `- **Effective Date:** ${doc.metadata.effectiveDate}` : '- **Effective Date:** Not specified',
      doc.metadata?.termLength ? `- **Term Length:** ${doc.metadata.termLength}` : '- **Term Length:** Not specified',
      doc.metadata?.governingLaw ? `- **Governing Law:** ${doc.metadata.governingLaw}` : '- **Governing Law:** Not specified',
      doc.metadata?.jurisdiction ? `- **Jurisdiction:** ${doc.metadata.jurisdiction}` : '',
      '',
      `## Category Risk Breakdown`,
      ...(doc.scoreBreakdown || []).map((b) => `- **${b.category}:** ${b.score}/100 (${b.reason})`),
      '',
      `## Identified Risks (${doc.risks?.length || 0})`,
      ...(doc.risks || []).map(
        (r, i) => `### ${i + 1}. [${r.severity}] ${r.title} (${r.category})
- **Confidence:** ${Math.round((r.confidence ?? 0.85) * 100)}%
- **Plain Explanation:** ${r.description}
${r.exactQuote ? `- **Exact Quote:** "${r.exactQuote}"` : ''}
- **Suggestion:** ${r.recommendation}
`
      ),
      `## Key Clauses (${doc.keyClauses?.length || 0})`,
      ...(doc.keyClauses || []).map(
        (c, i) => `### ${i + 1}. [${c.category}] ${c.title} - ${c.riskLevel} Risk
- **Explanation:** ${c.plainExplanation}
${c.exactQuote ? `- **Exact Quote:** "${c.exactQuote}" (${c.location})` : ''}
- **Negotiation Tip:** ${c.negotiationTip}
`
      ),
      `## Deadlines (${doc.deadlines?.length || 0})`,
      ...(doc.deadlines || []).map(
        (d, i) => `${i + 1}. **Date:** ${d.resolvedDate || d.date || d.relativeRule || 'Pending date'}
   - **Action:** ${d.label} [${d.type}]
   - **Who:** ${d.responsibleParty || doc.userPartyRole}
   ${d.exactQuote ? `- **Exact Quote:** "${d.exactQuote}"` : ''}
   - **Reminder Note / Consequence:** ${d.consequenceIfMissed || d.reminderNote || 'None'}`
      ),
      '',
      `## Obligations (${doc.obligations?.length || 0})`,
      ...(doc.obligations || []).map(
        (o, i) => `${i + 1}. **Party:** ${o.belongsToUser ? 'You / User' : o.responsibleParty}
   - **Duty:** ${o.description} (${o.dueDate || 'Ongoing'})
   ${o.exactQuote ? `- **Exact Quote:** "${o.exactQuote}"` : ''}
   - **Consequence of Breach:** ${o.consequenceOfBreach || 'Standard contractual breach'}`
      ),
      '',
      `## Missing Protections (${doc.missingProtections?.length || 0})`,
      ...(doc.missingProtections || []).map(
        (m, i) => `### ${i + 1}. Missing Protection: ${m.title} [${m.severity || 'Medium'} Severity]
- **Why Needed:** ${m.whyItMatters}
- **Recommendation:** "${m.suggestedWording}"
`
      ),
      '',
      '---',
      '*BondLens provides informational analysis, not legal advice.*',
    ];

    const content = lines.filter((l) => l !== undefined && l !== '').join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    triggerDownload(blob, this.getFilename(doc, 'md'));
  },

  /**
   * Generates and downloads full analysis as JSON (.json)
   */
  exportJSON(doc: DocumentAnalysis) {
    const payload = {
      app: 'BondLens',
      exportedAt: new Date().toISOString(),
      documentName: doc.title,
      dateAnalyzed: new Date(doc.createdAt).toISOString(),
      selectedParty: doc.userPartyRole,
      riskScore: doc.overallRiskScore,
      riskLevel: doc.riskLevel,
      summary: doc.summary,
      metadata: {
        documentType: doc.documentType,
        parties: doc.metadata?.parties || [],
        effectiveDate: doc.metadata?.effectiveDate || null,
        termLength: doc.metadata?.termLength || null,
        governingLaw: doc.metadata?.governingLaw || null,
        jurisdiction: doc.metadata?.jurisdiction || null,
      },
      categoryRiskBreakdown: doc.scoreBreakdown,
      risks: (doc.risks || []).map((r) => ({
        severity: r.severity,
        title: r.title,
        category: r.category,
        exactQuote: r.exactQuote,
        plainExplanation: r.description,
        suggestion: r.recommendation,
        confidence: r.confidence,
      })),
      keyClauses: (doc.keyClauses || []).map((c) => ({
        category: c.category,
        title: c.title,
        exactQuote: c.exactQuote,
        explanation: c.plainExplanation,
        riskLevel: c.riskLevel,
        location: c.location,
        negotiationTip: c.negotiationTip,
      })),
      deadlines: (doc.deadlines || []).map((d) => ({
        date: d.resolvedDate || d.date || d.relativeRule,
        action: d.label,
        type: d.type,
        who: d.responsibleParty || doc.userPartyRole,
        exactQuote: d.exactQuote,
        reminderNote: d.consequenceIfMissed || d.reminderNote,
      })),
      obligations: (doc.obligations || []).map((o) => ({
        party: o.belongsToUser ? 'You / User' : o.responsibleParty,
        duty: o.description,
        dueDate: o.dueDate,
        exactQuote: o.exactQuote,
        consequenceOfBreach: o.consequenceOfBreach,
      })),
      missingProtections: (doc.missingProtections || []).map((m) => ({
        protection: m.title,
        severity: m.severity || 'Medium',
        whyNeeded: m.whyItMatters,
        recommendation: m.suggestedWording,
      })),
      disclaimer: 'BondLens provides informational analysis, not legal advice.',
    };

    const content = JSON.stringify(payload, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, this.getFilename(doc, 'json'));
  },

  /**
   * Generates and downloads full analysis as plain text (.txt)
   */
  exportPlainText(doc: DocumentAnalysis) {
    const lines: string[] = [
      '================================================================================',
      `BONDLENS LEGAL ANALYSIS REPORT: ${doc.title.toUpperCase()}`,
      '================================================================================',
      `Date: ${new Date(doc.createdAt).toLocaleDateString()}`,
      `Selected Party: ${doc.userPartyRole}`,
      `Risk Score & Level: ${doc.overallRiskScore}/100 (${doc.riskLevel})`,
      '',
      'PLAIN-LANGUAGE SUMMARY:',
      doc.summary,
      '',
      'DOCUMENT METADATA:',
      `Document Type: ${doc.documentType}`,
      `Parties: ${doc.metadata?.parties?.map((p: any) => `${p.name} (${p.role})`).join(', ') || 'Identified in document'}`,
      `Effective Date: ${doc.metadata?.effectiveDate || 'Not specified'}`,
      `Term: ${doc.metadata?.termLength || 'Not specified'}`,
      `Governing Law: ${doc.metadata?.governingLaw || 'Not specified'}`,
      doc.metadata?.jurisdiction ? `Jurisdiction: ${doc.metadata.jurisdiction}` : '',
      '',
      'CATEGORY RISK BREAKDOWN:',
      ...(doc.scoreBreakdown || []).map((b) => `  * ${b.category}: ${b.score}/100 - ${b.reason}`),
      '',
      '--------------------------------------------------------------------------------',
      `RISKS (${doc.risks?.length || 0}):`,
      '--------------------------------------------------------------------------------',
      ...(doc.risks || []).map(
        (r, i) => `[${i + 1}] Severity: ${r.severity} | Title: ${r.title} | Category: ${r.category}
Confidence: ${Math.round((r.confidence ?? 0.85) * 100)}%
Plain Explanation: ${r.description}
${r.exactQuote ? `Quote: "${r.exactQuote}"\n` : ''}Suggestion: ${r.recommendation}
`
      ),
      '--------------------------------------------------------------------------------',
      `KEY CLAUSES (${doc.keyClauses?.length || 0}):`,
      '--------------------------------------------------------------------------------',
      ...(doc.keyClauses || []).map(
        (c, i) => `[${i + 1}] Category: ${c.category} | Title: ${c.title} | Risk Level: ${c.riskLevel}
Explanation: ${c.plainExplanation}
${c.exactQuote ? `Quote: "${c.exactQuote}" (${c.location})\n` : ''}Negotiation Tip: ${c.negotiationTip}
`
      ),
      '--------------------------------------------------------------------------------',
      `DEADLINES (${doc.deadlines?.length || 0}):`,
      '--------------------------------------------------------------------------------',
      ...(doc.deadlines || []).map(
        (d, i) => `[${i + 1}] Date: ${d.resolvedDate || d.date || d.relativeRule || 'Pending'}
Action: ${d.label} [${d.type}] | Who: ${d.responsibleParty || doc.userPartyRole}
${d.exactQuote ? `Quote: "${d.exactQuote}"\n` : ''}Reminder Note / Consequence: ${d.consequenceIfMissed || d.reminderNote || 'None'}
`
      ),
      '--------------------------------------------------------------------------------',
      `OBLIGATIONS (${doc.obligations?.length || 0}):`,
      '--------------------------------------------------------------------------------',
      ...(doc.obligations || []).map(
        (o, i) => `[${i + 1}] Party: ${o.belongsToUser ? 'You / User' : o.responsibleParty}
Duty: ${o.description} (Due: ${o.dueDate || 'Ongoing'})
${o.exactQuote ? `Quote: "${o.exactQuote}"\n` : ''}Consequence of Breach: ${o.consequenceOfBreach || 'Standard contractual breach'}
`
      ),
      '--------------------------------------------------------------------------------',
      `MISSING PROTECTIONS (${doc.missingProtections?.length || 0}):`,
      '--------------------------------------------------------------------------------',
      ...(doc.missingProtections || []).map(
        (m, i) => `[${i + 1}] Protection: ${m.title} [${m.severity || 'Medium'} Severity]
Why Needed: ${m.whyItMatters}
Recommendation: "${m.suggestedWording}"
`
      ),
      '================================================================================',
      'DISCLAIMER: BondLens provides informational analysis, not legal advice.',
      '================================================================================',
    ];

    const content = lines.filter((l) => l !== '').join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, this.getFilename(doc, 'txt'));
  },

  /**
   * Generates a customizable negotiation counter-proposal email
   */
  generateCounterProposalEmail(doc: DocumentAnalysis, highRisks: RiskFinding[]): string {
    const riskItems = highRisks
      .slice(0, 4)
      .map(
        (r, i) =>
          `${i + 1}. ${r.title} (${r.category}):\n   - Current wording: "${(r.exactQuote || '').slice(0, 140)}..."\n   - Our proposal: ${r.recommendation}`
      )
      .join('\n\n');

    return `Subject: Comments and Proposed Amendments: ${doc.title}

Dear Signatory Team,

Thank you for providing the draft of ${doc.title}. We have completed our preliminary contractual review from the perspective of ${doc.userPartyRole}. 

Overall, we are excited about advancing our partnership. However, there are a few provisions where we would like to align on more standard, reciprocal terms prior to execution:

${riskItems}

Could you please confirm if these adjustments work for your team, or let us know a convenient time this week for a brief call to finalize the redlines?

Best regards,
${doc.userPartyRole} Legal & Commercial Team`;
  },
};
