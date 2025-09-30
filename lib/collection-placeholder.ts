import type { CSSProperties } from "react";

type GradientPalette = {
  colors: readonly [string, string, string?];
  textClass: string;
  containerClass: string;
};

const FALLBACK_NAME = "Collection";

const GRADIENTS: GradientPalette[] = [
  {
    colors: ["#f43f5e", "#f97316", "#facc15"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/20 shadow-lg shadow-black/20",
  },
  {
    colors: ["#6366f1", "#8b5cf6", "#ec4899"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/20 shadow-lg shadow-black/20",
  },
  {
    colors: ["#0ea5e9", "#22d3ee", "#2563eb"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/20 shadow-lg shadow-black/20",
  },
  {
    colors: ["#10b981", "#14b8a6", "#2563eb"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/20 shadow-lg shadow-black/20",
  },
  {
    colors: ["#f59e0b", "#f97316", "#ef4444"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/20 shadow-lg shadow-black/20",
  },
  {
    colors: ["#0f172a", "#1e293b", "#3b82f6"],
    textClass: "text-white",
    containerClass: "ring-1 ring-white/10 shadow-lg shadow-black/40",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function getInitialCharacter(name: string): string {
  if (!name) {
    return "C";
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "C";
  }

  const candidates = trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .filter(Boolean);

  if (candidates.length === 0) {
    return "C";
  }

  const initial = candidates[0];
  return /[A-Z0-9]/.test(initial) ? initial : "#";
}

function buildGradient(colors: readonly [string, string, string?]): string {
  const [first, second, third] = colors;
  const stops = [`${first} 0%`, `${second} 55%`];
  if (third) {
    stops.push(`${third} 100%`);
  }
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

export interface CollectionPlaceholderStyles {
  initial: string;
  containerClass: string;
  textClass: string;
  style: CSSProperties;
  ariaLabel: string;
}

export function getCollectionPlaceholder(
  name?: string | null
): CollectionPlaceholderStyles {
  const safeName = name?.trim() || FALLBACK_NAME;
  const index = Math.abs(hashString(safeName)) % GRADIENTS.length;
  const palette = GRADIENTS[index];

  const gradient = buildGradient(palette.colors);
  const style: CSSProperties = {
    backgroundImage: gradient,
    backgroundColor: palette.colors[0],
    backgroundSize: "200% 200%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return {
    initial: getInitialCharacter(safeName),
    containerClass: palette.containerClass,
    textClass: palette.textClass,
    style,
    ariaLabel: `Placeholder cover for ${safeName}`,
  };
}
