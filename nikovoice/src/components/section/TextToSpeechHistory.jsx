import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  Check,
  Download,
  Mic,
  Pause,
  Play,
  Plus,
  Search,
} from "lucide-react";
import { voiceLabel } from "./ttsShared";

const DAY = 24 * 60 * 60 * 1000;

const DATE_OPTIONS = [
  { id: "", label: "All time" },
  { id: "1", label: "Last 24 hours" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
];

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function FilterMenu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = options.find((o) => o.id === value);
  const active = value !== "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors ${
          active
            ? "border-[#673de6] bg-[#673de6]/10 text-[#673de6]"
            : "border-gray-200 text-gray-900 hover:bg-gray-50"
        }`}
      >
        <Plus size={13} />
        <span className="max-w-[160px] truncate">
          {active ? current?.label : label}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 min-w-[220px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-md">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-gray-900 hover:bg-gray-100"
            >
              <span className="truncate">{o.label}</span>
              {value === o.id && (
                <Check size={14} className="shrink-0 text-[#673de6]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, href, download, children }) {
  const cls =
    "grid h-8 w-8 place-items-center rounded-lg text-gray-900 hover:bg-gray-200";
  if (href) {
    return (
      <a
        href={href}
        download={download}
        title={label}
        aria-label={label}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cls}
    >
      {children}
    </button>
  );
}

function TextToSpeechHistory({
  items,
  nowPlayingId,
  isPlaying,
  onPlay,
  onUseText,
}) {
  const [query, setQuery] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [range, setRange] = useState("");

  const voiceOptions = useMemo(() => {
    const map = new Map();
    items.forEach((i) => map.set(i.voice.id, i.voice));
    return [
      { id: "", label: "All voices" },
      ...[...map.values()].map((v) => ({ id: v.id, label: voiceLabel(v) })),
    ];
  }, [items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = range ? Date.now() - Number(range) * DAY : 0;

    return items.filter(
      (i) =>
        (!q || i.text.toLowerCase().includes(q)) &&
        (!voiceId || i.voice.id === voiceId) &&
        new Date(i.createdAt).getTime() >= cutoff,
    );
  }, [items, query, voiceId, range]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 pt-4">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 transition-colors focus-within:border-[#673de6]">
          <Search size={16} className="shrink-0 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterMenu
            label="Voice"
            value={voiceId}
            options={voiceOptions}
            onChange={setVoiceId}
          />
          <FilterMenu
            label="Date"
            value={range}
            options={DATE_OPTIONS}
            onChange={setRange}
          />
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-6">
        {list.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-gray-500">
            {items.length === 0
              ? "Your generated speech will appear here."
              : "No results found."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((item) => {
              const isCurrent = nowPlayingId === item.id;
              const showPause = isCurrent && isPlaying;

              return (
                <li key={item.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-100 focus-within:bg-gray-100 ${
                      isCurrent ? "bg-gray-100" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => item.audioUrl && onPlay(item)}
                      className="min-w-0 flex-1 text-left outline-none"
                    >
                      <p className="truncate text-[15px] font-semibold text-gray-900">
                        {item.text}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-normal text-gray-500">
                        <Mic
                          size={13}
                          strokeWidth={1.75}
                          className="shrink-0"
                        />
                        <span className="truncate">
                          {voiceLabel(item.voice)}
                        </span>
                        <span className="shrink-0">
                          · {timeAgo(item.createdAt)}
                        </span>
                      </p>
                    </button>

                    <div
                      className={`shrink-0 items-center gap-0.5 ${
                        isCurrent
                          ? "flex"
                          : "hidden group-hover:flex group-focus-within:flex"
                      }`}
                    >
                      {item.audioUrl && (
                        <ActionBtn
                          label={showPause ? "Pause" : "Play"}
                          onClick={() => onPlay(item)}
                        >
                          {showPause ? (
                            <Pause size={16} fill="currentColor" />
                          ) : (
                            <Play size={16} fill="currentColor" />
                          )}
                        </ActionBtn>
                      )}
                      <ActionBtn
                        label="Use this text"
                        onClick={() => onUseText(item)}
                      >
                        <AlignLeft size={16} />
                      </ActionBtn>
                      {item.audioUrl && (
                        <ActionBtn
                          label="Download"
                          href={item.audioUrl}
                          download={`nikovoice-${item.id}.wav`}
                        >
                          <Download size={16} />
                        </ActionBtn>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TextToSpeechHistory;
