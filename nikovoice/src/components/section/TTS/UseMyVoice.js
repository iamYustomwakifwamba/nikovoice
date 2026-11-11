import { useCallback, useEffect, useState } from "react";
import {
  listVoiceSamples,
  listErrorMessage,
  uploadVoiceSample,
  uploadErrorMessage,
} from "../../../services/voiceService";

// User voices kutoka API: GET /api/media/voice-samples/ (na upload ya voice mpya)
export default function useMyVoices() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      setVoices(await listVoiceSamples({ signal }));
    } catch (err) {
      // Tumeghairi (component imeondoka), usionyeshe kosa
      if (signal?.aborted || err?.code === "ERR_CANCELED") return;
      setError(listErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  // Inapakia faili kwenye API, kisha inaiongeza juu ya orodha
  const upload = useCallback(async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const name = file.name.replace(/\.[^.]+$/, "");
      const created = await uploadVoiceSample({ name, file });
      // Tunabaki na `file` ili TTS iweze kuitumia kama audio_prompt
      setVoices((list) => [{ ...created, file }, ...list]);
      setError("");
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }, []);

  return { voices, loading, error, reload, uploading, uploadError, upload };
}
