'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, Lock, Mail } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : authError.message)
        return
      }

      window.location.href = '/admin'
    } catch {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080a] px-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="bg-[#111113] border-white/[0.08] shadow-2xl">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20">
              <Lock className="h-7 w-7 text-[#c9a84c]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Maison Dorée</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Panneau d&apos;administration</p>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#a0a09a] text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@maisondoree.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] focus:border-[#c9a84c] focus:ring-[#c9a84c]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#a0a09a] text-sm">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] focus:border-[#c9a84c] focus:ring-[#c9a84c]/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-11 text-sm transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-[#606060] text-xs mt-6">
          Accès réservé aux administrateurs autorisés
        </p>
      </div>
    </div>
  )
}
