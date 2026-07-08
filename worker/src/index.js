/**
 * index.js — Notification worker entry point
 * Exposes a POST /notify endpoint that gets called by the main API.
 */
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send Slack notification via Incoming Webhook
 */
async function sendSlackNotification(text) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('REPLACE')) {
    console.log('⚠️  Slack webhook URL not configured, skipping Slack alert');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error(`❌  Slack API returned status ${response.status}`);
    } else {
      console.log('✅  Slack notification sent');
    }
  } catch (err) {
    console.error('❌  Error sending Slack notification:', err.message);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(subject, text) {
  const recipient = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (!recipient || !process.env.SMTP_HOST || process.env.SMTP_USER?.includes('you@gmail.com')) {
    console.log('⚠️  SMTP credentials or recipient email not configured, skipping email alert');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Incident Command" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject,
      text,
    });
    console.log('✅  Email notification sent');
  } catch (err) {
    console.error('❌  Error sending email notification:', err.message);
  }
}

// Health check endpoint (used by Kubernetes probes)
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.post('/notify', async (req, res) => {
  const { event, incident } = req.body;

  if (!event || !incident) {
    return res.status(400).json({ error: 'Missing event or incident payload' });
  }

  console.log(`✉️  Received notification request for event: ${event}`);

  // Handle asynchronous sending
  res.status(202).json({ status: 'Processing' });

  try {
    const creator = incident.createdBy?.name || 'Unknown';
    const severity = incident.severity || 'SEV4';
    const title = incident.title || 'Untitled';
    const description = incident.description || 'No description provided.';
    const id = incident._id;

    if (event === 'incident_created') {
      const slackText = `🚨 *New Incident Declared:* ${title} (${severity})\n*Status:* Investigating\n*Declared By:* ${creator}\n*Description:* ${description}\n*Link:* http://localhost:5173/incidents/${id}`;
      const emailSubject = `🚨 [${severity}] New Incident Declared: ${title}`;
      const emailText = `A new incident has been declared in Incident Command.

Title: ${title}
Severity: ${severity}
Status: Investigating
Declared By: ${creator}

Description:
${description}

View Details: http://localhost:5173/incidents/${id}`;

      await Promise.all([
        sendSlackNotification(slackText),
        sendEmailNotification(emailSubject, emailText)
      ]);
    } else if (event === 'incident_resolved') {
      const durationMs = incident.resolvedAt ? (new Date(incident.resolvedAt) - new Date(incident.createdAt)) : 0;
      const durationMins = Math.round(durationMs / 60000);

      const slackText = `✅ *Incident Resolved:* ${title} (${severity})\n*Duration:* resolved in ${durationMins} minutes\n*Link:* http://localhost:5173/incidents/${id}`;
      const emailSubject = `✅ [Resolved] Incident: ${title}`;
      const emailText = `The incident has been marked as Resolved.

Title: ${title}
Severity: ${severity}
Duration: Resolved in ${durationMins} minutes

View Details: http://localhost:5173/incidents/${id}`;

      await Promise.all([
        sendSlackNotification(slackText),
        sendEmailNotification(emailSubject, emailText)
      ]);
    }
  } catch (err) {
    console.error('❌  Error processing notification:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✉️  Notification worker running on http://localhost:${PORT}`);
});
