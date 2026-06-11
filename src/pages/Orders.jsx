import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import useStore from '../store'
import {
  formatDate, formatAmount, getProductLabel, getStatusLabel, STATUS_CONFIG,
} from '../utils'
import { StatusBadge, PaymentBadge, ModeBadge, StatusSelect, EmptyState } from '../components/ui'

const STATUSES = ['nouvelle', 'confirmee', 'fini', 'remis', 'annulee']

export default function Orders() {
  const orders = useStore(s => s.orders)
  const updateOrder = useStore(s => s.updateOrder)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMode, setFilterMode] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')

  const filtered = useMemo(() => {
    let list = [...orders]
    // Uniquement les commandes à partir d'aujourd'hui
    list = list.filter(o => !o.deliveryDate || o.deliveryDate.slice(0, 10) >= today)
    if (filterStatus) list = list.filter(o => o.status === filterStatus)
    if (filterMode) list = list.filter(o => o.deliveryMode === filterMode)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        [o.clientFirstName, o.clientLastName, o.clientInstagram, o.clientPhone,
          o.productType, o.flavorMain, o.theme, o.productVariant]
          .join(' ').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || ''))
  }, [orders, search, filterStatus, filterMode])

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Commandes</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Link to="/commandes/nouvelle" className="btn-primary flex-shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle commande</span>
          <span className="sm:hidden">Nouvelle</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, Instagram, produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="form-select sm:w-48"
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="form-select sm:w-40"
          >
            <option value="">Tous les modes</option>
            <option value="retrait">Retrait</option>
            <option value="livraison">Livraison</option>
          </select>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === '' ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-bordeaux hover:text-bordeaux'}`}
          >
            Toutes ({orders.length})
          </button>
          {[
            { value: 'nouvelle', label: 'À confirmer' },
            { value: 'confirmee', label: 'Confirmée' },
          ].map(({ value, label }) => {
            const count = orders.filter(o => o.status === value && (!o.deliveryDate || o.deliveryDate.slice(0, 10) >= today)).length
            return (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === value ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-bordeaux hover:text-bordeaux'}`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {(search || filterStatus || filterMode) && (
        <p className="text-xs text-warmgray-400 mb-3">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
      )}

      <CalendarView orders={filtered} updateOrder={updateOrder} />
    </div>
  )
}

function CalendarView({ orders, updateOrder }) {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const ordersByDate = useMemo(() => {
    const map = {}
    orders.forEach(o => {
      if (!o.deliveryDate) return
      const key = o.deliveryDate.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(o)
    })
    return map
  }, [orders])

  const selectedDayOrders = selectedDay ? (ordersByDate[selectedDay] || []) : []
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="flex gap-4">
      {/* Calendrier */}
      <div className={`card p-0 overflow-hidden transition-all ${selectedDay ? 'flex-1' : 'w-full'}`}>
        {/* Nav mois */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-1.5 rounded-lg text-warmgray-400 hover:text-bordeaux hover:bg-rose-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-playfair text-lg font-semibold text-chocolat capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg text-warmgray-400 hover:text-bordeaux hover:bg-rose-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-rose-100">
          {weekDays.map(wd => (
            <div key={wd} className="text-center text-xs font-semibold text-warmgray-400 uppercase tracking-wide py-2">
              {wd}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayOrders = ordersByDate[key] || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday_ = isToday(day)
            const isSelected = selectedDay === key

            return (
              <div
                key={key}
                onClick={() => dayOrders.length > 0 ? setSelectedDay(isSelected ? null : key) : null}
                className={`min-h-[90px] p-2 border-b border-r border-rose-50 transition-colors
                  ${!isCurrentMonth ? 'bg-rose-50/20' : ''}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                  ${dayOrders.length > 0 ? 'cursor-pointer hover:bg-rose-50/50' : ''}
                  ${isSelected ? 'bg-rose-50 ring-1 ring-inset ring-bordeaux/20' : ''}
                `}
              >
                <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1.5 ${
                  isToday_ ? 'bg-bordeaux text-white' : isCurrentMonth ? 'text-chocolat' : 'text-warmgray-300'
                }`}>
                  {format(day, 'd')}
                </div>

                {dayOrders.length > 0 && (
                  <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block ${
                    isSelected
                      ? 'bg-bordeaux text-white'
                      : 'bg-rose-100 text-bordeaux'
                  }`}>
                    {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3 border-t border-rose-100">
          <span className="flex items-center gap-1.5 text-[11px] text-bordeaux font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300 inline-block" />
            Jour avec commandes
          </span>
        </div>
      </div>

      {/* Panneau latéral */}
      {selectedDay && (
        <div className="w-80 shrink-0">
          <div className="card p-0 overflow-hidden sticky top-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-rose-50/50">
              <div>
                <p className="font-playfair font-semibold text-chocolat capitalize">
                  {format(new Date(selectedDay + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })}
                </p>
                <p className="text-xs text-warmgray-400 mt-0.5">
                  {selectedDayOrders.length} commande{selectedDayOrders.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg text-warmgray-400 hover:text-bordeaux hover:bg-rose-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-3 space-y-3">
              {selectedDayOrders
                .sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''))
                .map(o => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/commandes/${o.id}`)}
                    className="w-full text-left card hover:border-rose-300 hover:shadow-soft transition-all p-3"
                  >
                    {/* Pseudo / nom */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        {o.clientInstagram ? (
                          <p className="font-semibold text-rose-500 text-sm">{o.clientInstagram}</p>
                        ) : null}
                        <p className={`${o.clientInstagram ? 'text-xs text-warmgray-400' : 'font-semibold text-chocolat text-sm'}`}>
                          {o.clientFirstName} {o.clientLastName}
                        </p>
                      </div>
                      {o.deliveryTime && (
                        <span className="text-xs font-bold text-bordeaux bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5 shrink-0">
                          {o.deliveryTime}
                        </span>
                      )}
                    </div>

                    {/* Produit */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-chocolat">
                        {getProductLabel(o.productType)}
                        {o.productVariant ? <span className="text-warmgray-400 font-normal"> · {o.productVariant}</span> : null}
                      </p>

                      {/* Forme */}
                      {o.shape && (
                        <p className="text-xs text-warmgray-500">
                          <span className="font-medium">Forme :</span> {o.shape}
                        </p>
                      )}

                      {/* Parfums */}
                      {(o.flavorMain || o.flavorSecondary) && (
                        <p className="text-xs text-warmgray-500">
                          {[o.flavorMain, o.flavorSecondary].filter(Boolean).join(' + ')}
                        </p>
                      )}

                      {/* Statut confirmation */}
                      {(o.status === 'nouvelle' || o.status === 'confirmee') && (
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          o.status === 'confirmee'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {o.status === 'confirmee' ? 'Confirmée' : 'À confirmer'}
                        </span>
                      )}
                    </div>

                    {/* Heure de retrait si absente */}
                    {!o.deliveryTime && (
                      <p className="text-[10px] text-warmgray-300 mt-2 italic">Heure non renseignée</p>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
