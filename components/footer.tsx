import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#e4e2e1] bg-white">
      <div className="mx-auto flex min-h-40 w-full max-w-7xl flex-col items-center justify-center gap-2 px-4 py-10 sm:px-6 lg:px-8">
        <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="size-24 object-contain" />
        <p className="text-xs font-semibold tracking-[0.08em] text-[#83746b]">Home Mix</p>
      </div>
    </footer>
  );
}
