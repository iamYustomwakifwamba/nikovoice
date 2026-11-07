import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play } from "lucide-react";

const PEAK_BINS = 400;
const SKELETON_BARS = 140;
const BAR_W = 3;
const BAR_GAP = 2;
const ACCENT = "#673de6";
const IDLE = "#d1d5db";

// Maumbo ya kivuli cha wave (hayabadiliki)
const SKELETON = Array.from(
  { length: SKELETON_BARS },
  (_, i) => 0.15 + 0.85 * Math.abs(Math.sin(i * 0.37) * Math.sin(i * 0.11 + 1)),
);

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

// Soma audio halisi na utengeneze "peaks" za waveform
async function computePeaks(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / PEAK_BINS));
    const peaks = new Array(PEAK_BINS);
    for (let i = 0; i < PEAK_BINS; i++) {
      let max = 0;
      const start = i * block;
      for (let j = 0; j < block && start + j < data.length; j++) {
        const v = Math.abs(data[start + j]);
        if (v > max) max = v;
      }
      peaks[i] = max;
    }
    const top = Math.max(...peaks) || 1;
    return {
      peaks: peaks.map((p) => Math.pow(p / top, 0.8)),
      duration: audio.duration,
    };
  } finally {
    ctx.close();
  }
}

function resample(peaks, count) {
  const out = new Array(count);
  const size = peaks.length / count;
  for (let i = 0; i < count; i++) {
    const from = Math.floor(i * size);
    const to = Math.max(from + 1, Math.floor((i + 1) * size));
    let max = 0;
    for (let j = from; j < to && j < peaks.length; j++) {
      if (peaks[j] > max) max = peaks[j];
    }
    out[i] = max;
  }
  return out;
}

function drawWave(canvas, peaks, progress) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;

  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const count = Math.max(1, Math.floor((w + BAR_GAP) / (BAR_W + BAR_GAP)));
  const bars = resample(peaks, count);
  const used = count * (BAR_W + BAR_GAP) - BAR_GAP;
  const offset = (w - used) / 2;
  const mid = h / 2;

  for (let i = 0; i < count; i++) {
    const barH = Math.max(4, bars[i] * h * 0.92);
    const x = offset + i * (BAR_W + BAR_GAP);
    ctx.fillStyle = (i + 0.5) / count <= progress ? ACCENT : IDLE;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, mid - barH / 2, BAR_W, barH, 1.5);
    else ctx.rect(x, mid - barH / 2, BAR_W, barH);
    ctx.fill();
  }
}

function WaveformPlayer({
  item,
  loading = false,
  audioRef,
  onPlay,
  autoPlay = true,
}) {
  const innerRef = useRef(null);
  const ref = audioRef ?? innerRef;
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const draggingRef = useRef(false);
  const autoPlayedRef = useRef(null);

  const [data, setData] = useState(null); // { url, peaks, duration }
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [width, setWidth] = useState(0);

  const url = item?.audioUrl ?? null;
  const peaks = data && data.url === url ? data.peaks : null;
  const ready = !loading && Boolean(url) && Boolean(peaks);

  // Tengeneza waveform kila audio mpya inapofika
  useEffect(() => {
    setTime(0);
    setPlaying(false);
    if (!url) return;

    let cancelled = false;
    computePeaks(url)
      .then(({ peaks, duration }) => {
        if (cancelled) return;
        setData({ url, peaks, duration });
        setDuration(duration);
      })
      .catch(() => {
        // Ikishindwa kusoma (mfano CORS), onyesha mistari ya kawaida
        if (cancelled) return;
        setData({ url, peaks: new Array(PEAK_BINS).fill(0.35), duration: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Cheza yenyewe waveform ikiwa tayari
  useEffect(() => {
    if (!ready || !autoPlay || autoPlayedRef.current === url) return;
    autoPlayedRef.current = url;
    ref.current?.play().catch(() => {});
  }, [ready, autoPlay, url, ref]);

  // Fuatilia upana
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Chora waveform
  useEffect(() => {
    if (!peaks || !canvasRef.current) return;
    drawWave(canvasRef.current, peaks, duration ? time / duration : 0);
  }, [peaks, time, duration, width]);

  // Progress laini wakati inacheza
  useEffect(() => {
    if (!playing) return;
    let raf;
    const tick = () => {
      const a = ref.current;
      if (a) setTime(a.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, ref]);

  const toggle = () => {
    const a = ref.current;
    if (!a || !ready) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const seekTo = (clientX) => {
    const a = ref.current;
    const el = wrapRef.current;
    if (!a || !el || !duration || !ready) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setTime(a.currentTime);
  };

  const nudge = (sec) => {
    const a = ref.current;
    if (!a || !ready) return;
    a.currentTime = Math.min(Math.max(a.currentTime + sec, 0), duration);
    setTime(a.currentTime);
  };

  return (
    <div>
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="auto"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setDuration(d);
          }}
          onPlay={() => {
            setPlaying(true);
            onPlay?.();
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gray-950 text-white transition-opacity hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {playing ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div
          ref={wrapRef}
          role="slider"
          tabIndex={ready ? 0 : -1}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          onPointerDown={(e) => {
            if (!ready) return;
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekTo(e.clientX);
          }}
          onPointerMove={(e) => draggingRef.current && seekTo(e.clientX)}
          onPointerUp={() => (draggingRef.current = false)}
          onPointerCancel={() => (draggingRef.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") nudge(-5);
            if (e.key === "ArrowRight") nudge(5);
          }}
          className={`relative h-[120px] min-w-0 flex-1 touch-none select-none outline-none ${
            ready ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {/* Kivuli cha wave wakati inatengenezwa */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 flex items-center gap-[2px] transition-opacity duration-700 ${
              ready ? "opacity-0" : "opacity-100"
            }`}
          >
            {SKELETON.map((h, i) => (
              <span
                key={i}
                className="flex-1 animate-pulse rounded-full bg-[#673de6]/30"
                style={{
                  height: `${h * 92}%`,
                  minHeight: 4,
                  animationDelay: `-${i * 35}ms`,
                  animationDuration: "1.8s",
                }}
              />
            ))}
          </div>

          {/* Waveform halisi */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between pl-16 text-[13px] text-gray-500">
        <span className="tabular-nums">
          {ready ? `${fmt(time)} / ${fmt(duration)}` : "Generating audio..."}
        </span>
        {ready && (
          <a
            href={url}
            download={`nikovoice-${item.id}.wav`}
            aria-label="Download"
            title="Download"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-800 hover:bg-gray-100"
          >
            <Download size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export default WaveformPlayer;