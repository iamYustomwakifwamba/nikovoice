import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  ArrowDownUp,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Film,
  GraduationCap,
  Loader2,
  Megaphone,
  MessageCircle,
  Search,
  Share2,
  Smile,
  Upload,
  Users,
  X,
} from "lucide-react";
import { VOICES, VoiceAvatar, voiceLabel } from "./TtsShared";
import WaveformPlayer from "./WaveformPlayer";

const MAX_CHARS = 5000;
const TEXT_MIN_H = 160; // urefu wa chini wa input (px)
const TEXT_MAX_H = 360; // ukizidi, input inaanza kuscroll

const CATEGORIES = [
  { id: "conversational", label: "Conversational", icon: MessageCircle },
  { id: "narration", label: "Narration", icon: BookOpen },
  { id: "characters", label: "Characters", icon: Smile },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "educational", label: "Educational", icon: GraduationCap },
  { id: "advertisement", label: "Advertisement", icon: Megaphone },
  { id: "entertainment", label: "Entertainment", icon: Film },
];

const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "neutral", label: "Neutral" },
];

const AGES = [
  { id: "young", label: "Young" },
  { id: "middle", label: "Middle Aged" },
  { id: "old", label: "Old" },
];

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function Chip({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[14px] transition-colors ${
        active
          ? "border-[#673de6] bg-[#673de6]/10 text-[#673de6]"
          : "border-gray-200 text-gray-900 hover:bg-gray-50"
      }`}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

function FilterRow({ label, open, onToggle, badge, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-[14px] font-medium text-gray-900"
      >
        <span className="flex items-center gap-2">
          {label}
          {badge ? (
            <span className="rounded-full bg-[#673de6] px-1.5 text-[11px] text-white">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            open ? "rotate-180" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="flex flex-wrap gap-2 pb-3">{children}</div>}
    </div>
  );
}

function VoiceRow({ v, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        selected ? "bg-[#673de6]/10" : "hover:bg-gray-50"
      }`}
    >
      <VoiceAvatar voice={v} size={40} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-gray-900">
        {voiceLabel(v)}
      </span>

      <span className="hidden w-[210px] shrink-0 items-center gap-2 text-[14px] sm:flex">
        <span className="text-gray-900">{v.lang}</span>
        <span className="text-gray-500">{v.accent}</span>
        {v.more > 0 && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
            +{v.more}
          </span>
        )}
      </span>

      {v.uses != null && (
        <span className="hidden w-[130px] shrink-0 items-center gap-4 text-[14px] text-gray-600 lg:flex">
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} /> {v.added}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {compact.format(v.uses)}
          </span>
        </span>
      )}

      <span className="grid h-5 w-5 shrink-0 place-items-center">
        {selected && <Check size={16} className="text-[#673de6]" />}
      </span>
    </button>
  );
}

function SectionTitle({ children }) {
  return <p className="px-3 pb-1 pt-4 text-[13px] text-gray-500">{children}</p>;
}

