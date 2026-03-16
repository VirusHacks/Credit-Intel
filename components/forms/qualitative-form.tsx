'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Factory, Users, Building2, Handshake, BarChart3,
  ChevronDown, ChevronUp, CheckCircle2, Loader2, Wand2,
} from 'lucide-react';

// ─── Schema ──────────────────────────────────────────────────────────────────

const NoteSchema = z.object({
  category: z.enum([
    'factory_operations', 'management_quality', 'collateral_inspection',
    'customer_relationships', 'industry_context',
  ]),
  fiveCDimension: z.enum(['character', 'capacity', 'capital', 'collateral', 'conditions']),
  noteText: z.string().min(10, 'Note must be at least 10 characters'),
  scoreDelta: z.number().int().min(-20).max(20).optional(),
});

const FormSchema = z.object({
  notes: z.array(NoteSchema).min(1),
});

type FormValues = z.infer<typeof FormSchema>;

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryConfig {
  key: FormValues['notes'][number]['category'];
  label: string;
  fiveCDimension: FormValues['notes'][number]['fiveCDimension'];
  description: string;
  placeholder: string;
  icon: React.ReactNode;
  dimensionColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'factory_operations',
    label: 'Factory / Operations',
    fiveCDimension: 'capacity',
    description: 'Physical infrastructure, machinery condition, production capacity, workforce',
    placeholder: 'e.g. Factory in Surat SEZ, 120-loom setup, 85% capacity utilisation. Two new Picanol looms installed in 2024. Workforce of 140, mostly skilled. No labour disputes observed...',
    icon: <Factory className="h-4 w-4" />,
    dimensionColor: 'bg-white/10 text-white/80 border border-white/20',
  },
  {
    key: 'management_quality',
    label: 'Management Quality',
    fiveCDimension: 'character',
    description: 'Promoter background, experience, integrity, succession planning',
    placeholder: 'e.g. Promoter Mr. Rajesh Sharma has 22 years in textile industry. MBA from Nirma University. Honest demeanor, no evasive answers. Second-gen family business, son being groomed...',
    icon: <Users className="h-4 w-4" />,
    dimensionColor: 'bg-white/10 text-white/80 border border-white/20',
  },
  {
    key: 'collateral_inspection',
    label: 'Collateral Inspection',
    fiveCDimension: 'collateral',
    description: 'Property value, encumbrances, marketability, inspection findings',
    placeholder: 'e.g. Residential plot in Vesu, Surat — current market value ~Rs.1.8Cr. CERSAI search clean. No third-party encumbrances. Title deeds verified with sub-registrar...',
    icon: <Building2 className="h-4 w-4" />,
    dimensionColor: 'bg-white/10 text-white/80 border border-white/20',
  },
  {
    key: 'customer_relationships',
    label: 'Customer Relationships',
    fiveCDimension: 'capacity',
    description: 'Key customers, concentration risk, payment track record, repeat business',
    placeholder: 'e.g. Top 3 customers — Aditya Birla Fashion, Reliance Retail, and a Dubai exporter — contribute 42% of revenue. Payment track record clean, 30-45 day DSO...',
    icon: <Handshake className="h-4 w-4" />,
    dimensionColor: 'bg-white/10 text-white/80 border border-white/20',
  },
  {
    key: 'industry_context',
    label: 'Industry Context',
    fiveCDimension: 'conditions',
    description: 'Sector outlook, regulatory environment, competition, macro tailwinds/headwinds',
    placeholder: 'e.g. Technical textiles seeing strong demand post PLI scheme. Cotton prices stabilising. Chinese competition reduced due to import duties. GST on textiles normalised...',
    icon: <BarChart3 className="h-4 w-4" />,
    dimensionColor: 'bg-white/10 text-white/80 border border-white/20',
  },
];

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_DATA: Array<{ noteText: string; scoreDelta: number }> = [
  {
    noteText:
      'Factory located in Bhiwadi Industrial Area, Rajasthan. 3 production lines with CNC machines (2022 vintage). Total built-up area ~18,000 sq ft. Housekeeping excellent, no idle machinery observed. Current utilisation ~78%. Workforce of 210 — 160 on payroll, 50 contract workers. No labour disputes in last 3 years. Canteen and safety equipment in place.',
    scoreDelta: 5,
  },
  {
    noteText:
      'Promoter Mr. Arvind Mehta (54) has 28 years in steel fabrication. Previously worked at Tata Steel for 9 years before starting this venture in 2001. Articulate, detailed knowledge of order book and financials. No evasiveness on NPA questions — confirmed one restructured account in 2019 (COVID relief) fully regularised. Son (29, IIT Bombay) being groomed for ops. Succession plan clearly discussed.',
    scoreDelta: 10,
  },
  {
    noteText:
      'Primary collateral: Industrial plot (1.2 acres) + factory building in RIICO Industrial Area, Bhiwadi. Current DM circle rate Rs 4,200/sq yd; estimated market value Rs 3.8 Cr. CERSAI search clean — no existing charge. Title deeds verified (original 1998 purchase + mutation). No litigation on property as per e-Courts search. Secondary: Promoter residential flat in Sector 14, Gurgaon — self-declared value Rs 1.6 Cr.',
    scoreDelta: 5,
  },
  {
    noteText:
      'Top 5 customers contribute 58% of revenue. Anchor customer: Larsen & Toubro (EPC division) — 3-year supply agreement, ~Rs 4.2 Cr/year. Others include Tata Projects, KEC International, and two mid-size EPC contractors. Payment cycle: 45–60 days; no overdues beyond 90 days in last 2 years. Customer retention rate ~85% over 5-year period. Some concentration risk with L&T but mitigated by diversification efforts.',
    scoreDelta: 5,
  },
  {
    noteText:
      'Steel fabrication for infrastructure / EPC sector seeing strong tailwind due to government capex push (National Infrastructure Pipeline Rs 111 Lakh Cr). Input costs (HR coil, angles) have stabilised in Q3 FY26 after 18-month volatility. Chinese dumping risk partially mitigated by anti-dumping duties on certain steel products. Competitive landscape: ~6 similar-sized players in NCR region. Company has ISO 9001:2015 certification, giving edge in government tenders.',
    scoreDelta: 5,
  },
];

