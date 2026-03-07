'use client';

import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { Explainability } from '@/components/agent/explainability';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              AI Analysis & Explainability
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor agent activities and understand decision-making process
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">APP-2024-001</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-bold text-blue-600 mt-1">In Progress</p>
              </div>
            </Card>
            <Card className="p-4">
              <div>
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="text-xl font-bold text-gray-900 mt-1">5-10 mins</p>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="activities" className="gap-2">
                <Zap className="w-4 h-4" />
                Agent Activities
              </TabsTrigger>
              <TabsTrigger value="explainability" className="gap-2">
                <Brain className="w-4 h-4" />
                Decision Explanation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="space-y-6">
              <AgentActivityFeed />
            </TabsContent>

            <TabsContent value="explainability" className="space-y-6">
              <Explainability />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
