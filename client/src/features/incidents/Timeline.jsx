/**
 * Timeline.jsx — scrollable timeline feed + post-update form
 *
 * aria-live="polite" on the feed region means screen readers will announce
 * new entries as they're added (Phase 2: Socket.io will push them in real-time;
 * for now, they appear after the POST response).
 */
import { useEffect, useRef, useState } from 'react';
import { getTimeline, addTimelineEntry } from '../../api/incidents';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { RoleBadge } from '../../components/Badge';
import { CAN_MUTATE_ROLES } from '../../utils/constants';
import { formatTimestamp } from '../../utils/formatDate';
import { useIncidentSocket } from './useIncidentSocket';

export function Timeline({ incidentId, incidentStatus }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const bottomRef = useRef(null);

  const canPost = CAN_MUTATE_ROLES.includes(user?.role) && incidentStatus !== 'Resolved';

  // ponytail: subscribe to real-time timeline entry broadcasts
  useIncidentSocket(incidentId, {
    onIncidentUpdated: () => {},
    onTimelineEntryCreated: (entry) => {
      setEntries((prev) => {
        // Prevent duplicate appending
        if (prev.some((e) => e._id === entry._id)) return prev;
        return [...prev, entry];
      });
    },
  });

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const { entries: data } = await getTimeline(incidentId);
        setEntries(data);
      } catch {
        setError("Couldn't load the timeline — try refreshing.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTimeline();
  }, [incidentId]);

  // Scroll to bottom whenever entries change (auto-scroll for live updates in Phase 2)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  async function handlePostEntry(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    setIsPosting(true);
    setPostError('');

    try {
      const { entry } = await addTimelineEntry(incidentId, newText.trim());
      setEntries((prev) => [...prev, entry]);
      setNewText('');
    } catch (err) {
      setPostError(err.response?.data?.error || 'Could not post update. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-slate-100 mb-4">Timeline</h2>

      {/* Loading */}
      {isLoading && <div className="py-8"><LoadingSpinner label="Loading timeline..." /></div>}

      {/* Fetch error */}
      {error && <div role="alert" className="text-sm text-red-400 py-4">{error}</div>}

      {/* Timeline feed — aria-live so new entries are announced to screen readers */}
      {!isLoading && (
        <div
          aria-live="polite"
          aria-label="Incident timeline"
          className="space-y-4 max-h-[28rem] overflow-y-auto pr-1 mb-4"
        >
          {entries.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              No updates yet — post the first timeline entry below.
            </p>
          )}

          {entries.map((entry, idx) => (
            <TimelineEntry key={entry._id} entry={entry} isLast={idx === entries.length - 1} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Post new entry — only for responders/admins on open incidents */}
      {canPost && (
        <form onSubmit={handlePostEntry} className="border-t border-slate-800 pt-4 space-y-3">
          {postError && (
            <div role="alert" aria-live="polite" className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              {postError}
            </div>
          )}
          <div>
            <label htmlFor="timeline-entry" className="sr-only">Post a timeline update</label>
            <textarea
              id="timeline-entry"
              rows={3}
              value={newText}
              onChange={(e) => { setNewText(e.target.value); setPostError(''); }}
              placeholder="What's happening? What did you try? What's the current status?"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPosting}
              disabled={!newText.trim()}
              id="btn-post-timeline-entry"
            >
              Post update
            </Button>
          </div>
        </form>
      )}

      {incidentStatus === 'Resolved' && (
        <p className="text-xs text-slate-600 text-center pt-2 border-t border-slate-800 mt-4">
          This incident is resolved. The timeline is read-only.
        </p>
      )}
    </div>
  );
}

/** A single entry in the timeline feed */
function TimelineEntry({ entry, isLast }) {
  const isSystemEvent = entry.type !== 'update';

  return (
    <div className={`flex gap-3 ${isLast ? '' : 'pb-4 border-b border-slate-800/50'}`}>
      {/* Vertical line connector */}
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${isSystemEvent ? 'bg-slate-600' : 'bg-sky-500'}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-800 mt-1.5" />}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-slate-300">{entry.author?.name}</span>
          <RoleBadge role={entry.author?.role} />
          <span className="text-xs text-slate-600">{formatTimestamp(entry.createdAt)}</span>
        </div>
        <p className={`text-sm leading-relaxed ${isSystemEvent ? 'text-slate-500 italic' : 'text-slate-300 font-mono'}`}>
          {entry.text}
        </p>
      </div>
    </div>
  );
}
