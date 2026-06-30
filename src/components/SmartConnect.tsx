import { Gauge, MapPin, Smartphone, Lock, Lightbulb, Navigation } from "lucide-react";

const APP_FEATURES = [
  {
    icon: Gauge,
    title: "Dashboard",
    description: "Ride stats & analytics at your fingertips.",
  },
  {
    icon: Smartphone,
    title: "Scooter Control",
    description: "Live status, lock/unlock, and remote controls.",
  },
  {
    icon: MapPin,
    title: "Map & Location",
    description: "Find your last parked location instantly.",
  },
  {
    icon: Lock,
    title: "Anti-Theft",
    description: "Smart lock and motion alerts for peace of mind.",
  },
  {
    icon: Lightbulb,
    title: "Light Control",
    description: "Manage headlights and indicators remotely.",
  },
  {
    icon: Navigation,
    title: "Trip History",
    description: "Track routes, distance, and riding patterns.",
  },
];

export default function SmartConnect() {
  return (
    <section id="smart-connect" className="bg-[#E6E6E6] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
            SMART CONNECT
          </p>
          <h2 className="mt-4 font-display text-4xl font-black text-[#111111] md:text-5xl">
            CONTROL. TRACK. RIDE.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#7A7A7A]">
            The Tiger E1 app puts your scooter in your pocket. Technology that
            moves with you — smart, connected, and effortless.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="relative mx-auto w-full max-w-xs">
            <PhoneMockup />
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APP_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-5 transition-shadow hover:shadow-lg"
              >
                <feature.icon
                  className="h-6 w-6 text-[#FF5A00]"
                  strokeWidth={1.5}
                />
                <h3 className="mt-3 text-sm font-bold text-[#111111]">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#7A7A7A]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto aspect-[9/19] w-64 overflow-hidden rounded-[2.8rem] border-[5px] border-[#222222] bg-[#0A0A0A] shadow-[0_35px_70px_rgba(0,0,0,0.55)] transition-all duration-500 rotate-0 hover:rotate-[-3deg] hover:scale-105">
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
      <div className="absolute left-0 top-0 h-full w-[2px] bg-white/20" />
      <div className="absolute right-0 top-0 h-full w-[2px] bg-black/40" />
      <div className="absolute top-0 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-[#111111] shadow-lg" />
      <div className="relative z-10 flex h-full flex-col p-6 pt-10">
        <p className="text-center text-xs font-semibold tracking-[0.35em] uppercase text-[#FF7A1A] drop-shadow-[0_0_8px_rgba(255,90,0,0.6)]">
          TIGER E1
        </p>
        <p className="mt-2 text-center font-display text-2xl font-black tracking-wide text-white drop-shadow-lg">
          SMART CONNECT
        </p>
        <div className="mx-auto mt-3 mb-6 h-[2px] w-16 rounded-full bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />

        <div className="mt-8 flex justify-center">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="40" stroke="#2B2B2B" strokeWidth="6" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#FF5A00"
                strokeWidth="6"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset="37.68"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-black text-white">85%</span>
              <span className="text-[8px] text-[#7A7A7A]">BATTERY</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#111111] p-3 text-center">
            <p className="font-display text-lg font-black text-[#FF5A00]">72</p>
            <p className="text-[8px] text-[#7A7A7A]">KM LEFT</p>
          </div>
          <div className="rounded-lg bg-[#111111] p-3 text-center">
            <p className="font-display text-lg font-black text-white">LOCKED</p>
            <p className="text-[8px] text-[#7A7A7A]">STATUS</p>
          </div>
        </div>

        <div className="mt-auto rounded-lg bg-[#FF5A00] py-3 text-center text-xs font-bold text-white">
          START RIDE
        </div>
      </div>
    </div>
  );
}
