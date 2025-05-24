import { useId } from "react"

/**
 * Custom hook that generates a unique ID using React 18's useId
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function useUniqueId(prefix?: string): string {
  const id = useId()
  return prefix ? `${prefix}-${id}` : id
}
