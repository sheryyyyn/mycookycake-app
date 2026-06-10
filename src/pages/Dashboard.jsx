import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Link2, Copy, ExternalLink, Bell, ChevronRight, AlertTriangle,
} from 'lucide-react'
import useStore from '../store'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'
import {
  todayUpperCase, getUpcomingOrders, getOrdersIn3Days,
  getTodayOrders, getTomorrowOrders, formatDate, formatAmount,
  getProductLabel, daysUntil,
} from '../utils'
import { StatusBadge, ModeBadge } from '../components/ui'

export default function Dashboard() {
  const orders = useStore(s => s.orders)
  const settings = useStore(s => s.settings)
  const [copied, setCopied] = useState(false)

  const formUrl = window.location.origin + '/formulaire'

  const thisWeek = getUpcomingOrders(orders)

  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())
  const thisMonthCA = orders
    .filter(o => {
      if (o.status === 'annulee') return false
      if (!o.deliveryDate) return false
      const d = parseISO(o.deliveryDate)
      return d >= monthStart && d <= monthEnd
    })
    .reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)

  const upcoming = getUpcomingOrders(orders).slice(0, 6)
  const in3days = getOrdersIn3Days(orders)
  const today = getTodayOrders(orders)
  const tomorrow = getTomorrowOrders(orders)
  const urgents = [...today, ...tomorrow, ...in3days].filter(
    (o, i, arr) => arr.findIndex(x => x.id === o.id) === i
  )

  function copyLink() {
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-1">
          {todayUpperCase()}
        </p>
        <h1 className="font-playfair text-4xl font-bold text-chocolat leading-tight">Bonjour.</h1>
        <p className="text-warmgray-400 mt-1 text-sm">Voici un aperçu de votre atelier aujourd'hui.</p>
      </div>

      {/* Quick summary banner */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <div className="bg-white border border-warmgray-100 rounded-2xl px-4 py-4 shadow-soft text-center">
          <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-1">Demain</p>
          <p className="font-playfair text-3xl font-bold text-chocolat leading-none">{tomorrow.length}</p>
          <p className="text-xs text-warmgray-400 mt-1">commande{tomorrow.length > 1 ? 's' : ''} à préparer</p>
        </div>
        <div className="bg-white border border-warmgray-100 rounded-2xl px-4 py-4 shadow-soft text-center">
          <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-1">Cette semaine</p>
          <p className="font-playfair text-3xl font-bold text-chocolat leading-none">{thisWeek.length}</p>
          <p className="text-xs text-warmgray-400 mt-1">commande{thisWeek.length > 1 ? 's' : ''} dans les 7 jours</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-4 shadow-soft text-center">
          <p className="text-xs font-semibold text-bordeaux/60 uppercase tracking-widest mb-1">Ce mois</p>
          <p className="font-playfair text-3xl font-bold text-bordeaux leading-none">{formatAmount(thisMonthCA)}</p>
          <p className="text-xs text-bordeaux/50 mt-1">de chiffre d'affaire</p>
        </div>
      </div>

      {/* Form link encart */}
      <div className="bg-gradient-to-r from-rose-100 to-rose-50 border border-rose-200 rounded-2xl p-5 mb-7 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
            <Link2 size={18} className="text-bordeaux" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-bordeaux text-sm">Lien de commande client</p>
            <p className="text-xs text-warmgray-500 mt-0.5">Copiez ce lien et envoyez-le à vos clientes après validation.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/formulaire"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm gap-1.5"
          >
            <ExternalLink size={13} />
            Voir le formulaire
          </a>
          <button onClick={copyLink} className="btn-primary text-sm gap-1.5">
            <Copy size={13} />
            {copied ? 'Copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>

      {/* Urgent reminders */}
      {urgents.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-semibold text-sm text-chocolat">Rappels urgents</h2>
          </div>
          <div className="space-y-2">
            {urgents.map(o => {
              const days = daysUntil(o.deliveryDate)
              return (
                <Link key={o.id} to={`/commandes/${o.id}`} className="block">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-amber-100 transition-colors">
                    <Bell size={15} className="text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-800 flex-1">
                      Commande de <strong>{o.clientFirstName}</strong>{' '}
                      {days === 0 ? "aujourd'hui" : days === 1 ? 'demain' : `dans ${days} jours`}
                      {' — '}{getProductLabel(o.productType)} · {o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'} à {o.deliveryTime}
                    </p>
                    <ChevronRight size={14} className="text-amber-400 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-playfair font-semibold text-chocolat text-xl">Prochaines commandes</h2>
            <p className="text-sm text-warmgray-400 mt-0.5">Les livraisons et retraits à venir</p>
          </div>
          <Link to="/commandes" className="btn-secondary text-sm">
            Tout voir
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-3xl block mb-2">🎂</span>
            <p className="text-warmgray-400 text-sm">Aucune commande à venir</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const days = daysUntil(order.deliveryDate)
  return (
    <Link to={`/commandes/${order.id}`}>
      <div className="card hover:border-rose-300 hover:shadow-soft transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs text-warmgray-400 font-medium">{getProductLabel(order.productType)}</p>
            <p className="font-semibold text-chocolat">{order.clientFirstName}</p>
            <p className="text-xs text-rose-500">{order.clientInstagram}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-warmgray-400">
              {formatDate(order.deliveryDate)} · {order.deliveryTime}
            </p>
            <ModeBadge mode={order.deliveryMode} />
          </div>
          <span className="text-xs text-bordeaux font-semibold group-hover:underline flex items-center gap-0.5">
            Voir <ChevronRight size={12} />
          </span>
        </div>
        {days !== null && days <= 3 && days >= 0 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 border border-amber-100 font-medium">
            {days === 0 ? "⚡ Aujourd'hui !" : days === 1 ? '⚡ Demain !' : `⚡ Dans ${days} jours`}
          </div>
        )}
      </div>
    </Link>
  )
}
