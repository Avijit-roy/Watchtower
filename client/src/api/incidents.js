/**
 * incidents.js — API functions for incidents and timelines
 */
import apiClient from './apiClient';

/** GET /api/incidents */
export async function getIncidents() {
  const res = await apiClient.get('/incidents');
  return res.data; // { incidents }
}

/** POST /api/incidents */
export async function createIncident(data) {
  const res = await apiClient.post('/incidents', data);
  return res.data; // { incident }
}

/** GET /api/incidents/:id */
export async function getIncident(id) {
  const res = await apiClient.get(`/incidents/${id}`);
  return res.data; // { incident }
}

/** PATCH /api/incidents/:id */
export async function updateIncident(id, data) {
  const res = await apiClient.patch(`/incidents/${id}`, data);
  return res.data; // { incident }
}

/** GET /api/incidents/:id/timeline */
export async function getTimeline(id) {
  const res = await apiClient.get(`/incidents/${id}/timeline`);
  return res.data; // { entries }
}

/** POST /api/incidents/:id/timeline */
export async function addTimelineEntry(id, text) {
  const res = await apiClient.post(`/incidents/${id}/timeline`, { text });
  return res.data; // { entry }
}

/** GET /api/status — public, no auth */
export async function getStatus() {
  const res = await apiClient.get('/status');
  return res.data; // { open, recent }
}
