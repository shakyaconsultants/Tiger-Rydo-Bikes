// import { Battery, Zap, Clock, Leaf } from "lucide-react";

// const FEATURES = [
//   {
//     icon: Battery,
//     title: "85 KM Range",
//     description: "Go further on a single charge. Built for daily city commutes.",
//     accent: "#FF5A00",
//   },
//   {
//     icon: Clock,
//     title: "0–80% in 4.2 HRS",
//     description: "Fast charging that fits your schedule. Back on the road quickly.",
//     accent: "#00B2FF",
//   },
//   {
//     icon: Zap,
//     title: "Smart BMS",
//     description: "Intelligent battery management for optimal performance and longevity.",
//     accent: "#FFD600",
//   },
//   {
//     icon: Leaf,
//     title: "Zero Emission",
//     description: "Cleaner rides. Stronger tomorrow. Maximum impact, zero guilt.",
//     accent: "#A6FF00",
//   },
// ];

// export default function BatterySection() {
//   return (
//     <section id="battery" className="bg-[#0A0A0A] py-24">
//       <div className="mx-auto max-w-7xl px-6 lg:px-8">
//         <div className="grid items-center gap-16 lg:grid-cols-2">
//           <div>
//             <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
//               BATTERY & RANGE
//             </p>
//             <h2 className="mt-4 font-display text-4xl font-black text-white md:text-5xl">
//               GO FURTHER.
//               <br />
//               CHARGE FASTER.
//             </h2>
//             <p className="mt-6 text-lg leading-relaxed text-[#7A7A7A]">
//               Advanced lithium-ion technology delivers exceptional range and rapid
//               charging. Every ride is optimized for the city — efficient, intelligent,
//               and always ready.
//             </p>

//             <div className="mt-10 space-y-6">
//               <div className="flex items-center gap-4">
//                 <div className="h-12 w-1 bg-[#FF5A00]" />
//                 <div>
//                   <p className="font-display text-4xl font-black text-[#FF5A00]">85 KM</p>
//                   <p className="text-sm text-[#7A7A7A]">Maximum range per charge</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="h-12 w-1 bg-[#00B2FF]" />
//                 <div>
//                   <p className="font-display text-4xl font-black text-white">4.2 HRS</p>
//                   <p className="text-sm text-[#7A7A7A]">0–80% fast charge time</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             {FEATURES.map((feature) => (
//               <div
//                 key={feature.title}
//                 className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6 transition-colors hover:border-[#FF5A00]/30"
//               >
//                 <feature.icon
//                   className="h-8 w-8"
//                   style={{ color: feature.accent }}
//                   strokeWidth={1.5}
//                 />
//                 <h3 className="mt-4 font-display text-lg font-bold text-white">
//                   {feature.title}
//                 </h3>
//                 <p className="mt-2 text-sm leading-relaxed text-[#7A7A7A]">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
