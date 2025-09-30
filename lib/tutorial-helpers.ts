import type { TutorialLevel, TutorialTechnique, TutorialDuration } from "@/types/tutorial"

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

/**
 * Get badge variant for tutorial level
 */
export function getLevelBadgeVariant(level: TutorialLevel): "default" | "secondary" | "destructive" {
  switch (level) {
    case "beginner":
      return "secondary"
    case "intermediate":
      return "default"
    case "advanced":
      return "destructive"
    default:
      return "default"
  }
}

/**
 * Get display label for technique
 */
export function getTechniqueLabel(technique: TutorialTechnique): string {
  const labels: Record<TutorialTechnique, string> = {
    acrylic: "Acrylic",
    gel: "Gel",
    stamping: "Stamping",
    "hand-painted": "Hand-Painted",
    ombre: "Ombre",
    "3d": "3D Art",
    french: "French",
    marble: "Marble",
    chrome: "Chrome",
    other: "Other",
  }
  return labels[technique] || technique
}

/**
 * Get display label for level
 */
export function getLevelLabel(level: TutorialLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/**
 * Get duration category label
 */
export function getDurationLabel(duration: TutorialDuration): string {
  const labels: Record<TutorialDuration, string> = {
    short: "Under 15 min",
    medium: "15-30 min",
    long: "30+ min",
  }
  return labels[duration]
}
