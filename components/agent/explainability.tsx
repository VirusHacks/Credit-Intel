'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Brain, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface DecisionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  score: number;
  description: string;
}

const decisionFactors: DecisionFactor[] = [
  {
    name: 'Debt-to-Equity Ratio',
    impact: 'positive',
    score: 8.5,
    description: 'Healthy leverage with 0.38 ratio, indicating strong equity base',
  },
  {
    name: 'Current Ratio',
    impact: 'positive',
    score: 8.2,
    description: 'Strong liquidity position at 2.1x, well above minimum threshold',
  },
  {
    name: 'Revenue Growth',
    impact: 'positive',
    score: 7.8,
    description: '12% YoY growth demonstrates positive business momentum',
  },
  {
    name: 'Profit Margin',
    impact: 'neutral',
    score: 6.5,
    description: 'Net profit margin of 14.4%, slightly below industry average of 16%',
  },
  {
    name: 'Industry Risk',
    impact: 'negative',
    score: 5.2,
    description: 'Technology sector faces moderate cyclical risks',
  },
  {
    name: 'Management Experience',
    impact: 'positive',
    score: 8.8,
    description: 'CEO has 15+ years industry experience, strong track record',
  },
];

export function Explainability() {
  const [expandedId, setExpandedId] = useState<number | null>(0);

  const positiveFactors = decisionFactors.filter((f) => f.impact === 'positive').length;
  const negativeFactors = decisionFactors.filter((f) => f.impact === 'negative').length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Decision Explanation</h3>
            <p className="text-sm text-gray-700 mb-4">
              The AI credit assessment model analyzed {decisionFactors.length} key factors to reach
              the final credit recommendation. Below is a detailed breakdown of how each factor
              influenced the decision.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Supporting Factors</p>
                <p className="text-xl font-bold text-green-600 mt-1">{positiveFactors}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Challenging Factors</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{negativeFactors}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Overall Confidence</p>
                <p className="text-xl font-bold text-blue-600 mt-1">91%</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Decision Factors */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Detailed Factor Analysis
        </h3>

        {decisionFactors.map((factor, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                factor.impact === 'positive'
                  ? 'border-l-4 border-l-green-600'
                  : factor.impact === 'negative'
                  ? 'border-l-4 border-l-red-600'
                  : 'border-l-4 border-l-gray-400'
              }`}
              onClick={() => setExpandedId(expandedId === index ? null : index)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{factor.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        factor.impact === 'positive'
                          ? 'text-green-600'
                          : factor.impact === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {factor.score.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Impact Score</p>
                  </div>
                  <motion.div animate={{ rotate: expandedId === index ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 font-semibold">Model Weight</p>
                      <p className="text-sm text-blue-900 mt-1">
                        {factor.impact === 'positive' ? '12-15%' : '5-8%'} of final score
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-700 font-semibold">Confidence</p>
                      <p className="text-sm text-indigo-900 mt-1">
                        {(85 + Math.random() * 15).toFixed(0)}% certainty
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    This factor was derived from financial analysis of the company's balance sheet
                    and operating statements, compared against industry benchmarks and historical
                    performance patterns.
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Model Information */}
      <Card className="p-6 bg-gray-50 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Model Version</p>
            <p className="font-medium text-gray-900">IntelliCredit v2.1</p>
          </div>
          <div>
            <p className="text-gray-600">Model Type</p>
            <p className="font-medium text-gray-900">Gradient Boosting Ensemble</p>
          </div>
          <div>
            <p className="text-gray-600">Training Data</p>
            <p className="font-medium text-gray-900">50K+ applications (2018-2024)</p>
          </div>
          <div>
            <p className="text-gray-600">Last Updated</p>
            <p className="font-medium text-gray-900">March 2024</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
