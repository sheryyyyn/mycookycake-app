import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Cake, Eye, EyeOff } from 'lucide-react'
import useStore from '../store'

export default function Login() {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const ok = login(password)
    setLoading(false)
    if (ok) {
      navigate(from, { replace: true })
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-beige-light rounded-full translate-y-1/2 -translate-x-1/2 opacity-40 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
            <Cake size={28} className="text-bordeaux" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-bordeaux">Mycookycake</h1>
          <p className="text-warmgray-400 text-sm mt-1">Espace de gestion privé</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-soft p-8">
          <h2 className="font-playfair text-xl font-semibold text-chocolat mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="••••••••••••"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-warmgray-500"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                Mot de passe incorrect.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-warmgray-400 mt-6 italic">
          L'art de créer des moments sucrés
        </p>
      </div>
    </div>
  )
}
