import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Edit2, Save, X, ShoppingBag } from 'lucide-react'
import useStore from '../store'
import { formatDate, formatAmount, getProductLabel } from '../utils'
import { StatusBadge, ModeBadge, Card } from '../components/ui'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clients = useStore(s => s.clients)
  const orders = useStore(s => s.orders)
  const updateClient = useStore(s => s.updateClient)

  const client = clients.find(c => c.id === id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(client || {})

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-warmgray-400">Cliente introuvable.</p>
        <Link to="/clientes" className="btn-primary mt-4 inline-flex">Retour</Link>
      </div>
    )
  }

  const clientOrders = orders.filter(o =>
    o.clientInstagram?.toLowerCase() === client.instagram?.toLowerCase()
  ).sort((a, b) => (b.deliveryDate || '').localeCompare(a.deliveryDate || ''))

  const totalAmount = clientOrders.reduce((s, o) => s + (Number(o.amountTotal) || 0), 0)
  const allergies = [...new Set(clientOrders.map(o => o.allergies).filter(Boolean))]

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function save() {
    updateClient(id, form)
    setEditing(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/clientes')} className="flex items-center gap-1 text-sm text-warmgray-400 hover:text-bordeaux">
          <ChevronLeft size={16} /> Clientes
        </button>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary gap-1"><Save size={14} /> Sauvegarder</button>
            <button onClick={() => { setForm(client); setEditing(false) }} className="btn-ghost gap-1"><X size={14} /> Annuler</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-ghost gap-1"><Edit2 size={14} /> Modifier</button>
        )}
      </div>

      {/* Header */}
      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-xl">
            {client.firstName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-playfair text-2xl font-bold text-chocolat">{client.firstName} {client.lastName}</h1>
            <p className="text-rose-500 text-sm">{client.instagram}</p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="font-bold text-chocolat">{clientOrders.length}</p>
                <p className="text-xs text-warmgray-400">commandes</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-chocolat">{formatAmount(totalAmount)}</p>
                <p className="text-xs text-warmgray-400">total</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 mb-4">
        {/* Infos */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Informations</h2>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[['firstName','Prénom'],['lastName','Nom'],['instagram','Instagram'],['phone','Téléphone'],['email','Email']].map(([k,l]) => (
                <div key={k} className="space-y-1">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={form[k] || ''} onChange={e => setField(k, e.target.value)} />
                </div>
              ))}
              <div className="space-y-1 sm:col-span-2">
                <label className="form-label">Notes internes</label>
                <textarea className="form-textarea" rows={3} value={form.notes || ''} onChange={e => setField('notes', e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {[['Prénom', client.firstName],['Nom', client.lastName],['Instagram', client.instagram],['Téléphone', client.phone],['Email', client.email || '—']].map(([l,v]) => (
                <div key={l}>
                  <span className="form-label">{l}</span>
                  <p className="text-chocolat font-medium mt-0.5">{v}</p>
                </div>
              ))}
              {client.notes && (
                <div className="sm:col-span-2">
                  <span className="form-label">Notes</span>
                  <p className="text-warmgray-500 mt-0.5 italic">{client.notes}</p>
                </div>
              )}
              {allergies.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="form-label">Allergies détectées</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {allergies.map(a => <span key={a} className="badge bg-red-50 text-red-600 border border-red-200">{a}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Orders */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-bordeaux" /> Commandes ({clientOrders.length})
          </h2>
          {clientOrders.length === 0 ? (
            <p className="text-sm text-warmgray-400 italic">Aucune commande pour cette cliente.</p>
          ) : (
            <div className="space-y-2">
              {clientOrders.map(o => (
                <Link key={o.id} to={`/commandes/${o.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-rose-50 hover:border-rose-300 hover:bg-rose-50/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-chocolat text-sm">{getProductLabel(o.productType)} · {o.productVariant}</p>
                    <p className="text-xs text-warmgray-400">{formatDate(o.deliveryDate)} · {o.deliveryTime}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModeBadge mode={o.deliveryMode} />
                    <StatusBadge status={o.status} />
                    <span className="font-semibold text-chocolat text-sm">{formatAmount(o.amountTotal)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
