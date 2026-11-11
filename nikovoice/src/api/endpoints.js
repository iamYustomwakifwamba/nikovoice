export const API_BASE_URL = "";

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register/`,
    CSRF: `${API_BASE_URL}/api/auth/csrf/`,
    LOGIN: `${API_BASE_URL}/api/auth/login/`,
    PROFILE: `${API_BASE_URL}/api/auth/profile/`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout/`,
  },
  VOICES: {
    // Linganisha prefix na include() ya media_library kwenye config/urls.py
    UPLOAD: `${API_BASE_URL}/api/media/voice-samples/upload/`,
    LIST: `${API_BASE_URL}/api/media/voice-samples/`,
  },
  TTS: {
    // Linganisha na include("tts_engine.urls") kwenye config/urls.py
    GENERATE: `${API_BASE_URL}/api/tts/generate/`,
    // History iko kwenye media_library (api/media/), si tts_engine
    HISTORY: `${API_BASE_URL}/api/media/tts-history/`,
  },
};