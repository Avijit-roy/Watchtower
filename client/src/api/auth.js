/**
 * auth.js — API functions for authentication
 * Each function maps to one API endpoint. No fetch logic in components.
 */
import apiClient from './apiClient';

/** POST /api/auth/register */
export async function registerUser({ name, email, password, role }) {
  const res = await apiClient.post('/auth/register', { name, email, password, role });
  return res.data; // { token, user }
}

/** POST /api/auth/login */
export async function loginUser({ email, password }) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data; // { token, user }
}

/** GET /api/auth/me */
export async function getMe() {
  const res = await apiClient.get('/auth/me');
  return res.data; // { user }
}
