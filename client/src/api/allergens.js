import api from '../lib/api';

export const listAllergens = () =>
  api.get('/allergens').then((r) => r.data);

export const createAllergen = (data) =>
  api.post('/allergens', data).then((r) => r.data);

export const updateAllergen = (id, data) =>
  api.put(`/allergens/${id}`, data).then((r) => r.data);

export const deleteAllergen = (id) =>
  api.delete(`/allergens/${id}`).then((r) => r.data);
