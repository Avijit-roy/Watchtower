/**
 * Badge.jsx — severity and status indicator badges
 *
 * Reads from constants.js — never repeats Tailwind class strings here.
 */
import { SEVERITY_CONFIG, STATUS_CONFIG, ROLE_CONFIG } from '../utils/constants';

export function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.shortLabel}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badgeClass}`}>
      {config.label}
    </span>
  );
}
