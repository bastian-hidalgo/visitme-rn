import { useCallback, useMemo, useState } from 'react'

export type StepStatus = 'pending' | 'active' | 'complete'

export interface StepDefinition<T extends string> {
  id: T
  title: string
  description?: string
}

interface UseStepperizeOptions<T extends string> {
  steps: StepDefinition<T>[]
  initialStep?: T
}

interface StepperizeApi<T extends string> {
  steps: StepDefinition<T>[]
  activeStep: T
  activeIndex: number
  order: T[]
  isFirst: boolean
  isLast: boolean
  goTo: (step: T) => void
  next: () => void
  previous: () => void
  getStatus: (step: T, completedSteps?: Set<T>) => StepStatus
}

export function useStepperize<T extends string>({ steps, initialStep }: UseStepperizeOptions<T>): StepperizeApi<T> {
  if (!steps.length) {
    throw new Error('useStepperize requiere al menos un paso para inicializarse')
  }

  const order = useMemo(() => steps.map((step) => step.id), [steps])

  const initialIndex = useMemo(() => {
    if (!initialStep) return 0
    const idx = order.indexOf(initialStep)
    return idx >= 0 ? idx : 0
  }, [initialStep, order])

  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const goTo = useCallback(
    (step: T) => {
      const idx = order.indexOf(step)
      if (idx === -1) return
      setActiveIndex(idx)
    },
    [order],
  )

  const next = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev >= order.length - 1) return prev
      return prev + 1
    })
  }, [order.length])

  const previous = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev <= 0) return 0
      return prev - 1
    })
  }, [])

  const getStatus = useCallback(
    (step: T, completedSteps?: Set<T>): StepStatus => {
      const idx = order.indexOf(step)
      if (idx === -1) return 'pending'

      if (completedSteps?.has(step)) return 'complete'
      if (idx === activeIndex) return 'active'
      if (idx < activeIndex) return 'complete'
      return 'pending'
    },
    [activeIndex, order],
  )

  const activeStep = order[activeIndex]

  return {
    steps,
    activeStep,
    activeIndex,
    order,
    isFirst: activeIndex === 0,
    isLast: activeIndex === order.length - 1,
    goTo,
    next,
    previous,
    getStatus,
  }
}
