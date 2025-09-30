/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useScrollVelocity } from '@/hooks/use-scroll-velocity'

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
})

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => {
  return setTimeout(cb, 16) // ~60fps
}) as any

global.cancelAnimationFrame = jest.fn(clearTimeout) as any

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true,
})

jest.useFakeTimers()

describe('useScrollVelocity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    window.scrollY = 0
    ;(window.performance.now as jest.Mock).mockReturnValue(0)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  it('should initialize with zero velocity and not scrolling', () => {
    const { result } = renderHook(() => useScrollVelocity())

    expect(result.current.velocity).toBe(0)
    expect(result.current.isScrolling).toBe(false)
    expect(result.current.isFastScrolling).toBe(false)
    expect(result.current.direction).toBe('down')
    expect(result.current.acceleration).toBe(0)
  })

  it('should detect downward scrolling', async () => {
    const { result } = renderHook(() => useScrollVelocity({
      velocityThreshold: 10,
      fastThreshold: 50,
    }))

    // Simulate scroll events
    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    act(() => {
      // First scroll position
      window.scrollY = 0
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16) // RAF delay
    })

    act(() => {
      // Second scroll position after 100ms
      window.scrollY = 100
      timeCounter = 100
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16) // RAF delay
    })

    // Should detect downward movement
    expect(result.current.direction).toBe('down')
    expect(result.current.velocity).toBeGreaterThan(0)
  })

  it('should detect upward scrolling', async () => {
    const { result } = renderHook(() => useScrollVelocity({
      velocityThreshold: 10,
    }))

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    act(() => {
      // Start from scrolled position
      window.scrollY = 200
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    act(() => {
      // Scroll up
      window.scrollY = 100
      timeCounter = 100
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    expect(result.current.direction).toBe('up')
    expect(result.current.velocity).toBeGreaterThan(0)
  })

  it('should detect fast scrolling', async () => {
    const { result } = renderHook(() => useScrollVelocity({
      velocityThreshold: 10,
      fastThreshold: 500, // 500px/s
    }))

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    act(() => {
      window.scrollY = 0
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    act(() => {
      // Very fast scroll: 1000px in 100ms = 10,000px/s
      window.scrollY = 1000
      timeCounter = 100
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    expect(result.current.isFastScrolling).toBe(true)
    expect(result.current.isScrolling).toBe(true)
  })

  it('should stop detecting scrolling after timeout', () => {
    const { result } = renderHook(() => useScrollVelocity({
      velocityThreshold: 10,
    }))

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    act(() => {
      window.scrollY = 0
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    act(() => {
      window.scrollY = 100
      timeCounter = 100
      window.dispatchEvent(new Event('scroll'))
    })

    act(() => {
      jest.advanceTimersByTime(16)
    })

    // Should be scrolling
    expect(result.current.isScrolling).toBe(true)

    // Wait for stop timeout (150ms)
    act(() => {
      jest.advanceTimersByTime(150)
    })

    // Should stop scrolling
    expect(result.current.isScrolling).toBe(false)
    expect(result.current.velocity).toBe(0)
  })

  it('should calculate acceleration correctly', () => {
    const { result } = renderHook(() => useScrollVelocity())

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    // First measurement
    act(() => {
      window.scrollY = 0
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
      jest.advanceTimersByTime(16)
    })

    // Second measurement - slower
    act(() => {
      window.scrollY = 100
      timeCounter = 200 // Slower: 500px/s
      window.dispatchEvent(new Event('scroll'))
      jest.advanceTimersByTime(16)
    })

    // Third measurement - faster
    act(() => {
      window.scrollY = 300
      timeCounter = 300 // Faster: 2000px/s
      window.dispatchEvent(new Event('scroll'))
      jest.advanceTimersByTime(16)
    })

    // Should have positive acceleration (speeding up)
    expect(result.current.acceleration).toBeGreaterThan(0)
  })

  it('should handle sample size configuration', () => {
    const { result } = renderHook(() => useScrollVelocity({
      sampleSize: 3,
    }))

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    // Add several scroll events
    for (let i = 0; i < 5; i++) {
      act(() => {
        window.scrollY = i * 50
        timeCounter = i * 50
        window.dispatchEvent(new Event('scroll'))
        jest.advanceTimersByTime(16)
      })
    }

    // Should still work with limited samples
    expect(result.current.velocity).toBeGreaterThanOrEqual(0)
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useScrollVelocity())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('should use custom thresholds', () => {
    const customVelocityThreshold = 200
    const customFastThreshold = 800

    const { result } = renderHook(() => useScrollVelocity({
      velocityThreshold: customVelocityThreshold,
      fastThreshold: customFastThreshold,
    }))

    let timeCounter = 0
    ;(window.performance.now as jest.Mock).mockImplementation(() => timeCounter)

    act(() => {
      window.scrollY = 0
      timeCounter = 0
      window.dispatchEvent(new Event('scroll'))
      jest.advanceTimersByTime(16)
    })

    act(() => {
      // Scroll at exactly threshold velocity
      window.scrollY = 150 // 150px in 100ms = 1500px/s (above both thresholds)
      timeCounter = 100
      window.dispatchEvent(new Event('scroll'))
      jest.advanceTimersByTime(16)
    })

    expect(result.current.isScrolling).toBe(true)
    expect(result.current.isFastScrolling).toBe(true)
  })
})
