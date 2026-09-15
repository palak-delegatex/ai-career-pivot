import { Link } from "@/i18n/navigation";

// Server-rendered internal-link back to the /tools hub (AIC-1230). Rendered at
// the foot of every standalone tool page so the hub ↔ tool link loop is fully
// crawlable — the hub links out to each tool, each tool links back to the hub.
export default function ToolsHubLink() {
  return (
    <div className="border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-slate-400 text-sm">
          Looking for something else?{" "}
          <Link
            href="/tools"
            className="text-teal-400 font-medium hover:text-teal-300 transition-colors"
          >
            Explore all free AI career tools →
          </Link>
        </p>
      </div>
    </div>
  );
}
