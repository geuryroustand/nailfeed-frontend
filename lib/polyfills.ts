// This file provides polyfills for browser environments

// Polyfill for require if needed in browser context
if (typeof window !== "undefined" && typeof (window as any).require === "undefined") {
  // Create a simple warning function that logs to console but doesn't break execution
  ;(window as any).require = (modulePath: string) => {
    console.warn(`Module '${modulePath}' was attempted to be loaded using require() which is not available in the browser. 
    Please update the code to use ES module imports instead.`)
    return {} // Return empty object to prevent further errors
  }
}

export {}
