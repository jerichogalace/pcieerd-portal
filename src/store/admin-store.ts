import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminState {
  isAuthenticated: boolean
  currentPin: string
  setPin: (pin: string) => void
  login: (pin: string) => boolean
  logout: () => void
}

// Default 6-digit PIN: 021926
const DEFAULT_PIN = '021926'

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentPin: DEFAULT_PIN,
      
      setPin: (pin: string) => {
        set({ currentPin: pin })
      },
      
      login: (pin: string) => {
        const { currentPin } = get()
        if (pin === currentPin) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },
      
      logout: () => {
        set({ isAuthenticated: false })
      },
    }),
    {
      name: 'admin-auth',
    }
  )
)
