import { create } from 'zustand'

interface FocusModeState {
  active: boolean
  toggle: () => void
  setActive: (active: boolean) => void
}

export const useFocusModeActive = create<FocusModeState>((set) => ({
  active: false,
  toggle: () => set((s) => ({ active: !s.active })),
  setActive: (active) => set({ active })
}))
