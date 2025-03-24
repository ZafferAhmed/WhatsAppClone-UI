import axios from "axios";
import { API_URL } from "../Utilities/Constants";

axios.defaults.withCredentials = true;

export const registerUser = async (userData) => {
  return await axios.post(`${API_URL}/register-or-login`, userData);
};

export const getUsers = async () => {
  return await axios.get(`${API_URL}/users`);
};

export const sendMessage = async (messageData) => {
  return await axios.post(`${API_URL}/send-message`, messageData);
};

export const getMessages = async (user1, user2) => {
  return await axios.get(`${API_URL}/messages/${user1}/${user2}`);
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
