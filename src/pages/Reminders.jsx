import { Link } from 'react-router-dom'
import { Bell, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import useStore from '../store'
import {
  getTodayOrders, getTomorrowOrders, getOrdersIn3Days, getLateOrders,
  formatDate, getProductLabel, daysUntil,
} from '../utils'
import { StatusBadge, ModeBadge } from '../components/ui'

export default function Reminders() {
  const orders = useStore(s => s.orders)

  const today = getTodayOrders(orders)
  const tomorrow = getTomorrowOrders(orders)
  const in3 = getOrdersIn3Days(orders).filter(o =>
    !today.find(x => x.id === o.id) && !tomorrow.find(x => x.id === o.id)
  )
  const late = getLateOrders(orders)

  const sections = [
    { key: 'late', title: 'En retard', icon: <AlertTriangle size={16} className="text-red-500" />, orders: late, color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
    { key: 'today', title: "Aujourd'hui", icon: <Bell size={16} className="text-bordeaux" />, orders: today, color: 'bg-rose-50 border-rose-200', textColor: 'text-bordeaux' },
    { key: 'tomorrow', title: 'Demain', icon: <Clock size={16} className="text-amber-500" />, orders: tomorrow, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
    { key: 'in3', title: 'Dans 3 jours', icon: <CheckCircle2 size={16} className="text-blue-500" />, orders: in3, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  ]

  const hasAny = sections.some(s => s.orders.length > 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-3xl font-bold text-chocolat">Rappels</h1>
        <p className="text-sm text-warmgray-400 mt-0.5">Commandes à surveiller de près</p>
      </div>

      {!hasAny && (
        <div className="card text-center py-16">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-playfair text-xl font-semibold text-chocolat">Tout est à jour !</p>
          <p className="text-sm text-warmgray-400 mt-1">Aucune commande urgente à surveiller pour le moment.</p>
        </div>
      )}

      <div className="space-y-6">
        {sections.map(({ key, title, icon, orders: sOrders, color, textColor }) => {
          if (sOrders.length === 0) return null
          return (
            <div key={key}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${color}`}>
                {icon}
                <span className={`font-semibold text-sm ${textColor}`}>{title}</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${textColor}`}>
                  {sOrders.length}
                </span>
              </div>
              <div className="space-y-2">
                {sOrders.map(o => (
                  <ReminderCard key={o.id} order={o} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReminderCard({ order: o }) {
  const days = daysUntil(o.deliveryDate)
  return (
    <Link to={`/commandes/${o.id}`} className="block">
      <div className="card hover:border-rose-300 hover:shadow-soft transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-chocolat">{o.clientFirstName} {o.clientLastName}</span>
              <span className="text-xs text-rose-500">{o.clientInstagram}</span>
            </div>
            <p className="text-sm text-warmgray-500">
              {getProductLabel(o.productType)}{o.productVariant ? ` · ${o.productVariant}` : ''}
            </p>
            <p className="text-xs text-warmgray-400 mt-1">
              {formatDate(o.deliveryDate)} à {o.deliveryTime}
              {days === 0 && <span className="ml-2 font-semibold text-bordeaux">⚡ Aujourd'hui !</span>}
              {days === 1 && <span className="ml-2 font-semibold text-amber-600">⚠️ Demain</span>}
              {days !== null && days > 1 && <span className="ml-2 text-blue-600">📅 Dans {days} jours</span>}
              {days !== null && days < 0 && <span className="ml-2 font-semibold text-red-600">🚨 En retard de {Math.abs(days)} jour(s)</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={o.status} />
            <ModeBadge mode={o.deliveryMode} />
          </div>
          <ChevronRight size={16} className="text-warmgray-400 group-hover:text-bordeaux transition-colors flex-shrink-0 self-center" />
        </div>
      </div>
    </Link>
  )
}
