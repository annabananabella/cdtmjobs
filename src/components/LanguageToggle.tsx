import { useState } from "react";

interface LanguageToggleProps {
  lang: "en" | "de";
  onToggle: (lang: "en" | "de") => void;
}

export default function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 font-display text-xs tracking-wider">
      <button
        onClick={() => onToggle("en")}
        className={`px-2.5 py-1 rounded-md transition-all ${
          lang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onToggle("de")}
        className={`px-2.5 py-1 rounded-md transition-all ${
          lang === "de"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        DE
      </button>
    </div>
  );
}
