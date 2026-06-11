import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, User } from 'lucide-react'
import useStore from '../store'
import { formatDate, formatAmount } from '../utils'
import { EmptyState } from '../components/ui'

export default function Clients() {
  const clients = useStore(s => s.clients)
  const orders = useStore(s => s.orders)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const enriched = useMemo(() => {
    return clients.map(c => {
      const cOrders = orders.filter(o =>
        o.clientInstagram?.toLowerCase() === c.instagram?.toLowerCase()
      )
      const total = cOrders.reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)
      const last = cOrders.sort((a, b) => b.deliveryDate?.localeCompare(a.deliveryDate || ''))[0]
      return { ...c, orderCount: cOrders.length, totalAmount: total, lastOrder: last }
    })
  }, [clients, orders])

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched
    const q = search.toLowerCase()
    return enriched.filter(c =>
      [c.firstName, c.lastName, c.instagram, c.phone].join(' ').toLowerCase().includes(q)
    )
  }, [enriched, search])

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Clientes</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, Instagram, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 w-full"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="Aucune cliente trouvée" sub="Les clientes sont créées automatiquement lors d'une commande." />
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <button
              key={client.id}
              onClick={() => navigate(`/clientes/${client.id}`)}
              className="card w-full text-left hover:border-rose-300 hover:shadow-soft transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-bordeaux" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-chocolat">{client.firstName} {client.lastName}</p>
                    {client.notes && (
                      <span className="text-xs bg-beige-light text-warmgray-500 px-2 py-0.5 rounded-full">Note</span>
                    )}
                  </div>
                  <p className="text-xs text-rose-500">{client.instagram}</p>
                  <p className="text-xs text-warmgray-400">{client.phone}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-chocolat">{client.orderCount} commande{client.orderCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-warmgray-400">{formatAmount(client.totalAmount)} total</p>
                  {client.lastOrder && (
                    <p className="text-xs text-warmgray-400">Dernière : {formatDate(client.lastOrder.deliveryDate)}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-warmgray-400 group-hover:text-bordeaux transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
