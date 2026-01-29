import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import React, { createContext, useEffect, useState } from "react";
import apiClient from "../config/APIConfig";
import { logError, logInfo, logCritical } from "../utils/logger";
import { useUser } from "../Hooks/useUser.js";


export const AuthContext = createContext({
  authData: null,
  setAuthData: () => {},
  authLoading: true,
});

export function AuthProvider({ children }) {
  const [authData, setAuthData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { facilitySlug } = useUser();

  


  const storedData = localStorage.getItem("token");
  useEffect(() => {
    if (storedData) {
      fetchUserData();
    } else {
      setAuthLoading(false);
    }
  }, [storedData]);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.post(`/user/get_user_info`, {
        patient_slug: localStorage.getItem("patient_slug") || "",
        facility_slug: facilitySlug
      });
      const userData = response?.data?.user;

      localStorage.setItem("userData", JSON.stringify(userData));
      const user = {
        ...userData,
        id: userData?.id,
        is_admin: userData?.is_admin ? true : false,
      };
      console.log("user++++++", user);
      localStorage.setItem("user", JSON.stringify(user));
      const data = {
        message: response?.data?.message,
        user,
      };
      datadogRum.setUser({
        id: userData?.id,
        email: userData?.email,
        role: userData?.role,
        name: `${userData?.first_name} ${userData?.last_name}`,
        phone: userData?.phone_number,
      });
      datadogLogs.setUser({
        id: userData?.id,
        email: userData?.email,
        name: `${userData?.first_name} ${userData?.last_name}`,
        role: userData?.role,
        phone: userData?.phone_number,
      });

      logInfo("User logged in", {
        userId: response?.data?.data?.id,
        email: response?.data?.data?.email,
      });

      // Enhance existing auth data instead of replacing it
      setAuthData(prevAuthData => {
        // If we already have auth data from login, enhance it
        if (prevAuthData) {
          return {
            ...prevAuthData, // Keep existing data
            ...data, // Add API response data
            facility_slug: localStorage.getItem("facility_slug"),
            patient_slug: localStorage.getItem("patient_slug"),
            user: {
              ...prevAuthData.user, // Keep existing user data
              ...user, // Add enhanced user data from API
            }
          };
        }
        // If no existing data, use API response
        return {
          ...data,
          facility_slug: localStorage.getItem("facility_slug"),
          patient_slug: localStorage.getItem("patient_slug"),
        };
      });
      setAuthLoading(false);
    } catch (error) {
      logCritical("Error fetching user data:", error);
      setAuthLoading(false);
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ authData, setAuthData, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
