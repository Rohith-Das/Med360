

import axios from 'axios';
import { store } from '../app/store';

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axiosInstance.post('/patient/refresh-token');
        const newAccessToken = res.data.data.accessToken;
        const {setAccessToken}=await import('../features/auth/authSlice')
         store.dispatch(setAccessToken(newAccessToken));
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        const {logout}=await import('../features/auth/authSlice')
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
