import type { ProductParameter } from "@/lib/types";

interface ProductParametersProps {
  parameters: ProductParameter[];
}

export default function ProductParameters({ parameters }: ProductParametersProps) {
  return (
    <div className="rounded-2xl border border-[#E6E6E6] bg-white overflow-hidden">
      <div className="border-b border-[#E6E6E6] bg-[#F9F9F9] px-6 py-4">
        <h3 className="font-display text-lg font-black text-[#111111]">
          PARAMETERS
        </h3>
        <p className="text-xs text-[#7A7A7A]">Full technical specifications</p>
      </div>
      <dl className="divide-y divide-[#E6E6E6]">
        {parameters.map((param) => (
          <div
            key={param.label}
            className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
          >
            <dt className="text-sm text-[#7A7A7A]">{param.label}</dt>
            <dd className="text-sm font-semibold text-[#111111]">{param.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
