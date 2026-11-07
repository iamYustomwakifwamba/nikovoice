import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ArrowDownUp,
    BookOpen,
    Check,
    ChevronDown,
    ChevronRight,
    FileAudio,
    Film,
    Globe,
    GraduationCap,
    Languages,
    Megaphone,
    MessageCircle,
    Mic,
    Pause,
    Play,
    Plus,
    Search,
    Share2,
    SlidersHorizontal,
    Smile,
    Upload,
    X,
} from "lucide-react"
import { VOICES, voiceLabel } from "./ttsShared"

const CATEGORIES = [
    { id: "conversational", label: "Conversational", icon: MessageCircle },
    { id: "narration", label: "Narration", icon: BookOpen },
    { id: "characters", label: "Characters", icon: Smile },
    { id: "social", label: "Social Media", icon: Share2 },
    { id: "educational", label: "Educational", icon: GraduationCap },
    { id: "advertisement", label: "Advertisement", icon: Megaphone },
    { id: "entertainment", label: "Entertainment", icon: Film },
]

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

const GENDERS = [
    { id: "male", label: "Male" },
    { id: "female", label: "Female" },
    { id: "neutral", label: "Neutral" },
]

const AGES = [
    { id: "young", label: "Young" },
    { id: "middle", label: "Middle Aged" },
    { id: "old", label: "Old" },
]

const SORTS = [
    { id: "popular", label: "Most used" },
    { id: "name", label: "Name (A-Z)" },
]

function useOutsideClose(open, close) {
    const ref = useRef(null)
    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (!ref.current?.contains(e.target)) close()
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open, close])
    return ref
}

