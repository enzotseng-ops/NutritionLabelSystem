import api from '../lib/api';

export const searchFoods = (params) =>
  api.get('/nutrition-data/search', { params }).then((r) => r.data);

export const getFoodById = (id) =>
  api.get(`/nutrition-data/${id}`).then((r) => r.data);

export const createFood = (data) =>
  api.post('/nutrition-data', data).then((r) => r.data);

export const updateFood = (id, data) =>
  api.put(`/nutrition-data/${id}`, data).then((r) => r.data);

export const deleteFood = (id) =>
  api.delete(`/nutrition-data/${id}`).then((r) => r.data);

export const getCategories = () =>
  api.get('/nutrition-data/meta/categories').then((r) => r.data);
