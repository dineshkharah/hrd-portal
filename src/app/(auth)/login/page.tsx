'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }

      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role = session?.user?.role

      if (role === 'HRD') router.push('/hrd/dashboard')
      else if (role === 'DEC') router.push('/dec/dashboard')
      else if (role === 'DRR') router.push('/drr/dashboard')
      else if (role === 'CLUB') router.push('/club/dashboard')
      else if (role === 'DCM') router.push('/dcm/dashboard')
      else router.push('/login')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#180F04]">
      {/* Background glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4A017]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#D4A017]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(170,255,71,0.03)_0%,_transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <div className="flex items-center gap-3">
            <svg width="38" height="38" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="12.5" stroke="#E8175D" strokeWidth="2"/>
              <circle cx="14" cy="14" r="5.5" stroke="#E8175D" strokeWidth="2"/>
              <circle cx="14" cy="14" r="2.5" fill="#E8175D"/>
              <line x1="14" y1="8.5" x2="14" y2="2.5" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="14" y1="25.5" x2="14" y2="19.5" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="8.5" y1="14" x2="2.5" y2="14" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="25.5" y1="14" x2="19.5" y2="14" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="9.9" y1="9.9" x2="5.8" y2="5.8" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
              <line x1="22.2" y1="22.2" x2="18.1" y2="18.1" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18.1" y1="9.9" x2="22.2" y2="5.8" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5.8" y1="22.2" x2="9.9" y2="18.1" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-['Fraunces'] text-white font-bold text-5xl tracking-tight leading-none">SYNC</span>
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#FBF7EE]/30 font-['Geist']">
            Rotaract District 3141 · by Team HRD
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-md p-7 shadow-2xl shadow-black/40">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-[#FBF7EE]/50 font-['Geist']">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@district3141.org"
                className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 text-sm text-[#FBF7EE] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40 focus:border-[#D4A017]/60 transition-all font-['Geist']"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-[#FBF7EE]/50 font-['Geist']">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 text-sm text-[#FBF7EE] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/40 focus:border-[#D4A017]/60 transition-all font-['Geist']"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <p className="text-xs text-red-400 text-center font-['Geist']">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 h-11 rounded-xl bg-[#D4A017] text-[#180F04] text-sm font-bold tracking-wide hover:bg-[#e6b520] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-['Geist'] shadow-lg shadow-[#D4A017]/20"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[10px] text-[#FBF7EE]/20 font-['Geist'] tracking-wide">
          Authorised access only · Rotaract District 3141
        </p>
      </div>
    </main>
  )
}
