import Link from "next/link";

// Static SVG hoisted to module level (rendering-hoist-jsx)
const LogoIcon = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
  </svg>
);

export default function SiteNav() {
  return (
    <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
          {LogoIcon}
        </div>
        <span className="font-semibold text-base tracking-tight text-white">AICareerPivot</span>
      </Link>
      <div className="flex items-center gap-5">
        <Link href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Blog</Link>
        <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Pricing</Link>
        <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How It Works</Link>
        <Link
          href="/waitlist"
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-colors text-white"
        >
          Join Waitlist
        </Link>
      </div>
    </nav>
  );
}
