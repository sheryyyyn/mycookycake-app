import { useState } from 'react'
import { Cake, ChevronRight, ChevronLeft, Check, Upload, X, AlertCircle } from 'lucide-react'
import useStore from '../store'
import { genId, computePaymentStatus, getProductLabel } from '../utils'

const PRODUCT_TYPES = [
  { id: 'bento_cake', label: 'Bento Cake', emoji: '🎂' },
  { id: 'layer_cake', label: 'Layer Cake', emoji: '🎆' },
  { id: 'cupcakes', label: 'Cupcakes', emoji: '🧁' },
  { id: 'verrines', label: 'Verrines', emoji: '🍮' },
  { id: 'bowl_cake', label: 'Bowl Cake', emoji: '🥣' },
  { id: 'layer_cup', label: 'Layer Cup', emoji: '🥤' },
  { id: 'piece_montee', label: 'Pièce montée', emoji: '🏰' },
  { id: 'box', label: 'Box événementielle', emoji: '🎁' },
  { id: 'autre', label: 'Autre', emoji: '✨' },
]

const INITIAL = {
  clientFirstName: '', clientLastName: '', clientInstagram: '',
  clientPhone: '', clientEmail: '',
  productType: '', productVariant: '', quantity: '',
  shape: '',
  flavorMain: '', flavorSecondary: '', supplements: [],
  theme: '', colors: '', messageOnCake: '', allergies: '', notesClient: '',
  deliveryMode: 'retrait', deliveryDate: '', deliveryTime: '',
  deliveryAddress: '', deliveryZip: '', deliveryCity: '', deliveryNote: '',
  photos: [],
}

