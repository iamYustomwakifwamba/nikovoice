import { useEffect, useRef, useState } from "react";
import { AudioLines, ChevronDown, Loader2, X } from "lucide-react";
import { VoiceAvatar, makeDemoAudio, voiceLabel } from "./TtsShared";
import WaveformPlayer from "./WaveformPlayer";
import VoiceModal, { voicePreviewId } from "./TTS/VoicesModal";
import useMyVoices from "./TTS/UseMyVoice";

const MAX_CHARS = 1000; // sawa na kikomo cha Django na Chatterbox API
const TEXT_MIN_H = 160; // urefu wa chini wa input (px)
const TEXT_MAX_H = 360; // ukizidi, input inaanza kuscroll

function TextToSpeechSection({
  text,
  onTextChange,
  voice,
  onVoiceChange,
  onGenerate,
  generating,
  error,
  result,
  resultAudioRef,
  onResultPlay,
  // Za player ya chini (zile zile unazopeleka kwenye TextToSpeechHistory)
  nowPlayingId,
  isPlaying,
  onPlay,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const textRef = useRef(null);
  const demoUrlRef = useRef(null);

  // User voices kutoka API
  const mine = useMyVoices();

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

  // Preview: tunatengeneza item yenye muundo wa history item na kuipeleka
  // kwenye player ile ile ya chini kupitia onPlay (inafanya play/pause yenyewe).
  const previewVoice = (v) => {
    let audioUrl = v.previewUrl;
    if (!audioUrl) {
      // Public voices hazina audio bado: beep ya dummy
      if (!demoUrlRef.current) demoUrlRef.current = makeDemoAudio(2);
      audioUrl = demoUrlRef.current;
    }
    onPlay({
      id: voicePreviewId(v),
      text: "Voice preview",
      voice: v,
      audioUrl,
      createdAt: new Date().toISOString(),
    });
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
        {error && (
          <p role="alert" className="mr-auto text-[13px] text-red-600">
            {error}
          </p>
        )}
        <span className="shrink-0 text-[13px] text-gray-500">
          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}{" "}
          characters
        </span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#673de6] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
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
        mine={mine}
        nowPlayingId={nowPlayingId}
        isPlaying={isPlaying}
        onPreview={onPlay ? previewVoice : undefined}
        playerOpen={nowPlayingId != null}
      />
    </div>
  );
}

export default TextToSpeechSection;