// Services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/'; // ton backend Django

const api = axios.create({
  baseURL: API_URL,
});

// Ajouter le token JWT dans chaque requête si présent
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
