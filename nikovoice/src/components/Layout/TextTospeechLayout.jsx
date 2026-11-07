import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SideBarSection from "../section/SideBar";
import TextToSpeechHistory from "../section/TextToSpeechHistory";
import TextToSpeechPlayer from "../section/TextToSpeechPlayer";
import TopBarSection from "../section/TopBarSection";
import TextToSpeechSection from "../section/TextToSpeechSection";
import { AUTO_VOICE, VOICES, makeDemoAudio } from "../section/TtsShared";

// Lugha 23 za Chatterbox Multilingual
const LANGUAGES = [
  ["sw", "Swahili"],
  ["en", "English"],
  ["ar", "Arabic"],
  ["da", "Danish"],
  ["de", "German"],
  ["el", "Greek"],
  ["es", "Spanish"],
  ["fi", "Finnish"],
  ["fr", "French"],
  ["he", "Hebrew"],
  ["hi", "Hindi"],
  ["it", "Italian"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["ms", "Malay"],
  ["nl", "Dutch"],
  ["no", "Norwegian"],
  ["pl", "Polish"],
  ["pt", "Portuguese"],
  ["ru", "Russian"],
  ["sv", "Swedish"],
  ["tr", "Turkish"],
  ["zh", "Chinese"],
];

const DEFAULT_SETTINGS = {
  language: "sw",
  exaggeration: 0.5,
  cfg: 0.5,
  temperature: 0.8,
};

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const byId = (id) => VOICES.find((v) => v.id === id);

// Data ya mfano. Ondoa makeDemoAudio na seed ukiunganisha na backend.
const demo = makeDemoAudio(3);
const SEED_HISTORY = [
  {
    id: "h1",
    text: "Karibu kwenye nikovoice, sauti yako, njia yako.",
    voice: byId("amani"),
    createdAt: ago(12 * MIN),
    audioUrl: demo,
  },
  {
    id: "h2",
    text: "Habari za asubuhi wananchi, leo tuna habari kubwa kutoka Mbeya.",
    voice: byId("baraka"),
    createdAt: ago(3 * 60 * MIN),
    audioUrl: demo,
  },
  {
    id: "h3",
    text: "Ni sawa.",
    voice: byId("neema"),
    createdAt: ago(2 * DAY),
    audioUrl: demo,
  },
  {
    id: "h4",
    text: "Njoo hapa, njoo hapa, njoo hapa.",
    voice: byId("zawadi"),
    createdAt: ago(2 * DAY + 5 * MIN),
    audioUrl: demo,
  },
  {
    id: "h5",
    text: "Hapana, hapana, hapana, ni sawa.",
    voice: byId("juma"),
    createdAt: ago(40 * DAY),
    audioUrl: demo,
  },
];

function Slider({ label, value, min, max, step, onChange, left, right, hint }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[14px] font-medium text-gray-900">{label}</span>
        <span className="font-mono text-[13px] text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#673de6]"
      />
      <div className="flex justify-between text-[12px] text-gray-500">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {hint && <p className="mt-1 text-[12px] text-gray-500">{hint}</p>}
    </div>
  );
}

