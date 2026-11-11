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
  Pause,
  Play,
  Search,
  Share2,
  Smile,
  Upload,
  Users,
} from "lucide-react";
import { VOICES, VoiceAvatar, voiceLabel } from "../TtsShared";

// Urefu wa player ya chini (px). Modal inaacha nafasi hii ili player ibaki wazi.
// Ukiona inafunika au kuna pengo, rekebisha namba hii.
const PLAYER_H = 88;

// id ya item ya preview inayopelekwa kwenye player (isigongane na ids za history)
export const voicePreviewId = (v) => `voice-${v.id}`;

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

// Icon ya mic: ukiweka mouse juu inabadilika kuwa play. Ukibofya, inacheza kwenye
// player ya chini (ile ile ya history). Jina/eneo la kulia ndilo linalochagua voice.
function VoiceRow({ v, selected, onClick, current, playing, onPreview }) {
  const showPause = current && playing;

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        selected ? "bg-[#673de6]/10" : "hover:bg-gray-50"
      }`}
    >
      {onPreview ? (
        <button
          type="button"
          onClick={() => onPreview(v)}
          aria-label={showPause ? `Pause ${v.name}` : `Play ${v.name}`}
          title={showPause ? "Pause preview" : "Play preview"}
          className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#673de6]"
        >
          <VoiceAvatar voice={v} size={40} />
          <span
            className={`absolute inset-0 grid place-items-center rounded-full bg-gray-950 text-white transition-opacity ${
              current
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            }`}
          >
            {showPause ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </span>
        </button>
      ) : (
        <VoiceAvatar voice={v} size={40} />
      )}

      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none"
      >
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

        {/* Takwimu zinaonyeshwa kwa public voices tu (user voices hazina `added`) */}
        {v.uses != null && v.added && (
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
    </div>
  );
}

function SectionTitle({ children }) {
  return <p className="px-3 pb-1 pt-4 text-[13px] text-gray-500">{children}</p>;
}

/**
 * Modal ya kuchagua reference voice.
 *  - mine: matokeo ya useMyVoices() (user voices kutoka API)
 *  - nowPlayingId / isPlaying / onPreview: za player ya chini (zile za history)
 *  - playerOpen: player ya chini inaonekana, kwa hiyo modal inaiacha wazi
 */
function VoiceModal({
  open,
  onClose,
  onSelect,
  selectedId,
  mine,
  nowPlayingId,
  isPlaying,
  onPreview,
  playerOpen,
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

  // Public voices: bado dummy kutoka TtsShared
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

  // User voices: zinatoka API
  const myList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = mine.voices.filter(
      (v) => !q || v.name.toLowerCase().includes(q),
    );
    return sortBy === "name"
      ? [...out].sort((a, b) => a.name.localeCompare(b.name))
      : out; // API tayari inazipanga mpya kwanza
  }, [mine.voices, query, sortBy]);

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

  // Props za pamoja kwa kila VoiceRow
  const rowProps = (v) => ({
    v,
    selected: selectedId === v.id,
    onClick: () => onSelect(v),
    current: nowPlayingId === voicePreviewId(v),
    playing: isPlaying,
    onPreview,
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      // Player ya chini ikiwa wazi, overlay inaishia juu yake ili ibaki inaonekana na kubofyeka
      style={{ bottom: playerOpen ? PLAYER_H : 0 }}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select reference voice"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ height: "min(760px, 100%)" }}
        className="flex w-[min(1100px,100%)] overflow-hidden rounded-2xl bg-white shadow-xl"
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
                        <VoiceRow key={v.id} {...rowProps(v)} />
                      ))}
                    </>
                  )
                ) : (
                  <>
                    {best.length > 0 && (
                      <>
                        <SectionTitle>Best voices</SectionTitle>
                        {best.map((v) => (
                          <VoiceRow key={v.id} {...rowProps(v)} />
                        ))}
                      </>
                    )}
                    {rest.length > 0 && (
                      <>
                        <SectionTitle>All library voices</SectionTitle>
                        {rest.map((v) => (
                          <VoiceRow key={v.id} {...rowProps(v)} />
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
                    if (file) mine.upload(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={mine.uploading}
                  onClick={() => fileRef.current?.click()}
                  className="mb-2 flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-left hover:border-[#673de6] hover:bg-[#673de6]/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#673de6]/10 text-[#673de6]">
                    {mine.uploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium text-gray-900">
                      {mine.uploading
                        ? "Uploading..."
                        : "Upload reference audio"}
                    </span>
                    <span className="block text-[13px] text-gray-500">
                      A clean clip of 5 to 15 seconds works best
                    </span>
                  </span>
                </button>

                {mine.uploadError && (
                  <p
                    role="alert"
                    className="mb-2 px-1 text-[13px] text-red-600"
                  >
                    {mine.uploadError}
                  </p>
                )}

                {mine.loading ? (
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 py-12 text-[14px] text-gray-500"
                  >
                    <Loader2 size={16} className="animate-spin" />
                    Loading your voices...
                  </div>
                ) : mine.error ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <p className="text-[14px] text-gray-700">{mine.error}</p>
                    <button
                      type="button"
                      onClick={mine.reload}
                      className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-[14px] font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Try again
                    </button>
                  </div>
                ) : myList.length === 0 ? (
                  <p className="py-12 text-center text-[14px] text-gray-500">
                    {mine.voices.length === 0
                      ? "You have no voices yet."
                      : "No voices match your search."}
                  </p>
                ) : (
                  myList.map((v) => <VoiceRow key={v.id} {...rowProps(v)} />)
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceModal;