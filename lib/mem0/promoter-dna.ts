/**
 * promoter-dna.ts
 * mem0 integration for Promoter DNA — persistent cross-application memory.
 *
 * Stores and retrieves promoter history keyed by DIN (Director Identification Number).
 * When a promoter appears in a new application, prior decisions, fraud signals,
 * and risk patterns are surfaced automatically.
 */

import MemoryClient from 'mem0ai';

// ─── Singleton client ───────────────────────────────────────────────────────────
let _client: InstanceType<typeof MemoryClient> | null = null;

function getClient(): InstanceType<typeof MemoryClient> | null {
  const key = process.env.MEM0_API_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new MemoryClient({ apiKey: key });
  }
  return _client;
}

export function isMem0Available(): boolean {
  return !!process.env.MEM0_API_KEY;
}

// ─── Types ──────────────────────────────────────────────────────────────────────
export interface PromoterProfile {
  din: string;
  companyName: string;
  applicationId: string;
  decision: string;
  fiveCsSummary: {
    character: { score: number; rating: string };
    capacity: { score: number; rating: string };
    capital: { score: number; rating: string };
    collateral: { score: number; rating: string };
    conditions: { score: number; rating: string };
  };
  fraudSignals: string[];
  qualitativeNotes: string[];
  recommendedAmount?: string;
  cmrRank?: number;
  date: string;
}

export interface PromoterMemory {
  id: string;
  memory: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// ─── Store promoter data after CAM generation ───────────────────────────────────
export async function storePromoterDNA(profile: PromoterProfile): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.log('[mem0] Skipping store — MEM0_API_KEY not configured');
    return false;
  }

  const content = buildMemoryContent(profile);

  try {
    await client.add(
      [{ role: 'user', content }],
      {
        user_id: `promoter_${profile.din}`,
        metadata: {
          application_id: profile.applicationId,
          company_name: profile.companyName,
          decision: profile.decision,
          din: profile.din,
          date: profile.date,
        },
      },
    );
    console.log(`[mem0] Stored promoter DNA for DIN ${profile.din} (app: ${profile.applicationId})`);
    return true;
  } catch (err) {
    console.error('[mem0] Failed to store promoter DNA:', err);
    return false;
  }
}

// ─── Retrieve promoter history for a new application ────────────────────────────
export async function searchPromoterHistory(din: string): Promise<PromoterMemory[]> {
  const client = getClient();
  if (!client) {
    console.log('[mem0] Skipping search — MEM0_API_KEY not configured');
    return [];
  }

  try {
    const results = await client.search(
      'Prior credit applications, decisions, risk signals, and fraud history',
      { user_id: `promoter_${din}` },
    );
    return (Array.isArray(results) ? results : []) as PromoterMemory[];
  } catch (err) {
    console.error('[mem0] Failed to search promoter history:', err);
    return [];
  }
}

// ─── Get all memories for a promoter ────────────────────────────────────────────
export async function getAllPromoterMemories(din: string): Promise<PromoterMemory[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const results = await client.getAll({ user_id: `promoter_${din}` });
    return (Array.isArray(results) ? results : []) as PromoterMemory[];
  } catch (err) {
    console.error('[mem0] Failed to get promoter memories:', err);
    return [];
  }
}

// ─── Build human-readable memory content for storage ────────────────────────────
function buildMemoryContent(profile: PromoterProfile): string {
  const { fiveCsSummary: fc } = profile;
  const lines = [
    `Credit application for ${profile.companyName} (Application ID: ${profile.applicationId}) on ${profile.date}.`,
    `Decision: ${profile.decision}.`,
    `Five Cs Assessment:`,
    `  Character: ${fc.character.score}/100 (${fc.character.rating})`,
    `  Capacity: ${fc.capacity.score}/100 (${fc.capacity.rating})`,
    `  Capital: ${fc.capital.score}/100 (${fc.capital.rating})`,
    `  Collateral: ${fc.collateral.score}/100 (${fc.collateral.rating})`,
    `  Conditions: ${fc.conditions.score}/100 (${fc.conditions.rating})`,
  ];

  if (profile.recommendedAmount) {
    lines.push(`Recommended Amount: ${profile.recommendedAmount}`);
  }
  if (profile.cmrRank) {
    lines.push(`CIBIL CMR Rank: ${profile.cmrRank}`);
  }
  if (profile.fraudSignals.length > 0) {
    lines.push(`Fraud Signals Detected: ${profile.fraudSignals.join('; ')}`);
  }
  if (profile.qualitativeNotes.length > 0) {
    lines.push(`Credit Officer Observations: ${profile.qualitativeNotes.join('; ')}`);
  }

  return lines.join('\n');
}
