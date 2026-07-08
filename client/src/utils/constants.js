/**
 * constants.js — Single source of truth for severity/status labels and colors.
 *
 * Why here? FRONTEND_GUIDELINES.md rule: "Define severity/status colors once in
 * utils/constants.js and reference them everywhere, rather than repeating conditional
 * class strings per component."
 */

// Severity definitions — matches server/src/models/Incident.js exactly
export const SEVERITIES = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];

export const SEVERITY_CONFIG = {
  SEV1: {
    label: 'SEV1 — Critical',
    shortLabel: 'SEV1',
    description: 'Complete service outage, customer impact',
    badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-500',
    cardBorderClass: 'border-l-4 border-l-red-500',
  },
  SEV2: {
    label: 'SEV2 — Major',
    shortLabel: 'SEV2',
    description: 'Significant degradation, partial outage',
    badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    dotClass: 'bg-orange-500',
    cardBorderClass: 'border-l-4 border-l-orange-500',
  },
  SEV3: {
    label: 'SEV3 — Minor',
    shortLabel: 'SEV3',
    description: 'Minor degradation, workaround available',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    dotClass: 'bg-yellow-500',
    cardBorderClass: 'border-l-4 border-l-yellow-500',
  },
  SEV4: {
    label: 'SEV4 — Low',
    shortLabel: 'SEV4',
    description: 'Low impact, cosmetic or informational',
    badgeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-500',
    cardBorderClass: 'border-l-4 border-l-blue-500',
  },
};

// Status definitions — matches the lifecycle in Incident.js
export const STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];

export const STATUS_CONFIG = {
  Investigating: {
    label: 'Investigating',
    badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    dotClass: 'bg-red-500 animate-pulse',
  },
  Identified: {
    label: 'Identified',
    badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    dotClass: 'bg-orange-500 animate-pulse',
  },
  Monitoring: {
    label: 'Monitoring',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    dotClass: 'bg-yellow-500',
  },
  Resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
};

// Role definitions
export const ROLES = ['responder', 'admin', 'readonly'];

export const ROLE_CONFIG = {
  responder: { label: 'Responder', badgeClass: 'bg-sky-500/20 text-sky-400' },
  admin: { label: 'Admin', badgeClass: 'bg-purple-500/20 text-purple-400' },
  readonly: { label: 'Read-only', badgeClass: 'bg-slate-500/20 text-slate-400' },
};

// Roles that can mutate incidents — used for UI gating
export const CAN_MUTATE_ROLES = ['responder', 'admin'];
