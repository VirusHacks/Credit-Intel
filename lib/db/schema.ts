import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'analyst', 'viewer']);
export const applicationStatusEnum = pgEnum('application_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high']);
export const analysisStepEnum = pgEnum('analysis_step', ['document_verification', 'financial_analysis', 'risk_assessment', 'credit_scoring', 'report_generation']);
export const documentTypeEnum = pgEnum('document_type', ['financial_statement', 'tax_return', 'bank_statement', 'business_license', 'id_document', 'other', 'gst_return', 'itr', 'cibil_report', 'annual_report', 'sanction_letter']);

// New enums for AI pipeline
export const pipelineStatusEnum = pgEnum('pipeline_status', ['not_started', 'ingesting', 'analyzing', 'awaiting_qualitative', 'reconciling', 'generating_cam', 'complete', 'failed']);
export const agentNameEnum = pgEnum('agent_name', ['bank_statement', 'gst_analyzer', 'itr_balancesheet', 'cibil_cmr', 'scout', 'reconciler', 'cam_generator']);
export const qualitativeCategoryEnum = pgEnum('qualitative_category', ['factory_operations', 'management_quality', 'collateral_inspection', 'customer_relationships', 'industry_context']);
export const fiveCDimensionEnum = pgEnum('five_c_dimension', ['character', 'capacity', 'capital', 'collateral', 'conditions']);
export const camDecisionEnum = pgEnum('cam_decision', ['APPROVE', 'CONDITIONAL_APPROVE', 'REJECT']);
export const researchTypeEnum = pgEnum('research_type', ['ecourts', 'mca_din', 'rbi_circular', 'credit_ratings', 'news_fraud', 'shareholding', 'apify_enrichment']);
export const extractionStageEnum = pgEnum('extraction_stage', ['pdf_detection', 'ocr', 'llama_parse', 'gemini_native', 'agent_bank', 'agent_gst', 'agent_itr', 'agent_cibil', 'agent_scout', 'qualitative_gate', 'reconciler', 'cam_generation']);
export const stageStatusEnum = pgEnum('stage_status', ['pending', 'processing', 'done', 'failed']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').default('viewer').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Companies Table
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }).unique(),
  registrationType: varchar('registration_type', { length: 100 }),
  foundedYear: integer('founded_year'),
  location: varchar('location', { length: 255 }),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Applications Table
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  status: applicationStatusEnum('status').default('draft').notNull(),
  industry: varchar('industry', { length: 100 }),
  subIndustry: varchar('sub_industry', { length: 100 }),
  numberOfEmployees: integer('number_of_employees'),
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  businessStage: varchar('business_stage', { length: 100 }),
  yearlyGrowth: decimal('yearly_growth', { precision: 5, scale: 2 }),
  mainProducts: text('main_products').array(),
  keyCustomers: text('key_customers'),
  creditScoreRequested: decimal('credit_score_requested', { precision: 5, scale: 2 }),
  creditScoreProvided: decimal('credit_score_provided', { precision: 5, scale: 2 }),
  analysisProgress: integer('analysis_progress').default(0),
  // India-specific fields
  cin: varchar('cin', { length: 21 }),          // Company Identification Number (MCA)
  gstin: varchar('gstin', { length: 15 }),       // GST Identification Number
  pan: varchar('pan', { length: 10 }),           // PAN of company
  promoterDin: varchar('promoter_din', { length: 8 }), // Director Identification Number
  requestedAmountInr: decimal('requested_amount_inr', { precision: 15, scale: 2 }), // in INR
  cmrRank: integer('cmr_rank'),                  // CIBIL CMR: 1 (best) to 10 (worst)
  pipelineStatus: pipelineStatusEnum('pipeline_status').default('not_started'),
  qualitativeGateDone: boolean('qualitative_gate_done').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Financial Data Table
