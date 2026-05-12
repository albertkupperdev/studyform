import Link from "next/link";

export default function NavBar() {
  return (
    <div
      className="sticky top-0 z-40"
      style={{
        background: "rgba(245,243,236,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative w-[22px] h-[22px] flex items-center justify-center flex-shrink-0">
            <span className="absolute inset-0 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="relative font-serif text-[var(--ink)] text-xs leading-none">S</span>
          </div>
          <span className="font-serif text-base text-[var(--ink)] leading-none">Studyform</span>
        </Link>
      </div>
    </div>
  );
}
