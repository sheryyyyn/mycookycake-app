import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, PlusCircle, Calendar, Users,
  BookOpen, Bell, Settings, Link2, LogOut, Cake,
} from 'lucide-react'
import useStore from '../../store'

const NAV_ITEMS = [
  { to: '/',             label: 'Tableau de bord',  icon: LayoutDashboard, end: true },
  { to: '/commandes',    label: 'Commandes',         icon: ShoppingBag },
  { to: '/commandes/nouvelle', label: 'Nouvelle commande', icon: PlusCircle },
  { to: '/calendrier',  label: 'Calendrier',         icon: Calendar },
  { to: '/clientes',    label: 'Clientes',           icon: Users },
  { to: '/catalogue',   label: 'Catalogue',          icon: BookOpen },
  { to: '/rappels',     label: 'Rappels',            icon: Bell },
  { to: '/parametres',  label: 'Paramètres',         icon: Settings },
]

export default function Sidebar({ onClose }) {
  const logout = useStore(s => s.logout)
  const settings = useStore(s => s.settings)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
    onClose?.()
  }

  function copyFormLink() {
    const url = window.location.origin + '/formulaire'
    navigator.clipboard.writeText(url)
      .then(() => alert('Lien copié !'))
      .catch(() => alert(url))
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-rose-100">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-rose-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Cake size={18} className="text-bordeaux" />
          </div>
          <div>
            <p className="font-playfair font-bold text-bordeaux text-base leading-tight">
              {settings.businessName}
            </p>
            <p className="text-xs text-warmgray-400">Gestion</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'sidebar-link ' + (isActive ? 'active' : '')
            }
            onClick={onClose}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 pt-3 border-t border-rose-50 space-y-2">
        <button
          onClick={copyFormLink}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50 text-bordeaux text-sm font-medium hover:bg-rose-100 transition-colors"
        >
          <Link2 size={15} className="flex-shrink-0" />
          <span>Lien de commande client</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-warmgray-400 text-sm hover:text-bordeaux hover:bg-rose-50 transition-colors"
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>

        <p className="px-3 text-xs text-warmgray-400 italic leading-tight">
          L'art de créer des moments sucrés
        </p>
      </div>
    </div>
  )
}
