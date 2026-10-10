export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type RiskCategory =
  | 'Liability'
  | 'Payment'
  | 'Termination'
  | 'IP'
  | 'Compliance'
  | 'Confidentiality'
  | 'Other';

export type PartyRole =
  | 'Client'
  | 'Vendor'
  | 'Employer'
  | 'Employee'
  | 'Landlord'
  | 'Tenant'
  | 'Disclosing party'
  | 'Receiving party'
  | 'Customer'
  | 'Licensor'
  | 'Licensee'
  | 'General Party';

export type DeadlineType =
  | 'Payment'
  | 'Renewal'
  | 'TerminationNotice'
  | 'Deliverable'
  | 'Audit'
  | 'Expiration'
  | 'Other';

export type DeadlineStatus = 'Pending' | 'Completed' | 'Snoozed';

export type ObligationStatus = 'Pending' | 'In Progress' | 'Fulfilled' | 'Waived';

export interface DocumentParty {
  name: string;
  role: string;
}

export interface DocumentMetadata {
  documentType: string;
  parties: DocumentParty[];
  effectiveDate?: string;
  termLength?: string;
  governingLaw?: string;
  jurisdiction?: string;
  language?: string;
}

export interface CategoryScoreBreakdown {
  category: RiskCategory;
  score: number; // 0 to 100
  reason: string;
}

export interface KeyClause {
  id: string;
  title: string;
  category: RiskCategory;
  exactQuote: string;
  location: string;
  plainExplanation: string;
  whyItMatters: string;
  riskLevel: RiskSeverity;
  negotiationTip: string;
  confidence: number; // 0 to 1
  isQuoteVerified?: boolean;
  userNotes?: string;
  isReviewed?: boolean;
}

export interface RiskFinding {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  category: RiskCategory;
  relatedClauseId?: string | null;
  exactQuote: string;
  recommendation: string;
  ambiguityFlag?: boolean;
  status?: 'Open' | 'Mitigated' | 'Accepted';
  isQuoteVerified?: boolean;
  confidence?: number;
}

export interface MissingProtection {
  id: string;
  title: string;
  severity?: RiskSeverity;
  whyItMatters: string;
  suggestedWording: string;
}

export interface DeadlineItem {
  id: string;
  label: string;
  type: DeadlineType;
  date?: string; // YYYY-MM-DD
  relativeRule?: string;
  resolvedDate?: string | null; // YYYY-MM-DD
  noticeRequiredDays?: number;
  consequenceIfMissed?: string;
  responsibleParty?: string;
  reminderNote?: string;
  relatedClauseId?: string | null;
  exactQuote: string;
  status: DeadlineStatus;
  snoozedUntil?: string;
  isQuoteVerified?: boolean;
}

export interface ObligationItem {
  id: string;
  responsibleParty: string;
  belongsToUser: boolean;
  description: string;
  dueDate?: string;
  consequenceOfBreach?: string;
  status: ObligationStatus;
  relatedClauseId?: string | null;
  exactQuote: string;
  isQuoteVerified?: boolean;
}

export interface AssistantCitation {
  quote: string;
  location?: string;
  isVerified?: boolean;
}

export interface DocumentNote {
  id: string;
  text: string;
  createdAt: number;
  source?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: 'ask' | 'decide';
  bottomLine?: string;
  points?: string[];
  whatToNegotiate?: string[];
  consequencesIfAccepted?: string[];
  questionsToAsk?: string[];
  citations?: AssistantCitation[];
  notFoundInDocument?: boolean;
  followUps?: string[];
  feedback?: 'up' | 'down' | null;
  isDetailExpanded?: boolean;
}

export interface DocumentAnalysis {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  userPartyRole: PartyRole;
  documentType: string;
  rawText: string;
  summary: string;
  overallRiskScore: number; // 0 to 100
  riskLevel: RiskSeverity;
  metadata: DocumentMetadata;
  scoreBreakdown: CategoryScoreBreakdown[];
  keyClauses: KeyClause[];
  risks: RiskFinding[];
  missingProtections: MissingProtection[];
  deadlines: DeadlineItem[];
  obligations: ObligationItem[];
  chatHistory?: ChatMessage[];
  reportNotes?: DocumentNote[];
}
