import apiClient from "../config/APIConfig";
import {
  checkHealthRisk,
} from "../config/vitalSignsConfig";
import { getUserPassword, handleEncrypt } from "../utils/encryption";
import { logCritical, logError, logInfo, logWarn } from "../utils/logger";

export const savePublicKey = async (payload) => {
  try {
    const response = await apiClient.post(`/user/save_public_key`, payload);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error saving public key:", error);
    return { error: error.message };
  }
};

export const getUserInfoFromToken = async (token, user = {}) => {
  try {
    const response = await apiClient.post(`/invite/get-mobile`, {
      token,
      ...user,
    });

    if (response.status !== 200 && response.status !== 201) {
      logWarn(
        "Error fetching user info",
        `HTTP error! status: ${response.status}`
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    logInfo("User info fetched successfully", response.data);

    const data = response.data;
    return data;
  } catch (error) {
    logCritical("Error fetching user info", error);
    return { error: error.message };
  }
};

export const googleLogin = async (payload) => {
  try {
    const response = await apiClient.post(`/user/google-login`, payload);

    if (response.status !== 200 && response.status !== 201) {
      logError("login failed", `HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    return data;
  } catch (error) {
    logError("Error during Google login", error);
    return { error: error.message };
  }
};

export const checkAccess = async () => {
  try {
    const response = await apiClient.post(`/user/check_access`, {
      patient_slug: localStorage.getItem("patient_slug") || "",
      facility_slug: localStorage.getItem("facility_slug") || "",
    });

    if (response.status !== 200 && response.status !== 201) {
      logWarn("checkAccess failed", `HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    return data;
  } catch (error) {
    logError("Error during checkAccess", error);
    return { error: error.message };
  }
};

export const checkInvitedUser = async () => {
  try {
    const response = await apiClient.get(`/user/check_invited_user`);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error during Google login:", error);
    return { error: error.message };
  }
};

export const storeHighAlert = async (alertData) => {
  try {
    const response = await apiClient.post(`/user/store_high_alert`, alertData);

    if (response.status !== 200 && response.status !== 201) {
      logCritical("Error storing high alert", `HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    logInfo("High alert stored successfully");
    return data;
  } catch (error) {
    logCritical("Error storing high alert", error);
    return { error: error.message };
  }
};

export const createOrUpdateUserHealthVitals = async (vitalsData,age_years) => {
  try {
    const userPassword = await getUserPassword();
    // Determine alert level based on vital signs using configuration
    
      const vitals_data = structuredClone(vitalsData);
      // By this we were getting the vital from the api using chatgpt
      // delete vitals_data.heartbeats;
      // let result = await apiClient.post(`/user/get_vitals_alerts_from_vitals`, {
      //   vitals_data: vitals_data
      // });
      // let {alert,alert_reason, alert_in} = result.data.data;
      // By this we were getting the alerts from the our logic
    // let {risk,message, alert_in} = checkHealthRisk({...vitalsData,age_years});
    // const vitalSigns = Object.keys(vitalSignsConfig.thresholds);
    
    // for (const vitalSign of vitalSigns) {
    //   if (vitalsData[vitalSign] !== undefined) {
    //     const alert = checkVitalSignAlert(
    //       vitalSign,
    //       vitalsData[vitalSign],
    //       vitalSignsConfig.thresholds[vitalSign]
    //     );
        
    //     // Update highest alert if current alert is higher
    //     if (risk === "high" || (risk === "medium" && highestAlert === "low")) {
    //       highestAlert = risk;
    //     }
    //   }
    // }
    

    // const encryptedPayload = await handleEncrypt(vitalsData, userPassword);
    if (vitalsData) {
      logInfo("health vitals payload is encrypted successfully");

      const response = await apiClient.post(`/user/create_health_vitals/`, {
        ...vitalsData,
        // alert: risk,
        // alert_reason: message,
        // alert_in: alert_in
      });

      if (response.status !== 200 && response.status !== 201) {
        logError(
          "Error creating/updating user health vitals",
          `HTTP error! status: ${response.status}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = response.data;
      logInfo("User health vitals created/updated successfully");

      // Store high alert if alert level is high
      // if (risk === "high") {
      //   await storeHighAlert({
      //     vital_data: encryptedPayload,
      //     alert: risk,
      //     timestamp: new Date().toISOString()
      //   });
      // }

      return data;
    } else {
      logCritical("Error encrypting health vitals payload");
      return { error: "Error encrypting health vitals payload" };
    }
  } catch (error) {
    logCritical("Error creating/updating user health vitals", error);
    return { error: error.message };
  }
};

export const getUserHealthVitals = async (id) => {
  try {
    const response = await apiClient.get(
      `/user/get_user_with_health_vitals/${id}`
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error getting user health vitals:", error);
    logCritical("Error getting user health vitals:", error);
    return { error: error.message };
  }
};

export const logSessionActivity = async (payload) => {
  try {
    const response = await apiClient.post(`/user/log_session`, payload);

    if (response.status !== 200 && response.status !== 201) {
      logError("Error logging session:", `HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    logInfo("Session log created successfully");
    return response.data;
  } catch (err) {
    logError("Error logging session:", err);
    return { error: err.message };
  }
};
