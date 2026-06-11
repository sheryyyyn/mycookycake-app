import { Link } from 'react-router-dom'
import { ClipboardList, Users, DollarSign, Clock, Cake, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import useStore from '../store'
import { format, parseISO, isToday, startOfDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState } from 'react'
import {
  todayUpperCase,
  getUpcomingOrders,
  getTodayPickups,
  formatAmount,
  getStatusColor,
  getStatusLabel,
  getProductLabel,
  formatDateShort,
} from '../utils'

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ orders }) {
  const [current, setCurrent] = useState(new Date())
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start: week starts Monday (1)
  const startPad = (getDay(monthStart) + 6) % 7
  const pickupDates = new Set(
    orders
      .filter(o => o.deliveryDate && o.status !== 'annulee')
      .map(o => o.deliveryDate.slice(0, 10))
  )

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrent(d => addDays(startOfMonth(d), -1))} className="p-1 rounded hover:bg-rose-50 text-warmgray-400 hover:text-bordeaux transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-chocolat capitalize">
          {format(current, 'MMMM yyyy', { locale: fr })}
        </span>
        <button onClick={() => setCurrent(d => addDays(endOfMonth(d), 1))} className="p-1 rounded hover:bg-rose-50 text-warmgray-400 hover:text-bordeaux transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-warmgray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const hasPickup = pickupDates.has(key)
          const today = isToday(day)
          return (
            <div
              key={key}
              className={`
                text-center text-sm py-2 rounded-lg font-medium transition-colors
                ${today ? 'bg-bordeaux text-white' : ''}
                ${hasPickup && !today ? 'bg-rose-100 text-bordeaux font-bold' : ''}
                ${!today && !hasPickup ? 'text-warmgray-500' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const orders = useStore(s => s.orders)
  const clients = useStore(s => s.clients)

  const today = startOfDay(new Date())
  const activeOrders = orders.filter(o => {
    if (o.status === 'annulee') return false
    if (o.status === 'nouvelle' || o.status === 'confirmee') {
      if (!o.deliveryDate) return true
      return parseISO(o.deliveryDate) >= today
    }
    return true
  })
  const totalCollected = activeOrders.reduce((s, o) => s + (Number(o.amountPaid) || 0), 0)
  const upcomingPickups = getUpcomingOrders(orders)
  const todayPickups = getTodayPickups(orders)

  // Week production orders
  const weekOrders = activeOrders.filter(o => {
    if (!o.deliveryDate) return false
    const d = parseISO(o.deliveryDate)
    const now = startOfDay(new Date())
    return d >= now && d <= addDays(now, 7)
  })

  // Recent orders for table (last 5 non-cancelled)
  const recentOrders = [...activeOrders]
    .sort((a, b) => (b.createdAt || b.id || '').localeCompare(a.createdAt || a.id || ''))
    .slice(0, 5)

  const stats = [
    { label: 'Total commandes', value: orders.filter(o => o.status !== 'annulee').length, sub: 'Commandes actives', icon: ClipboardList, color: 'bg-rose-50 text-bordeaux' },
    { label: 'Clients', value: clients.length, sub: 'Total clients', icon: Users, color: 'bg-amber-50 text-amber-600' },
    { label: 'Paiements', value: formatAmount(totalCollected), sub: 'Total encaissé', icon: DollarSign, color: 'bg-violet-50 text-violet-600' },
    { label: 'Retraits', value: upcomingPickups.length, sub: 'À venir (7j)', icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Production', value: weekOrders.length, sub: 'Cette semaine', icon: Cake, color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-1">{todayUpperCase()}</p>
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Tableau de bord</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card py-4 px-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-chocolat leading-tight">{s.value}</div>
              <div className="text-[11px] text-warmgray-400 leading-tight">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Table + Calendar */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Orders Overview Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-chocolat">Aperçu des commandes</h2>
            <Link to="/commandes" className="text-xs text-bordeaux hover:underline font-medium">Voir tout</Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-6">Aucune commande</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rose-100">
                    <th className="text-left text-[10px] font-semibold text-warmgray-400 uppercase tracking-wide pb-2 pr-3">Client</th>
                    <th className="text-left text-[10px] font-semibold text-warmgray-400 uppercase tracking-wide pb-2 pr-3">Produit</th>
                    <th className="text-left text-[10px] font-semibold text-warmgray-400 uppercase tracking-wide pb-2 pr-3">Date</th>
                    <th className="text-left text-[10px] font-semibold text-warmgray-400 uppercase tracking-wide pb-2 pr-3">Statut</th>
                    <th className="text-right text-[10px] font-semibold text-warmgray-400 uppercase tracking-wide pb-2">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-2.5 pr-3">
                        <Link to={`/commandes/${o.id}`} className="font-medium text-chocolat hover:text-bordeaux transition-colors">
                          {o.clientInstagram || o.clientFirstName || '—'}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-warmgray-500 text-xs">{getProductLabel(o.productType)}</td>
                      <td className="py-2.5 pr-3 text-warmgray-500 text-xs whitespace-nowrap">{formatDateShort(o.deliveryDate)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`badge text-[10px] border ${getStatusColor(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-chocolat text-xs">{formatAmount(o.amountTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="card">
          <h2 className="font-semibold text-chocolat mb-4 text-sm">Calendrier</h2>
          <MiniCalendar orders={orders} />
        </div>
      </div>

      {/* Today's Pickups */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bordeaux flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-white" />
            </div>
            <h2 className="font-semibold text-chocolat">Retraits & Livraisons du jour</h2>
          </div>
          <Link to="/commandes" className="btn-secondary text-xs py-1.5 px-3">Toutes les commandes</Link>
        </div>

        {todayPickups.length === 0 ? (
          <p className="text-sm text-warmgray-400 text-center py-5">Aucun retrait ni livraison aujourd'hui</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {todayPickups.map(o => (
              <Link key={o.id} to={`/commandes/${o.id}`} className="flex items-center gap-3 bg-rose-50 hover:bg-rose-100 transition-colors rounded-xl px-4 py-3 min-w-[220px]">
                <div className="text-center flex-shrink-0">
                  <div className="text-sm font-bold text-bordeaux">{o.deliveryTime || '—'}</div>
                </div>
                <div className="w-px h-8 bg-rose-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Cake size={14} className="text-bordeaux" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-chocolat leading-tight">{o.clientInstagram || o.clientFirstName}</div>
                    <div className="text-[11px] text-warmgray-400 flex items-center gap-1">
                      {o.deliveryMode === 'livraison' ? <><MapPin size={9} /> Livraison</> : 'Retrait'}
                      {' · '}{getProductLabel(o.productType)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
