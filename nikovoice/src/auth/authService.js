
import api from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export async function register(userData) {
  const response = await api.post(
    ENDPOINTS.AUTH.REGISTER,
    userData
  );

  return response.data;
}

export async function login(credentials) {
  const response = await api.post(
    ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  return response.data;
}

export async function getProfile() {
  const response = await api.get(
    ENDPOINTS.AUTH.PROFILE
  );

  return response.data;
}

export async function logout() {
  const response = await api.post(
    ENDPOINTS.AUTH.LOGOUT
  );

  return response.data;
}
