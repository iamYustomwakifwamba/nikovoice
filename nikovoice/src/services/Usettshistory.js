import { useCallback, useEffect, useState } from "react";
import {
  listTtsHistory,
  historyErrorMessage,
} from "./Ttsservice";

// History ya TTS kutoka API: GET /api/media/tts-history/
export default function useTtsHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      setItems(await listTtsHistory({ signal }));
    } catch (err) {
      // Tumeghairi (component imeondoka), usionyeshe kosa
      if (signal?.aborted || err?.code === "ERR_CANCELED") return;
      setError(historyErrorMessage(err));
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

  // Audio mpya ikitengenezwa, iweke juu ya orodha mara moja
  const addItem = useCallback(
    (item) => setItems((list) => [item, ...list]),
    [],
  );

  return { items, loading, error, reload, addItem };
}
