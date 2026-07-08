/**
 * incidentController.js — CRUD for incidents and timeline entries
 *
 * Public route (no auth):
 *   GET /api/status — open incidents for the public status page
 *
 * Protected routes (requireAuth minimum):
 *   GET    /api/incidents          — all roles
 *   POST   /api/incidents          — responder | admin
 *   GET    /api/incidents/:id      — all roles
 *   PATCH  /api/incidents/:id      — responder | admin
 *   POST   /api/incidents/:id/timeline  — responder | admin
 *   GET    /api/incidents/:id/timeline  — all roles
 */
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const TimelineEntry = require('../models/TimelineEntry');

// Helper: collect validation errors and return early on failure
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  return null;
}

// ---------- Validation chains ---------------------------------------------------

const createIncidentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters'),
  body('severity').isIn(Incident.SEVERITIES || ['SEV1', 'SEV2', 'SEV3', 'SEV4'])
    .withMessage('Severity must be SEV1, SEV2, SEV3, or SEV4'),
  body('description').optional().trim().isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('affectedServices').optional().isArray().withMessage('affectedServices must be an array'),
];

const updateIncidentValidation = [
  body('status').optional()
    .isIn(['Investigating', 'Identified', 'Monitoring', 'Resolved'])
    .withMessage('Status must be Investigating, Identified, Monitoring, or Resolved'),
  body('assignedTo').optional().isMongoId().withMessage('assignedTo must be a valid user ID'),
  body('affectedServices').optional().isArray().withMessage('affectedServices must be an array'),
  body('postmortem').optional().isString().withMessage('postmortem must be a string'),
];

const createTimelineEntryValidation = [
  body('text').trim().notEmpty().withMessage('Timeline entry text is required')
    .isLength({ max: 5000 }).withMessage('Entry must be at most 5000 characters'),
];

// ---------- Controllers ---------------------------------------------------------

/**
 * GET /api/status — PUBLIC (no auth)
 * Returns all non-resolved incidents for the status page, plus the 5 most recently resolved.
 * Documented as public per rules.md rule 1.4.
 */
async function getStatus(_req, res) {
  try {
    const [open, recent] = await Promise.all([
      Incident.find({ status: { $ne: 'Resolved' } })
        .sort({ createdAt: -1 })
        .select('title severity status affectedServices createdAt')
        .lean(),
      Incident.find({ status: 'Resolved' })
        .sort({ resolvedAt: -1 })
        .limit(5)
        .select('title severity status affectedServices createdAt resolvedAt')
        .lean(),
    ]);

    return res.status(200).json({ open, recent });
  } catch (err) {
    console.error('[incidentController.getStatus]', err.message);
    return res.status(500).json({ error: 'Could not load status. Please try again.' });
  }
}

/**
 * GET /api/incidents — list all incidents (auth required, all roles)
 */
async function getIncidents(_req, res) {
  try {
    const incidents = await Incident.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    return res.status(200).json({ incidents });
  } catch (err) {
    console.error('[incidentController.getIncidents]', err.message);
    return res.status(500).json({ error: "Couldn't load incidents. Please try refreshing." });
  }
}

/**
 * POST /api/incidents — create an incident (responder | admin)
 */
async function createIncident(req, res) {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const { title, description, severity, affectedServices } = req.body;

  try {
    const incident = await Incident.create({
      title,
      description: description || '',
      severity,
      affectedServices: affectedServices || [],
      createdBy: req.user._id,
      status: 'Investigating',
    });

    // Populate author so the client gets the full user object in the response
    await incident.populate('createdBy', 'name email');

    // ponytail: trigger notification worker asynchronously
    triggerNotification('incident_created', incident);

    return res.status(201).json({ incident });
  } catch (err) {
    console.error('[incidentController.createIncident]', err.message);
    return res.status(500).json({ error: 'Could not create incident. Please try again.' });
  }
}

/**
 * GET /api/incidents/:id — incident detail (auth required, all roles)
 */
async function getIncident(req, res) {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    return res.status(200).json({ incident });
  } catch (err) {
    console.error('[incidentController.getIncident]', err.message);
    return res.status(500).json({ error: 'Could not load incident. Please try refreshing.' });
  }
}

/**
 * PATCH /api/incidents/:id — update status / assignment / services (responder | admin)
 */
