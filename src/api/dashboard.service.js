import apiClient from "../config/APIConfig";
import { logCritical } from "../utils/logger";

export const getMonthList = async () => {
    try {
      const response = await apiClient.post(`/user/get_filter_month_name`);
  
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = response.data;
      return data;
    } catch (error) {
      console.error("Error during getMonthList:", error);
      logCritical("Error during getMonthList:", error);
      return { error: error.message };
    }
  };