function SettingsPanel({ settings, onChange }) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value });

  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <p className="mb-2 text-[14px] font-medium text-gray-900">Language</p>
      <select
        value={settings.language}
        onChange={(e) => set("language")(e.target.value)}
        className="mb-6 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[14px] outline-none focus:border-[#673de6]"
      >
        {LANGUAGES.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>

      <Slider
        label="Exaggeration"
        min={0}
        max={1}
        step={0.05}
        value={settings.exaggeration}
        onChange={set("exaggeration")}
        left="Neutral"
        right="Expressive"
      />
      <Slider
        label="Pace guidance (CFG)"
        min={0}
        max={1}
        step={0.05}
        value={settings.cfg}
        onChange={set("cfg")}
        left="Slower"
        right="Stricter"
        hint="Lower values can improve pacing for fast reference voices."
      />
      <Slider
        label="Temperature"
        min={0.1}
        max={1.5}
        step={0.05}
        value={settings.temperature}
        onChange={set("temperature")}
        left="Stable"
        right="Varied"
      />

      <button
        type="button"
        onClick={() => onChange(DEFAULT_SETTINGS)}
        className="text-[14px] text-[#673de6] hover:underline"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function TextToSpeechLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState("history");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState(location.state?.voice ?? null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [history, setHistory] = useState(SEED_HISTORY);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null); // audio mpya, inaonekana kama waveform

  // Bottom player: History tu
  const audioRef = useRef(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Waveform player ya audio mpya
  const resultAudioRef = useRef(null);

  const handlePlay = (item) => {
    resultAudioRef.current?.pause(); // usicheze mbili kwa pamoja
    if (nowPlaying?.id === item.id) {
      const a = audioRef.current;
      if (a) a.paused ? a.play() : a.pause();
    } else {
      setNowPlaying(item); // bottom player inafunguka na kucheza
    }
  };

  const closePlayer = () => {
    audioRef.current?.pause();
    setNowPlaying(null);
    setIsPlaying(false);
  };

  const handleGenerate = async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    resultAudioRef.current?.pause();
    try {
      // TODO: unganisha na backend yako (Django -> worker)
      // const form = new FormData();
      // form.append("text", text);
      // form.append("language", settings.language);
      // form.append("exaggeration", settings.exaggeration);
      // form.append("cfg_weight", settings.cfg);
      // form.append("temperature", settings.temperature);
      // if (voice?.file) form.append("reference_audio", voice.file);
      // else if (voice) form.append("voice_id", voice.id);
      // const res = await fetch("/api/tts", { method: "POST", body: form });
      // const { audio_url: audioUrl } = await res.json();
      await new Promise((r) => setTimeout(r, 1800));
      const audioUrl = makeDemoAudio(4);

      const item = {
        id: crypto.randomUUID(),
        text: text.trim(),
        voice: voice ?? AUTO_VOICE,
        createdAt: new Date().toISOString(),
        audioUrl,
      };

      setHistory((h) => [item, ...h]); // inaingia History
      setResult(item); // inaonekana kama waveform chini ya input
      setTab("history");
      // Makusudi: HAKUNA setNowPlaying hapa. Bottom player haifunguki yenyewe.
    } finally {
      setGenerating(false);
    }
  };

  // Rudisha text na voice kwenye editor
  const handleUseText = (item) => {
    setText(item.text);
    setVoice(item.voice.id === "auto" ? null : item.voice);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <SideBarSection
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBarSection title="Text to Speech" />

        <div className="flex min-h-0 flex-1 border-t border-gray-200">
          <main className="min-w-0 flex-1 overflow-hidden">
            <TextToSpeechSection
              text={text}
              onTextChange={setText}
              voice={voice}
              onVoiceChange={setVoice}
              onGenerate={handleGenerate}
              generating={generating}
              result={result}
              resultAudioRef={resultAudioRef}
              onResultPlay={() => audioRef.current?.pause()}
            />
          </main>

          <aside className="hidden w-[420px] shrink-0 flex-col border-l border-gray-200 lg:flex">
            <div className="flex gap-5 border-b border-gray-200 px-5 pt-4">
              {["settings", "history"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-2.5 text-[14px] font-medium capitalize ${
                    tab === t
                      ? "border-[#673de6] text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {tab === "history" ? (
                <TextToSpeechHistory
                  items={history}
                  nowPlayingId={nowPlaying?.id}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onUseText={handleUseText}
                />
              ) : (
                <SettingsPanel settings={settings} onChange={setSettings} />
              )}
            </div>
          </aside>
        </div>

        {nowPlaying && (
          <TextToSpeechPlayer
            key={nowPlaying.id}
            item={nowPlaying}
            audioRef={audioRef}
            onPlayingChange={setIsPlaying}
            onClose={closePlayer}
          />
        )}
      </div>
    </div>
  );
}

export default TextToSpeechLayout;