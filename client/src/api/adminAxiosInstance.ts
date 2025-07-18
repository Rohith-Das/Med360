import axios from "axios";
import { store } from "../app/store";
const adminAxiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});
adminAxiosInstance.interceptors.request.use((config)=>{
    const state=store.getState();
    const token=state.adminAuth.adminAccessToken;
    if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
})
adminAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await adminAxiosInstance.post('/admin/refresh-token');
        const newAccessToken = res.data.data.adminAccessToken;
        const { setAdminAccessToken } = await import('../features/auth/adminAuthSlice');
        store.dispatch(setAdminAccessToken(newAccessToken));
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return adminAxiosInstance(originalRequest);
      } catch (err) {
        const { adminLogout } = await import('../features/auth/adminAuthSlice');
        store.dispatch(adminLogout());
        window.location.href = '/admin/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default adminAxiosInstance;