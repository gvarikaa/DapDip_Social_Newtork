'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function AuthMigrationDebugPage() {
  const { user, isLoading } = useAuth();
  const [serverAuth, setServerAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkServerAuth() {
      try {
        const response = await fetch('/api/debug/auth-status');
        if (!response.ok) {
          throw new Error('Server auth check failed');
        }
        const data = await response.json();
        setServerAuth(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    checkServerAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Migration Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Client Auth Status</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify({ user }, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Server Auth Status</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(serverAuth, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Migration Progress</h2>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Feature</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-t">Client-side Auth</td>
              <td className="p-2 border-t">
                {user ? '✅ Working' : '❌ Not Working'}
              </td>
              <td className="p-2 border-t">
                Using temporary auth context in lib/auth/index.ts
              </td>
            </tr>
            <tr>
              <td className="p-2 border-t">Server-side Auth</td>
              <td className="p-2 border-t">
                {serverAuth?.success ? '✅ Working' : '❌ Not Working'}
              </td>
              <td className="p-2 border-t">
                Using temporary auth in lib/auth/server-only.ts
              </td>
            </tr>
            <tr>
              <td className="p-2 border-t">Server Actions</td>
              <td className="p-2 border-t">
                ✅ Updated
              </td>
              <td className="p-2 border-t">
                action.ts now using our server-only auth
              </td>
            </tr>
            <tr>
              <td className="p-2 border-t">API Routes</td>
              <td className="p-2 border-t">
                ✅ Completed
              </td>
              <td className="p-2 border-t">
                API routes using Supabase auth
              </td>
            </tr>
            <tr>
              <td className="p-2 border-t">Auth UI</td>
              <td className="p-2 border-t">
                ✅ Completed
              </td>
              <td className="p-2 border-t">
                Sign-in/Sign-up pages using Supabase
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Migration Status: COMPLETED ✅</h2>
        <ul className="list-disc pl-5">
          <li className="mb-1">✅ Updated API routes to use Supabase auth</li>
          <li className="mb-1">✅ Updated auth UI components</li>
          <li className="mb-1">✅ Configured Supabase project settings</li>
          <li className="mb-1">✅ Removed old auth dependencies</li>
        </ul>
      </div>
    </div>
  );
}