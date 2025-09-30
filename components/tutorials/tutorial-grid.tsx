import TutorialCard from "./tutorial-card"
import type { Tutorial } from "@/types/tutorial"

interface TutorialGridProps {
  tutorials: Tutorial[]
}

export default function TutorialGrid({ tutorials }: TutorialGridProps) {
  if (tutorials.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground mb-4">No tutorials found. Try adjusting filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tutorials.map((tutorial) => (
        <TutorialCard key={tutorial.documentId} tutorial={tutorial} />
      ))}
    </div>
  )
}
