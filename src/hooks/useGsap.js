import { useLayoutEffect } from 'react'
import { gsap } from '../lib/motion'

/**
 * Runs GSAP setup inside a gsap.context scoped to `scope`, reverting everything on unmount.
 * The callback receives the context so it can use gsap.matchMedia etc.
 */
export function useGsap(callback, scope, deps = []) {
  useLayoutEffect(() => {
    if (!scope.current) return
    const ctx = gsap.context(callback, scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