function VoiceModal({
  open,
  onClose,
  onSelect,
  selectedId,
  myVoices,
  onUpload,
}) {
  const [tab, setTab] = useState("explore");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [cats, setCats] = useState([]);
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [rows, setRows] = useState({ categories: true });
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const languages = useMemo(
    () => [...new Set(VOICES.map((v) => v.lang))].sort(),
    [],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = VOICES.filter(
      (v) =>
        (!q ||
          `${v.name} ${v.desc} ${v.lang} ${v.accent}`
            .toLowerCase()
            .includes(q)) &&
        (!language || v.lang === language) &&
        (!cats.length || cats.includes(v.category)) &&
        (!gender || v.gender === gender) &&
        (!age || v.age === age),
    );
    return [...out].sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : b.uses - a.uses,
    );
  }, [query, language, cats, gender, age, sortBy]);

  const myList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myVoices.filter((v) => !q || v.name.toLowerCase().includes(q));
  }, [myVoices, query]);

  if (!open) return null;

  const hasFilters = query || language || cats.length || gender || age;
  const toggleRow = (id) => setRows((r) => ({ ...r, [id]: !r[id] }));
  const toggleCat = (id) =>
    setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const clearAll = () => {
    setQuery("");
    setLanguage("");
    setCats([]);
    setGender("");
    setAge("");
  };

  const best = list.filter((v) => v.featured);
  const rest = list.filter((v) => !v.featured);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select reference voice"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-[min(760px,calc(100vh-2rem))] w-[min(1100px,100%)] overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Left: filters */}
        <div className="hidden w-[320px] shrink-0 overflow-y-auto border-r border-gray-200 p-5 md:block">
          <p className="mb-2 text-[14px] font-medium text-gray-900">Language</p>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 text-[14px] text-gray-900 outline-none focus:border-[#673de6]"
            >
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-3 text-gray-500"
            />
          </div>

          <div className="mt-4">
            <FilterRow
              label="Categories"
              open={rows.categories}
              onToggle={() => toggleRow("categories")}
              badge={cats.length}
            >
              {CATEGORIES.map(({ id, label, icon }) => (
                <Chip
                  key={id}
                  icon={icon}
                  active={cats.includes(id)}
                  onClick={() => toggleCat(id)}
                >
                  {label}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow
              label="Gender"
              open={rows.gender}
              onToggle={() => toggleRow("gender")}
              badge={gender ? 1 : 0}
            >
              {GENDERS.map((g) => (
                <Chip
                  key={g.id}
                  active={gender === g.id}
                  onClick={() => setGender(gender === g.id ? "" : g.id)}
                >
                  {g.label}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow
              label="Age"
              open={rows.age}
              onToggle={() => toggleRow("age")}
              badge={age ? 1 : 0}
            >
              {AGES.map((a) => (
                <Chip
                  key={a.id}
                  active={age === a.id}
                  onClick={() => setAge(age === a.id ? "" : a.id)}
                >
                  {a.label}
                </Chip>
              ))}
            </FilterRow>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-2 text-[14px] text-[#673de6] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Right: list */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 p-4">
            <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5">
              {[
                ["explore", "Explore"],
                ["mine", "My voices"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    tab === id
                      ? "bg-white text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 transition-colors focus-within:border-[#673de6]">
              <Search size={16} className="shrink-0 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Start typing to search..."
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
              />
            </div>

            <button
              type="button"
              aria-label="Sort"
              title={
                sortBy === "name" ? "Sorted by name" : "Sorted by most used"
              }
              onClick={() =>
                setSortBy((s) => (s === "name" ? "popular" : "name"))
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {tab === "explore" ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selectedId === null ? "bg-[#673de6]/10" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-800">
                    <AudioLines size={18} />
                  </span>
                  <span className="text-[14px] font-medium text-gray-900">
                    Auto-select voice
                  </span>
                  <span className="ml-auto hidden text-[14px] text-gray-500 lg:block">
                    Uses the default voice when you generate
                  </span>
                  <span className="grid h-5 w-5 place-items-center">
                    {selectedId === null && (
                      <Check size={16} className="text-[#673de6]" />
                    )}
                  </span>
                </button>

                {list.length === 0 && (
                  <p className="py-16 text-center text-[14px] text-gray-500">
                    No voices match your filters.
                  </p>
                )}

                {hasFilters ? (
                  list.length > 0 && (
                    <>
                      <SectionTitle>Results ({list.length})</SectionTitle>
                      {list.map((v) => (
                        <VoiceRow
                          key={v.id}
                          v={v}
                          selected={selectedId === v.id}
                          onClick={() => onSelect(v)}
                        />
                      ))}
                    </>
                  )
                ) : (
                  <>
                    {best.length > 0 && (
                      <>
                        <SectionTitle>Best voices</SectionTitle>
                        {best.map((v) => (
                          <VoiceRow
                            key={v.id}
                            v={v}
                            selected={selectedId === v.id}
                            onClick={() => onSelect(v)}
                          />
                        ))}
                      </>
                    )}
                    {rest.length > 0 && (
                      <>
                        <SectionTitle>All library voices</SectionTitle>
                        {rest.map((v) => (
                          <VoiceRow
                            key={v.id}
                            v={v}
                            selected={selectedId === v.id}
                            onClick={() => onSelect(v)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mb-2 flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-left hover:border-[#673de6] hover:bg-[#673de6]/5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#673de6]/10 text-[#673de6]">
                    <Upload size={18} />
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium text-gray-900">
                      Upload reference audio
                    </span>
                    <span className="block text-[13px] text-gray-500">
                      A clean clip of 5 to 15 seconds works best
                    </span>
                  </span>
                </button>

                {myList.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-gray-500">
                    You have no voices yet.
                  </p>
                ) : (
                  myList.map((v) => (
                    <VoiceRow
                      key={v.id}
                      v={v}
                      selected={selectedId === v.id}
                      onClick={() => onSelect(v)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextToSpeechSection({
  text,
  onTextChange,
  voice,
  onVoiceChange,
  onGenerate,
  generating,
  result,
  resultAudioRef,
  onResultPlay,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [myVoices, setMyVoices] = useState([]);
  const textRef = useRef(null);

  // Input inakua kulingana na maandishi, waveform inabaki chini yake moja kwa moja
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(
      Math.max(el.scrollHeight, TEXT_MIN_H),
      TEXT_MAX_H,
    )}px`;
  }, [text]);

  const handleUpload = (file) => {
    const v = {
      id: `my-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      desc: "Reference voice",
      lang: "Custom",
      accent: "",
      more: 0,
      g: myVoices.length + 3,
      file, // tuma hii kwenye backend kama audio_prompt
    };
    setMyVoices((list) => [v, ...list]);
  };

  const pick = (v) => {
    onVoiceChange(v);
    setModalOpen(false);
  };

  const canGenerate = text.trim().length > 0 && !generating;

  return (
    <div className="flex h-full flex-col">
      {/* Eneo la juu: linascroll likizidi, footer inabaki chini */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[840px] px-6 pb-6 pt-16">
          {/* Voice chip */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[14px] font-medium text-gray-900 hover:bg-gray-50"
            >
              {voice ? (
                <VoiceAvatar voice={voice} size={18} />
              ) : (
                <AudioLines size={16} />
              )}
              <span className="max-w-[360px] truncate">
                {voice ? voiceLabel(voice) : "Select reference voice"}
              </span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>

            {voice && (
              <button
                type="button"
                aria-label="Clear voice"
                onClick={() => onVoiceChange(null)}
                className="grid h-8 w-8 place-items-center rounded-md text-gray-800 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Text */}
          <div className="mt-5 rounded-xl border border-gray-300 bg-white px-4 py-3 transition-colors focus-within:border-[#673de6] focus-within:ring-1 focus-within:ring-[#673de6]">
            <textarea
              ref={textRef}
              value={text}
              maxLength={MAX_CHARS}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  e.key === "Enter" &&
                  canGenerate
                ) {
                  onGenerate();
                }
              }}
              placeholder="Start typing here or paste any text you want to turn into speech..."
              style={{ height: TEXT_MIN_H }}
              className="block w-full resize-none overflow-y-auto bg-transparent text-[16px] leading-7 text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Audio mpya: kivuli wakati inatengenezwa, kisha waveform (haichezi yenyewe) */}
          {(generating || result) && (
            <div className="mt-6">
              <WaveformPlayer
                item={result}
                loading={generating}
                audioRef={resultAudioRef}
                onPlay={onResultPlay}
                autoPlay={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto flex w-full max-w-[840px] shrink-0 items-center justify-end gap-4 px-6 pb-6 pt-4">
        <span className="text-[13px] text-gray-500">
          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}{" "}
          characters
        </span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 rounded-lg bg-[#673de6] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {generating && <Loader2 size={16} className="animate-spin" />}
          {generating ? "Generating..." : "Generate speech"}
        </button>
      </div>

      <VoiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={pick}
        selectedId={voice ? voice.id : null}
        myVoices={myVoices}
        onUpload={handleUpload}
      />
    </div>
  );
}

export default TextToSpeechSection;