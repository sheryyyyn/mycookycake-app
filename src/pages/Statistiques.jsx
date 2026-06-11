import { useState, useMemo } from 'react'
import { TrendingUp, ShoppingBag, Users, CreditCard, Target } from 'lucide-react'
import useStore from '../store'
import {
  parseISO, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, eachMonthOfInterval, isWithinInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatAmount, getProductLabel } from '../utils'

const PERIODS = [
  { id: 'week',  label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year',  label: 'Année' },
]

function getInterval(period) {
  const now = new Date()
  if (period === 'week')  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
  if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) }
  return { start: startOfYear(now), end: endOfYear(now) }
}

function KpiCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`card flex items-center gap-4 ${accent ? 'bg-bordeaux border-bordeaux' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-white/20' : 'bg-rose-100'}`}>
        <Icon size={20} className={accent ? 'text-white' : 'text-bordeaux'} />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-white/70' : 'text-warmgray-400'}`}>{label}</p>
        <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-chocolat'}`}>{value}</p>
      </div>
    </div>
  )
}

function HBarChart({ data, max }) {
  if (!data.length) return <p className="text-sm text-warmgray-400 text-center py-4">Aucune donnée</p>
  return (
    <div className="space-y-2.5">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-warmgray-500 w-28 flex-shrink-0 truncate">{label}</span>
          <div className="flex-1 bg-rose-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-bordeaux h-2 rounded-full transition-all"
              style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs font-semibold text-chocolat w-6 text-right">{value}</span>
        </div>
      ))}
    </div>
  )
}

