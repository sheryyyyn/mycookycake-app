import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Layers, CalendarDays, Heart, Square, Clock, MapPin } from 'lucide-react'
import useStore from '../store'
import { format, parseISO, startOfDay, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { aggregateGenoises, getWeekOrders, formatDate } from '../utils'

const KANBAN_COLUMNS = [
  { id: 'pas_commence', label: 'Pas commencé', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
  { id: 'montage_fait', label: 'Montage fait',  color: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-400' },
  { id: 'lissage_fait', label: 'Lissage fait',  color: 'bg-violet-50 border-violet-200', dot: 'bg-violet-400' },
  { id: 'termine',      label: 'Terminé',        color: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
  { id: 'remis_prod',   label: 'Remis',          color: 'bg-warmgray-50 border-beige',  dot: 'bg-warmgray-400' },
]

function getProductionStatus(order) {
  return order.productionStatus || 'pas_commence'
}

function KanbanCard({ order, onDragStart }) {
  const shape = order.shape
  return (
    <div
      draggable
      onDragStart={() => onDragStart(order.id)}
      className="bg-white rounded-xl border border-rose-100 shadow-card p-3 cursor-grab active:cursor-grabbing hover:shadow-soft transition-all group"
    >
      {order.photos?.[0] && (
        <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5">
          <img src={order.photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="space-y-1.5">
        <p className="font-semibold text-bordeaux text-sm">{order.clientInstagram || order.clientFirstName}</p>

        <div className="flex items-center gap-1 text-xs text-chocolat-light">
          {shape === 'coeur' ? <Heart size={11} className="text-rose-400" /> : <Square size={11} className="text-warmgray-400" />}
          <span>{shape === 'coeur' ? 'Cœur' : 'Rond'}</span>
          {order.productVariant && <span>· {order.productVariant}</span>}
        </div>

        {order.colors && (
          <p className="text-xs text-warmgray-400 truncate">Couv : {order.colors}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-warmgray-400 pt-0.5">
          <Clock size={10} />
          <span>{order.deliveryTime || '—'}</span>
          <span>·</span>
          {order.deliveryMode === 'livraison' ? (
            <><MapPin size={10} className="text-blue-400" /><span className="text-blue-500">Livraison</span></>
          ) : (
            <span>Retrait</span>
          )}
        </div>

        {order.deliveryDate && (
          <p className="text-xs text-warmgray-400">{formatDate(order.deliveryDate)}</p>
        )}
      </div>

      <Link
        to={`/commandes/${order.id}`}
        onClick={e => e.stopPropagation()}
        className="mt-2 text-xs text-bordeaux opacity-0 group-hover:opacity-100 transition-opacity block"
      >
        Voir la commande →
      </Link>
    </div>
  )
}

function KanbanView() {
  const orders = useStore(s => s.orders)
  const updateOrder = useStore(s => s.updateOrder)
  const dragId = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const kanbanOrders = orders.filter(o => o.status !== 'nouvelle' && o.status !== 'annulee')

  function handleDragStart(id) {
    dragId.current = id
  }

  function handleDragOver(e, colId) {
    e.preventDefault()
    setDragOver(colId)
  }

  function handleDrop(colId) {
    if (dragId.current) {
      updateOrder(dragId.current, { productionStatus: colId })
      dragId.current = null
    }
    setDragOver(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {KANBAN_COLUMNS.map(col => {
        const colOrders = kanbanOrders.filter(o => getProductionStatus(o) === col.id)
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-64 rounded-2xl border-2 transition-colors ${col.color} ${dragOver === col.id ? 'ring-2 ring-bordeaux' : ''}`}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={() => handleDrop(col.id)}
            onDragLeave={() => setDragOver(null)}
          >
            <div className="px-3 py-3 border-b border-current border-opacity-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-semibold text-chocolat uppercase tracking-wide">{col.label}</span>
              <span className="ml-auto text-xs text-warmgray-400 font-medium">{colOrders.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {colOrders.map(o => (
                <KanbanCard key={o.id} order={o} onDragStart={handleDragStart} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GenoisesView() {
  const orders = useStore(s => s.orders)
  const weekOrders = getWeekOrders(orders)
  const genoises = aggregateGenoises(weekOrders)

  const rows = [
    { label: 'Bento Cakes (2 tranches / gâteau)', value: genoises.bento },
    { label: 'Layer Cake 10 parts (3 tranches)', value: genoises.layer10 },
    { label: 'Layer Cake 15 parts (4 tranches)', value: genoises.layer15 },
    { label: 'Layer Cake 20/25 parts (5 tranches)', value: genoises.layer2025 },
    { label: 'Layer Cake 30/35 parts (5 tranches)', value: genoises.layer3035 },
  ].filter(r => r.value > 0)

  return (
    <div className="max-w-lg">
      <div className="card">
        <h2 className="font-semibold text-chocolat mb-4">Génoises à préparer — semaine en cours</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-warmgray-400 text-center py-6">Aucune génoise à préparer cette semaine</p>
        ) : (
          <>
            <div className="space-y-2">
              {rows.map(r => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-rose-50 last:border-0">
                  <span className="text-sm text-chocolat-light">{r.label}</span>
                  <span className="font-bold text-chocolat">{r.value} tranches</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200 flex items-center justify-between">
              <span className="font-bold text-chocolat">Total à préparer</span>
              <span className="text-2xl font-bold text-bordeaux">{genoises.total} tranches</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PlanningView() {
  const orders = useStore(s => s.orders)

  const now = startOfDay(new Date())
  const upcomingDays = Array.from({ length: 14 }, (_, i) => addDays(now, i))

  const byDate = {}
  for (const o of orders) {
    if (!o.deliveryDate || o.status === 'annulee') continue
    const key = o.deliveryDate.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(o)
  }

  const daysWithOrders = upcomingDays.filter(d => byDate[format(d, 'yyyy-MM-dd')])

  return (
    <div className="max-w-2xl space-y-4">
      {daysWithOrders.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-warmgray-400 text-sm">Aucune commande dans les 14 prochains jours</p>
        </div>
      ) : (
        daysWithOrders.map(d => {
          const key = format(d, 'yyyy-MM-dd')
          const dayOrders = byDate[key] || []
          const dayLabel = format(d, 'EEEE d MMMM', { locale: fr })
          return (
            <div key={key} className="card">
              <p className="text-xs font-semibold text-bordeaux uppercase tracking-widest mb-3 capitalize">{dayLabel}</p>
              <div className="space-y-2">
                {dayOrders.sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || '')).map(o => (
                  <Link key={o.id} to={`/commandes/${o.id}`}>
                    <div className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0 hover:bg-rose-50 -mx-2 px-2 rounded-lg transition-colors">
                      <span className="text-xs font-bold text-bordeaux w-12 flex-shrink-0">{o.deliveryTime || '—'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-chocolat truncate">{o.clientInstagram || o.clientFirstName}</p>
                        <p className="text-xs text-warmgray-400 truncate">
                          {o.productType === 'bento_cake' ? 'Bento' : o.productType === 'layer_cake' ? 'Layer Cake' : o.productType}
                          {o.productVariant && ` · ${o.productVariant}`}
                          {o.shape && o.shape !== 'non_concerne' && ` · ${o.shape === 'coeur' ? 'Cœur' : 'Rond'}`}
                        </p>
                      </div>
                      <span className={`badge text-xs flex-shrink-0 ${o.deliveryMode === 'livraison' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {o.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

const TABS = [
  { id: 'kanban',   label: 'Kanban',    icon: ChefHat },
  { id: 'genoises', label: 'Génoises',  icon: Layers },
  { id: 'planning', label: 'Planning',  icon: CalendarDays },
]

export default function Production() {
  const [tab, setTab] = useState('kanban')

  return (
    <div className="p-6 max-w-full">
      <div className="mb-6">
        <h1 className="font-playfair text-3xl font-bold text-chocolat">Production</h1>
        <p className="text-sm text-warmgray-400 mt-0.5">Suivi de la production et des génoises</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-rose-50 rounded-xl p-1 w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white text-bordeaux shadow-card'
                : 'text-warmgray-500 hover:text-chocolat'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'kanban' && <KanbanView />}
      {tab === 'genoises' && <GenoisesView />}
      {tab === 'planning' && <PlanningView />}
    </div>
  )
}
