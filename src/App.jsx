import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useStore from './store'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import NewOrder from './pages/NewOrder'
import OrderDetail from './pages/OrderDetail'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Catalog from './pages/Catalog'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import ClientForm from './pages/ClientForm'

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
                <Route path="/calendrier" element={<Calendar />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/clientes/:id" element={<ClientDetail />} />
                <Route path="/catalogue" element={<Catalog />} />
                <Route path="/rappels" element={<Reminders />} />
                <Route path="/parametres" element={<Settings />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
