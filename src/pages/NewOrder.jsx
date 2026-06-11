import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import useStore from '../store'
import { genId, computePaymentStatus } from '../utils'
import { Card, PhotoGallery } from '../components/ui'

const SHAPE_LABELS = { rond: 'Rond', coeur: 'Cœur', autre: 'Autre', non_concerne: 'Non concerné' }

const INITIAL = {
  clientInstagram: '', clientEmail: '',
  productType: 'bento_cake', productVariant: '',
  shape: 'rond',
  flavorMain: '', flavorBottom: '', flavorTop: '',
  supplements: [], supplementOther: '',
  colors: '', messageOnCake: '', allergies: '',
  notesInternal: '',
  deliveryMode: 'retrait', deliveryDate: '', deliveryTime: '',
  deliveryAddress: '', deliveryZip: '', deliveryCity: '', deliveryNote: '',
  amountTotal: '', amountPaid: '',
  photos: [],
}

function Field({ form, errors, onChange, k, label, required, ...rest }) {
  return (
    <div className="space-y-1">
      <label className="form-label">{label}{required && <span className="text-bordeaux ml-0.5">*</span>}</label>
      <input
        className={`form-input ${errors[k] ? 'border-red-300 ring-1 ring-red-300' : ''}`}
        value={form[k]}
        onChange={e => onChange(k, e.target.value)}
        {...rest}
      />
      {errors[k] && <p className="text-xs text-red-500">{errors[k]}</p>}
    </div>
  )
}

