import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link2, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

type Tab = 'url' | 'text';

interface ParseJob {
  id: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result_recipe_id: number | null;
  error_message: string | null;
}

export default function AddRecipePage() {
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [jobId, setJobId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Submit parse job
  const parseMutation = useMutation({
    mutationFn: async () => {
      const body = tab === 'url' ? { url } : { text };
      const { data } = await api.post<{ job_id: number; status: string }>('/api/v1/recipes/parse', body);
      return data;
    },
    onSuccess: (data) => setJobId(data.job_id),
  });

  // Poll job status
  const { data: job } = useQuery({
    queryKey: ['parse_job', jobId],
    queryFn: async () => {
      const { data } = await api.get<ParseJob>(`/api/v1/parse_jobs/${jobId}`);
      return data;
    },
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'done' || status === 'failed' ? false : 2000;
    },
  });

  // Navigate when done
  useEffect(() => {
    if (job?.status === 'done' && job.result_recipe_id) {
      navigate(`/recipes/${job.result_recipe_id}`);
    }
  }, [job, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseMutation.mutate();
  };

  const isPolling = jobId !== null && job?.status !== 'done' && job?.status !== 'failed';
  const isFailed  = job?.status === 'failed';

  const tabStyle = (t: Tab) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: tab === t ? 'var(--color-charcoal)' : 'transparent',
    color: tab === t ? 'white' : 'var(--color-warm-gray)',
    transition: 'background 0.15s',
  });

  return (
    <div className="p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
        Add a Recipe
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-warm-gray)' }}>
        Paste a URL and we'll fetch it automatically, or paste the recipe text directly.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--color-cream-dark)' }}>
        <button style={tabStyle('url')} onClick={() => setTab('url')}>
          <span className="flex items-center gap-2"><Link2 size={14} /> From URL</span>
        </button>
        <button style={tabStyle('text')} onClick={() => setTab('text')}>
          <span className="flex items-center gap-2"><FileText size={14} /> Paste text</span>
        </button>
      </div>

      {/* Status messages */}
      {isPolling && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-sage)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-sage)' }}>Fetching and parsing recipe…</p>
            <p className="text-xs mt-0.5" style={{ color: '#4ade80' }}>This usually takes 5–15 seconds</p>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>
              {job?.error_message?.includes('paywall') || job?.error_message?.includes('denied')
                ? 'This site requires a subscription — try pasting the recipe text instead.'
                : job?.error_message ?? 'Failed to parse recipe.'}
            </p>
            <button
              className="text-xs mt-1 underline"
              style={{ color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => { setJobId(null); parseMutation.reset(); setTab('text'); }}
            >
              Switch to paste text →
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tab === 'url' ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Recipe URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://www.example.com/recipes/chocolate-cake"
              className="px-4 py-3 rounded-xl text-base outline-none"
              style={{ border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-warm-gray)' }}>
              Works with most recipe sites that publish structured data (BBC Good Food, Serious Eats, Food Network, etc.)
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Recipe text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={14}
              placeholder={"Paste the full recipe here — title, ingredients, and instructions.\n\nExample:\n\nChocolate Chip Cookies\n\nIngredients:\n2 cups flour\n1 cup butter\n...\n\nInstructions:\n1. Preheat oven to 375°F\n2. Mix dry ingredients..."}
              className="px-4 py-3 rounded-xl text-sm outline-none resize-y"
              style={{ border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={parseMutation.isPending || isPolling}
          className="py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
          style={{
            background: 'var(--color-terra)',
            color: 'white',
            border: 'none',
            cursor: parseMutation.isPending || isPolling ? 'wait' : 'pointer',
            opacity: parseMutation.isPending || isPolling ? 0.7 : 1,
          }}
        >
          {parseMutation.isPending || isPolling ? (
            <><Loader2 size={17} className="animate-spin" /> Parsing…</>
          ) : (
            <><CheckCircle size={17} /> Save Recipe</>
          )}
        </button>
      </form>
    </div>
  );
}
