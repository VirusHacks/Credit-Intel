export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AnalysisStep = 'document_verification' | 'financial_analysis' | 'risk_assessment' | 'credit_scoring' | 'report_generation';

// ─── AI Pipeline Types ───────────────────────────────────────────────────────

export type PipelineStatus =
  | 'not_started' | 'ingesting' | 'analyzing' | 'awaiting_qualitative'
  | 'reconciling' | 'generating_cam' | 'complete' | 'failed';

export type AgentName =
  | 'bank_statement' | 'gst_analyzer' | 'itr_balancesheet'
  | 'cibil_cmr' | 'scout' | 'reconciler' | 'cam_generator';

export type QualitativeCategory =
  | 'factory_operations' | 'management_quality' | 'collateral_inspection'
  | 'customer_relationships' | 'industry_context';

export type FiveCDimension = 'character' | 'capacity' | 'capital' | 'collateral' | 'conditions';

export type FiveCRating = 'Strong' | 'Adequate' | 'Weak' | 'Red Flag';

export type CAMDecision = 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT';

export type ResearchType =
  | 'ecourts' | 'mca_din' | 'rbi_circular' | 'credit_ratings'
  | 'news_fraud' | 'shareholding' | 'apify_enrichment';

export type StageStatus = 'pending' | 'processing' | 'done' | 'failed';

export type PDFDocumentType =
  | 'bank_statement' | 'gst_return' | 'itr' | 'annual_report'
  | 'cibil_report' | 'sanction_letter' | 'balance_sheet';

// ─── Agent Signal (single extracted data point) ─────────────────────────────
export interface AgentSignal {
  applicationId: string;
  agentName: AgentName;
  signalKey: string;
  signalValue: string;          // JSON-serialized for arrays/objects, raw for scalars
  confidence: number;           // 0.0 – 1.0
  rawSnippet?: string;          // OCR/scraped text that produced the value
  isUnverified: boolean;        // confidence < 0.75
}

// ─── Qualitative Note ────────────────────────────────────────────────────────
export interface QualitativeNote {
  id?: string;
  applicationId: string;
  category: QualitativeCategory;
  fiveCDimension: FiveCDimension;
  noteText: string;
  scoreDelta?: number;          // positive or negative impact on 5C score
  createdBy: string;
}

// ─── 5Cs Score per dimension ─────────────────────────────────────────────────
export interface FiveCScore {
  score: number;                // 0 – 100
  rating: FiveCRating;
  explanation: string;          // with source citations inline
}

export interface FiveCsScores {
  character: FiveCScore;
  capacity: FiveCScore;
  capital: FiveCScore;
  collateral: FiveCScore;
  conditions: FiveCScore;
}

// ─── Loan Recommendation ─────────────────────────────────────────────────────
export interface LoanRecommendation {
  decision: CAMDecision;
  recommendedAmountInr: string;        // e.g. "₹5Cr"
  recommendedRatePercent: string;      // e.g. "13.5%"
  originalAsk: string;
  reductionRationale?: string;
  conditions: string[];
}

// ─── Discrepancy Check ───────────────────────────────────────────────────────
export type DiscrepancyVerdict = 'PASS' | 'FLAG' | 'RED_FLAG';

export interface DiscrepancyResult {
  checkName: string;
  threshold: string;
  actualValue: string;
  verdict: DiscrepancyVerdict;
  confidence: number;
}

// ─── Research Finding ────────────────────────────────────────────────────────
export interface ResearchFinding {
  applicationId: string;
  searchType: ResearchType;
  query?: string;
  sourceUrl?: string;
  snippet: string;
  relevanceScore?: number;
  isFraudSignal: boolean;
}

// ─── CAM Output ──────────────────────────────────────────────────────────────
export interface CAMOutput {
  applicationId: string;
  fiveCsScores: FiveCsScores;
  decision: CAMDecision;
  recommendedAmountInr?: number;
  recommendedRatePercent?: number;
  reductionRationale?: string;
  conditions?: string[];
  thinkingTrace?: string;       // DeepSeek-R1 <think> chain
  pdfBlobUrl?: string;
  generatedAt: Date;
}

// ─── Pipeline State (SSE events) ─────────────────────────────────────────────
export interface PipelineEvent {
  appId: string;
  stage: string;
  status: StageStatus;
  progress?: number;            // 0 – 100
  confidence?: number;
  message?: string;
  thinkTokens?: string;         // streaming think tokens from reconciler
}

// ─── Extraction State ─────────────────────────────────────────────────────────
export interface ExtractionState {
  applicationId: string;
  stage: string;
  status: StageStatus;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ─── India-specific application fields (extends CreditApplication) ────────────
export interface IndiaApplicationFields {
  cin?: string;           // Company Identification Number (CIN) — from MCA
  gstin?: string;         // GST Identification Number
  pan?: string;           // PAN of the company
  promoterDin?: string;   // Director Identification Number
  requestedAmountInr?: number;
  cmrRank?: number;       // CIBIL CMR 1 (best) – 10 (worst), NOT 300-900
  pipelineStatus?: PipelineStatus;
  qualitativeGateDone?: boolean;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  registrationType: string;
  foundedYear: number;
  location: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  email: string;
  website?: string;
}

export interface BusinessDetails {
  industry: string;
  subIndustry: string;
  numberOfEmployees: number;
  annualRevenue: number;
  businessStage: string;
  yearlyGrowth: number;
  mainProducts: string[];
  keyCustomers: string;
}

export interface FinancialMetrics {
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  annualRevenue: number;
  netIncome: number;
  operatingCashFlow: number;
  debtToEquityRatio: number;
  currentRatio: number;
  profitMargin: number;
}

export interface RiskFactors {
  industryRisk: RiskLevel;
  financialRisk: RiskLevel;
  managementRisk: RiskLevel;
  marketRisk: RiskLevel;
  operationalRisk: RiskLevel;
}

export interface CreditAssessment {
  creditScore: number;
  riskRating: RiskLevel;
  riskFactors: RiskFactors;
  recommendation: string;
  debtCapacity: number;
  approvalProbability: number;
}

export interface AnalysisStatus {
  step: AnalysisStep;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

export interface CreditApplication {
  id: string;
  company: Company;
  businessDetails: BusinessDetails;
  documents: Document[];
  bankingInformation: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    yearsWithBank: number;
  };
  financialMetrics: FinancialMetrics;
  creditAssessment: CreditAssessment;
  analysisStatus: AnalysisStatus[];
  requestedAmount: number;
  createdAt: Date;
  submittedAt?: Date;
  updatedAt: Date;
  status: ApplicationStatus;
  notes: string;
}

export interface CreditMemo {
  applicationId: string;
  executive_summary: string;
  company_overview: string;
  financial_analysis: string;
  risk_assessment: string;
  credit_recommendation: string;
  conclusion: string;
  generatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'manager' | 'viewer';
  avatar?: string;
  joinedAt: Date;
}
