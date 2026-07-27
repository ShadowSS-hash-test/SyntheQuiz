import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL,

  withCredentials: true, 
});

axiosInstance.interceptors.response.use(
  (response) => {

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

  
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 

      try {
      
        await axios.post(
          `${baseURL}/users/refreshToken`, 
          {}, 
          { withCredentials: true } 
        );

      
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        
        console.error('Session expired. Please log in again.');
        
    
        window.location.href = '/login'; 
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;