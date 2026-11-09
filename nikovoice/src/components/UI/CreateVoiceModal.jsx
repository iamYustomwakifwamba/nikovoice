import { useEffect, useRef, useState } from "react";
import {
  FileAudio,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const MAX_RECORD_S = 30;
const MAX_UPLOAD_MB = 25;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg|oga|opus|webm)$/i;
const PEAK_BINS = 300;
const BAR_W = 3;
const BAR_GAP = 2;
const ACCENT = "#673de6";
const IDLE = "#d1d5db";

const SAMPLE_TEXT =
  "Habari, karibu kwenye nikovoice. Leo ni siku nzuri sana, na ninafurahi kushiriki sauti yangu nanyi. Tuendelee kujifunza kitu kipya kila siku.";

/* ---------- Helpers ---------- */

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const fmtSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function decodeBlob(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    ctx.close().catch(() => {});
  }
}

function peaksFrom(buffer, bins = PEAK_BINS) {
  const data = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(data.length / bins));
  const peaks = new Array(bins).fill(0);
  for (let i = 0; i < bins; i++) {
    let max = 0;
    const start = i * block;
    for (let j = 0; j < block && start + j < data.length; j++) {
      const v = Math.abs(data[start + j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  const top = Math.max(...peaks) || 1;
  return peaks.map((p) => Math.pow(p / top, 0.8));
}

// Rekodi ya kivinjari (webm/mp4) -> WAV ya mono ya 16-bit. Backend inapata muundo rahisi.
function toWavFile(buffer, name) {
  const { numberOfChannels, length, sampleRate } = buffer;
  const mono = new Float32Array(length);
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += ch[i] / numberOfChannels;
  }
  const view = new DataView(new ArrayBuffer(44 + length * 2));
  const str = (o, s) =>
    [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  str(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new File([view.buffer], name, { type: "audio/wav" });
}

function pickMime() {
  const list = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return list.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
}

function hintFor(duration) {
  if (duration < 5)
    return { ok: false, text: "A bit short. 5 to 15 seconds works best." };
  if (duration > 60)
    return { ok: false, text: "Long clip. 5 to 15 seconds is plenty." };
  return { ok: true, text: "Good length." };
}

/* ---------- Canvas ---------- */

function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
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
  return { ctx, w, h };
}

function bar(ctx, x, mid, bh) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, mid - bh / 2, BAR_W, bh, BAR_W / 2);
  else ctx.rect(x, mid - bh / 2, BAR_W, bh);
  ctx.fill();
}

function drawWave(canvas, peaks, progress) {
  const f = fitCanvas(canvas);
  if (!f) return;
  const { ctx, w, h } = f;
  const step = BAR_W + BAR_GAP;
  const count = Math.max(1, Math.floor((w + BAR_GAP) / step));
  const size = peaks.length / count;
  const offset = (w - (count * step - BAR_GAP)) / 2;
  for (let i = 0; i < count; i++) {
    const from = Math.floor(i * size);
    const to = Math.max(from + 1, Math.floor((i + 1) * size));
    let max = 0;
    for (let j = from; j < to && j < peaks.length; j++)
      if (peaks[j] > max) max = peaks[j];
    ctx.fillStyle = (i + 0.5) / count <= progress ? ACCENT : IDLE;
    bar(ctx, offset + i * step, h / 2, Math.max(4, max * h * 0.9));
  }
}

function drawLive(canvas, levels) {
  const f = fitCanvas(canvas);
  if (!f) return;
  const { ctx, w, h } = f;
  const step = BAR_W + BAR_GAP;
  const count = Math.floor((w + BAR_GAP) / step);
  const visible = levels.slice(-count);
  ctx.fillStyle = IDLE;
  for (let i = 0; i < count - visible.length; i++) {
    bar(ctx, i * step + BAR_GAP, h / 2, 4);
  }
  ctx.fillStyle = ACCENT;
  visible.forEach((lv, i) => {
    const x = w - (visible.length - i) * step + BAR_GAP;
    bar(ctx, x, h / 2, Math.max(4, Math.min(1, lv * 4) * h * 0.9));
  });
}

/* ---------- Sehemu ndogo ---------- */

function ClipPreview({ clip }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dragging = useRef(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [width, setWidth] = useState(0);
  const duration = clip.duration;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawWave(canvasRef.current, clip.peaks, duration ? time / duration : 0);
    }
  }, [clip.peaks, time, duration, width]);

  useEffect(() => {
    if (!playing) return;
    let raf;
    const loop = () => {
      if (audioRef.current) setTime(audioRef.current.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const seek = (clientX) => {
    const a = audioRef.current;
    const el = wrapRef.current;
    if (!a || !el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setTime(a.currentTime);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <audio
        ref={audioRef}
        src={clip.url}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-950 text-white hover:bg-gray-800"
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div
        ref={wrapRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && seek(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="relative h-14 min-w-0 flex-1 cursor-pointer touch-none select-none outline-none"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <span className="w-[76px] shrink-0 text-right text-[12.5px] tabular-nums text-gray-500">
        {fmt(time)} / {fmt(duration)}
      </span>
    </div>
  );
}

function Hint({ duration }) {
  const h = hintFor(duration);
  return (
    <p
      className={`mt-2 text-[12.5px] ${h.ok ? "text-emerald-700" : "text-amber-700"}`}
    >
      {h.text}
    </p>
  );
}

/* ---------- Modal ---------- */

function CreateVoiceModal({ open, onClose, onCreate }) {
  const [mode, setMode] = useState("upload");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [clips, setClips] = useState({ upload: null, record: null });
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);
  const [recState, setRecState] = useState("idle"); // idle | requesting | recording | processing | ready
  const [elapsed, setElapsed] = useState(0);

  const fileRef = useRef(null);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(0);
  const levelsRef = useRef([]);
  const startedAtRef = useRef(0);
  const lastPushRef = useRef(0);
  const lastTenthRef = useRef(-1);
  const liveCanvasRef = useRef(null);

  const busy =
    recState === "requesting" ||
    recState === "recording" ||
    recState === "processing" ||
    creating;

  const releaseMedia = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const teardown = () => {
    const rec = recorderRef.current;
    if (rec) {
      rec.onstop = null;
      rec.ondataavailable = null;
      if (rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* tayari imesimama */
        }
      }
    }
    recorderRef.current = null;
    releaseMedia();
  };

  const putClip = (key, clip) => {
    const old = clipsRef.current[key];
    if (old?.url) URL.revokeObjectURL(old.url);
    setClips((c) => ({ ...c, [key]: clip }));
  };

  // Weka upya kila modal inapofunguliwa, na safisha inapofungwa
  useEffect(() => {
    if (!open) return;
    setMode("upload");
    setName("");
    setAgree(false);
    setClips({ upload: null, record: null });
    setError("");
    setReading(false);
    setCreating(false);
    setRecState("idle");
    setElapsed(0);
    return () => {
      teardown();
      Object.values(clipsRef.current).forEach(
        (c) => c?.url && URL.revokeObjectURL(c.url),
      );
    };
  }, [open]);

  const close = () => {
    teardown();
    onClose();
  };
  const softClose = () => {
    if (!busy) close();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && softClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  /* ----- Upload ----- */

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    if (!(file.type.startsWith("audio/") || AUDIO_EXT.test(file.name))) {
      setError("Please choose an audio file (MP3, WAV, M4A, FLAC or OGG).");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setReading(true);
    try {
      const buffer = await decodeBlob(file);
      putClip("upload", {
        file,
        url: URL.createObjectURL(file),
        duration: buffer.duration,
        peaks: peaksFrom(buffer),
      });
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, "").slice(0, 60));
    } catch {
      setError("We couldn't read that file. Try a WAV or MP3.");
    } finally {
      setReading(false);
    }
  };

  /* ----- Record ----- */

  const stopRecording = () => {
    cancelAnimationFrame(rafRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      setRecState("processing");
      rec.stop(); // inaita onstop
    }
  };

  const startRecording = async () => {
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Recording isn't supported in this browser. Try Chrome, Edge or Firefox, or upload a file instead.",
      );
      return;
    }
    setRecState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickMime();
      const rec = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        releaseMedia();
        try {
          const buffer = await decodeBlob(blob);
          const file = toWavFile(buffer, `recording-${Date.now()}.wav`);
          putClip("record", {
            file,
            url: URL.createObjectURL(file),
            duration: buffer.duration,
            peaks: peaksFrom(buffer),
          });
          setRecState("ready");
        } catch {
          setError("We couldn't process that recording. Please try again.");
          setRecState("idle");
        }
      };
      recorderRef.current = rec;

      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      levelsRef.current = [];
      lastPushRef.current = 0;
      lastTenthRef.current = -1;
      startedAtRef.current = performance.now();
      setElapsed(0);
      rec.start(250);
      setRecState("recording");

      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        const now = performance.now();
        const t = (now - startedAtRef.current) / 1000;
        if (t >= MAX_RECORD_S) {
          stopRecording();
          return;
        }
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        if (now - lastPushRef.current >= 60) {
          lastPushRef.current = now;
          levelsRef.current.push(Math.sqrt(sum / buf.length));
          if (levelsRef.current.length > 600) levelsRef.current.shift();
        }
        if (liveCanvasRef.current)
          drawLive(liveCanvasRef.current, levelsRef.current);
        const tenth = Math.floor(t * 10);
        if (tenth !== lastTenthRef.current) {
          lastTenthRef.current = tenth;
          setElapsed(t);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      teardown();
      setRecState("idle");
      setError(
        e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
          ? "Microphone access was blocked. Allow it in your browser's address bar, then try again."
          : e?.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "We couldn't start the recording.",
      );
    }
  };

  const recordAgain = () => {
    putClip("record", null);
    setElapsed(0);
    setRecState("idle");
    setError("");
  };

  /* ----- Submit ----- */

  if (!open) return null;

  const clip = clips[mode];
  const canCreate = Boolean(name.trim() && clip && agree && !busy);

  const submit = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), file: clip.file, source: mode });
    } catch (e) {
      setError(e?.message || "We couldn't create the voice. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={softClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new voice"
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[min(760px,calc(100vh-2rem))] w-[min(520px,100%)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">
              Create new voice
            </h2>
            <p className="mt-1 text-[14px] text-gray-500">
              Upload or record a clean clip and we will clone it.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="grid h-8 w-8 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Name */}
        <label
          htmlFor="voice-name"
          className="mb-1.5 mt-5 block text-[14px] font-medium text-gray-900"
        >
          Voice name
        </label>
        <input
          id="voice-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My narrator voice"
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[14px] outline-none transition-colors placeholder:text-gray-400 focus:border-[#673de6]"
        />

        {/* Source */}
        <p className="mb-1.5 mt-4 text-[14px] font-medium text-gray-900">
          Reference audio
        </p>
        <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-0.5">
          {[
            ["upload", "Upload", Upload],
            ["record", "Record", Mic],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              disabled={busy && mode !== id}
              onClick={() => {
                setMode(id);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors disabled:opacity-50 ${
                mode === id
                  ? "bg-white text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {mode === "upload" ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.webm"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              {clip ? (
                <>
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#673de6]/10 text-[#673de6]">
                      <FileAudio size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-gray-900">
                        {clip.file.name}
                      </span>
                      <span className="block text-[12.5px] text-gray-500">
                        {fmtSize(clip.file.size)} · {fmt(clip.duration)}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      title="Remove"
                      onClick={() => putClip("upload", null)}
                      className="grid h-8 w-8 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ClipPreview key={clip.url} clip={clip} />
                  <Hint duration={clip.duration} />
                </>
              ) : (
                <button
                  type="button"
                  disabled={reading}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 transition-colors ${
                    dragOver
                      ? "border-[#673de6] bg-[#673de6]/5"
                      : "border-gray-300 hover:border-[#673de6] hover:bg-[#673de6]/5"
                  }`}
                >
                  {reading ? (
                    <>
                      <Loader2
                        size={22}
                        className="animate-spin text-[#673de6]"
                      />
                      <span className="text-[14px] text-gray-700">
                        Reading audio...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#673de6]/10 text-[#673de6]">
                        <Upload size={20} />
                      </span>
                      <span className="text-[14px] font-medium text-gray-900">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-[12.5px] text-gray-500">
                        MP3, WAV, M4A, FLAC or OGG, up to {MAX_UPLOAD_MB} MB
                      </span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              {recState === "idle" && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 px-4 py-6">
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label="Start recording"
                    className="grid h-16 w-16 place-items-center rounded-full bg-[#673de6] text-white transition hover:bg-[#5b32d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#673de6] focus-visible:ring-offset-2 active:scale-95"
                  >
                    <Mic size={26} />
                  </button>
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-gray-900">
                      Click to start recording
                    </p>
                    <p className="text-[12.5px] text-gray-500">
                      Up to {MAX_RECORD_S} seconds. Use a quiet room.
                    </p>
                  </div>
                </div>
              )}

              {recState === "requesting" && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 px-4 py-8">
                  <Loader2 size={22} className="animate-spin text-[#673de6]" />
                  <p className="text-[14px] text-gray-700">
                    Waiting for microphone permission...
                  </p>
                </div>
              )}

              {recState === "recording" && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                      Recording
                    </span>
                    <span className="tabular-nums text-gray-500">
                      {fmt(elapsed)} / {fmt(MAX_RECORD_S)}
                    </span>
                  </div>
                  <canvas ref={liveCanvasRef} className="h-[72px] w-full" />
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-[14px] font-medium text-white hover:bg-gray-800"
                    >
                      <Square size={13} fill="currentColor" />
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {recState === "processing" && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 px-4 py-8">
                  <Loader2 size={22} className="animate-spin text-[#673de6]" />
                  <p className="text-[14px] text-gray-700">Processing...</p>
                </div>
              )}

              {recState === "ready" && clip && (
                <>
                  <ClipPreview key={clip.url} clip={clip} />
                  <div className="mt-2 flex items-center justify-between">
                    <Hint duration={clip.duration} />
                    <button
                      type="button"
                      onClick={recordAgain}
                      className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#673de6] hover:underline"
                    >
                      <RotateCcw size={13} />
                      Record again
                    </button>
                  </div>
                </>
              )}

              {(recState === "idle" || recState === "recording") && (
                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <p className="text-[12.5px] font-medium text-gray-700">
                    Need something to read?
                  </p>
                  <p className="mt-0.5 text-[13px] leading-5 text-gray-600">
                    {SAMPLE_TEXT}
                  </p>
                  <p className="mt-1 text-[12px] text-gray-500">
                    Any text works. Speak in the language you will generate.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700"
          >
            {error}
          </p>
        )}

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#673de6]"
          />
          I confirm this is my own voice or I have permission to clone it.
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-gray-300 px-4 py-2 text-[14px] font-medium text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={submit}
            className="flex items-center gap-2 rounded-lg bg-[#673de6] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#5b32d4] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            {creating ? "Creating..." : "Create voice"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateVoiceModal;
