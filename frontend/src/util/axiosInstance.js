import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL,

  withCredentials: true, 
});

// -------------------------------------------------------------
// REQUEST INTERCEPTOR: Not needed!
// The browser will automatically attach the access_token cookie.
// -------------------------------------------------------------

// -------------------------------------------------------------
// RESPONSE INTERCEPTOR: Catch 401s and Refresh
// -------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => {
    // Pass successful responses through normally
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the server returns a 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        // Hit your refresh route. 
        // The browser automatically sends the HttpOnly refresh_token cookie here.
        await axios.post(
          `${baseURL}/users/refreshToken`, 
          {}, 
          { withCredentials: true } 
        );

        // If the refresh succeeds, your backend just set a NEW access_token cookie.
        // All we have to do is retry the original request. The browser will 
        // automatically attach the new, valid cookie!
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token request fails (e.g., refresh token expired)
        console.error('Session expired. Please log in again.');
        
    
        window.location.href = '/login'; 
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;