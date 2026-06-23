import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, Edit2, Save, X, Trash2, Check, AlertCircle,
  MapPin, Clock, CreditCard, Camera, FileText, User, Package,
} from 'lucide-react'
import useStore from '../store'
import {
  formatDate, formatAmount, getProductLabel, computePaymentStatus,
} from '../utils'
import {
  StatusBadge, PaymentBadge, ModeBadge, StatusSelect,
  Modal, PhotoGallery, Card, Input, Select, Textarea,
} from '../components/ui'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orders = useStore(s => s.orders)
  const updateOrder = useStore(s => s.updateOrder)
  const deleteOrder = useStore(s => s.deleteOrder)

  const order = orders.find(o => o.id === id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(order || {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef()

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-warmgray-400">Commande introuvable.</p>
        <Link to="/commandes" className="btn-primary mt-4 inline-flex">Retour aux commandes</Link>
      </div>
    )
  }

  const current = editing ? form : order

  function field(key) {
    return {
      value: form[key] ?? '',
      onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  async function saveEdit() {
    await updateOrder(id, { ...form, paymentStatus: computePaymentStatus(form.amountTotal, form.amountPaid) })
    setEditing(false)
  }

  function cancelEdit() {
    setForm(order)
    setEditing(false)
  }

  function changeStatus(status) {
    updateOrder(id, { status })
  }

  function handleAddPhotos(e) {
    if (e._dataUrl) {
      updateOrder(id, { photos: [...(order.photos || []), e._dataUrl] })
      return
    }
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        updateOrder(id, { photos: [...(order.photos || []), ev.target.result] })
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDeletePhoto(i) {
    const photos = [...(order.photos || [])]
    photos.splice(i, 1)
    updateOrder(id, { photos })
  }

  function confirmAndDelete() {
    deleteOrder(id)
    navigate('/commandes')
  }

  const amountDue = (Number(current.amountTotal) || 0) - (Number(current.amountPaid) || 0)

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <button onClick={() => navigate('/commandes')} className="flex items-center gap-1 text-sm text-warmgray-400 hover:text-bordeaux transition-colors">
          <ChevronLeft size={16} /> Commandes
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={saveEdit} className="btn-primary gap-1"><Save size={14} /> Sauvegarder</button>
              <button onClick={cancelEdit} className="btn-ghost gap-1"><X size={14} /> Annuler</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-ghost gap-1"><Edit2 size={14} /> Modifier</button>
              <button onClick={() => setConfirmDelete(true)} className="btn-danger gap-1"><Trash2 size={14} /> Supprimer</button>
            </>
          )}
        </div>
      </div>

      {/* Summary header */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-playfair text-2xl font-bold text-chocolat">
                {current.clientFirstName} {current.clientLastName}
              </h1>
              <StatusBadge status={current.status} />
            </div>
            <p className="text-rose-500 text-sm">{current.clientInstagram}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <ModeBadge mode={current.deliveryMode} />
              <span className="text-xs text-warmgray-400 flex items-center gap-1">
                <Clock size={12} /> {formatDate(current.deliveryDate)} à {current.deliveryTime}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-playfair text-2xl sm:text-3xl font-bold text-bordeaux">{formatAmount(current.amountTotal)}</p>
            <PaymentBadge status={current.paymentStatus} />
          </div>
        </div>

        {/* Quick status buttons */}
        {!editing && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-rose-50">
            <span className="text-xs text-warmgray-400 self-center font-medium">Changer le statut :</span>
            {[['confirmee', '✓ Confirmée'], ['fini', '✓ Fini'], ['remis', '🏁 Remis'], ['annulee', '✕ Annulée']].map(([s, l]) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={current.status === s}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${current.status === s ? 'opacity-40 cursor-not-allowed border-beige text-warmgray-400' : 'border-beige text-warmgray-500 hover:bg-rose-50 hover:border-bordeaux hover:text-bordeaux'}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Client info */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <User size={16} className="text-bordeaux" /> Informations cliente
          </h2>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Prénom" {...field('clientFirstName')} />
                <Input label="Nom" {...field('clientLastName')} />
              </div>
              <Input label="Instagram" {...field('clientInstagram')} />
              <Input label="Téléphone" {...field('clientPhone')} type="tel" />
              <Input label="Email" {...field('clientEmail')} type="email" />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Prénom" val={current.clientFirstName} />
              <Row label="Nom" val={current.clientLastName} />
              <Row label="Instagram" val={current.clientInstagram} />
              <Row label="Téléphone" val={current.clientPhone} />
              <Row label="Email" val={current.clientEmail || '—'} />
            </div>
          )}
        </Card>

        {/* Produit */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <Package size={16} className="text-bordeaux" /> Détails produit
          </h2>
          {editing ? (
            <div className="space-y-3">
              <Input label="Type de produit" {...field('productType')} />
              <Input label="Variante / taille" {...field('productVariant')} />
              <Input label="Forme" {...field('shape')} />
              <Input label="Saveur principale" {...field('flavorMain')} />
              <Input label="Saveur secondaire" {...field('flavorSecondary')} />
              <Input label="Thème" {...field('theme')} />
              <Input label="Couleurs" {...field('colors')} />
              <Input label="Message sur le gâteau" {...field('messageOnCake')} />
              <Input label="Allergies" {...field('allergies')} />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Produit" val={getProductLabel(current.productType)} />
              <Row label="Variante" val={current.productVariant} />
              <Row label="Forme" val={current.shape || '—'} />
              <Row label="Saveur principale" val={current.flavorMain || '—'} />
              <Row label="Saveur secondaire" val={current.flavorSecondary || '—'} />
              {current.supplements?.length > 0 && (
                <div className="flex gap-1 flex-wrap items-start">
                  <span className="text-warmgray-400 w-32 flex-shrink-0 text-xs font-medium pt-0.5">Suppléments</span>
                  <div className="flex flex-wrap gap-1">
                    {current.supplements.map(s => (
                      <span key={s} className="badge bg-rose-50 text-rose-600 border border-rose-200 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <Row label="Thème" val={current.theme || '—'} />
              <Row label="Couleurs" val={current.colors || '—'} />
              <Row label="Message" val={current.messageOnCake || '—'} />
              <Row label="Allergies" val={current.allergies || '—'} />
            </div>
          )}
        </Card>

        {/* Remise */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-bordeaux" /> Remise
          </h2>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Date" type="date" {...field('deliveryDate')} />
                <Input label="Heure" type="time" {...field('deliveryTime')} />
              </div>
              <Select label="Mode" {...field('deliveryMode')}>
                <option value="retrait">Retrait</option>
                <option value="livraison">Livraison</option>
              </Select>
              {form.deliveryMode === 'livraison' && (
                <>
                  <Input label="Adresse" {...field('deliveryAddress')} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Code postal" {...field('deliveryZip')} />
                    <Input label="Ville" {...field('deliveryCity')} />
                  </div>
                  <Input label="Note livraison" {...field('deliveryNote')} />
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Date" val={formatDate(current.deliveryDate)} />
              <Row label="Heure" val={current.deliveryTime || '—'} />
              <Row label="Mode" val={<ModeBadge mode={current.deliveryMode} />} />
              {current.deliveryMode === 'livraison' && (
                <>
                  <Row label="Adresse" val={current.deliveryAddress || '—'} />
                  <Row label="Ville" val={`${current.deliveryZip} ${current.deliveryCity}`.trim() || '—'} />
                  <Row label="Note" val={current.deliveryNote || '—'} />
                </>
              )}
            </div>
          )}
        </Card>

        {/* Paiement */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-bordeaux" /> Paiement
          </h2>
          {editing ? (
            <div className="space-y-3">
              <Input label="Montant total (€)" type="number" step="0.5" {...field('amountTotal')} />
              <Input label="Montant payé (€)" type="number" step="0.5" {...field('amountPaid')} />
              <div className="bg-beige-light rounded-xl px-3 py-2 text-sm">
                Reste à payer : <strong>{formatAmount(Math.max(0, (Number(form.amountTotal) || 0) - (Number(form.amountPaid) || 0)))}</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-warmgray-400 mb-1">Total</p>
                  <p className="font-bold text-chocolat">{formatAmount(current.amountTotal)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-warmgray-400 mb-1">Payé</p>
                  <p className="font-bold text-green-700">{formatAmount(current.amountPaid)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${amountDue > 0 ? 'bg-amber-50' : 'bg-beige-light'}`}>
                  <p className="text-xs text-warmgray-400 mb-1">Reste</p>
                  <p className={`font-bold ${amountDue > 0 ? 'text-amber-700' : 'text-warmgray-500'}`}>{formatAmount(Math.max(0, amountDue))}</p>
                </div>
              </div>
              <PaymentBadge status={current.paymentStatus} />
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <FileText size={16} className="text-bordeaux" /> Notes
          </h2>
          {editing ? (
            <div className="space-y-3">
              <Textarea label="Notes cliente" {...field('notesClient')} rows={3} />
              <Textarea label="Notes internes" {...field('notesInternal')} rows={3} />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="form-label">Notes cliente</p>
                <p className="text-warmgray-500 mt-1">{current.notesClient || <span className="italic">Aucune note</span>}</p>
              </div>
              <div>
                <p className="form-label">Notes internes</p>
                <p className="text-warmgray-500 mt-1">{current.notesInternal || <span className="italic">Aucune note</span>}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Photos */}
        <Card className="lg:col-span-2">
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4 flex items-center gap-2">
            <Camera size={16} className="text-bordeaux" /> Photos d'inspiration
          </h2>
          <PhotoGallery
            photos={order.photos || []}
            onDelete={handleDeletePhoto}
            onAdd={handleAddPhotos}
          />
        </Card>
      </div>

      {/* Confirm delete modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer la commande">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Cette action est irréversible. La commande de <strong>{order.clientFirstName} {order.clientLastName}</strong> sera définitivement supprimée.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmAndDelete} className="btn-danger flex-1 justify-center">
              <Trash2 size={14} /> Supprimer définitivement
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost flex-1 justify-center">
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, val }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-warmgray-400 text-xs font-medium w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-chocolat font-medium flex-1">{val}</span>
    </div>
  )
}
