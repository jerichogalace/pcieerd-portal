import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminState {
  isAuthenticated: boolean
  currentPassword: string
  setPassword: (password: string) => void
  fetchPassword: () => Promise<void>
  login: (password: string) => boolean
  logout: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentPassword: '021926',
      
      setPassword: (password: string) => {
        set({ currentPassword: password })
      },
      
      fetchPassword: async () => {
        try {
          const response = await fetch('/api/change-password')
          if (response.ok) {
            const data = await response.json()
            set({ currentPassword: data.password })
          }
        } catch (error) {
          console.error('Error fetching password:', error)
        }
      },
      
      login: (password: string) => {
        const { currentPassword } = get()
        if (password === currentPassword) {
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
      name: 'admin-auth-v2',
    }
  )
)
