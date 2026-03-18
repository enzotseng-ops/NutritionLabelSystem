import api from '../lib/api';

export const importExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // 不手動設定 Content-Type，讓 Axios 自動帶上含 boundary 的 multipart/form-data
  return api.post('/import/excel', formData).then((r) => r.data);
};

export const getExcelExportUrl = (id) => {
  const base = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://labels.openclaw-gb.com/api-proxy';
  return `${base}/export/excel/${id}`;
};
