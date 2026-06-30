interface ProductVideoProps {
  videoUrl: string;
  title: string;
}

export default function ProductVideo({ videoUrl, title }: ProductVideoProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#0A0A0A]">
      <div className="border-b border-[#2B2B2B] px-6 py-4">
        <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
          PRODUCT VIDEO
        </p>
        <h3 className="mt-1 font-display text-xl font-black text-white">
          {title}
        </h3>
      </div>
      <div className="relative aspect-video">
        <iframe
          src={videoUrl}
          title={`${title} product video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
