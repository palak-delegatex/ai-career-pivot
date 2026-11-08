# Pinned Inter assets

These unmodified Inter v4.001 WOFF2 subsets are the exact files served by
AICareerPivot's production build before this change. `manifest.json` records
the source URLs, retrieval date, byte counts, SHA-256 hashes and Unicode ranges.
The original Google Fonts OFL copyright and license are included in `OFL.txt`.

This pins the existing typography instead of requesting fresh Inter CSS at
build time. Next.js 16.2.2 can fail when Google returns extensionless Inter font
URLs: https://github.com/vercel/next.js/issues/99114.

The seven local loaders keep the previous 400/500/600 faces, normal style,
`font-display: swap`, Unicode subsets and `--font-inter` family. Only the
48,432-byte Latin file is preloaded. The shared Arial fallback retains the
previous ascent, descent, line-gap and size-adjust metrics. Each module exports
`const Inter` because its name must match the explicit shared font family in
Turbopack. Other fonts and the Next.js version are unchanged.

Verify file integrity with `node scripts/check-inter-fonts.mjs`. After a
production build, run it with `--build` to check the actual emitted faces,
family variables, fallback metrics, preload and article handoff.
