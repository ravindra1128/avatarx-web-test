import apiClient from "../config/APIConfig";

export const sendInvite = async (body) => {
  const response = await apiClient.post(`/invite/send`, body);

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message);
  }

  const data = response.data;
  return data;
};