function FlavorSelect({ form, onChange, activeFlavors, k, label }) {
  return (
    <div className="space-y-1">
      <label className="form-label">{label}</label>
      <select className="form-select" value={form[k]} onChange={e => onChange(k, e.target.value)}>
        <option value="">Choisir...</option>
        {['gourmand', 'fruite', 'premium'].map(cat => {
          const fs = activeFlavors.filter(f => f.category === cat)
          if (!fs.length) return null
          return (
            <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
              {fs.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}

function DateButton({ value, onChange }) {
  const inputRef = useRef(null)
  const formatted = value
    ? format(parseISO(value), 'EEE d MMMM', { locale: fr })
    : null

  function open() {
    try { inputRef.current?.showPicker() } catch { inputRef.current?.click() }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className="form-input text-left flex items-center gap-2 w-full"
      >
        <CalendarDays size={15} className="text-bordeaux flex-shrink-0" />
        <span className={value ? 'text-chocolat capitalize font-medium' : 'text-warmgray-400'}>
          {formatted ?? 'Choisir une date'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        tabIndex={-1}
      />
    </div>
  )
}

export default function NewOrder() {
  const navigate = useNavigate()
  const addOrder = useStore(s => s.addOrder)
  const addClient = useStore(s => s.addClient)
  const clients = useStore(s => s.clients)
  const catalog = useStore(s => s.catalog)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})

  const product = catalog.products?.find(p => p.id === form.productType)
  const activeFlavors = catalog.flavors?.filter(f => f.active) || []
  const activeSupplements = catalog.supplements?.filter(s => s.active) || []
  const isPieceMontee = form.productType === 'piece_montee'

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function toggleSupplement(name) {
    setForm(f => ({
      ...f,
      supplements: f.supplements.includes(name)
        ? f.supplements.filter(s => s !== name)
        : [...f.supplements, name],
    }))
  }

  function handlePhotos(e) {
    if (e._dataUrl) { setForm(f => ({ ...f, photos: [...f.photos, e._dataUrl] })); return }
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  function validate() {
    const errs = {}
    if (!form.clientInstagram) errs.clientInstagram = 'Requis'
    if (!form.deliveryDate) errs.deliveryDate = 'Requis'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const existing = clients.find(c =>
      c.instagram?.toLowerCase() === form.clientInstagram.toLowerCase()
    )
    if (!existing) {
      addClient({
        id: genId(),
        instagram: form.clientInstagram,
        email: form.clientEmail,
        notes: '',
        createdAt: new Date().toISOString(),
      })
    }

    const allSupplements = [
      ...form.supplements,
      ...(form.supplementOther.trim() ? [form.supplementOther.trim()] : []),
    ]

    const amountTotal = Number(form.amountTotal) || 0
    const amountPaid = Number(form.amountPaid) || 0

    addOrder({
      ...form,
      supplements: allSupplements,
      id: genId(),
      status: 'nouvelle',
      createdAt: new Date().toISOString(),
      amountTotal,
      amountPaid,
      paymentStatus: computePaymentStatus(amountTotal, amountPaid),
    })
    navigate('/commandes')
  }

  const F = (props) => <Field form={form} errors={errors} onChange={set} {...props} />
  const FS = (props) => <FlavorSelect form={form} onChange={set} activeFlavors={activeFlavors} {...props} />

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/commandes')} className="flex items-center gap-1 text-sm text-warmgray-400 hover:text-bordeaux">
          <ChevronLeft size={16} /> Commandes
        </button>
      </div>
      <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat mb-5">Nouvelle commande</h1>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* ── Cliente ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Cliente</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field k="clientInstagram" label="Instagram" required placeholder="@pseudo" />
            <Field k="clientEmail" label="Email" type="email" placeholder="(optionnel)" />
          </div>
        </Card>

        {/* ── Produit ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Produit</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="form-label">Type de produit</label>
              <select
                className="form-select"
                value={form.productType}
                onChange={e => { set('productType', e.target.value); set('productVariant', '') }}
              >
                {(catalog.products || []).filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="form-label">Pièce</label>
              <select className="form-select" value={form.productVariant} onChange={e => set('productVariant', e.target.value)}>
                <option value="">Sélectionner...</option>
                {(product?.variants || []).map(v => (
                  <option key={v.id} value={v.label}>
                    {v.label}{v.price != null ? ` — ${v.price} €` : ' — Sur devis'}
                  </option>
                ))}
              </select>
            </div>
            {product?.shapes?.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <label className="form-label">Forme</label>
                <div className="flex gap-2 flex-wrap">
                  {product.shapes.map(s => (
                    <button
                      key={s} type="button" onClick={() => set('shape', s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.shape === s ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-bordeaux'}`}
                    >
                      {SHAPE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Saveurs & Suppléments ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Saveurs & Suppléments</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {isPieceMontee ? (
              <>
                <FlavorSelect k="flavorBottom" label="Saveur étage bas" />
                <FlavorSelect k="flavorTop" label="Saveur étage haut" />
              </>
            ) : (
              <div className="sm:col-span-2">
                <FlavorSelect k="flavorMain" label="Saveur" />
              </div>
            )}
          </div>
          {activeSupplements.length > 0 && (
            <div className="mb-3">
              <label className="form-label">Suppléments</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {activeSupplements.map(s => (
                  <button
                    key={s.id} type="button" onClick={() => toggleSupplement(s.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.supplements.includes(s.name) ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}
                  >
                    {s.name}{s.price > 0 ? ` +${s.price}€` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="form-label">Autre supplément</label>
            <input
              className="form-input"
              placeholder="Ex: figurines, fleurs fraîches..."
              value={form.supplementOther}
              onChange={e => set('supplementOther', e.target.value)}
            />
          </div>
        </Card>

        {/* ── Personnalisation ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Personnalisation</h2>
          <div className="space-y-3">
            <Field k="colors" label="Couleur de couverture" placeholder="Ex: rose poudré, blanc, or..." />
            <Field k="messageOnCake" label="Message sur le gâteau" />
            <Field k="allergies" label="Allergies / restrictions" />
          </div>
        </Card>

        {/* ── Photos ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Photos d'inspiration</h2>
          <PhotoGallery
            photos={form.photos}
            onDelete={i => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
            onAdd={handlePhotos}
          />
        </Card>

        {/* ── Date & Remise ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Date & remise</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="form-label">Date <span className="text-bordeaux">*</span></label>
              <DateButton value={form.deliveryDate} onChange={v => set('deliveryDate', v)} />
              {errors.deliveryDate && <p className="text-xs text-red-500">{errors.deliveryDate}</p>}
            </div>
            <Field k="deliveryTime" label="Heure" type="time" placeholder="(optionnel)" />
            <div className="space-y-1 sm:col-span-2">
              <label className="form-label">Mode</label>
              <div className="flex gap-4">
                {['retrait', 'livraison'].map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryMode" value={m} checked={form.deliveryMode === m} onChange={() => set('deliveryMode', m)} className="accent-bordeaux" />
                    <span className="text-sm text-chocolat font-medium capitalize">{m}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.deliveryMode === 'livraison' && (
              <>
                <Field k="deliveryAddress" label="Adresse" className="sm:col-span-2" />
                <Field k="deliveryZip" label="Code postal" />
                <Field k="deliveryCity" label="Ville" />
              </>
            )}
          </div>
        </Card>

        {/* ── Paiement ── */}
        <Card>
          <h2 className="font-semibold text-chocolat mb-3">Paiement</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field k="amountTotal" label="Montant total (€)" type="number" step="0.5" />
            <Field k="amountPaid" label="Montant payé (€)" type="number" step="0.5" />
          </div>
          <div className="space-y-1 mt-3">
            <label className="form-label">Notes internes</label>
            <textarea className="form-textarea" rows={2} value={form.notesInternal} onChange={e => set('notesInternal', e.target.value)} />
          </div>
        </Card>

        <div className="flex gap-3 pb-6">
          <button type="submit" className="btn-primary flex-1 justify-center py-3">
            Créer la commande
          </button>
          <Link to="/commandes" className="btn-ghost justify-center px-6">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
