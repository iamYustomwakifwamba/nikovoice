import { useRef, useState } from "react"
import SideBarSection from "../section/SideBar"
import TopBarSection from "../section/TopBarSection"
import VoicesSection from "../section/VoicesSection"
import TextToSpeechPlayer from "../section/TextToSpeechPlayer"
import { makeDemoAudio } from "../section/TtsShared"

// Sauti ya mfano. Badilisha na voice.previewUrl kutoka backend ukishaunganisha.
const DEMO_AUDIO = makeDemoAudio(3)

const sampleText = (voice) =>
    voice.lang === "Swahili"
        ? "Habari, karibu kwenye nikovoice."
        : "Hello, welcome to nikovoice."

function VoicesLayout() {
    const [collapsed, setCollapsed] = useState(false)

    const audioRef = useRef(null)
    const [nowPlaying, setNowPlaying] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)

    const handlePlay = (voice) => {
        if (nowPlaying?.id === voice.id) {
            const a = audioRef.current
            if (a) a.paused ? a.play() : a.pause()
            return
        }
        setNowPlaying({
            id: voice.id,
            text: sampleText(voice),
            voice,
            audioUrl: voice.previewUrl ?? DEMO_AUDIO,
        })
    }

    const closePlayer = () => {
        audioRef.current?.pause()
        setNowPlaying(null)
        setIsPlaying(false)
    }

    return (
        <div className="flex h-screen bg-white text-gray-900">
            <SideBarSection
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBarSection title="Voices" />

                <main className="min-h-0 flex-1 overflow-y-auto border-t border-gray-200 bg-white">
                    <VoicesSection
                        nowPlayingId={nowPlaying?.id}
                        isPlaying={isPlaying}
                        onPlay={handlePlay}
                    />
                </main>

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
    )
}

export default VoicesLayout