import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { store } from '../store.ts';
import { initialState, loginUser } from '../features/userSlice.ts';

const BASE_URL = import.meta.env.VITE_API_URL;

const ACCESS_TOKEN = 'access_token';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token: string | null = sessionStorage.getItem(ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `https://fastapi-backend-unzj.onrender.com/api/refresh/`,
          {},
          { withCredentials: true },
        );

        const newToken: string = response.data.access;
        sessionStorage.setItem(ACCESS_TOKEN, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        sessionStorage.removeItem(ACCESS_TOKEN);
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const logout = async () => {
  await api.post('/logout/', {}, { withCredentials: true });
  sessionStorage.removeItem(ACCESS_TOKEN);
  window.location.href = '/';
  store.dispatch(loginUser(initialState));
};

export default api;
