import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useStore from './store'

import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import NewOrder from './pages/NewOrder'
import OrderDetail from './pages/OrderDetail'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Catalog from './pages/Catalog'
import Settings from './pages/Settings'
import ClientForm from './pages/ClientForm'
import Production from './pages/Production'
import Courses from './pages/Courses'
import Etiquettes from './pages/Etiquettes'
import Statistiques from './pages/Statistiques'

export default function App() {
  const loadData = useStore(s => s.loadData)
  const loading = useStore(s => s.loading)
  const connectionError = useStore(s => s.connectionError)

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-bordeaux border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-warmgray-400 text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-playfair text-xl font-bold text-chocolat">Connexion impossible</h2>
          <p className="text-sm text-warmgray-500 leading-relaxed">
            La base de données est temporairement inaccessible. Cela arrive parfois quand le projet Supabase est en veille après une période d'inactivité.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-amber-800">Que faire ?</p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              <li>Va sur <span className="font-mono font-bold">supabase.com</span> → ton projet</li>
              <li>Clique sur <strong>"Restore project"</strong> si le projet est en pause</li>
              <li>Attends 1-2 minutes puis réessaie</li>
            </ol>
          </div>
          <button
            onClick={() => loadData()}
            className="btn-primary w-full justify-center"
          >
            Réessayer la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/formulaire" element={<ClientForm />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/commandes" element={<Orders />} />
              <Route path="/commandes/nouvelle" element={<NewOrder />} />
              <Route path="/commandes/:id" element={<OrderDetail />} />
              <Route path="/production" element={<Production />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/etiquettes" element={<Etiquettes />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/:id" element={<ClientDetail />} />
              <Route path="/catalogue" element={<Catalog />} />
              <Route path="/statistiques" element={<Statistiques />} />
              <Route path="/parametres" element={<Settings />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}
