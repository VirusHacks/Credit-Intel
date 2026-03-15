'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { mockUser } from '@/lib/mock-data';
import { Bell, Moon, Save, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
        checked ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/5'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform mt-[1px] ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Settings
        </h1>

        <div className="relative flex flex-col gap-6 p-6">
          {/* Profile Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-white/40" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Profile</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
              {[
                { label: 'Full Name', value: mockUser.name, type: 'text' },
                { label: 'Email Address', value: mockUser.email, type: 'email' },
                { label: 'Role', value: mockUser.role, type: 'text' },
                { label: 'Member Since', value: mockUser.joinedAt.toLocaleDateString(), type: 'text' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2 text-sm text-white/60 disabled:opacity-60 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Notification Settings */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-white/40" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Notifications</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl divide-y divide-white/10">
              {[
                { label: 'Email Notifications', desc: 'Receive email updates about applications', checked: emailNotifications, onChange: setEmailNotifications },
                { label: 'Push Notifications', desc: 'Receive push notifications on your device', checked: pushNotifications, onChange: setPushNotifications },
                { label: 'Weekly Reports', desc: 'Get weekly summaries of your applications', checked: weeklyReports, onChange: setWeeklyReports },
                { label: 'Application Updates', desc: 'Notify me about application status changes', checked: applicationUpdates, onChange: setApplicationUpdates },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                  <Toggle checked={item.checked} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </section>

          {/* Appearance */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-white/40" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Appearance</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Dark Mode</p>
                  <p className="text-xs text-white/40">Monochromatic dark theme (always on)</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  Active
                </div>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Data Management</p>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
              <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md p-4">
                <p className="font-medium text-white text-sm">Export Your Data</p>
                <p className="mt-1 text-xs text-white/40">Download all your application data as CSV or JSON</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="border-[#222222] text-white/60 hover:bg-white/5 hover:text-white">Export as CSV</Button>
                  <Button variant="outline" size="sm" className="border-[#222222] text-white/60 hover:bg-white/5 hover:text-white">Export as JSON</Button>
                </div>
              </div>

              <div className="rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-md p-4 shadow-xl">
                <p className="font-bold text-white text-sm">✗ Danger Zone</p>
                <p className="mt-1 text-xs text-white/40">Permanently delete your account and all associated data</p>
                <Button variant="outline" size="sm" className="mt-3 border-white/30 text-white/60 hover:bg-white/10 hover:text-white">
                  Delete Account
                </Button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2 bg-white text-black hover:bg-white/90">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
