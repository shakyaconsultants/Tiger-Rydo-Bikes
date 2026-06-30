import { Building2, Briefcase, GraduationCap, Key, Glasses } from "lucide-react";
import { BRAND } from "@/lib/constants";

const AUDIENCE = [
  { icon: Building2, label: "Urban Commuters" },
  { icon: Briefcase, label: "Young Professionals" },
  { icon: GraduationCap, label: "College Students" },
  { icon: Key, label: "First-time EV Buyers" },
  { icon: Glasses, label: "Style-conscious Riders" },
];

export default function CitySection() {
  return (
    <section id="city" className="relative overflow-hidden bg-white py-24">
      <div className="absolute top-0 right-0 h-full w-1/3 bg-[#0A0A0A] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
              BUILT FOR THE CITY
            </p>
            <h2 className="mt-4 font-display text-4xl font-black text-[#111111] md:text-5xl">
              AGILE. SMART.
              <br />
              ELECTRIC.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#7A7A7A]">
              {BRAND.promise} Tiger sits between utility and lifestyle — functional,
              practical, yet stylish and expressive. Made for the pulse of urban environments.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {AUDIENCE.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E6E6E6] px-4 py-2 text-sm text-[#2B2B2B]"
                >
                  <item.icon className="h-4 w-4 text-[#FF5A00]" strokeWidth={1.5} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-[#0A0A0A] p-8 lg:p-12">
              <p className="font-display text-3xl font-black leading-tight text-white md:text-4xl">
                MOVE SMARTER.
              </p>
              <p className="mt-2 text-[#7A7A7A]">
                Intelligent moves. Better cities.
              </p>

              <div className="my-8 h-px bg-[#2B2B2B]" />

              <div className="space-y-6">
                <MessageBlock
                  headline="BUILT FOR CITY SPEED."
                  sub="Power meets control. Every ride."
                />
                <MessageBlock
                  headline="SMART TECH. REAL FREEDOM."
                  sub="Technology that moves with you."
                />
                <MessageBlock
                  headline="DESIGNED TO PERFORM."
                  sub="Every detail. Every advantage."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageBlock({ headline, sub }: { headline: string; sub: string }) {
  return (
    <div className="group cursor-default">
      <p className="text-sm font-bold tracking-wide text-white transition-colors group-hover:text-[#FF5A00]">
        {headline}
      </p>
      <p className="mt-1 text-xs text-[#7A7A7A]">{sub}</p>
    </div>
  );
}
