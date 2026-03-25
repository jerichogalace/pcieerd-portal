'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'

interface AdminLoginProps {
  onBack: () => void
}

export function AdminLogin({ onBack }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAdminStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500))

    const success = login(password)
    if (!success) {
      setError('Invalid password. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <header className="bg-sky-700 text-white py-4 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Image 
              src="/icon.png" 
              alt="DOST-PCIEERD Logo" 
              width={32} 
              height={32}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">DOST - PCIEERD</h1>
              <p className="text-xs sm:text-sm text-sky-100">Admin Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-sky-100 p-3">
                <Lock className="h-8 w-8 text-sky-700" />
              </div>
            </div>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-sky-700 hover:bg-sky-800"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12"
                  onClick={onBack}
                >
                  Back to Visitor Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-gray-100 border-t py-4 px-4 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} DOST - PCIEERD. All rights reserved.</p>
      </footer>
    </div>
  )
}