export default function ClientForm() {
  const addOrder = useStore(s => s.addOrder)
  const addClient = useStore(s => s.addClient)
  const clients = useStore(s => s.clients)
  const catalog = useStore(s => s.catalog)
  const settings = useStore(s => s.settings)

  const [form, setForm] = useState(INITIAL)
  const [step, setStep] = useState(0) // 0-7 steps + 8=recap + 9=success
  const [errors, setErrors] = useState({})

  const activeFlavors = catalog.flavors?.filter(f => f.active) || []
  const activeSupplements = catalog.supplements?.filter(s => s.active) || []
  const product = catalog.products?.find(p => p.id === form.productType)

  const totalSteps = 7

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
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
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  function validateStep() {
    const errs = {}
    if (step === 0) {
      if (!form.clientFirstName) errs.clientFirstName = 'Requis'
      if (!form.clientInstagram) errs.clientInstagram = 'Requis'
      if (!form.clientPhone) errs.clientPhone = 'Requis'
    }
    if (step === 1) {
      if (!form.productType) errs.productType = 'Requis'
    }
    if (step === 5) {
      if (!form.deliveryDate) errs.deliveryDate = 'Requis'
      if (!form.deliveryTime) errs.deliveryTime = 'Requis'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (!validateStep()) return
    setStep(s => Math.min(s + 1, totalSteps))
  }
  function prev() { setStep(s => Math.max(s - 1, 0)) }

  function showRecap() {
    if (!validateStep()) return
    setStep(8)
  }

  async function submit() {
    const existing = clients.find(c =>
      c.instagram?.toLowerCase() === form.clientInstagram.toLowerCase()
    )
    if (!existing) {
      await addClient({
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
    await addOrder({
      ...form,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: 'nouvelle',
      amountTotal: 0,
      amountPaid: 0,
      paymentStatus: 'non_paye',
    })
    setStep(9)
  }

  // ── Success ────────────────────────────────────────────
  if (step === 9) {
    return (
      <FormShell settings={settings} step={null}>
        <div className="text-center py-12 px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-chocolat mb-2">Merci {form.clientFirstName} !</h2>
          <p className="text-warmgray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Ta commande a bien été envoyée. Je reviens vers toi rapidement si j'ai besoin d'un détail supplémentaire.
          </p>
          <div className="mt-6 bg-beige-light rounded-xl p-4 text-xs text-warmgray-500 max-w-sm mx-auto">
            💌 Je te contacte via Instagram : <strong>{form.clientInstagram}</strong>
          </div>
        </div>
      </FormShell>
    )
  }

  // ── Récap ──────────────────────────────────────────────
  if (step === 8) {
    return (
      <FormShell settings={settings} step={null}>
        <div className="space-y-4">
          <h2 className="font-playfair text-xl font-bold text-chocolat">Récapitulatif de ta commande</h2>
          <div className="bg-rose-50 rounded-2xl p-5 space-y-2 text-sm">
            <RecapRow label="Prénom" val={form.clientFirstName} />
            <RecapRow label="Instagram" val={form.clientInstagram} />
            <RecapRow label="Téléphone" val={form.clientPhone} />
            <RecapRow label="Produit" val={getProductLabel(form.productType)} />
            {form.productVariant && <RecapRow label="Taille" val={form.productVariant} />}
            {form.flavorMain && <RecapRow label="Saveur principale" val={form.flavorMain} />}
            {form.flavorSecondary && <RecapRow label="Saveur secondaire" val={form.flavorSecondary} />}
            {form.supplements.length > 0 && <RecapRow label="Suppléments" val={form.supplements.join(', ')} />}
            {form.theme && <RecapRow label="Thème" val={form.theme} />}
            {form.colors && <RecapRow label="Couleurs" val={form.colors} />}
            {form.messageOnCake && <RecapRow label="Message" val={form.messageOnCake} />}
            <RecapRow label="Date" val={form.deliveryDate} />
            <RecapRow label="Heure" val={form.deliveryTime} />
            <RecapRow label="Mode" val={form.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'} />
            {form.deliveryMode === 'livraison' && form.deliveryCity && (
              <RecapRow label="Ville" val={`${form.deliveryZip} ${form.deliveryCity}`} />
            )}
            {form.photos.length > 0 && <RecapRow label="Photos" val={`${form.photos.length} photo(s)`} />}
          </div>
          <button onClick={() => setStep(5)} className="text-xs text-bordeaux underline">
            Modifier les informations
          </button>
          <div className="flex gap-2 pt-2">
            <button onClick={submit} className="btn-primary flex-1 justify-center py-3">
              Envoyer ma commande ✨
            </button>
          </div>
          <p className="text-xs text-warmgray-400 text-center">
            En soumettant ce formulaire, tu confirmes les informations renseignées.
          </p>
        </div>
      </FormShell>
    )
  }

  const stepTitles = [
    'Informations personnelles',
    'Type de commande',
    'Taille & forme',
    'Saveurs & suppléments',
    'Personnalisation',
    'Date & remise',
    'Photos d\'inspiration',
  ]

  const isLast = step === totalSteps - 1

  return (
    <FormShell settings={settings} step={step} total={totalSteps} stepLabel={stepTitles[step]}>
      <div className="space-y-4">

        {/* STEP 0 — Infos personnelles */}
        {step === 0 && (
          <>
            <FormField label="Prénom" required error={errors.clientFirstName}>
              <input className={`form-input ${errors.clientFirstName ? 'border-red-300' : ''}`} value={form.clientFirstName} onChange={e => setField('clientFirstName', e.target.value)} placeholder="Marie" />
            </FormField>
            <FormField label="Nom">
              <input className="form-input" value={form.clientLastName} onChange={e => setField('clientLastName', e.target.value)} placeholder="Dupont" />
            </FormField>
            <FormField label="Pseudo Instagram" required error={errors.clientInstagram}>
              <input className={`form-input ${errors.clientInstagram ? 'border-red-300' : ''}`} value={form.clientInstagram} onChange={e => setField('clientInstagram', e.target.value)} placeholder="@tonpseudo" />
            </FormField>
            <FormField label="Téléphone" required error={errors.clientPhone}>
              <input className={`form-input ${errors.clientPhone ? 'border-red-300' : ''}`} type="tel" value={form.clientPhone} onChange={e => setField('clientPhone', e.target.value)} placeholder="06 00 00 00 00" />
            </FormField>
            <FormField label="Email">
              <input className="form-input" type="email" value={form.clientEmail} onChange={e => setField('clientEmail', e.target.value)} placeholder="marie@email.fr" />
            </FormField>
          </>
        )}

        {/* STEP 1 — Type */}
        {step === 1 && (
          <>
            {errors.productType && <p className="text-xs text-red-500">Sélectionne un type de produit</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_TYPES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setField('productType', p.id); setField('productVariant', '') }}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 text-sm font-medium transition-all ${form.productType === p.id ? 'border-bordeaux bg-rose-50 text-bordeaux' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — Taille & forme */}
        {step === 2 && (
          <>
            {product?.variants?.length > 0 && (
              <FormField label="Taille / quantité">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setField('productVariant', v.label)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.productVariant === v.label ? 'border-bordeaux bg-rose-50 text-bordeaux' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}
                    >
                      <div className="font-semibold">{v.label}</div>
                      {v.price != null && <div className="text-xs mt-0.5 text-warmgray-400">{v.price} €</div>}
                      {v.price == null && <div className="text-xs mt-0.5 text-warmgray-400">Sur devis</div>}
                    </button>
                  ))}
                </div>
              </FormField>
            )}
            {product?.shapes?.length > 0 && (
              <FormField label="Forme">
                <div className="flex gap-2 flex-wrap">
                  {product.shapes.map(s => (
                    <button key={s} type="button" onClick={() => setField('shape', s)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.shape === s ? 'border-bordeaux bg-rose-50 text-bordeaux' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}>
                      {s === 'rond' ? 'Rond' : s === 'coeur' ? 'Cœur ❤️' : s === 'autre' ? 'Autre' : 'Non concerné'}
                    </button>
                  ))}
                </div>
              </FormField>
            )}
            {!product?.variants?.length && !product?.shapes?.length && (
              <p className="text-sm text-warmgray-400 italic py-4 text-center">Sélectionne d'abord un type de produit à l'étape précédente.</p>
            )}
          </>
        )}

        {/* STEP 3 — Saveurs & suppléments */}
        {step === 3 && (
          <>
            <FormField label="Saveur principale">
              <select className="form-select" value={form.flavorMain} onChange={e => setField('flavorMain', e.target.value)}>
                <option value="">Choisir une saveur...</option>
                {['gourmand', 'fruite', 'premium'].map(cat => {
                  const fs = activeFlavors.filter(f => f.category === cat)
                  if (!fs.length) return null
                  const labels = { gourmand: '🍫 Gourmands', fruite: '🍓 Fruités', premium: '✨ Premiums' }
                  return (
                    <optgroup key={cat} label={labels[cat]}>
                      {fs.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </FormField>
            <FormField label="Saveur secondaire (optionnel)">
              <select className="form-select" value={form.flavorSecondary} onChange={e => setField('flavorSecondary', e.target.value)}>
                <option value="">Aucune</option>
                {activeFlavors.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </FormField>
            {activeSupplements.length > 0 && (
              <FormField label="Suppléments (optionnel)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {activeSupplements.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSupplement(s.name)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${form.supplements.includes(s.name) ? 'border-bordeaux bg-rose-50 text-bordeaux font-semibold' : 'border-beige text-warmgray-500 hover:border-rose-300'}`}>
                      {s.name}
                      {s.price > 0 && <span className="text-xs ml-1 opacity-70">+{s.price}€</span>}
                    </button>
                  ))}
                </div>
              </FormField>
            )}
          </>
        )}

        {/* STEP 4 — Personnalisation */}
        {step === 4 && (
          <>
            <FormField label="Thème de la commande">
              <input className="form-input" value={form.theme} onChange={e => setField('theme', e.target.value)} placeholder="Ex: anniversaire pastel, baby shower, mariage..." />
            </FormField>
            <FormField label="Couleurs souhaitées">
              <input className="form-input" value={form.colors} onChange={e => setField('colors', e.target.value)} placeholder="Ex: rose poudré, blanc, doré..." />
            </FormField>
            <FormField label="Message sur le gâteau">
              <input className="form-input" value={form.messageOnCake} onChange={e => setField('messageOnCake', e.target.value)} placeholder="Ex: Joyeux anniversaire Emma ✨" />
            </FormField>
            <FormField label="Allergies ou restrictions alimentaires">
              <input className="form-input" value={form.allergies} onChange={e => setField('allergies', e.target.value)} placeholder="Ex: allergie aux fruits à coque, végétarienne..." />
            </FormField>
            <FormField label="Inspirations ou détails importants">
              <textarea className="form-textarea" rows={4} value={form.notesClient} onChange={e => setField('notesClient', e.target.value)} placeholder="Décris-moi ta vision du gâteau, partage tes inspirations, ce que tu aimes ou n'aimes pas..." />
            </FormField>
          </>
        )}

        {/* STEP 5 — Date & remise */}
        {step === 5 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Date souhaitée" required error={errors.deliveryDate}>
                <input className={`form-input ${errors.deliveryDate ? 'border-red-300' : ''}`} type="date" value={form.deliveryDate} onChange={e => setField('deliveryDate', e.target.value)} />
              </FormField>
              <FormField label="Heure souhaitée" required error={errors.deliveryTime}>
                <input className={`form-input ${errors.deliveryTime ? 'border-red-300' : ''}`} type="time" value={form.deliveryTime} onChange={e => setField('deliveryTime', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Mode de remise">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['retrait', '🏪 Retrait', 'Je récupère ma commande sur place'], ['livraison', '🚗 Livraison', 'Je souhaite une livraison à domicile']].map(([val, label, sub]) => (
                  <button key={val} type="button" onClick={() => setField('deliveryMode', val)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.deliveryMode === val ? 'border-bordeaux bg-rose-50' : 'border-beige hover:border-rose-200'}`}>
                    <p className={`font-semibold text-sm ${form.deliveryMode === val ? 'text-bordeaux' : 'text-chocolat'}`}>{label}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </FormField>
            {form.deliveryMode === 'livraison' && (
              <>
                <FormField label="Adresse complète">
                  <input className="form-input" value={form.deliveryAddress} onChange={e => setField('deliveryAddress', e.target.value)} placeholder="12 rue de la Paix" />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Code postal">
                    <input className="form-input" value={form.deliveryZip} onChange={e => setField('deliveryZip', e.target.value)} placeholder="75001" />
                  </FormField>
                  <FormField label="Ville">
                    <input className="form-input" value={form.deliveryCity} onChange={e => setField('deliveryCity', e.target.value)} placeholder="Paris" />
                  </FormField>
                </div>
                <FormField label="Informations complémentaires">
                  <input className="form-input" value={form.deliveryNote} onChange={e => setField('deliveryNote', e.target.value)} placeholder="Code portail, étage, sonnette..." />
                </FormField>
              </>
            )}
            {form.deliveryMode === 'retrait' && (
              <FormField label="Créneau de retrait souhaité">
                <input className="form-input" value={form.deliveryNote} onChange={e => setField('deliveryNote', e.target.value)} placeholder="Note éventuelle..." />
              </FormField>
            )}
          </>
        )}

        {/* STEP 6 — Photos */}
        {step === 6 && (
          <>
            <div className="bg-beige-light rounded-xl p-4 text-xs text-warmgray-500 mb-2">
              📸 Ajoute des photos ou screenshots de tes inspirations pour que je puisse visualiser ta commande. (optionnel)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {form.photos.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} className="w-full h-full object-cover rounded-xl" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                    className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-red-400 shadow">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-beige flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors">
                <Upload size={20} className="text-warmgray-400" />
                <span className="text-xs text-warmgray-400 mt-1">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
              </label>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-4">
          {step > 0 && (
            <button type="button" onClick={prev} className="btn-ghost gap-1">
              <ChevronLeft size={16} /> Retour
            </button>
          )}
          {isLast ? (
            <button type="button" onClick={showRecap} className="btn-primary flex-1 justify-center">
              Voir le récapitulatif <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={next} className="btn-primary flex-1 justify-center">
              Continuer <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </FormShell>
  )
}

function FormShell({ children, settings, step, total, stepLabel }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl pointer-events-none" />

      <header className="bg-white border-b border-rose-100 px-4 py-4 text-center sticky top-0 z-10">
        <div className="flex items-center justify-center gap-2">
          <Cake size={20} className="text-bordeaux" />
          <span className="font-playfair font-bold text-bordeaux text-lg">{settings?.businessName || 'Mycookycake'}</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <div className="text-center mb-8">
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat mb-2">Finalise ta commande</h1>
              <p className="text-warmgray-500 text-sm leading-relaxed max-w-sm mx-auto">
                {settings?.formIntro}
              </p>
              <div className="mt-3 bg-beige-light rounded-xl px-4 py-3 text-xs text-warmgray-500 border border-beige">
                <AlertCircle size={12} className="inline mr-1" />
                {settings?.conditions}
              </div>
            </div>
          )}

          {step !== null && total && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-warmgray-400 mb-2">
                <span>{stepLabel}</span>
                <span>{step + 1} / {total}</span>
              </div>
              <div className="h-1.5 bg-beige-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-bordeaux rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-rose-100 shadow-soft p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, required, error, children }) {
  return (
    <div className="space-y-1">
      <label className="form-label">{label}{required && <span className="text-bordeaux ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function RecapRow({ label, val }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-warmgray-400 text-xs">{label}</span>
      <span className="text-chocolat font-medium text-xs text-right">{val}</span>
    </div>
  )
}
