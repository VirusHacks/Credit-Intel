'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AlertCircle, LogIn, CreditCard } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.push('/');
    } catch {
      setLocalError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Credit Intel</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-Powered Corporate Credit Appraisal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || error) && (
              <div className="flex gap-2 items-start p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{localError || error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl">
              <p><strong className="text-foreground">Admin:</strong> admin@gmail.com / password</p>
              <p><strong className="text-foreground">Analyst:</strong> analyst@gmail.com / password</p>
              <p><strong className="text-foreground">Viewer:</strong> viewer@gmail.com / password</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
