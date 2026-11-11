import api from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

// Seva inarudisha URL kamili (http://127.0.0.1:8000/media/...).
// Tunatumia njia tu ili ipite kwenye proxy ya Vite.
function toLocalUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

// Jibu la seva -> muundo ambao UI ya Voices inaujua
export function toVoice(sample) {
  return {
    id: `my-${sample.id}`,
    serverId: sample.id,
    name: sample.name,
    desc: "",
    lang: "Custom",
    accent: "",
    more: 0,
    category: "custom",
    uses: 0,
    previewUrl: toLocalUrl(sample.audio_file),
    createdAt: sample.created_at,
  };
}

// GET /api/media/voice-samples/  ->  { count, voice_samples: [...] }
export async function listVoiceSamples({ signal } = {}) {
  const response = await api.get(ENDPOINTS.VOICES.LIST, { signal });
  return (response.data?.voice_samples ?? []).map(toVoice);
}

// Ujumbe wa kosa wakati wa kupakia orodha ya voices
export function listErrorMessage(err) {
  const res = err?.response;
  if (!res) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (res.status === 401 || res.status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (res.status >= 500) return "Server error. Please try again later.";

  const detail = typeof res.data?.detail === "string" ? res.data.detail : "";
  return (
    detail || res.data?.error || "Could not load your voices. Please try again."
  );
}

// Inatuma name + audio_file kama multipart (majina ya sehemu ni yale ya view yako)
export async function uploadVoiceSample({ name, file }) {
  const form = new FormData();
  form.append("name", name);
  form.append("audio_file", file, file.name);

  const response = await api.post(ENDPOINTS.VOICES.UPLOAD, form);
  return toVoice(response.data.voice_sample);
}

// View yako inarudisha { error: "..." }, na DRF inarudisha { detail: "..." }
export function uploadErrorMessage(err) {
  const res = err?.response;
  if (!res) {
    return "Can't reach the server. Check your connection and try again.";
  }

  const detail = typeof res.data?.detail === "string" ? res.data.detail : "";

  if (res.status === 400) {
    return res.data?.error || detail || "Please check the name and audio file.";
  }
  if (res.status === 401 || res.status === 403) {
    return /csrf/i.test(detail)
      ? "Security check failed. Refresh the page and try again."
      : "Your session has expired. Please sign in again.";
  }
  if (res.status === 413) return "That file is too large for the server.";
  if (res.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (res.status >= 500) return "Server error. Please try again later.";

  return (
    res.data?.error ||
    detail ||
    "We couldn't upload the voice. Please try again."
  );
}