function Chip({ active, icon: Icon, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-[14px] transition-colors ${
                active
                    ? "border-[#673de6] bg-[#673de6]/10 text-[#673de6]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
        >
            {Icon && <Icon size={16} strokeWidth={1.75} />}
            {children}
        </button>
    )
}

function LanguageMenu({ value, languages, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useOutsideClose(open, () => setOpen(false))

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[14px] font-medium transition-colors ${
                    value
                        ? "border-[#673de6] bg-[#673de6]/10 text-[#673de6]"
                        : "border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
            >
                <Languages size={16} strokeWidth={1.75} />
                {value || "Language"}
                <ChevronDown size={14} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-md">
                    {["", ...languages].map((l) => (
                        <button
                            key={l || "all"}
                            type="button"
                            onClick={() => {
                                onChange(l)
                                setOpen(false)
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[14px] text-gray-900 hover:bg-gray-100"
                        >
                            {l || "All languages"}
                            {value === l && (
                                <Check size={14} className="text-[#673de6]" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function SortMenu({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useOutsideClose(open, () => setOpen(false))

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                aria-label="Sort"
                title="Sort"
                onClick={() => setOpen((o) => !o)}
                className="grid h-11 w-11 place-items-center rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
            >
                <ArrowDownUp size={16} />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
                    {SORTS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                                onChange(s.id)
                                setOpen(false)
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[14px] text-gray-900 hover:bg-gray-100"
                        >
                            {s.label}
                            {value === s.id && (
                                <Check size={14} className="text-[#673de6]" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function CreateVoiceButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#673de6] pl-3 pr-4 text-[14px] font-semibold text-white transition hover:bg-[#5b32d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#673de6] focus-visible:ring-offset-2 active:scale-[0.97]"
        >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
                <Plus size={14} strokeWidth={2.5} />
            </span>
            Create new voice
        </button>
    )
}

function CreateVoiceModal({ open, onClose, onCreate }) {
    const [name, setName] = useState("")
    const [file, setFile] = useState(null)
    const [agree, setAgree] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileRef = useRef(null)

    useEffect(() => {
        if (!open) return
        setName("")
        setFile(null)
        setAgree(false)
        const onKey = (e) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    if (!open) return null

    const accept = (f) => {
        if (f && f.type.startsWith("audio/")) {
            setFile(f)
            if (!name.trim()) setName(f.name.replace(/\.[^.]+$/, ""))
        }
    }

    const canCreate = name.trim() && file && agree

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Create new voice"
                onMouseDown={(e) => e.stopPropagation()}
                className="w-[min(480px,100%)] rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-[18px] font-semibold text-gray-900">
                            Create new voice
                        </h2>
                        <p className="mt-1 text-[14px] text-gray-500">
                            Upload a clean reference clip and we will clone it.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <label className="mb-1.5 mt-5 block text-[14px] font-medium text-gray-900">
                    Voice name
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My narrator voice"
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[14px] outline-none transition-colors placeholder:text-gray-400 focus:border-[#673de6]"
                />

                <label className="mb-1.5 mt-4 block text-[14px] font-medium text-gray-900">
                    Reference audio
                </label>
                <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                        accept(e.target.files?.[0])
                        e.target.value = ""
                    }}
                />

                {file ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#673de6]/10 text-[#673de6]">
                            <FileAudio size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-gray-900">
                                {file.name}
                            </span>
                            <span className="block text-[12.5px] text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </span>
                        <button
                            type="button"
                            aria-label="Remove file"
                            onClick={() => setFile(null)}
                            className="grid h-8 w-8 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault()
                            setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setDragOver(false)
                            accept(e.dataTransfer.files?.[0])
                        }}
                        className={`flex w-full flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 transition-colors ${
                            dragOver
                                ? "border-[#673de6] bg-[#673de6]/5"
                                : "border-gray-300 hover:border-[#673de6] hover:bg-[#673de6]/5"
                        }`}
                    >
                        <Upload size={20} className="text-[#673de6]" />
                        <span className="text-[14px] font-medium text-gray-900">
                            Click to upload or drag and drop
                        </span>
                        <span className="text-[12.5px] text-gray-500">
                            MP3, WAV or M4A. A clean clip of 5 to 15 seconds works best.
                        </span>
                    </button>
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
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-[14px] font-medium text-gray-900 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canCreate}
                        onClick={() => onCreate({ name: name.trim(), file })}
                        className="rounded-lg bg-[#673de6] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#5b32d4] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        Create voice
                    </button>
                </div>
            </div>
        </div>
    )
}

function VoiceCard({ voice, isCurrent, isPlaying, onPlay, onPick }) {
    const showPause = isCurrent && isPlaying
    const isCustom = voice.category === "custom"

    return (
        <div className="flex min-w-0 items-center gap-4 rounded-2xl p-1.5 transition-colors hover:bg-gray-50">
            {/* Tile: mic kwa kawaida, play/pause ukiweka mouse juu */}
            <button
                type="button"
                onClick={onPlay}
                aria-label={showPause ? `Pause ${voice.name}` : `Play ${voice.name}`}
                className="group relative grid h-[70px] w-[70px] shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600 outline-none focus-visible:ring-2 focus-visible:ring-[#673de6]"
            >
                <Mic
                    size={26}
                    strokeWidth={1.5}
                    className={`transition-opacity ${
                        isCurrent ? "opacity-0" : "group-hover:opacity-0"
                    }`}
                />
                <span
                    className={`absolute inset-0 grid place-items-center rounded-xl bg-gray-950 text-white transition-opacity ${
                        isCurrent
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    }`}
                >
                    {showPause ? (
                        <Pause size={22} fill="currentColor" />
                    ) : (
                        <Play size={22} fill="currentColor" className="ml-0.5" />
                    )}
                </span>
            </button>

            {/* Info: kubofya kunafungua Text to Speech */}
            <button
                type="button"
                onClick={onPick}
                className="min-w-0 flex-1 text-left outline-none"
            >
                <span className="block truncate text-[15px] font-semibold text-gray-900">
                    {voiceLabel(voice)}
                </span>
                <span className="mt-0.5 block text-[14px] text-gray-500">
                    {CATEGORY_LABEL[voice.category] ?? "My voice"}
                </span>
                {!isCustom && (
                    <span className="mt-1 flex items-center gap-1.5 text-[14px] text-gray-600">
                        <Globe size={14} className="shrink-0 text-gray-500" />
                        <span>{voice.lang}</span>
                        {voice.accent && (
                            <span className="truncate text-gray-500">{voice.accent}</span>
                        )}
                        {voice.more > 0 && (
                            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                                +{voice.more}
                            </span>
                        )}
                    </span>
                )}
            </button>
        </div>
    )
}

function VoiceGrid({ voices, nowPlayingId, isPlaying, onPlay, onPick }) {
    return (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
            {voices.map((v) => (
                <VoiceCard
                    key={v.id}
                    voice={v}
                    isCurrent={nowPlayingId === v.id}
                    isPlaying={isPlaying}
                    onPlay={() => onPlay(v)}
                    onPick={() => onPick(v)}
                />
            ))}
        </div>
    )
}

function VoicesSection({ nowPlayingId, isPlaying, onPlay }) {
    const navigate = useNavigate()

    const [tab, setTab] = useState("explore")
    const [query, setQuery] = useState("")
    const [language, setLanguage] = useState("")
    const [cats, setCats] = useState([])
    const [gender, setGender] = useState("")
    const [age, setAge] = useState("")
    const [sortBy, setSortBy] = useState("popular")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [myVoices, setMyVoices] = useState([])

    const languages = useMemo(
        () => [...new Set(VOICES.map((v) => v.lang))].sort(),
        []
    )

    const toggleCat = (id) =>
        setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))

    const advancedCount = (gender ? 1 : 0) + (age ? 1 : 0)
    const hasFilters = Boolean(
        query.trim() || language || cats.length || gender || age
    )

    const clearAll = () => {
        setQuery("")
        setLanguage("")
        setCats([])
        setGender("")
        setAge("")
    }

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        const out = VOICES.filter(
            (v) =>
                (!q ||
                    `${v.name} ${v.desc} ${v.lang} ${v.accent}`
                        .toLowerCase()
                        .includes(q)) &&
                (!language || v.lang === language) &&
                (!cats.length || cats.includes(v.category)) &&
                (!gender || v.gender === gender) &&
                (!age || v.age === age)
        )
        return [...out].sort((a, b) =>
            sortBy === "name" ? a.name.localeCompare(b.name) : b.uses - a.uses
        )
    }, [query, language, cats, gender, age, sortBy])

    const trending = results.slice(0, 6)
    const rest = results.slice(6)

    // Kubofya jina la voice kunafungua Text to Speech ikiwa na voice hiyo
    const pick = (voice) => navigate("/text-to-speech", { state: { voice } })

    const handleCreate = ({ name, file }) => {
        const voice = {
            id: `my-${Date.now()}`,
            name,
            desc: "",
            lang: "Custom",
            accent: "",
            more: 0,
            category: "custom",
            uses: 0,
            file, // tuma kwenye backend kama reference_audio
            previewUrl: URL.createObjectURL(file),
        }
        setMyVoices((list) => [voice, ...list])
        setCreateOpen(false)
        setTab("mine")
    }

    const gridProps = { nowPlayingId, isPlaying, onPlay, onPick: pick }

    return (
        <div className="mx-auto w-full max-w-[1150px] px-6 pb-16 pt-14">
            <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
                Voices
            </h1>

            {/* Tabs + Create button */}
            <div className="mt-6 flex items-end justify-between gap-4 border-b border-gray-200">
                <div className="flex gap-6">
                    {[
                        ["explore", "Explore"],
                        ["mine", "My Voices"],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={`-mb-px border-b-2 px-1 pb-3 text-[14px] font-medium transition-colors ${
                                tab === id
                                    ? "border-[#673de6] text-gray-900"
                                    : "border-transparent text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mb-2">
                    <CreateVoiceButton onClick={() => setCreateOpen(true)} />
                </div>
            </div>

            {tab === "explore" ? (
                <>
                    {/* Search row */}
                    <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 transition-colors focus-within:border-[#673de6]">
                            <Search size={16} className="shrink-0 text-gray-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search library voices..."
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
                            />
                            {query && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setQuery("")}
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setFiltersOpen((o) => !o)}
                            className={`flex h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-[14px] font-medium transition-colors ${
                                filtersOpen || advancedCount
                                    ? "border-[#673de6] bg-[#673de6]/10 text-[#673de6]"
                                    : "border-gray-300 text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                            {advancedCount > 0 && (
                                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#673de6] px-1 text-[10px] text-white">
                                    {advancedCount}
                                </span>
                            )}
                        </button>

                        <SortMenu value={sortBy} onChange={setSortBy} />
                    </div>

                    {/* Advanced filters */}
                    {filtersOpen && (
                        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-4 rounded-xl border border-gray-200 bg-white p-4">
                            <div>
                                <p className="mb-2 text-[13px] font-medium text-gray-900">
                                    Gender
                                </p>
                                <div className="flex gap-2">
                                    {GENDERS.map((g) => (
                                        <Chip
                                            key={g.id}
                                            active={gender === g.id}
                                            onClick={() =>
                                                setGender(gender === g.id ? "" : g.id)
                                            }
                                        >
                                            {g.label}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-[13px] font-medium text-gray-900">
                                    Age
                                </p>
                                <div className="flex gap-2">
                                    {AGES.map((a) => (
                                        <Chip
                                            key={a.id}
                                            active={age === a.id}
                                            onClick={() => setAge(age === a.id ? "" : a.id)}
                                        >
                                            {a.label}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language + categories */}
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                        <LanguageMenu
                            value={language}
                            languages={languages}
                            onChange={setLanguage}
                        />
                        <span className="mx-1 h-6 w-px shrink-0 bg-gray-200" />
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
                    </div>

                    {/* Results */}
                    {results.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="text-[14px] text-gray-500">
                                No voices match your filters.
                            </p>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="mt-2 text-[14px] text-[#673de6] hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : hasFilters ? (
                        <section className="mt-8">
                            <h2 className="mb-4 text-[16px] font-semibold text-gray-900">
                                Results ({results.length})
                            </h2>
                            <VoiceGrid voices={results} {...gridProps} />
                        </section>
                    ) : (
                        <>
                            <section className="mt-8">
                                <h2 className="mb-4 flex items-center gap-1 text-[16px] font-semibold text-gray-900">
                                    Trending voices
                                    <ChevronRight size={16} className="text-gray-500" />
                                </h2>
                                <VoiceGrid voices={trending} {...gridProps} />
                            </section>

                            {rest.length > 0 && (
                                <section className="mt-10">
                                    <h2 className="mb-4 text-[16px] font-semibold text-gray-900">
                                        All library voices
                                    </h2>
                                    <VoiceGrid voices={rest} {...gridProps} />
                                </section>
                            )}
                        </>
                    )}
                </>
            ) : myVoices.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-28 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-500">
                        <Mic size={24} strokeWidth={1.5} />
                    </span>
                    <div>
                        <p className="text-[15px] font-semibold text-gray-900">
                            You have no voices yet
                        </p>
                        <p className="mt-1 text-[14px] text-gray-500">
                            Upload a reference clip to create your first voice.
                        </p>
                    </div>
                    <CreateVoiceButton onClick={() => setCreateOpen(true)} />
                </div>
            ) : (
                <section className="mt-8">
                    <VoiceGrid voices={myVoices} {...gridProps} />
                </section>
            )}

            <CreateVoiceModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreate={handleCreate}
            />
        </div>
    )
}

export default VoicesSection