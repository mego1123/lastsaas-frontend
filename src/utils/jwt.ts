import { jwtDecode } from "jwt-decode";
import axios from "./axios";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/configs/auth";

const isTokenValid = (authToken: string): boolean => {
  try {
    const decoded: { exp?: number } = jwtDecode(authToken);
    if (!decoded.exp) {
      return false;
    }
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

const setSession = (accessToken?: string | null, refreshToken?: string | null): void => {
  if (typeof accessToken === "string" && accessToken.trim() !== "") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
};

export { isTokenValid, setSession };
