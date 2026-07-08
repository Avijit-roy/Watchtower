const { Router } = require('express');
const {
  getStatus,
  getIncidents,
  createIncident, createIncidentValidation,
  getIncident,
  updateIncident, updateIncidentValidation,
  getTimeline,
  addTimelineEntry, createTimelineEntryValidation,
} = require('../controllers/incidentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

// ---- Public route (no auth) -----------------------------------------------
// Documented as public per rules.md rule 1.4
router.get('/status', getStatus);

// ---- All routes below require authentication --------------------------------

// List all incidents — all authenticated roles
router.get('/incidents', requireAuth, getIncidents);

// Create incident — responders and admins only
router.post(
  '/incidents',
  requireAuth,
  requireRole('responder', 'admin'),
  createIncidentValidation,
  createIncident
);

// Get a single incident — all authenticated roles
router.get('/incidents/:id', requireAuth, getIncident);

// Update incident (status, assignment, etc.) — responders and admins only
router.patch(
  '/incidents/:id',
  requireAuth,
  requireRole('responder', 'admin'),
  updateIncidentValidation,
  updateIncident
);

// Get timeline for an incident — all authenticated roles
router.get('/incidents/:id/timeline', requireAuth, getTimeline);

// Add a timeline entry — responders and admins only
router.post(
  '/incidents/:id/timeline',
  requireAuth,
  requireRole('responder', 'admin'),
  createTimelineEntryValidation,
  addTimelineEntry
);

module.exports = router;
