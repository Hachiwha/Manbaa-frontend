import { apiClient } from "../apiClient";
import { setAccessTokenForDevelopment } from "../config";

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken?: string;
}

export function login(body: LoginBody) {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((res) => {
    if (res.accessToken) {
      setAccessTokenForDevelopment(res.accessToken);
    }
    return res;
  });
}

export function register(body: RegisterBody) {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((res) => {
    if (res.accessToken) {
      setAccessTokenForDevelopment(res.accessToken);
    }
    return res;
  });
}

export function logout() {
  setAccessTokenForDevelopment(null);
  return apiClient<void>("/auth/logout", {
    method: "POST",
  });
}
