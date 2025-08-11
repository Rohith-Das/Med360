import axios from 'axios';
import { store } from '../app/store';

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  console.log('Full auth state:', state.auth);
  let token = state.auth.accessToken;
  console.log('Access Token from Redux:', token); 
  if (!token) {
    token = localStorage.getItem("accessToken");
  }
  
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
        console.log('Attempting token refresh');
        const res = await axiosInstance.post('/patient/refresh-token');
        const newAccessToken = res.data.data.accessToken;
        console.log('New Access Token:', newAccessToken);
        
        const { setAccessToken } = await import('../features/auth/authSlice');
        store.dispatch(setAccessToken(newAccessToken));
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        console.error('Refresh Token Error:', err);
        const { logout } = await import('../features/auth/authSlice');
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;