import { z } from 'zod';

const RiskSeveritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

const RiskCategorySchema = z.enum([
  'Liability',
  'Payment',
  'Termination',
  'IP',
  'Compliance',
  'Confidentiality',
  'Other',
]);

const PartySchema = z.object({
  name: z.string().default('Party'),
  role: z.string().default('Signatory'),
});

export const DocumentMetadataSchema = z.object({
  documentType: z.string().default('Commercial Contract'),
  parties: z.array(PartySchema).default([]),
  effectiveDate: z.string().optional(),
  termLength: z.string().optional(),
  governingLaw: z.string().optional(),
  jurisdiction: z.string().optional(),
  language: z.string().optional().default('English'),
});

export const CategoryScoreSchema = z.object({
  category: RiskCategorySchema.catch('Other'),
  score: z.number().min(0).max(100).default(50),
  reason: z.string().default('Standard industry risk assessment'),
});

export const KeyClauseSchema = z.object({
  id: z.string().default(() => 'clause-' + Math.random().toString(36).substring(2, 9)),
  title: z.string(),
  category: RiskCategorySchema.catch('Other'),
  exactQuote: z.string().default(''),
  location: z.string().default('General Terms'),
  plainExplanation: z.string(),
  whyItMatters: z.string(),
  riskLevel: RiskSeveritySchema.catch('Medium'),
  negotiationTip: z.string().default('Request standard reciprocal terms.'),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const RiskFindingSchema = z.object({
  id: z.string().default(() => 'risk-' + Math.random().toString(36).substring(2, 9)),
  title: z.string(),
  description: z.string(),
  severity: RiskSeveritySchema.catch('Medium'),
  category: RiskCategorySchema.catch('Other'),
  relatedClauseId: z.string().nullable().optional(),
  exactQuote: z.string().default(''),
  recommendation: z.string().default('Propose bilateral caps and balanced cure periods.'),
  ambiguityFlag: z.boolean().default(false),
});

export const MissingProtectionSchema = z.object({
  id: z.string().default(() => 'missing-' + Math.random().toString(36).substring(2, 9)),
  title: z.string(),
  severity: RiskSeveritySchema.catch('Medium').optional(),
  whyItMatters: z.string(),
  suggestedWording: z.string(),
});

export const DeadlineSchema = z.object({
  id: z.string().default(() => 'deadline-' + Math.random().toString(36).substring(2, 9)),
  label: z.string(),
  type: z.enum(['Payment', 'Renewal', 'TerminationNotice', 'Deliverable', 'Audit', 'Expiration', 'Other']).catch('Other'),
  date: z.string().optional(),
  relativeRule: z.string().optional(),
  resolvedDate: z.string().nullable().optional(),
  noticeRequiredDays: z.number().optional().default(0),
  consequenceIfMissed: z.string().optional().default('Loss of legal remedy or automatic extension.'),
  responsibleParty: z.string().optional(),
  reminderNote: z.string().optional(),
  relatedClauseId: z.string().nullable().optional(),
  exactQuote: z.string().default(''),
  status: z.enum(['Pending', 'Completed', 'Snoozed']).catch('Pending'),
});

export const ObligationSchema = z.object({
  id: z.string().default(() => 'ob-' + Math.random().toString(36).substring(2, 9)),
  responsibleParty: z.string().default('Party'),
  belongsToUser: z.boolean().default(false),
  description: z.string(),
  dueDate: z.string().optional().default('As agreed'),
  consequenceOfBreach: z.string().optional().default('Contractual breach remedies apply.'),
  status: z.enum(['Pending', 'In Progress', 'Fulfilled', 'Waived']).catch('Pending'),
  relatedClauseId: z.string().nullable().optional(),
  exactQuote: z.string().default(''),
});

export const EngineAnalysisOutputSchema = z.object({
  metadata: DocumentMetadataSchema.default(() => ({
    documentType: 'General Contract',
    parties: [],
    language: 'English',
  })),
  summary: z.string().default('Document analysis completed.'),
  overallRiskScore: z.number().min(0).max(100).default(50),
  riskLevel: RiskSeveritySchema.catch('Medium'),
  scoreBreakdown: z.array(CategoryScoreSchema).default([]),
  keyClauses: z.array(KeyClauseSchema).default([]),
  risks: z.array(RiskFindingSchema).default([]),
  missingProtections: z.array(MissingProtectionSchema).default([]),
  deadlines: z.array(DeadlineSchema).default([]),
  obligations: z.array(ObligationSchema).default([]),
});

export const AssistantCitationSchema = z.object({
  quote: z.string().default(''),
  location: z.string().optional().default(''),
});

export const AssistantResponseSchema = z.object({
  answer: z.string().default(''),
  bottomLine: z.string().optional(),
  points: z.array(z.string()).optional().default([]),
  whatToNegotiate: z.array(z.string()).optional().default([]),
  consequencesIfAccepted: z.array(z.string()).optional().default([]),
  questionsToAsk: z.array(z.string()).optional().default([]),
  citations: z.array(AssistantCitationSchema).optional().default([]),
  notFoundInDocument: z.boolean().default(false),
  followUps: z.array(z.string()).optional().default([]),
});

export type AssistantResponseOutput = z.infer<typeof AssistantResponseSchema>;