function RevenueChart({ months, data }) {
  const max = Math.max(...data, 1)
  const H = 160
  const W = 60

  const points = data.map((v, i) => `${i * W + W / 2},${H - (v / max) * (H - 10) - 5}`)

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${months.length * W} ${H + 24}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B2635" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8B2635" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1="0" y1={H - t * (H - 10) - 5} x2={months.length * W} y2={H - t * (H - 10) - 5}
            stroke="#FEE1EC" strokeWidth="1" />
        ))}
        {data.length > 1 && (
          <>
            <polygon
              points={[`0,${H}`, ...points, `${(data.length - 1) * W + W / 2},${H}`].join(' ')}
              fill="url(#areaGrad)"
            />
            <polyline
              points={points.join(' ')}
              fill="none" stroke="#8B2635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </>
        )}
        {data.map((v, i) => (
          <circle key={i} cx={i * W + W / 2} cy={H - (v / max) * (H - 10) - 5} r="4" fill="#8B2635" />
        ))}
        {months.map((m, i) => (
          <text key={i} x={i * W + W / 2} y={H + 18} textAnchor="middle" fontSize="10" fill="#9E8E8E" className="capitalize">
            {format(m, 'MMM', { locale: fr })}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function Statistiques() {
  const orders  = useStore(s => s.orders)
  const settings = useStore(s => s.settings)
  const [period, setPeriod] = useState('month')

  const interval = getInterval(period)

  const periodOrders = useMemo(() => orders.filter(o => {
    if (o.status === 'annulee' || !o.deliveryDate) return false
    try { return isWithinInterval(parseISO(o.deliveryDate), interval) } catch { return false }
  }), [orders, period]) // eslint-disable-line react-hooks/exhaustive-deps

  const ca = periodOrders.reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)
  const nbCommandes = periodOrders.length
  const clientSet = new Set(periodOrders.map(o => o.clientInstagram || o.clientFirstName).filter(Boolean))
  const panierMoyen = nbCommandes > 0 ? ca / nbCommandes : 0

  // Products
  const productCounts = {}
  for (const o of periodOrders) {
    const k = getProductLabel(o.productType)
    productCounts[k] = (productCounts[k] || 0) + 1
  }
  const productData = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }))

  // Flavors
  const flavorCounts = {}
  for (const o of periodOrders) {
    const f = o.flavorMain?.trim()
    if (f) flavorCounts[f] = (flavorCounts[f] || 0) + 1
  }
  const flavorData = Object.entries(flavorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }))

  // Top clients (all time)
  const clientOrders = {}
  for (const o of orders.filter(o => o.status !== 'annulee')) {
    const k = o.clientInstagram || o.clientFirstName
    if (k) clientOrders[k] = (clientOrders[k] || 0) + 1
  }
  const topClients = Object.entries(clientOrders).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Fidélisation
  const returning = [...clientSet].filter(k => clientOrders[k] > 1).length
  const newClients = clientSet.size - returning

  // Monthly revenue chart
  const now = new Date()
  const yearMonths = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })
  const monthlyRevenue = yearMonths.map(m => {
    const mInt = { start: startOfMonth(m), end: endOfMonth(m) }
    return orders.filter(o => {
      if (o.status === 'annulee' || !o.deliveryDate) return false
      try { return isWithinInterval(parseISO(o.deliveryDate), mInt) } catch { return false }
    }).reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)
  })

  // Monthly objective
  const monthlyObjective = Number(settings.monthlyObjective) || 3000
  const thisMonthCA = orders.filter(o => {
    if (o.status === 'annulee' || !o.deliveryDate) return false
    try { return isWithinInterval(parseISO(o.deliveryDate), { start: startOfMonth(now), end: endOfMonth(now) }) } catch { return false }
  }).reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)
  const objPct = Math.min(100, Math.round((thisMonthCA / monthlyObjective) * 100))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-chocolat">Statistiques</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-1 bg-rose-50 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.id ? 'bg-white text-bordeaux shadow-card' : 'text-warmgray-500 hover:text-chocolat'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Chiffre d'affaires" value={formatAmount(ca)} icon={TrendingUp} accent />
        <KpiCard label="Commandes" value={nbCommandes} icon={ShoppingBag} />
        <KpiCard label="Clientes" value={clientSet.size} icon={Users} />
        <KpiCard label="Panier moyen" value={formatAmount(panierMoyen)} icon={CreditCard} />
      </div>

      {/* Revenue chart */}
      <div className="card mb-6">
        <h2 className="font-semibold text-chocolat mb-5">Évolution du CA — {now.getFullYear()}</h2>
        <RevenueChart months={yearMonths} data={monthlyRevenue} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="card">
          <h2 className="font-semibold text-chocolat mb-4">Produits les plus vendus</h2>
          <HBarChart data={productData} max={Math.max(...productData.map(d => d.value), 1)} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-chocolat mb-4">Saveurs les plus demandées</h2>
          <HBarChart data={flavorData} max={Math.max(...flavorData.map(d => d.value), 1)} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top clients */}
        <div className="card">
          <h2 className="font-semibold text-chocolat mb-4">Clientes fidèles</h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-4">Aucune donnée</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-warmgray-400 uppercase tracking-wide border-b border-rose-50">
                  <th className="text-left pb-2 font-semibold">Cliente</th>
                  <th className="text-right pb-2 font-semibold">Commandes</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map(([name, count]) => (
                  <tr key={name} className="border-b border-rose-50 last:border-0">
                    <td className="py-2 text-chocolat font-medium">{name}</td>
                    <td className="py-2 text-right">
                      <span className="badge bg-rose-100 text-bordeaux">{count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          {/* Fidélisation */}
          <div className="card">
            <h2 className="font-semibold text-chocolat mb-3">Fidélisation</h2>
            <div className="flex gap-3">
              <div className="flex-1 text-center py-3 bg-rose-50 rounded-xl">
                <p className="text-2xl font-bold text-bordeaux">{newClients}</p>
                <p className="text-xs text-warmgray-400 mt-0.5">Nouvelles</p>
              </div>
              <div className="flex-1 text-center py-3 bg-rose-50 rounded-xl">
                <p className="text-2xl font-bold text-bordeaux">{returning}</p>
                <p className="text-xs text-warmgray-400 mt-0.5">Récurrentes</p>
              </div>
            </div>
          </div>

          {/* Objectif mensuel */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-bordeaux" />
              <h2 className="font-semibold text-chocolat">Objectif du mois</h2>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-xl font-bold text-bordeaux">{formatAmount(thisMonthCA)}</span>
              <span className="text-sm text-warmgray-400">/ {formatAmount(monthlyObjective)}</span>
            </div>
            <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-bordeaux h-3 rounded-full transition-all duration-500"
                style={{ width: `${objPct}%` }}
              />
            </div>
            <p className="text-right text-xs text-bordeaux font-bold mt-1.5">{objPct} %</p>
            <p className="text-xs text-warmgray-400 mt-1">
              Objectif configurable dans les Paramètres
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
