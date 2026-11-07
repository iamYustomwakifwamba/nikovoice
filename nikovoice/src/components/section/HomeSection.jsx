import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Mic,
  ArrowUp,
  AudioLines,
  Music,
  Grid2x2,
  Image as ImageIcon,
  Video,
  Languages,
  UserRound,
  FileText,
  BookText,
  MoreHorizontal,
  Play,
} from "lucide-react";

const quickActions = [
  { id: "text-to-speech", label: "Speech", icon: AudioLines },
  { id: "music", label: "Music", icon: Music },
  { id: "voices", label: "Voice Clone", icon: Grid2x2 },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "dubbing", label: "Dubbing", icon: Languages },
  { id: "avatar", label: "Avatar", icon: UserRound },
  { id: "transcribe", label: "Transcribe", icon: FileText },
  { id: "audiobooks", label: "Audiobooks", icon: BookText },
  { id: "more", label: "More", icon: MoreHorizontal },
];

const slides = [
  {
    title: "Introducing Niko v1",
    subtitle: "Our fastest and most emotive voice model yet.",
    cta: "Try v1",
    features: [
      "Inline voice control",
      "Consistent speaker identity",
      "Seamless regenerations",
      "Better multilingual quality",
      "More expressive voices",
    ],
  },
  {
    title: "Introducing Niko Dub v1",
    subtitle: "Dub your videos into any language, keeping the original voice.",
    cta: "Try Dub v1",
    features: [
      "Automatic speech translation",
      "Original voice preserved",
      "Multi-speaker detection",
      "Natural timing and pacing",
      "Edit and regenerate any line",
    ],
  },
  {
    title: "Voice Cloning",
    subtitle: "Clone any voice from just a short audio sample.",
    cta: "Clone now",
    features: [
      "Instant voice cloning",
      "Works in many languages",
      "Keeps tone and accent",
      "Private by default",
      "Ready in seconds",
    ],
  },
  {
    title: "Dubbing Studio",
    subtitle: "Translate your videos while keeping the original voice.",
    cta: "Start dubbing",
    features: [
      "Automatic translation",
      "Speaker detection",
      "Lip-friendly timing",
      "Edit every line",
      "Export in one click",
    ],
  },
];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 60;

function Orb({ className, style }) {
  return <div className={`absolute rounded-full ${className}`} style={style} />;
}

function Orbs() {
  return (
    <div className="relative hidden w-[30%] shrink-0 md:block">
      <Orb
        className="left-[2%] top-[20%] h-[115px] w-[115px]"
        style={{
          background:
            "radial-gradient(circle at 40% 30%, #f5d0fe, #a78bfa 55%, #673de6)",
        }}
      />
      <span className="absolute left-[-14%] top-[12%] z-10 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-900">
        Natural
      </span>
      <Orb
        className="left-[56%] top-[-22%] h-[85px] w-[85px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #fde68a, #f59e0b 70%)",
        }}
      />
      <Orb
        className="left-[84%] top-[-4%] h-[60px] w-[60px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #6d28d9, #1e1b4b 80%)",
        }}
      />
      <Orb
        className="left-[88%] top-[34%] h-[55px] w-[55px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #fdba74, #ec4899 80%)",
        }}
      />
      <Orb
        className="left-[56%] top-[74%] h-[85px] w-[85px]"
        style={{
          background:
            "radial-gradient(circle at 40% 30%, #bae6fd, #38bdf8 50%, #1e3a8a)",
        }}
      />
      <Orb
        className="left-[84%] top-[66%] h-[60px] w-[60px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #a7f3d0, #10b981 60%, #064e3b)",
        }}
      />
      <button
        type="button"
        aria-label="Play sample"
        className="absolute left-[68%] top-[40%] z-10 grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-950"
      >
        <Play size={14} fill="currentColor" />
      </button>
    </div>
  );
}

