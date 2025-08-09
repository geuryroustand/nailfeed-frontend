import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SampleDataNoticeProps {
  className?: string
}

function SampleDataNotice({ className = "" }: SampleDataNoticeProps) {
  return (
    <Alert variant="default" className={`bg-amber-50 border-amber-200 ${className}`}>
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Sample Data Mode</AlertTitle>
      <AlertDescription className="text-amber-700">
        You're viewing sample data. Connect to a real API by setting the API_URL environment variable.
      </AlertDescription>
    </Alert>
  )
}

// Replace the named export with a default export
export default SampleDataNotice

// Keep the named export as well for backward compatibility
export { SampleDataNotice }
