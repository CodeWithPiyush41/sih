import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AIClient } from '@/lib/api/ai.client';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

export function AIStatusPage() {
  const [status, setStatus] = useState<{gemini: string, ollama: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AIClient.getHealth()
      .then(res => {
        setStatus(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-h1 text-ink mb-1 flex items-center gap-2">
          <Activity size={24} className="text-signal" />
          AI System Status
        </h1>
        <p className="text-body text-ink-muted">Development and monitoring status for AI orchestration.</p>
      </div>

      {loading && <p>Checking AI providers...</p>}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          Failed to connect to AI Orchestrator API: {error}
        </div>
      )}

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="bg-surface border border-border rounded-panel p-6">
            <h2 className="text-h2 text-ink mb-4 flex items-center gap-2">
              Gemini API
            </h2>
            <div className="flex items-center gap-2 mb-2">
              {status.gemini === 'available' ? (
                <CheckCircle2 className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
              <span className="text-body font-medium">
                {status.gemini === 'available' ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <p className="text-body-sm text-ink-muted mt-4">
              Configured as the primary provider for complex reasoning tasks.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-panel p-6">
            <h2 className="text-h2 text-ink mb-4 flex items-center gap-2">
              Local Ollama
            </h2>
            <div className="flex items-center gap-2 mb-2">
              {status.ollama === 'available' ? (
                <CheckCircle2 className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
              <span className="text-body font-medium">
                {status.ollama === 'available' ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <p className="text-body-sm text-ink-muted mt-4">
              Fallback provider and primary for code analysis tasks. Expecting local server at port 11434.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