function HomeSection({ onNavigate }) {
  const [prompt, setPrompt] = useState("");
  const [slide, setSlide] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  const startX = useRef(0);
  const moved = useRef(false);

  const total = slides.length;
  const next = () => setSlide((s) => (s + 1) % total);
  const prev = () => setSlide((s) => (s - 1 + total) % total);

  // Auto slide
  useEffect(() => {
    if (paused || dragging) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, dragging, slide]);

  // Drag / swipe handlers
  const onPointerDown = (e) => {
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const diff = e.clientX - startX.current;
    if (Math.abs(diff) > 5) moved.current = true;
    setDragX(diff);
  };

  const endDrag = () => {
    if (!dragging) return;
    if (dragX <= -SWIPE_THRESHOLD) next();
    else if (dragX >= SWIPE_THRESHOLD) prev();
    setDragging(false);
    setDragX(0);
  };

  const go = (id) => {
    if (["text-to-speech", "voices", "dubbing"].includes(id)) onNavigate(id);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col items-center pt-24">
      {/* Hero */}
      <h1 className="text-[28px] font-medium tracking-tight text-gray-900">
        What would you like to create?
      </h1>

      <div className="mt-5 flex h-[54px] w-full max-w-[650px] items-center gap-2 rounded-full border border-gray-300 bg-white px-3 transition-colors focus-within:border-[#673de6] focus-within:ring-1 focus-within:ring-[#673de6]">
        <span
          className="h-7 w-7 shrink-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #c4b5fd, #673de6 60%, #3b1d9e)",
          }}
        />
        <button
          type="button"
          aria-label="Add"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-900 hover:bg-gray-100"
        >
          <Plus size={18} />
        </button>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Generate a podcast intro for my show..."
          className="min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
        />
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
          Alpha
        </span>
        <button
          type="button"
          aria-label="Voice input"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-900 hover:bg-gray-100"
        >
          <Mic size={18} />
        </button>
        <button
          type="button"
          aria-label="Send"
          disabled={!prompt.trim()}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition-colors ${
            prompt.trim() ? "bg-[#673de6] hover:opacity-90" : "bg-gray-400"
          }`}
        >
          <ArrowUp size={18} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="mt-[170px] flex flex-wrap justify-center">
        {quickActions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className="group flex w-[97px] flex-col items-center gap-2.5"
          >
            <span className="grid h-[42px] w-[42px] place-items-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors group-hover:border-[#673de6] group-hover:bg-[#673de6]/10 group-hover:text-[#673de6]">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <span className="text-[13px] font-medium text-gray-900">
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Promo carousel */}
      <div
        className={`relative mt-9 h-[192px] w-full touch-pan-y select-none overflow-hidden rounded-[28px] border border-gray-200 bg-white ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => {
          endDrag();
          setPaused(false);
        }}
        onPointerCancel={endDrag}
        onMouseEnter={() => setPaused(true)}
        onClickCapture={(e) => {
          // Zuia click ikiwa mtumiaji alikuwa anavuta tu
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
          }
        }}
      >
        <div
          className={`flex h-full ${
            dragging ? "" : "transition-transform duration-500 ease-out"
          }`}
          style={{
            transform: `translateX(calc(${-slide * 100}% + ${dragX}px))`,
          }}
        >
          {slides.map((s) => (
            <div key={s.title} className="flex h-full w-full shrink-0">
              {/* Left: features */}
              <ul className="hidden w-[30%] shrink-0 flex-col justify-center gap-[7px] pl-8 text-sm text-gray-500 md:flex">
                {s.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {/* Center: text */}
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <h2 className="text-2xl font-medium tracking-tight text-gray-900">
                  {s.title}
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">{s.subtitle}</p>
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    className="rounded-lg bg-gray-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    {s.cta}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-gray-900 hover:underline"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              {/* Right: orbs */}
              <Orbs />
            </div>
          ))}
        </div>
      </div>

      {/* Carousel dots */}
      <div className="mt-5 flex items-center gap-1.5 pb-10">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setSlide(i)}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === slide ? "bg-gray-950" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default HomeSection;