async function updateIncident(req, res) {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const { status, assignedTo, affectedServices, description, postmortem } = req.body;

  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    const previousStatus = incident.status;

    if (status !== undefined) incident.status = status;
    if (assignedTo !== undefined) incident.assignedTo = assignedTo || null;
    if (affectedServices !== undefined) incident.affectedServices = affectedServices;
    if (description !== undefined) incident.description = description;

    if (postmortem !== undefined) {
      incident.postmortem = {
        content: postmortem,
        generatedAt: incident.postmortem.generatedAt || new Date(),
      };
    }

    // Auto-log a status-change timeline entry so the audit trail is complete
    if (status && status !== previousStatus) {
      await TimelineEntry.create({
        incident: incident._id,
        author: req.user._id,
        text: `Status changed from ${previousStatus} to ${status}`,
        type: 'status_change',
      });
    }

    // Record resolution time and compile postmortem when status transitions to Resolved
    if (status === 'Resolved' && previousStatus !== 'Resolved') {
      incident.resolvedAt = new Date();

      await incident.populate('createdBy', 'name email');
      await incident.populate('assignedTo', 'name email');

      const entries = await TimelineEntry.find({ incident: incident._id })
        .sort({ createdAt: 1 })
        .populate('author', 'name role');

      incident.postmortem = {
        content: generatePostmortemMarkdown(incident, entries),
        generatedAt: new Date(),
      };
    }

    await incident.save();
    await incident.populate('createdBy', 'name email');
    await incident.populate('assignedTo', 'name email');

    // ponytail: emit socket update event to the incident room
    const io = req.app.get('io');
    if (io) {
      io.to(`incident:${incident._id}`).emit('incident_updated', incident);
    }

    // ponytail: trigger notification worker for resolution
    if (status === 'Resolved' && previousStatus !== 'Resolved') {
      triggerNotification('incident_resolved', incident);
    }

    return res.status(200).json({ incident });
  } catch (err) {
    console.error('[incidentController.updateIncident]', err.message);
    return res.status(500).json({ error: 'Could not update incident. Please try again.' });
  }
}

/**
 * GET /api/incidents/:id/timeline — list timeline entries (auth required, all roles)
 */
async function getTimeline(req, res) {
  try {
    const incident = await Incident.findById(req.params.id).select('_id');
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    const entries = await TimelineEntry.find({ incident: req.params.id })
      .sort({ createdAt: 1 }) // oldest first — chronological timeline
      .populate('author', 'name email role');

    return res.status(200).json({ entries });
  } catch (err) {
    console.error('[incidentController.getTimeline]', err.message);
    return res.status(500).json({ error: 'Could not load timeline. Please try refreshing.' });
  }
}

/**
 * POST /api/incidents/:id/timeline — add a timeline entry (responder | admin)
 */
async function addTimelineEntry(req, res) {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const incident = await Incident.findById(req.params.id).select('_id status');
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    if (incident.status === 'Resolved') {
      return res.status(400).json({
        error: 'Cannot add timeline entries to a resolved incident.',
      });
    }

    const entry = await TimelineEntry.create({
      incident: req.params.id,
      author: req.user._id,
      text: req.body.text.trim(),
      type: 'update',
    });

    await entry.populate('author', 'name email role');

    // ponytail: broadcast this entry via Socket.io to the incident room
    const io = req.app.get('io');
    if (io) {
      io.to(`incident:${incident._id}`).emit('timeline_entry_created', entry);
    }

    return res.status(201).json({ entry });
  } catch (err) {
    console.error('[incidentController.addTimelineEntry]', err.message);
    return res.status(500).json({ error: 'Could not post update. Please try again.' });
  }
}

// ponytail: helper to generate postmortem markdown structured document
function generatePostmortemMarkdown(incident, timelineEntries) {
  const services = incident.affectedServices?.length > 0
    ? incident.affectedServices.join(', ')
    : 'None';
  const assignee = incident.assignedTo?.name || 'Unassigned';
  const durationMs = incident.resolvedAt - incident.createdAt;
  const durationMins = Math.round(durationMs / 60000);
  const durationStr = `${durationMins} minutes`;

  let md = `# Postmortem: ${incident.title}

## Summary
- **Status:** Resolved
- **Severity:** ${incident.severity}
- **Declared By:** ${incident.createdBy?.name || 'Unknown'}
- **Assigned To:** ${assignee}
- **Created At:** ${incident.createdAt.toISOString()}
- **Resolved At:** ${incident.resolvedAt.toISOString()}
- **Duration:** ${durationStr}
- **Affected Services:** ${services}

## Description
${incident.description || 'No description provided.'}

## Root Cause
*Describe the root cause of this incident here. Why did this happen?*

## Action Items
- [ ] *Action item 1 to prevent recurrence...*
- [ ] *Action item 2...*

## Incident Timeline
`;

  timelineEntries.forEach((entry) => {
    const time = entry.createdAt.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const author = entry.author?.name || 'System';
    const role = entry.author?.role ? ` (${entry.author.role})` : '';
    const text = entry.text;
    md += `- **[${time}]** ${author}${role}: ${text}\n`;
  });

  return md;
}

// ponytail: helper to trigger notification worker asynchronously
function triggerNotification(event, incident) {
  if (!process.env.WORKER_URL) return;
  fetch(process.env.WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, incident }),
  }).catch((err) => {
    console.error(`[worker-trigger] Failed for ${event}:`, err.message);
  });
}

module.exports = {
  getStatus,
  getIncidents,
  createIncident,
  createIncidentValidation,
  getIncident,
  updateIncident,
  updateIncidentValidation,
  getTimeline,
  addTimelineEntry,
  createTimelineEntryValidation,
};
