'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Brain,
  FileText,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  step: string;
  agent: string;
  action: string;
  status: 'completed' | 'in-progress' | 'pending';
  confidence: number;
  timestamp: string;
  details?: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    step: 'Document Verification',
    agent: 'Document Validator',
    action: 'Verified 5 financial documents',
    status: 'completed',
    confidence: 0.98,
    timestamp: '2024-03-15 10:00',
    details: 'All documents passed integrity checks',
  },
  {
    id: '2',
    step: 'Financial Analysis',
    agent: 'Financial Analyzer',
    action: 'Analyzed financial statements and ratios',
    status: 'completed',
    confidence: 0.95,
    timestamp: '2024-03-15 10:15',
    details: 'Debt-to-equity ratio: 0.38, Current ratio: 2.1',
  },
  {
    id: '3',
    step: 'Risk Assessment',
    agent: 'Risk Assessor',
    action: 'Evaluating business and market risks',
    status: 'in-progress',
    confidence: 0.87,
    timestamp: '2024-03-15 10:30',
    details: 'Processing industry benchmarks',
  },
  {
    id: '4',
    step: 'Credit Scoring',
    agent: 'Credit Scorer',
    action: 'Pending credit score calculation',
    status: 'pending',
    confidence: 0,
    timestamp: 'Pending',
  },
  {
    id: '5',
    step: 'Report Generation',
    agent: 'Report Generator',
    action: 'Pending final report compilation',
    status: 'pending',
    confidence: 0,
    timestamp: 'Pending',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'in-progress':
      return <Zap className="w-5 h-5 text-blue-600 animate-pulse" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

const getAgentIcon = (agent: string) => {
  if (agent.includes('Document')) return <FileText className="w-4 h-4" />;
  if (agent.includes('Financial')) return <TrendingUp className="w-4 h-4" />;
  if (agent.includes('Risk')) return <AlertCircle className="w-4 h-4" />;
  return <Brain className="w-4 h-4" />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function AgentActivityFeed() {
  const completedCount = activities.filter((a) => a.status === 'completed').length;
  const totalSteps = activities.length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Agent Progress</h3>
          <span className="text-2xl font-bold text-blue-600">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(completedCount / totalSteps) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {completedCount} of {totalSteps} analysis steps completed
        </p>
      </Card>

      {/* Activity Timeline */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            variants={itemVariants}
            className="relative"
          >
            {/* Timeline connector */}
            {index < activities.length - 1 && (
              <div className="absolute left-6 top-16 w-1 h-12 bg-gray-200" />
            )}

            <Card
              className={`p-4 border-l-4 transition-all ${
                activity.status === 'completed'
                  ? 'border-l-green-600 bg-green-50 hover:shadow-md'
                  : activity.status === 'in-progress'
                  ? 'border-l-blue-600 bg-blue-50 hover:shadow-md'
                  : 'border-l-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(activity.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-semibold text-gray-900">{activity.step}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                        {getAgentIcon(activity.agent)}
                        {activity.agent}
                      </p>
                    </div>
                    {activity.confidence > 0 && (
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-white text-gray-700 border border-gray-200">
                          {(activity.confidence * 100).toFixed(0)}% confident
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mt-2">{activity.action}</p>

                  {activity.details && (
                    <p className="text-xs text-gray-600 mt-2 p-2 bg-white rounded border border-gray-200">
                      {activity.details}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Decision Tree */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Decision Rationale</h3>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-1">Risk Level: MEDIUM</p>
            <p className="text-xs text-blue-800">
              Based on industry risk (medium) and financial metrics (acceptable debt levels)
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-900 mb-1">Financial Health: GOOD</p>
            <p className="text-xs text-green-800">
              Strong profitability metrics with improving cash flow trends
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-1">Recommendation: APPROVE</p>
            <p className="text-xs text-amber-800">
              Subject to standard credit conditions and covenant requirements
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
