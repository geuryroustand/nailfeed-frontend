import Image from "next/image"
import { Clock } from "lucide-react"
import type { TutorialStep as TutorialStepType } from "@/types/tutorial"
import { formatDuration } from "@/lib/tutorial-helpers"

interface TutorialStepProps {
  step: TutorialStepType
}

export default function TutorialStep({ step }: TutorialStepProps) {
  return (
    <div className="flex gap-4">
      {/* Step Number */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
          {step.stepNumber}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
          {step.estimatedDuration && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{formatDuration(step.estimatedDuration)}</span>
            </div>
          )}
        </div>

        <p className="text-muted-foreground leading-relaxed">{step.description}</p>

        {step.image && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={step.image.url || "/placeholder.svg"}
              alt={step.image.alternativeText || `Step ${step.stepNumber}: ${step.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}
      </div>
    </div>
  )
}
