import api from '../lib/api';

export const listLabels = (params) =>
  api.get('/labels', { params }).then((r) => r.data);

export const getLabelById = (id) =>
  api.get(`/labels/${id}`).then((r) => r.data);

export const createLabel = (data) =>
  api.post('/labels', data).then((r) => r.data);

export const updateLabel = (id, data) =>
  api.put(`/labels/${id}`, data).then((r) => r.data);

export const deleteLabel = (id) =>
  api.delete(`/labels/${id}`).then((r) => r.data);

export const previewLabel = (data) =>
  api.post('/labels/preview', data).then((r) => r.data);
