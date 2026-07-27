
import axios from "axios";
 

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
 
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
 
export default axiosInstance;