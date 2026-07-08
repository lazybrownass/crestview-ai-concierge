import { FICTIONAL_DISCLAIMER } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-green-800 px-6 py-8 text-sm text-stone-400 md:px-16">
      <p>{FICTIONAL_DISCLAIMER}</p>
      <p className="mt-2">
        Built as a portfolio demo.{" "}
        <a
          href="https://github.com/lazybrownass/crestview-ai-concierge"
          className="underline decoration-brass-500/50 underline-offset-4 hover:text-stone-100"
        >
          Source on GitHub
        </a>
        .
      </p>
    </footer>
  );
}
