import axios from "axios";
import { ROLES } from "../constant/Constant";
import { getClientTimeZone } from "../utils/utils";
// Hardcoded API base URL
const BASE_URL = import.meta.env.VITE_AVATARX_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-client-timezone"] = getClientTimeZone();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid
      const userLanguage = localStorage.getItem("userLanguage");
      const selectedLanguage = localStorage.getItem("selected_language");
      const i18nextLng = localStorage.getItem("i18nextLng");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("userLanguage", userLanguage);
      localStorage.setItem("selected_language", selectedLanguage);
      localStorage.setItem("i18nextLng", i18nextLng);

      // Redirect to login if not already there
      // if (!window.location.pathname.includes("/login")) {
      //   window.location.href = `/login?redirectTo=${encodeURIComponent(
      //     window.location.pathname
      //   )}`;
      // }
      if (!window.location.pathname.includes("/login")) {
        window.location.href = userData?.role === ROLES.PATIENT ? `/login/patient` : `/login/provider`;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
