import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SideBarSection from "../section/SideBar";
import TextToSpeechHistory from "../section/TextToSpeechHistory";
import TextToSpeechPlayer from "../section/TextToSpeechPlayer";
import TopBarSection from "../section/TopBarSection";
import TextToSpeechSection from "../section/TextToSpeechSection";
import useTtsHistory from "../../services/Usettshistory";
import {
  generateSpeech,
  generateErrorMessage,
} from "../../services/Ttsservice";

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

      {/* Backend inakubali 0.25 hadi 2.0 (chini ya 0.25 inarudisha kosa) */}
      <Slider
        label="Exaggeration"
        min={0.25}
        max={2}
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
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // audio mpya, inaonekana kama waveform

  // History halisi kutoka API (GET /api/media/tts-history/)
  const history = useTtsHistory();

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

    // Django inahitaji voice sample ya mtumiaji (voice_sample_id kutoka database).
    // Public voices za dummy na Auto-select hazina serverId.
    if (!voice?.serverId) {
      setError('Select one of your own voices from "My voices" first.');
      return;
    }

    setGenerating(true);
    setError("");
    setResult(null);
    resultAudioRef.current?.pause();
    try {
      const { audioUrl } = await generateSpeech({
        text: text.trim(),
        voiceSampleId: voice.serverId,
        language: settings.language,
        exaggeration: settings.exaggeration,
        cfgWeight: settings.cfg,
        temperature: settings.temperature,
      });

      const item = {
        id: crypto.randomUUID(),
        text: text.trim(),
        voice,
        createdAt: new Date().toISOString(),
        audioUrl,
      };

      history.addItem(item); // inaingia juu ya History
      setResult(item); // inaonekana kama waveform chini ya input
      setTab("history");
      // Makusudi: HAKUNA setNowPlaying hapa. Bottom player haifunguki yenyewe.
    } catch (err) {
      setError(generateErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  // Rudisha text na voice kwenye editor.
  // Voice inarudi tu kama ni voice ya mtumiaji (ina serverId).
  const handleUseText = (item) => {
    setText(item.text);
    setVoice(item.voice?.serverId ? item.voice : null);
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
              error={error}
              result={result}
              resultAudioRef={resultAudioRef}
              onResultPlay={() => audioRef.current?.pause()}
              nowPlayingId={nowPlaying?.id ?? null}
              isPlaying={isPlaying}
              onPlay={handlePlay}
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
                  items={history.items}
                  loading={history.loading}
                  error={history.error}
                  onRetry={history.reload}
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
