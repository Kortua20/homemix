import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#173c2f] text-white">
      <div className="mx-auto flex min-h-48 w-full max-w-[1536px] flex-col items-center justify-center gap-3 px-4 py-12 sm:px-6 lg:px-10">
        <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="size-24 object-contain brightness-0 invert" />
        <p className="text-sm font-extrabold tracking-[-0.02em]">HOME MIX</p>
        <p className="text-xs text-[#c9d8ce]">ავეჯი ყოველდღიური ცხოვრებისთვის</p>
      </div>
    </footer>
  );
}
