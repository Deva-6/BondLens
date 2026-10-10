import React from 'react';
import { BondLensAssistant, BondLensAssistantProps } from './BondLensAssistant';
import { DocumentAnalysis, PartyRole, ChatMessage } from '../types/analysis';

export { BondLensAssistant };

export interface GroundedAssistantProps {
  documentId: string;
  documentTitle: string;
  documentText: string;
  partyRole: PartyRole;
  initialHistory?: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
  onJumpToClause?: (quote: string, location?: string) => void;
  onDraftEmail?: (negotiationPoints: string[], documentTitle: string) => void;
  onAddNote?: (noteText: string) => void;
  document?: DocumentAnalysis;
}

export const GroundedAssistant: React.FC<GroundedAssistantProps> = (props) => {
  const fullDoc: DocumentAnalysis = props.document || {
    id: props.documentId,
    title: props.documentTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userPartyRole: props.partyRole,
    documentType: 'Agreement',
    rawText: props.documentText,
    summary: '',
    overallRiskScore: 50,
    riskLevel: 'Medium',
    metadata: {
      documentType: 'Agreement',
      parties: [],
    },
    scoreBreakdown: [],
    keyClauses: [],
    risks: [],
    missingProtections: [],
    deadlines: [],
    obligations: [],
    chatHistory: props.initialHistory || [],
  };

  return (
    <BondLensAssistant
      document={fullDoc}
      isOpen={props.isOpen}
      onToggle={props.onToggle}
      onJumpToClause={props.onJumpToClause}
      onDraftEmail={props.onDraftEmail}
      onAddNote={props.onAddNote}
    />
  );
};
