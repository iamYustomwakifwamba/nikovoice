import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "./endpoints";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Axios inasoma cookie hii na kuweka header kila ombi (asili ileile tu)
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

function hasCsrfCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("csrftoken="));
}

let csrfRequest = null;

// Inaomba cookie ya CSRF kutoka Django. Hairudishi token, kwa sababu axios inaisoma yenyewe.
export function initializeCSRF() {
  if (!csrfRequest) {
    csrfRequest = api.get(ENDPOINTS.AUTH.CSRF).finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
}

// Hakikisha cookie ipo kabla ya ombi lolote lisilo la kusoma
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS", "TRACE"];

api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toUpperCase();
  if (!SAFE_METHODS.includes(method) && !hasCsrfCookie()) {
    await initializeCSRF();
  }
  return config;
});

export default api;