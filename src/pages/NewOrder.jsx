import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import useStore from '../store'
import { genId, computePaymentStatus, getProductLabel } from '../utils'
import { Input, Select, Textarea, Card, PhotoGallery } from '../components/ui'

const SHAPES = ['rond', 'coeur', 'autre', 'non_concerne']
const SHAPE_LABELS = { rond: 'Rond', coeur: 'Cœur', autre: 'Autre', non_concerne: 'Non concerné' }

const INITIAL = {
  clientFirstName: '', clientLastName: '', clientInstagram: '',
  clientPhone: '', clientEmail: '',
  productType: 'bento_cake', productVariant: '', quantity: '',
  shape: 'rond',
  flavorMain: '', flavorSecondary: '', supplements: [],
  theme: '', colors: '', messageOnCake: '', allergies: '',
  notesClient: '', notesInternal: '',
  deliveryMode: 'retrait', deliveryDate: '', deliveryTime: '',
  deliveryAddress: '', deliveryZip: '', deliveryCity: '', deliveryNote: '',
  amountTotal: '', amountPaid: '', status: 'nouvelle',
  photos: [],
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

  function setField(key, value) {
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
    if (e._dataUrl) {
      setForm(f => ({ ...f, photos: [...f.photos, e._dataUrl] }))
      return
    }
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  function validate() {
    const errs = {}
    if (!form.clientInstagram) errs.clientInstagram = 'Requis'
    if (!form.deliveryDate) errs.deliveryDate = 'Requis'
    if (!form.deliveryTime) errs.deliveryTime = 'Requis'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    // Auto-create or link client
    const existing = clients.find(c =>
      c.instagram?.toLowerCase() === form.clientInstagram.toLowerCase()
    )
    if (!existing) {
      addClient({
        id: genId(),
        firstName: form.clientFirstName,
        lastName: form.clientLastName,
        instagram: form.clientInstagram,
        phone: form.clientPhone,
        email: form.clientEmail,
        notes: '',
        createdAt: new Date().toISOString(),
      })
    }

    const amountTotal = Number(form.amountTotal) || 0
    const amountPaid = Number(form.amountPaid) || 0

    addOrder({
      ...form,
      id: genId(),
      createdAt: new Date().toISOString(),
      amountTotal,
      amountPaid,
      paymentStatus: computePaymentStatus(amountTotal, amountPaid),
    })
    navigate('/commandes')
  }

  function Field({ k, label, required, ...rest }) {
    return (
      <div className="space-y-1">
        <label className="form-label">{label}{required && <span className="text-bordeaux ml-0.5">*</span>}</label>
        <input
          className={`form-input ${errors[k] ? 'border-red-300 ring-1 ring-red-300' : ''}`}
          value={form[k]}
          onChange={e => setField(k, e.target.value)}
          {...rest}
        />
        {errors[k] && <p className="text-xs text-red-500">{errors[k]}</p>}
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/commandes')} className="flex items-center gap-1 text-sm text-warmgray-400 hover:text-bordeaux">
          <ChevronLeft size={16} /> Commandes
        </button>
      </div>
      <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat mb-6">Nouvelle commande</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Informations cliente</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field k="clientFirstName" label="Prénom" />
            <Field k="clientLastName" label="Nom" />
            <Field k="clientInstagram" label="Instagram" required placeholder="@pseudo" />
            <Field k="clientPhone" label="Téléphone" type="tel" />
            <Field k="clientEmail" label="Email" type="email" className="sm:col-span-2" />
          </div>
        </Card>

        {/* Produit */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Produit</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="form-label">Type de produit</label>
              <select className="form-select" value={form.productType} onChange={e => { setField('productType', e.target.value); setField('productVariant', '') }}>
                {(catalog.products || []).filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="form-label">Variante / taille</label>
              <select className="form-select" value={form.productVariant} onChange={e => setField('productVariant', e.target.value)}>
                <option value="">Sélectionner...</option>
                {(product?.variants || []).map(v => (
                  <option key={v.id} value={v.label}>
                    {v.label}{v.price != null ? ` — ${v.price} €` : ' — Sur devis'}
                  </option>
                ))}
              </select>
            </div>
            {product?.shapes?.length > 0 && (
              <div className="space-y-1">
                <label className="form-label">Forme</label>
                <div className="flex gap-2 flex-wrap">
                  {product.shapes.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('shape', s)}
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

        {/* Saveurs */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Saveurs & Suppléments</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <label className="form-label">Saveur principale</label>
              <select className="form-select" value={form.flavorMain} onChange={e => setField('flavorMain', e.target.value)}>
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
            <div className="space-y-1">
              <label className="form-label">Saveur secondaire</label>
              <select className="form-select" value={form.flavorSecondary} onChange={e => setField('flavorSecondary', e.target.value)}>
                <option value="">Aucune</option>
                {activeFlavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Suppléments</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {activeSupplements.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSupplement(s.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.supplements.includes(s.name) ? 'bg-bordeaux text-white border-bordeaux' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}
                >
                  {s.name}{s.price > 0 ? ` +${s.price}€` : ''}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Personnalisation */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Personnalisation</h2>
          <div className="space-y-3">
            <Field k="theme" label="Thème" placeholder="Ex: anniversaire bohème, baby shower..." />
            <Field k="colors" label="Couleurs souhaitées" placeholder="Ex: rose poudré, blanc, or..." />
            <Field k="messageOnCake" label="Message sur le gâteau" />
            <Field k="allergies" label="Allergies / restrictions" />
            <div className="space-y-1">
              <label className="form-label">Notes cliente</label>
              <textarea className="form-textarea" rows={3} value={form.notesClient} onChange={e => setField('notesClient', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Photos */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Photos d'inspiration</h2>
          <PhotoGallery
            photos={form.photos}
            onDelete={i => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
            onAdd={handlePhotos}
          />
        </Card>

        {/* Remise */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Date & remise</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field k="deliveryDate" label="Date" type="date" required />
            <Field k="deliveryTime" label="Heure" type="time" required />
            <div className="space-y-1 sm:col-span-2">
              <label className="form-label">Mode</label>
              <div className="flex gap-3">
                {['retrait', 'livraison'].map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryMode" value={m} checked={form.deliveryMode === m} onChange={() => setField('deliveryMode', m)} className="accent-bordeaux" />
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
                <Field k="deliveryNote" label="Note livraison" className="sm:col-span-2" />
              </>
            )}
          </div>
        </Card>

        {/* Admin fields */}
        <Card>
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Paiement & statut</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field k="amountTotal" label="Montant total (€)" type="number" step="0.5" />
            <Field k="amountPaid" label="Montant payé (€)" type="number" step="0.5" />
            <div className="space-y-1">
              <label className="form-label">Statut initial</label>
              <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="nouvelle">Nouvelle commande</option>
                <option value="confirmee">Confirmée</option>
                <option value="fini">Fini</option>
                <option value="remis">Remis</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>
          <div className="space-y-1 mt-3">
            <label className="form-label">Notes internes</label>
            <textarea className="form-textarea" rows={3} value={form.notesInternal} onChange={e => setField('notesInternal', e.target.value)} />
          </div>
        </Card>

        <div className="flex gap-3">
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
