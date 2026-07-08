/**
 * TimelineEntry.js — A single update posted to an incident's timeline
 *
 * Each entry is immutable once created (no PATCH endpoint for entries).
 * This preserves the integrity of the incident record — you can't silently
 * edit what was said during a response. The author and timestamp are the audit trail.
 */
const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true, // indexed because the most common query is "all entries for incident X"
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Timeline entry text is required'],
      trim: true,
      minlength: [1, 'Entry cannot be empty'],
      maxlength: [5000, 'Entry must be at most 5000 characters'],
    },
    // 'type' distinguishes user-posted updates from system events (status changes, assignments).
    // Stored for future use in postmortem generation and filtering.
    type: {
      type: String,
      enum: ['update', 'status_change', 'assignment', 'system'],
      default: 'update',
    },
  },
  {
    timestamps: true,
    // Return createdAt as the canonical timestamp — entries are ordered by this field
  }
);

module.exports = mongoose.model('TimelineEntry', timelineEntrySchema);
