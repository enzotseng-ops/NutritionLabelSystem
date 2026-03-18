import axios from 'axios';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://labels.openclaw-gb.com/api-proxy',
  withCredentials: true,
});

export default api;
