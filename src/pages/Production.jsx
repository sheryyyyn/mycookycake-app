import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat, Layers, CalendarDays, Heart, Circle, Clock, MapPin,
  ChevronLeft, ChevronRight, Utensils,
} from 'lucide-react'
import useStore from '../store'
import { format, parseISO, startOfDay, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { aggregateGenoises, getWeekOrders, formatDate, getProductLabel } from '../utils'

const KANBAN_COLUMNS = [
  { id: 'pas_commence', label: 'Pas commencé', color: 'bg-gray-50 border-gray-200',       dot: 'bg-gray-400' },
  { id: 'montage_fait', label: 'Montage fait',  color: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-400' },
  { id: 'lissage_fait', label: 'Lissage fait',  color: 'bg-violet-50 border-violet-200',   dot: 'bg-violet-400' },
  { id: 'termine',      label: 'Terminé',        color: 'bg-green-50 border-green-200',    dot: 'bg-green-500' },
  { id: 'remis_prod',   label: 'Remis',          color: 'bg-rose-50 border-rose-200',      dot: 'bg-rose-400' },
]

function getProductionStatus(order) {
  return order.productionStatus || 'pas_commence'
}

function KanbanCard({ order, onDragStart }) {
  const shape = order.shape
  const isLayerCup = order.productType === 'layer_cup'
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
          {!isLayerCup && (
            <>
              {shape === 'coeur'
                ? <Heart size={11} className="text-rose-400" />
                : <Circle size={11} className="text-warmgray-400" />}
              <span>{shape === 'coeur' ? 'Cœur' : 'Rond'}</span>
              {order.productVariant && <span>·</span>}
            </>
          )}
          <span className="font-medium">{getProductLabel(order.productType)}</span>
          {order.productVariant && <span>· {order.productVariant}</span>}
        </div>

        {order.colors && (
          <p className="text-xs text-warmgray-400 truncate">Couv : {order.colors}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-warmgray-400 pt-0.5">
          <Clock size={10} />
          <span>{order.deliveryTime || '—'}</span>
          <span>·</span>
          {order.deliveryMode === 'livraison'
            ? <><MapPin size={10} className="text-blue-400" /><span className="text-blue-500">Livraison</span></>
            : <span>Retrait</span>}
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

function WeekDayPicker({ orders, selectedDay, onSelect }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseWeek = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(baseWeek, i))

  const allKanban = orders.filter(o => o.status !== 'annulee')

  function countForDay(day) {
    return allKanban.filter(o => o.deliveryDate && isSameDay(parseISO(o.deliveryDate), day)).length
  }

  return (
    <div className="card mb-5">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost py-1 px-2">
          <ChevronLeft size={15} />
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-chocolat capitalize">
            Semaine du {format(baseWeek, 'd MMMM yyyy', { locale: fr })}
          </p>
          {selectedDay && (
            <button
              onClick={() => onSelect(null)}
              className="text-xs text-warmgray-400 hover:text-bordeaux underline"
            >
              Tout afficher
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost py-1 px-2">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const count = countForDay(day)
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const isToday = isSameDay(day, new Date())
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(isSelected ? null : day)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'bg-bordeaux border-bordeaux text-white'
                  : count > 0
                  ? 'bg-rose-50 border-rose-200 text-chocolat hover:border-bordeaux'
                  : 'bg-white border-beige text-warmgray-400 hover:border-rose-200 hover:text-chocolat'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                isSelected ? 'text-white/70' : isToday ? 'text-bordeaux' : ''
              }`}>
                {format(day, 'EEE', { locale: fr })}
              </span>
              <span className={`text-base font-bold leading-none ${
                isToday && !isSelected ? 'text-bordeaux' : ''
              }`}>
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-bordeaux text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function KanbanView() {
  const orders = useStore(s => s.orders)
  const updateOrder = useStore(s => s.updateOrder)
  const dragId = useRef(null)
  const [dragOver, setDragOver] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const allKanbanOrders = orders.filter(o => o.status !== 'nouvelle' && o.status !== 'annulee')
  const kanbanOrders = selectedDay
    ? allKanbanOrders.filter(o => o.deliveryDate && isSameDay(parseISO(o.deliveryDate), selectedDay))
    : []

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
    <div>
      <WeekDayPicker orders={orders} selectedDay={selectedDay} onSelect={setSelectedDay} />

      {!selectedDay ? (
        <div className="card text-center py-10">
          <p className="text-warmgray-400 text-sm">Sélectionnez un jour pour voir les commandes</p>
        </div>
      ) : kanbanOrders.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-warmgray-400 text-sm">Aucune commande ce jour</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-340px)]">
          {KANBAN_COLUMNS.map(col => {
            const colOrders = kanbanOrders.filter(o => getProductionStatus(o) === col.id)
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-64 rounded-2xl border-2 transition-colors ${col.color} ${
                  dragOver === col.id ? 'ring-2 ring-bordeaux' : ''
                }`}
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
      )}
    </div>
  )
}

function GenoisesView() {
  const orders = useStore(s => s.orders)
  const weekOrders = getWeekOrders(orders)
  const { rows, total } = aggregateGenoises(weekOrders)

  return (
    <div className="max-w-lg">
      <div className="card">
        <h2 className="font-semibold text-chocolat mb-4">Génoises à préparer — semaine en cours</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-warmgray-400 text-center py-6">Aucune génoise à préparer cette semaine</p>
        ) : (
          <>
            <div className="space-y-0">
              {rows.map(r => (
                <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-rose-50 last:border-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm text-chocolat-light">{r.typeLabel}</span>
                    {r.sizeLabel && (
                      <span className="text-sm font-bold text-bordeaux bg-rose-50 px-2 py-0.5 rounded-full">{r.sizeLabel}</span>
                    )}
                    <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full ${r.shapeLabel === 'Cœur' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>
                      {r.shapeLabel === 'Cœur' ? <Heart size={12} fill="currentColor" /> : <Circle size={12} />}
                      {r.shapeLabel}
                    </span>
                    <span className="text-xs text-warmgray-400">({r.slicesEach} × {r.count})</span>
                  </div>
                  <span className="font-bold text-chocolat ml-3 flex-shrink-0">{r.total} tranches</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200 flex items-center justify-between">
              <span className="font-bold text-chocolat">Total à préparer</span>
              <span className="text-2xl font-bold text-bordeaux">{total} tranches</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function getOrderDetailLabel(o) {
  const type = getProductLabel(o.productType)
  const variant = o.productVariant ? ` ${o.productVariant}` : ''
  return `${type}${variant}`
}

// sort by cake size ascending; Layer Cup always last regardless of size
function detailSortKey(label) {
  if (/layer cup/i.test(label)) return 9999
  const m = label.match(/(\d+)\s*parts?/i)
  if (m) return parseInt(m[1])
  const n = label.match(/(\d+)/)
  return n ? parseInt(n[1]) : 0
}

function FourrageView() {
  const orders = useStore(s => s.orders)
  const weekOrders = getWeekOrders(orders)
  const activeOrders = weekOrders.filter(o => o.status !== 'annulee')

  const byFlavor = {}
  for (const o of activeOrders) {
    for (const f of [o.flavorMain, o.flavorSecondary].filter(Boolean)) {
      if (!byFlavor[f]) byFlavor[f] = []
      byFlavor[f].push(o)
    }
  }

  const sorted = Object.entries(byFlavor).sort((a, b) => b[1].length - a[1].length)
  const total = sorted.reduce((s, [, arr]) => s + arr.length, 0)

  return (
    <div className="max-w-full">
      <h2 className="font-semibold text-chocolat mb-3">Fourrages à préparer — semaine en cours</h2>
      {sorted.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-warmgray-400 text-sm">Aucun fourrage à préparer cette semaine</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-3">
            {sorted.map(([flavor, flavorOrders]) => {
              const detailCounts = {}
              for (const o of flavorOrders) {
                const label = getOrderDetailLabel(o)
                detailCounts[label] = (detailCounts[label] || 0) + 1
              }
              const detailEntries = Object.entries(detailCounts).sort(
                (a, b) => detailSortKey(a[0]) - detailSortKey(b[0])
              )
              return (
                <div key={flavor} className="bg-white rounded-xl border border-rose-100 shadow-card overflow-hidden">
                  {/* header */}
                  <div className="bg-rose-50 px-3 py-2 flex items-center justify-between gap-2 border-b border-rose-100">
                    <span className="text-[11px] font-bold text-chocolat uppercase tracking-wide leading-tight">{flavor}</span>
                    <span className="text-2xl font-bold text-bordeaux leading-none flex-shrink-0">{flavorOrders.length}</span>
                  </div>
                  {/* détails */}
                  <div className="px-3 py-2 divide-y divide-rose-50">
                    {detailEntries.map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between gap-2 py-1 first:pt-0 last:pb-0">
                        <span className="text-xs text-chocolat-light leading-tight">{label}</span>
                        <span className="text-xs font-bold text-bordeaux flex-shrink-0 ml-1">
                          {count > 1 ? `× ${count}` : '× 1'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="inline-flex items-center gap-4 bg-white rounded-xl border border-rose-100 shadow-card px-4 py-2">
            <span className="font-bold text-chocolat text-sm">Total fourrages</span>
            <span className="text-xl font-bold text-bordeaux">{total}</span>
          </div>
        </>
      )}
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
          const dayOrders = (byDate[key] || []).sort((a, b) =>
            (a.deliveryTime || '').localeCompare(b.deliveryTime || '')
          )
          return (
            <div key={key} className="card">
              <p className="text-xs font-semibold text-bordeaux uppercase tracking-widest mb-3 capitalize">
                {format(d, 'EEEE d MMMM', { locale: fr })}
              </p>
              <div className="space-y-2">
                {dayOrders.map(o => (
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
                      <span className={`badge text-xs flex-shrink-0 ${
                        o.deliveryMode === 'livraison' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
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
  { id: 'genoises',  label: 'Génoises',  icon: Layers },
  { id: 'fourrage',  label: 'Fourrage',  icon: Utensils },
  { id: 'kanban',    label: 'Kanban',    icon: ChefHat },
  { id: 'planning',  label: 'Planning',  icon: CalendarDays },
]

export default function Production() {
  const [tab, setTab] = useState('genoises')

  return (
    <div className="p-6 max-w-full">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Production</h1>
        <p className="text-sm text-warmgray-400 mt-0.5">Suivi de la production et des génoises</p>
      </div>

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

      {tab === 'genoises' && <GenoisesView />}
      {tab === 'fourrage' && <FourrageView />}
      {tab === 'kanban'   && <KanbanView />}
      {tab === 'planning' && <PlanningView />}
    </div>
  )
}
