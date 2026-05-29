"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface ChatCTAProps {
  targetRole: string;
}

export default function ChatCTA({ targetRole }: ChatCTAProps) {
  return (
    <Link
      href="/chat"
      className="block w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all text-center shadow-lg shadow-teal-900/30"
    >
      <span className="inline-flex items-center gap-2.5">
        <Sparkles className="h-5 w-5" />
        Talk to your Career Coach about {targetRole}
      </span>
    </Link>
  );
}
