import api from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

// Seva inarudisha URL kamili (http://127.0.0.1:8000/media/...).
// Tunatumia njia tu ili ipite kwenye proxy ya Vite (kama kwenye voiceService).
function toLocalUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

// ---------- Generate ----------

// POST /api/tts/generate/
// Django inatumia voice_sample_id kuchukua audio ya reference kutoka database.
export async function generateSpeech({
  text,
  voiceSampleId,
  language,
  exaggeration,
  cfgWeight,
  temperature,
  seed = 0,
}) {
  const response = await api.post(
    ENDPOINTS.TTS.GENERATE,
    {
      text,
      voice_sample_id: voiceSampleId,
      language, // Django bado inalipuuza (hardcoded "sw"), tayari kwa baadaye
      exaggeration,
      cfg_weight: cfgWeight,
      temperature,
      seed,
    },
    // Generation inaweza kuchukua dakika kadhaa
    { timeout: 5 * 60 * 1000 },
  );

  const data = response.data;
  return {
    audioUrl: toLocalUrl(data.audio_url),
    audioFile: data.audio_file,
    language: data.language,
  };
}

// Views zako zinarudisha { error: "..." }, na DRF inarudisha { detail: "..." }
export function generateErrorMessage(err) {
  if (err?.code === "ECONNABORTED") {
    return "Generation is taking too long. Please try again.";
  }

  const res = err?.response;
  if (!res) {
    return "Can't reach the server. Check your connection and try again.";
  }

  const detail = typeof res.data?.detail === "string" ? res.data.detail : "";
  const message = res.data?.error || detail;

  if (res.status === 400) {
    return message || "Please check your text and settings.";
  }
  if (res.status === 401 || res.status === 403) {
    return /csrf/i.test(detail)
      ? "Security check failed. Refresh the page and try again."
      : "Your session has expired. Please sign in again.";
  }
  if (res.status === 404) {
    return "That voice was not found. Please pick another one.";
  }
  if (res.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (res.status === 502) {
    return "The voice engine isn't available right now. Please try again shortly.";
  }
  if (res.status >= 500) {
    return "Something went wrong while generating. Please try again.";
  }

  return message || "We couldn't generate the speech. Please try again.";
}

// ---------- History ----------

// History ya sasa haina taarifa za voice. Ikipata `voice_sample` ({ id, name })
// kutoka Django, tunaitumia; vinginevyo tunaonyesha jina la jumla.
const UNKNOWN_VOICE = {
  id: "unknown",
  name: "Generated voice",
  desc: "",
  lang: "Custom",
  accent: "",
  more: 0,
  category: "custom",
  uses: 0,
};

// Jibu la seva -> muundo ambao TextToSpeechHistory na player wanaujua
export function toHistoryItem(h) {
  const vs = h.voice_sample;
  const voice = vs
    ? {
        ...UNKNOWN_VOICE,
        id: `my-${vs.id}`, // sawa na toVoice() ya voiceService
        serverId: vs.id,
        name: vs.name,
      }
    : UNKNOWN_VOICE;

  return {
    id: `tts-${h.id}`,
    serverId: h.id,
    text: h.text,
    voice,
    language: h.language,
    createdAt: h.created_at,
    audioUrl: h.audio_url ? toLocalUrl(h.audio_url) : null,
  };
}

// GET /api/media/tts-history/  ->  { success, count, history: [...] }
export async function listTtsHistory({ signal } = {}) {
  const response = await api.get(ENDPOINTS.TTS.HISTORY, { signal });
  return (response.data?.history ?? []).map(toHistoryItem);
}

export function historyErrorMessage(err) {
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
    detail ||
    res.data?.error ||
    "Could not load your history. Please try again."
  );
}