const SCORE_DELTA_OPTIONS = [
  { value: 10, label: '+10 (Strong positive)' },
  { value: 5, label: '+5 (Moderate positive)' },
  { value: 0, label: '0 (Neutral)' },
  { value: -5, label: '-5 (Moderate concern)' },
  { value: -10, label: '-10 (Significant concern)' },
  { value: -20, label: '-20 (Red flag)' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface QualitativeFormProps {
  appId: string;
  onSuccess?: () => void;
}

export function QualitativeForm({ appId, onSuccess }: QualitativeFormProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('factory_operations');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      notes: CATEGORIES.map((c) => ({
        category: c.key,
        fiveCDimension: c.fiveCDimension,
        noteText: '',
        scoreDelta: 0,
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: 'notes' });
  const notesValues = watch('notes');

  const fillSampleData = () => {
    SAMPLE_DATA.forEach((sample, index) => {
      setValue(`notes.${index}.noteText`, sample.noteText, { shouldValidate: true });
      setValue(`notes.${index}.scoreDelta`, sample.scoreDelta, { shouldValidate: true });
    });
    setExpandedCategory('factory_operations');
  };

  const onSubmit = async (values: FormValues) => {
    // Filter out empty notes
    const filledNotes = values.notes.filter((n) => n.noteText.trim().length >= 10);
    if (filledNotes.length === 0) {
      setError('Please fill in at least one note (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${appId}/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: filledNotes }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Submission failed');
        return;
      }
      setSubmitted(true);
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-white/60" />
        <h2 className="text-xl font-bold">Qualitative Notes Submitted</h2>
        <p className="max-w-md text-muted-foreground">
          Your field observations have been saved. The AI Reconciler will now synthesise
          all signals and generate the Credit Appraisal Memo.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Qualitative Field Assessment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your on-site observations. Each note directly influences the 5Cs score.
            At least one section must be filled.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillSampleData}
          className="shrink-0 gap-1.5 border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Fill Sample Data
        </Button>
      </div>

      {fields.map((field, index) => {
        const cat = CATEGORIES[index];
        const noteVal = notesValues[index]?.noteText ?? '';
        const isExpanded = expandedCategory === cat.key;
        const hasContent = noteVal.trim().length >= 10;

        return (
          <Card key={field.id} className={`overflow-hidden transition-all ${hasContent ? 'ring-1 ring-white/40' : ''}`}>
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  {cat.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cat.label}</span>
                    <Badge variant="outline" className={`text-xs ${cat.dimensionColor}`}>
                      {cat.fiveCDimension.charAt(0).toUpperCase() + cat.fiveCDimension.slice(1)}
                    </Badge>
                    {hasContent && <CheckCircle2 className="h-4 w-4 text-white/60" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
            </button>

            {/* Body */}
            {isExpanded && (
              <div className="space-y-4 border-t p-4">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Field Observations <span className="text-muted-foreground">(min 10 chars)</span>
                  </Label>
                  <Textarea
                    {...register(`notes.${index}.noteText`)}
                    placeholder={cat.placeholder}
                    rows={5}
                    className="resize-none text-sm"
                  />
                  {errors.notes?.[index]?.noteText && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.notes[index].noteText?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Score Impact on{' '}
                    <span className="capitalize">{cat.fiveCDimension}</span> dimension
                  </Label>
                  <select
                    {...register(`notes.${index}.scoreDelta`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  >
                    {SCORE_DELTA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {error && (
        <div className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-md p-3 text-sm text-white/80 shadow-xl">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting notes...
          </>
        ) : (
          'Submit Qualitative Assessment → Trigger Reconciler'
        )}
      </Button>
    </form>
  );
}
