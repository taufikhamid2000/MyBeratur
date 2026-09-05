import Link from "next/link";

const FEATURES = [
  "Ambil nombor giliran dalam talian, tanpa beratur fizikal",
  "Keutamaan automatik untuk warga emas, OKU & wanita hamil",
  "Semak status giliran secara masa nyata di mana-mana",
  "Sokongan untuk JPN, JPJ, Imigresen & Polis",
];

export function AuthBrandingPanel() {
  return (
    <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-primary px-10 py-12 text-primary-foreground md:flex lg:w-[38%]">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

      <Link href="/" className="relative flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="15" className="fill-white/15" />
          <path
            d="M9 21.5v-11a1 1 0 0 1 1-1h5.2c2.8 0 4.6 1.5 4.6 3.9 0 1.6-.9 2.8-2.3 3.3l2.9 4.8h-3l-2.6-4.4h-2.2v4.4H9Zm2.6-6.6h2.4c1.3 0 2.1-.6 2.1-1.8 0-1.1-.8-1.8-2.1-1.8h-2.4v3.6Z"
            fill="currentColor"
          />
        </svg>
        <span className="text-lg font-semibold text-white">MyBeratur</span>
      </Link>

      <div className="relative">
        <p className="text-2xl font-semibold leading-snug text-balance">
          Beratur secara digital, bukan secara fizikal.
        </p>
        <ul className="mt-6 flex flex-col gap-3 text-sm text-primary-foreground/80">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                <path
                  d="M3 8.5 6.5 12 13 4.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/50">
        Sistem beratur digital Malaysia.{" "}
        <a
          href="https://taufik.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline hover:text-primary-foreground/70"
        >
          A project by Muhammad Taufik &rarr;
        </a>
      </p>
    </div>
  );
}
