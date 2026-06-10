import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, LayoutGrid, List, Eye, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import useStore from '../store'
import {
  formatDate, formatAmount, getProductLabel, getStatusLabel, STATUS_CONFIG,
} from '../utils'
import { StatusBadge, PaymentBadge, ModeBadge, StatusSelect, EmptyState } from '../components/ui'

const STATUSES = ['nouvelle', 'confirmee', 'fini', 'remis', 'annulee']
const MODES = ['retrait', 'livraison']

export default function Orders() {
  const orders = useStore(s => s.orders)
  const updateOrder = useStore(s => s.updateOrder)
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [view, setView] = useState('table') // 'table' | 'cards' | 'calendar'

  const filtered = useMemo(() => {
    let list = [...orders]
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-chocolat">Commandes</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Link to="/commandes/nouvelle" className="btn-primary">
          <Plus size={16} />
          Nouvelle commande
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
          <div className="flex rounded-xl border border-beige overflow-hidden bg-white">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${view === 'table' ? 'bg-rose-100 text-bordeaux font-semibold' : 'text-warmgray-400 hover:bg-rose-50'}`}
              title="Vue tableau"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${view === 'cards' ? 'bg-rose-100 text-bordeaux font-semibold' : 'text-warmgray-400 hover:bg-rose-50'}`}
              title="Vue cartes"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${view === 'calendar' ? 'bg-rose-100 text-bordeaux font-semibold' : 'text-warmgray-400 hover:bg-rose-50'}`}
              title="Vue calendrier"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === '' ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-bordeaux hover:text-bordeaux'}`}
          >
            Toutes ({orders.length})
          </button>
          {STATUSES.map(s => {
            const count = orders.filter(o => o.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === s ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-bordeaux hover:text-bordeaux'}`}
              >
                {getStatusLabel(s)} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Results count */}
      {(search || filterStatus || filterMode) && (
        <p className="text-xs text-warmgray-400 mb-3">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="Aucune commande trouvée" sub="Modifiez vos filtres ou créez une nouvelle commande." />
      ) : view === 'table' ? (
        <TableView orders={filtered} updateOrder={updateOrder} />
      ) : (
        <CardsView orders={filtered} updateOrder={updateOrder} />
      )}
    </div>
  )
}

function TableView({ orders, updateOrder }) {
  const navigate = useNavigate()
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 bg-rose-50/50">
              {['Prénom', 'Instagram', 'Produit', 'Date', 'Mode', 'Statut', 'Montant', 'Paiement', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-warmgray-400 uppercase tracking-wide px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr
                key={o.id}
                className={`border-b border-rose-50 hover:bg-rose-50/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-rose-50/10' : ''}`}
                onClick={() => navigate(`/commandes/${o.id}`)}
              >
                <td className="px-4 py-3 font-medium text-chocolat">{o.clientFirstName} {o.clientLastName}</td>
                <td className="px-4 py-3 text-rose-500 text-xs">{o.clientInstagram}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-chocolat">{getProductLabel(o.productType)}</div>
                  <div className="text-xs text-warmgray-400">{o.productVariant}</div>
                </td>
                <td className="px-4 py-3 text-warmgray-500 text-xs whitespace-nowrap">
                  {formatDate(o.deliveryDate)}
                  <br />{o.deliveryTime}
                </td>
                <td className="px-4 py-3"><ModeBadge mode={o.deliveryMode} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <StatusSelect
                    current={o.status}
                    onChange={status => updateOrder(o.id, { status })}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-chocolat whitespace-nowrap">{formatAmount(o.amountTotal)}</td>
                <td className="px-4 py-3"><PaymentBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3">
                  <button className="p-1.5 rounded-lg text-warmgray-400 hover:text-bordeaux hover:bg-rose-50">
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CardsView({ orders, updateOrder }) {
  const navigate = useNavigate()
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {orders.map(o => (
        <div
          key={o.id}
          className="card hover:border-rose-300 hover:shadow-soft transition-all cursor-pointer"
          onClick={() => navigate(`/commandes/${o.id}`)}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-chocolat">{o.clientFirstName} {o.clientLastName}</p>
              <p className="text-xs text-rose-500">{o.clientInstagram}</p>
            </div>
            <div onClick={e => e.stopPropagation()}>
              <StatusSelect current={o.status} onChange={s => updateOrder(o.id, { status: s })} />
            </div>
          </div>
          <div className="text-sm text-warmgray-500 space-y-1 mb-3">
            <p><span className="font-medium text-chocolat">{getProductLabel(o.productType)}</span> · {o.productVariant}</p>
            <p>{o.flavorMain}{o.flavorSecondary ? ` + ${o.flavorSecondary}` : ''}</p>
            <p>{formatDate(o.deliveryDate)} à {o.deliveryTime}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <ModeBadge mode={o.deliveryMode} />
              <PaymentBadge status={o.paymentStatus} />
            </div>
            <span className="font-bold text-chocolat">{formatAmount(o.amountTotal)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
