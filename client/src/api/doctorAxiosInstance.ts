import axios from "axios";
import { store } from "../app/store";

const doctorAxiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

doctorAxiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  let token = state.doctorAuth.doctorAccessToken || localStorage.getItem("doctorAccessToken");
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('Doctor access token in request:', token);
  return config;
}, (error) => {
  return Promise.reject(error);
});

doctorAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('Attempting to refresh token...');
        const refreshResponse = await axios.post(
          'http://localhost:5001/api/doctor/refresh-token',
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.data.doctorAccessToken;
        localStorage.setItem('doctorAccessToken', newAccessToken); // Update localStorage
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        console.log('Token refreshed successfully:', newAccessToken);
        return doctorAxiosInstance(originalRequest);
      } catch (err) {
        console.error('Token refresh failed:', err);
        const { doctorLogout } = await import('../features/auth/doctorAuthSlice');
        store.dispatch(doctorLogout());
        localStorage.removeItem('doctorAccessToken');
        window.location.href = '/doctor/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default doctorAxiosInstance;