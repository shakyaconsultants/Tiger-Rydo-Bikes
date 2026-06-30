import { VALUES } from "@/lib/constants";

export default function ValuesSection() {
  return (
    <section className="border-y border-[#E6E6E6] bg-[#F9F9F9] py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map((value) => (
            <div key={value.title} className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#FF5A00]">
                <span className="text-xl font-black text-[#FF5A00]">
                  {value.title.charAt(0)}
                </span>
              </div>
              <h3 className="font-display text-xl font-black tracking-wider text-[#111111]">
                {value.title}
              </h3>
              <p className="mt-1 text-base text-[#7A7A7A]">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
