/**
 * IncidentForm.jsx — modal form to create a new incident
 */
import { useState } from 'react';
import { Button } from '../../components/Button';
import { SEVERITIES, SEVERITY_CONFIG } from '../../utils/constants';
import { createIncident } from '../../api/incidents';

export function IncidentForm({ onCreated, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    severity: 'SEV2',
    description: '',
    affectedServices: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Parse comma-separated services into an array
    const affectedServices = formData.affectedServices
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const { incident } = await createIncident({
        title: formData.title,
        severity: formData.severity,
        description: formData.description,
        affectedServices,
      });
      onCreated(incident);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create incident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    /* Modal backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-label="Create new incident">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">Declare incident</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" aria-live="polite" className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="inc-title" className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="inc-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Payment service returning 500 errors"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="inc-severity" className="block text-sm font-medium text-slate-300 mb-1.5">
              Severity <span className="text-red-400">*</span>
            </label>
            <select
              id="inc-severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {SEVERITY_CONFIG[sev].label} — {SEVERITY_CONFIG[sev].description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inc-services" className="block text-sm font-medium text-slate-300 mb-1.5">
              Affected services <span className="text-slate-500 font-normal">(comma separated)</span>
            </label>
            <input
              id="inc-services"
              name="affectedServices"
              type="text"
              value={formData.affectedServices}
              onChange={handleChange}
              placeholder="e.g. payments, checkout, auth"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="inc-description" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              id="inc-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="What's happening? What's the customer impact?"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="flex-1">
              Declare incident
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
