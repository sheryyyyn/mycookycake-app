import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useStore from './store'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
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

function RequireAuth({ children }) {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  const initSeed = useStore(s => s.initSeed)

  useEffect(() => {
    initSeed()
  }, [initSeed])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/formulaire" element={<ClientForm />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
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
          </RequireAuth>
        }
      />
    </Routes>
  )
}
