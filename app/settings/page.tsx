'use client';

import { useState } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUser } from '@/lib/mock-data';
import { Bell, Moon, Save, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account preferences and notifications
          </p>
        </div>

        {/* Profile Section */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={mockUser.name}
                disabled
                className="mt-1 w-full rounded-md border bg-muted px-3 py-2 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email Address</label>
              <input
                type="email"
                value={mockUser.email}
                disabled
                className="mt-1 w-full rounded-md border bg-muted px-3 py-2 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={mockUser.role}
                disabled
                className="mt-1 w-full rounded-md border bg-muted px-3 py-2 disabled:opacity-50"
              >
                <option>{mockUser.role}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Member Since</label>
              <input
                type="text"
                value={mockUser.joinedAt.toLocaleDateString()}
                disabled
                className="mt-1 w-full rounded-md border bg-muted px-3 py-2 disabled:opacity-50"
              />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive email updates about applications
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-xs text-muted-foreground">
                  Get weekly summaries of your applications
                </p>
              </div>
              <input
                type="checkbox"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Application Updates</p>
                <p className="text-xs text-muted-foreground">
                  Notify me about application status changes
                </p>
              </div>
              <input
                type="checkbox"
                checked={applicationUpdates}
                onChange={(e) => setApplicationUpdates(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </h2>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Use dark theme for the application
              </p>
            </div>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="h-4 w-4 rounded"
            />
          </div>
        </Card>

        {/* Data Export */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-6">Data Management</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="font-medium text-yellow-900">Export Your Data</p>
              <p className="mt-1 text-xs text-yellow-800">
                Download all your application data as CSV or JSON
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm">
                  Export as CSV
                </Button>
                <Button variant="outline" size="sm">
                  Export as JSON
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Danger Zone</p>
              <p className="mt-1 text-xs text-red-800">
                Permanently delete your account and all associated data
              </p>
              <Button variant="outline" size="sm" className="mt-3 text-red-600">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
}
