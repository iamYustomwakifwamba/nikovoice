import { Mic } from "lucide-react";

export const AUTO_VOICE = { id: "auto", name: "Auto-select", desc: "" };

export const voiceLabel = (v) => (v.desc ? `${v.name} - ${v.desc}` : v.name);

export function VoiceAvatar({ size = 40 }) {
  // Ndogo = icon peke yake, kubwa = icon ndani ya duara la kijivu
  if (size < 24) {
    return (
      <Mic
        aria-hidden="true"
        size={size}
        strokeWidth={1.75}
        className="shrink-0 text-gray-500"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600"
      style={{ width: size, height: size }}
    >
      <Mic size={size * 0.45} strokeWidth={1.75} />
    </span>
  );
}

// Sauti ya mfano (beep fupi) ili player ijaribiwe bila backend.
// Ondoa ukiunganisha na Chatterbox.
export function makeDemoAudio(seconds = 3) {
  const rate = 16000;
  const n = rate * seconds;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) =>
    [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));

  str(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  str(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 2, true);

  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const fade = Math.min(1, t * 10, (seconds - t) * 10);
    const s = Math.sin(2 * Math.PI * 440 * t) * 0.08 * fade;
    v.setInt16(44 + i * 2, s * 32767, true);
  }
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

// Voices za mfano. Badilisha na data kutoka database yako (reference clips zako).
export const VOICES = [
  {
    id: "amani",
    name: "Amani",
    desc: "Calm and Clear",
    lang: "Swahili",
    accent: "Tanzanian",
    more: 2,
    category: "narration",
    gender: "female",
    age: "middle",
    uses: 48200,
    added: "1y",
    featured: true,
  },
  {
    id: "baraka",
    name: "Baraka",
    desc: "Deep, Warm Narrator",
    lang: "Swahili",
    accent: "Kenyan",
    more: 1,
    category: "narration",
    gender: "male",
    age: "old",
    uses: 36400,
    added: "1y",
    featured: true,
  },
  {
    id: "neema",
    name: "Neema",
    desc: "Friendly Presenter",
    lang: "Swahili",
    accent: "Tanzanian",
    more: 0,
    category: "conversational",
    gender: "female",
    age: "young",
    uses: 29800,
    added: "8m",
    featured: true,
  },
  {
    id: "zawadi",
    name: "Zawadi",
    desc: "Playful Storyteller",
    lang: "Swahili",
    accent: "Tanzanian",
    more: 0,
    category: "characters",
    gender: "female",
    age: "young",
    uses: 12100,
    added: "6m",
  },
  {
    id: "juma",
    name: "Juma",
    desc: "Upbeat Social Host",
    lang: "Swahili",
    accent: "Tanzanian",
    more: 0,
    category: "social",
    gender: "male",
    age: "young",
    uses: 9400,
    added: "5m",
  },
  {
    id: "tumaini",
    name: "Tumaini",
    desc: "Warm Teacher",
    lang: "Swahili",
    accent: "Kenyan",
    more: 0,
    category: "educational",
    gender: "female",
    age: "middle",
    uses: 7600,
    added: "5m",
  },
  {
    id: "daudi",
    name: "Daudi",
    desc: "Bold Ad Voice",
    lang: "Swahili",
    accent: "Tanzanian",
    more: 0,
    category: "advertisement",
    gender: "male",
    age: "middle",
    uses: 5200,
    added: "4m",
  },
  {
    id: "chris",
    name: "Chris",
    desc: "Confident and Versatile",
    lang: "English",
    accent: "American",
    more: 21,
    category: "conversational",
    gender: "male",
    age: "middle",
    uses: 312400,
    added: "2y",
    featured: true,
  },
  {
    id: "emma",
    name: "Emma",
    desc: "Bright and Warm",
    lang: "English",
    accent: "British",
    more: 15,
    category: "narration",
    gender: "female",
    age: "young",
    uses: 184000,
    added: "2y",
    featured: true,
  },
  {
    id: "oliver",
    name: "Oliver",
    desc: "Calm Documentary",
    lang: "English",
    accent: "British",
    more: 9,
    category: "narration",
    gender: "male",
    age: "old",
    uses: 98700,
    added: "2y",
  },
  {
    id: "camille",
    name: "Camille",
    desc: "Elegant and Soft",
    lang: "French",
    accent: "Standard",
    more: 12,
    category: "entertainment",
    gender: "female",
    age: "middle",
    uses: 41300,
    added: "1y",
  },
  {
    id: "arjun",
    name: "Arjun",
    desc: "Energetic Narrator",
    lang: "Hindi",
    accent: "Standard",
    more: 22,
    category: "educational",
    gender: "male",
    age: "young",
    uses: 52600,
    added: "2y",
  },
];

// Voices za mfano za mtumiaji. Ondoa ukiunganisha na backend (GET /api/voices).
export const MY_VOICES = [
  {
    id: "my-sample-1",
    name: "Sauti yangu ya habari",
    desc: "",
    lang: "Custom",
    accent: "",
    more: 0,
    category: "custom",
    uses: 0,
  },
  {
    id: "my-sample-2",
    name: "Narrator wa matangazo",
    desc: "",
    lang: "Custom",
    accent: "",
    more: 0,
    category: "custom",
    uses: 0,
  },
  {
    id: "my-sample-3",
    name: "Rekodi ya majaribio",
    desc: "",
    lang: "Custom",
    accent: "",
    more: 0,
    category: "custom",
    uses: 0,
  },
];