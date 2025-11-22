import axios from "axios";
import { store } from "../app/store";
const adminAxiosInstance = axios.create({
  baseURL: "http://localhost:5001/api/",
  withCredentials: true,
});
adminAxiosInstance.interceptors.request.use((config)=>{
    const state=store.getState();
    let token=state.adminAuth.adminAuth.adminAccessToken;
    if (!token) {
token = localStorage.getItem("adminAccessToken");  }
    if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('admin accesstokend is:',token)
  return config;
},
 (error) => {
    return Promise.reject(error);
  }
)

adminAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse=await axios.post(
           'http://localhost:5001/api/admin/refresh-token',
           {},
           {withCredentials:true}
        )
        const newAccessToken=refreshResponse.data.data.adminAccessToken;
        const {setAdminAccessToken}=await import('../features/auth/adminAuthSlice')
        store.dispatch(setAdminAccessToken(newAccessToken))
        originalRequest.headers['Authorization']=`Bearer ${newAccessToken}`;
        return adminAxiosInstance(originalRequest)
        // const res = await adminAxiosInstance.post('/admin/refresh-token');
        // const newAccessToken = res.data.data.adminAccessToken;
        // const { setAdminAccessToken } = await import('../features/auth/adminAuthSlice');
        // store.dispatch(setAdminAccessToken(newAccessToken));
        // originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        // return adminAxiosInstance(originalRequest);
      } catch (err) {
        const { adminLogout } = await import('../features/auth/adminAuthSlice');
        store.dispatch(adminLogout());
        localStorage.removeItem('adminAccessToken')
        window.location.href = '/admin/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default adminAxiosInstance;