export const financials = pgTable('financials', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  totalAssets: decimal('total_assets', { precision: 15, scale: 2 }),
  totalLiabilities: decimal('total_liabilities', { precision: 15, scale: 2 }),
  equity: decimal('equity', { precision: 15, scale: 2 }),
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  netIncome: decimal('net_income', { precision: 15, scale: 2 }),
  operatingCashFlow: decimal('operating_cash_flow', { precision: 15, scale: 2 }),
  debtToEquityRatio: decimal('debt_to_equity_ratio', { precision: 8, scale: 2 }),
  currentRatio: decimal('current_ratio', { precision: 8, scale: 2 }),
  profitMargin: decimal('profit_margin', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Documents Table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  documentType: documentTypeEnum('document_type').notNull(),
  fileSize: integer('file_size'),
  s3Path: varchar('s3_path', { length: 500 }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Risk Assessment Table
export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  industryRisk: riskLevelEnum('industry_risk'),
  financialRisk: riskLevelEnum('financial_risk'),
  managementRisk: riskLevelEnum('management_risk'),
  marketRisk: riskLevelEnum('market_risk'),
  operationalRisk: riskLevelEnum('operational_risk'),
  overallRisk: riskLevelEnum('overall_risk'),
  creditScore: integer('credit_score'),
  recommendation: varchar('recommendation', { length: 50 }),
  rationale: text('rationale'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Extractions Table
export const aiExtractions = pgTable('ai_extractions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  extractedData: jsonb('extracted_data').notNull(),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  manuallyReviewed: boolean('manually_reviewed').default(false),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agent Activities Table
export const agentActivities = pgTable('agent_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  step: analysisStepEnum('step'),
  details: jsonb('details'),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  decision: text('decision'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit Log Table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  relatedEntityId: uuid('related_entity_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// NEW TABLES FOR AI PIPELINE
// ─────────────────────────────────────────────────────────────

// Agent Signals Table — per-agent extracted data + confidence
export const agentSignals = pgTable('agent_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  agentName: agentNameEnum('agent_name').notNull(),
  signalKey: varchar('signal_key', { length: 100 }).notNull(),   // e.g. "gst_revenue_monthly"
  signalValue: text('signal_value'),                              // JSON string or scalar
  confidence: decimal('confidence', { precision: 4, scale: 3 }), // 0.000 – 1.000
  rawSnippet: text('raw_snippet'),                               // OCR/scraped text that produced the value
  isUnverified: boolean('is_unverified').default(false),         // true when confidence < 0.75
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Qualitative Notes Table — Credit Officer field observations
export const qualitativeNotes = pgTable('qualitative_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  category: qualitativeCategoryEnum('category').notNull(),
  fiveCDimension: fiveCDimensionEnum('five_c_dimension').notNull(),
  noteText: text('note_text').notNull(),
  scoreDelta: integer('score_delta'),  // positive or negative impact on 5C score
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// CAM Outputs Table — Final Credit Appraisal Memo per application
export const camOutputs = pgTable('cam_outputs', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  // 5C scores
  characterScore: integer('character_score'),   // 0-100
  capacityScore: integer('capacity_score'),
  capitalScore: integer('capital_score'),
  collateralScore: integer('collateral_score'),
  conditionsScore: integer('conditions_score'),
  // 5C ratings: Strong / Adequate / Weak / Red Flag
  characterRating: varchar('character_rating', { length: 20 }),
  capacityRating: varchar('capacity_rating', { length: 20 }),
  capitalRating: varchar('capital_rating', { length: 20 }),
  collateralRating: varchar('collateral_rating', { length: 20 }),
  conditionsRating: varchar('conditions_rating', { length: 20 }),
  // 5C explanations (full text with citations)
  characterExplanation: text('character_explanation'),
  capacityExplanation: text('capacity_explanation'),
  capitalExplanation: text('capital_explanation'),
  collateralExplanation: text('collateral_explanation'),
  conditionsExplanation: text('conditions_explanation'),
  // Decision
  decision: camDecisionEnum('decision').notNull(),
  recommendedAmountInr: decimal('recommended_amount_inr', { precision: 15, scale: 2 }),
  recommendedRatePercent: decimal('recommended_rate_percent', { precision: 5, scale: 2 }),
  reductionRationale: text('reduction_rationale'),
  conditions: jsonb('conditions'),   // string[] of loan conditions
  // AI Reasoning
  thinkingTrace: text('thinking_trace'),  // DeepSeek-R1 <think> chain
  // PDF
  pdfBlobUrl: varchar('pdf_blob_url', { length: 500 }),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

// Research Findings Table — Scout Agent results
export const researchFindings = pgTable('research_findings', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  searchType: researchTypeEnum('search_type').notNull(),
  query: text('query'),
  sourceUrl: varchar('source_url', { length: 500 }),
  snippet: text('snippet').notNull(),
  relevanceScore: decimal('relevance_score', { precision: 4, scale: 3 }),  // 0.000 – 1.000
  isFraudSignal: boolean('is_fraud_signal').default(false),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
});

// Extraction States Table — Pipeline resume state (mirrors Redis)
export const extractionStates = pgTable('extraction_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  stage: extractionStageEnum('stage').notNull(),
  status: stageStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),  // stage-specific info (e.g., page count, model used)
});

// ─────────────────────────────────────────────────────────────

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  company: one(companies, { fields: [applications.companyId], references: [companies.id] }),
  creator: one(users, { fields: [applications.createdBy], references: [users.id] }),
  documents: many(documents),
  financials: many(financials),
  assessments: many(assessments),
  agentActivities: many(agentActivities),
  agentSignals: many(agentSignals),
  qualitativeNotes: many(qualitativeNotes),
  camOutputs: many(camOutputs),
  researchFindings: many(researchFindings),
  extractionStates: many(extractionStates),
}));

export const agentSignalsRelations = relations(agentSignals, ({ one }) => ({
  application: one(applications, { fields: [agentSignals.applicationId], references: [applications.id] }),
}));

export const qualitativeNotesRelations = relations(qualitativeNotes, ({ one }) => ({
  application: one(applications, { fields: [qualitativeNotes.applicationId], references: [applications.id] }),
  creator: one(users, { fields: [qualitativeNotes.createdBy], references: [users.id] }),
}));

export const camOutputsRelations = relations(camOutputs, ({ one }) => ({
  application: one(applications, { fields: [camOutputs.applicationId], references: [applications.id] }),
}));

export const researchFindingsRelations = relations(researchFindings, ({ one }) => ({
  application: one(applications, { fields: [researchFindings.applicationId], references: [applications.id] }),
}));

export const extractionStatesRelations = relations(extractionStates, ({ one }) => ({
  application: one(applications, { fields: [extractionStates.applicationId], references: [applications.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  application: one(applications, { fields: [documents.applicationId], references: [applications.id] }),
  extractions: many(aiExtractions),
}));

export const financialsRelations = relations(financials, ({ one }) => ({
  application: one(applications, { fields: [financials.applicationId], references: [applications.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  application: one(applications, { fields: [assessments.applicationId], references: [applications.id] }),
}));

export const aiExtractionsRelations = relations(aiExtractions, ({ one }) => ({
  document: one(documents, { fields: [aiExtractions.documentId], references: [documents.id] }),
  reviewer: one(users, { fields: [aiExtractions.reviewedBy], references: [users.id] }),
}));

export const agentActivitiesRelations = relations(agentActivities, ({ one }) => ({
  application: one(applications, { fields: [agentActivities.applicationId], references: [applications.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
