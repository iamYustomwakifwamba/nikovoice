import { useState } from "react";
import {
  AudioLines,
  ChevronDown,
  Download,
  Mic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
} from "lucide-react";
import { voiceLabel } from "./TtsShared";

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

function SkipBtn({ dir, onClick }) {
  const Icon = dir < 0 ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Back 10 seconds" : "Forward 10 seconds"}
      title={dir < 0 ? "Back 10 seconds" : "Forward 10 seconds"}
      className="relative grid h-9 w-9 place-items-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/20"
    >
      <Icon size={22} strokeWidth={1.5} />
      <span className="absolute text-[8px] font-bold leading-none">10</span>
    </button>
  );
}

function TextToSpeechPlayer({ item, audioRef, onPlayingChange, onClose }) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    a.paused ? a.play() : a.pause();
  };

  const skip = (sec) => {
    const a = audioRef.current;
    if (!a) return;
    const max = Number.isFinite(a.duration) ? a.duration : a.currentTime;
    a.currentTime = Math.min(Math.max(a.currentTime + sec, 0), max);
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (a) a.currentTime = Number(e.target.value);
  };

  // Placeholder: badilisha na share link halisi kutoka backend
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "nikovoice", text: item.text });
      } else {
        await navigator.clipboard.writeText(item.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* mtumiaji alighairi */
    }
  };

  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)] items-center gap-4 border-t border-gray-200 bg-white px-6 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]">
      <audio
        ref={audioRef}
        src={item.audioUrl}
        autoPlay
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        onPlay={() => {
          setPlaying(true);
          onPlayingChange(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlayingChange(false);
        }}
        onEnded={() => {
          setPlaying(false);
          onPlayingChange(false);
        }}
      />

      {/* Left: info */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${
            playing ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          <AudioLines size={20} strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <p
            title={item.text}
            className="truncate text-[14px] font-semibold text-gray-900"
          >
            {item.text}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-gray-500">
            <Mic size={13} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate">{voiceLabel(item.voice)}</span>
          </p>
        </div>
      </div>

      {/* Center: controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <SkipBtn dir={-1} onClick={() => skip(-10)} />
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-950 text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 active:scale-95"
          >
            {playing ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <SkipBtn dir={1} onClick={() => skip(10)} />
        </div>

        <div className="flex w-full items-center gap-3 text-[12px] text-gray-500">
          <span className="w-9 text-right tabular-nums">{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(time, duration || 0)}
            onChange={seek}
            aria-label="Seek"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full transition-all hover:h-1.5 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gray-950 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-950"
            style={{
              background: `linear-gradient(to right, #030712 ${pct}%, #e5e7eb ${pct}%)`,
            }}
          />
          <span className="w-9 tabular-nums">{fmt(duration)}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={share}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/20"
        >
          <Share2 size={16} />
          {copied ? "Copied" : "Share"}
        </button>
        <a
          href={item.audioUrl}
          download={`nikovoice-${item.id}.wav`}
          aria-label="Download"
          title="Download"
          className="grid h-9 w-9 place-items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/20"
        >
          <Download size={18} />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          title="Close player"
          className="grid h-9 w-9 place-items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/20"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}

export default TextToSpeechPlayer;