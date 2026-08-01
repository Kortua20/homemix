import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#2f2925]/25 bg-[#f4efe7]">
      <div className="mx-auto grid min-h-44 w-full max-w-7xl grid-cols-1 items-center gap-6 border-x border-[#2f2925]/20 px-5 py-10 text-center sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:text-left">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#3a5577] uppercase">ავეჯი ყოველდღიური ცხოვრებისთვის</p>
        <Image src="/logo.png" alt="Home Mix" width={500} height={500} className="mx-auto size-20 object-contain sm:size-24" />
        <p className="text-xs font-semibold tracking-[0.12em] text-[#6f6259] uppercase sm:text-right">Home Mix</p>
      </div>
    </footer>
  );
}
