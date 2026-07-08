/**
 * Postmortem.jsx — Displays and edits the incident postmortem markdown
 *
 * FR10-FR12: Displays the compiled markdown, allows Responders/Admins to edit it,
 * and enables downloading the markdown file locally.
 */
import { useState } from 'react';
import { updateIncident } from '../../api/incidents';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { CAN_MUTATE_ROLES } from '../../utils/constants';

export function Postmortem({ incident, onIncidentUpdated }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(incident.postmortem?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = CAN_MUTATE_ROLES.includes(user?.role);
  const hasPostmortem = !!incident.postmortem?.content;

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      const { incident: updated } = await updateIncident(incident._id, {
        postmortem: content,
      });
      onIncidentUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save postmortem. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setContent(incident.postmortem?.content || '');
    setIsEditing(false);
    setError('');
  }

  function handleDownload() {
    // ponytail: completely native client-side file generation and download trigger
    const blob = new Blob([incident.postmortem.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postmortem-${incident._id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasPostmortem) {
    return null;
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Postmortem Draft</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generated on {new Date(incident.postmortem.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleDownload} id="btn-download-postmortem">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export .md
            </Button>
          )}
          {canEdit && !isEditing && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} id="btn-edit-postmortem">
              Edit
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="postmortem-content" className="sr-only">Edit postmortem markdown</label>
            <textarea
              id="postmortem-content"
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving} disabled={!content.trim()} id="btn-save-postmortem">
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 bg-slate-900 p-4 rounded-lg border border-slate-800 max-h-[35rem] overflow-y-auto leading-relaxed">
          {incident.postmortem.content}
        </pre>
      )}
    </div>
  );
}
