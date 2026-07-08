/**
 * Incident.js — Mongoose schema for incidents
 *
 * Status lifecycle (enforced here, not in controller):
 *   Investigating → Identified → Monitoring → Resolved
 *
 * Severity follows the industry-standard SEV1 (critical) → SEV4 (low) scale.
 * affectedServices is a simple array of strings — no separate collection needed for MVP.
 */
const mongoose = require('mongoose');

const SEVERITIES = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];
const STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    severity: {
      type: String,
      enum: { values: SEVERITIES, message: `Severity must be one of: ${SEVERITIES.join(', ')}` },
      required: [true, 'Severity is required'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: 'Investigating',
    },
    affectedServices: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Set when status transitions to 'Resolved' — used for postmortem generation in Phase 2
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Postmortem markdown content — generated on resolve, editable afterward (Phase 2)
    postmortem: {
      content: { type: String, default: '' },
      generatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Export constants so controllers and tests can import them without magic strings
incidentSchema.statics.SEVERITIES = SEVERITIES;
incidentSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Incident', incidentSchema);
