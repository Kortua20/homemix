import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#e4e2e1] bg-white">
      <div className="mx-auto flex min-h-40 w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Image
          src="/logo.png"
          alt="Home Mix"
          width={500}
          height={500}
          className="h-24 w-24 object-contain sm:h-28 sm:w-28"
        />
      </div>
    </footer>
  );
}
