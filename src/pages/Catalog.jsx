import { useState } from 'react'
import { Plus, Trash2, Edit2, Save, X, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react'
import useStore from '../store'
import { genId } from '../utils'

const TABS = ['Produits', 'Saveurs', 'Suppléments']
const CAT_LABELS = { gourmand: '🍫 Gourmands', fruite: '🍓 Fruités', premium: '✨ Premiums' }

export default function Catalog() {
  const [tab, setTab] = useState('Produits')

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Catalogue</h1>
        <p className="text-sm text-warmgray-400 mt-0.5">Gérez vos produits, saveurs et suppléments</p>
      </div>

      <div className="flex gap-0 mb-5 rounded-xl border border-beige overflow-hidden bg-white w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'bg-rose-100 text-bordeaux font-semibold' : 'text-warmgray-400 hover:bg-rose-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Produits' && <ProductsTab />}
      {tab === 'Saveurs' && <FlavorsTab />}
      {tab === 'Suppléments' && <SupplementsTab />}
    </div>
  )
}

// ── Products ──────────────────────────────────────────────────────
function ProductsTab() {
  const catalog = useStore(s => s.catalog)
  const updateCatalogProduct = useStore(s => s.updateCatalogProduct)
  const products = catalog.products || []
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-3">
      {products.map(p => (
        <ProductCard
          key={p.id}
          product={p}
          expanded={expanded === p.id}
          onToggleExpand={() => setExpanded(expanded === p.id ? null : p.id)}
          onUpdate={updates => updateCatalogProduct(p.id, updates)}
        />
      ))}
    </div>
  )
}

function ProductCard({ product, expanded, onToggleExpand, onUpdate }) {
  const [editingVariant, setEditingVariant] = useState(null)
  const [newVariant, setNewVariant] = useState({ label: '', price: '' })
  const [showAddVariant, setShowAddVariant] = useState(false)

  function toggleActive() { onUpdate({ active: !product.active }) }

  function saveVariant(varId, updates) {
    onUpdate({ variants: product.variants.map(v => v.id === varId ? { ...v, ...updates } : v) })
    setEditingVariant(null)
  }

  function deleteVariant(varId) {
    onUpdate({ variants: product.variants.filter(v => v.id !== varId) })
  }

  function addVariant() {
    if (!newVariant.label) return
    onUpdate({
      variants: [...product.variants, { id: genId(), label: newVariant.label, price: Number(newVariant.price) || null }],
    })
    setNewVariant({ label: '', price: '' })
    setShowAddVariant(false)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-card overflow-hidden ${product.active ? 'border-rose-100' : 'border-beige opacity-60'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggleExpand} className="flex items-center gap-2 flex-1 text-left">
          {expanded ? <ChevronDown size={16} className="text-warmgray-400" /> : <ChevronRight size={16} className="text-warmgray-400" />}
          <span className="font-semibold text-chocolat">{product.name}</span>
          <span className="text-xs text-warmgray-400">({product.variants?.length} variantes)</span>
        </button>
        <button onClick={toggleActive} className="p-1 text-warmgray-400 hover:text-bordeaux transition-colors" title={product.active ? 'Désactiver' : 'Activer'}>
          {product.active ? <ToggleRight size={20} className="text-bordeaux" /> : <ToggleLeft size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-rose-50 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-warmgray-400 uppercase mb-2">Variantes</p>
          <div className="space-y-2">
            {product.variants?.map(v => (
              <VariantRow key={v.id} variant={v}
                editing={editingVariant === v.id}
                onEdit={() => setEditingVariant(v.id)}
                onSave={updates => saveVariant(v.id, updates)}
                onCancel={() => setEditingVariant(null)}
                onDelete={() => deleteVariant(v.id)}
              />
            ))}
          </div>

          {showAddVariant ? (
            <div className="flex items-center gap-2 mt-3">
              <input className="form-input flex-1 text-sm" placeholder="Label (ex: 6 parts)" value={newVariant.label} onChange={e => setNewVariant(v => ({ ...v, label: e.target.value }))} />
              <input className="form-input w-24 text-sm" placeholder="Prix €" type="number" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))} />
              <button onClick={addVariant} className="btn-primary text-xs px-3 py-2"><Save size={13} /></button>
              <button onClick={() => setShowAddVariant(false)} className="btn-ghost text-xs px-3 py-2"><X size={13} /></button>
            </div>
          ) : (
            <button onClick={() => setShowAddVariant(true)} className="mt-3 flex items-center gap-1 text-xs text-bordeaux hover:underline">
              <Plus size={13} /> Ajouter une variante
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function VariantRow({ variant, editing, onEdit, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({ label: variant.label, price: variant.price ?? '' })
  return editing ? (
    <div className="flex items-center gap-2">
      <input className="form-input flex-1 text-sm" value={form.label} onChange={e => setForm(v => ({ ...v, label: e.target.value }))} />
      <input className="form-input w-24 text-sm" type="number" placeholder="Prix" value={form.price} onChange={e => setForm(v => ({ ...v, price: e.target.value }))} />
      <button onClick={() => onSave({ label: form.label, price: form.price !== '' ? Number(form.price) : null })} className="btn-primary text-xs px-2.5 py-1.5"><Save size={12} /></button>
      <button onClick={onCancel} className="btn-ghost text-xs px-2.5 py-1.5"><X size={12} /></button>
    </div>
  ) : (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 text-sm text-chocolat">{variant.label}</span>
      <span className="text-xs text-warmgray-400">{variant.price != null ? `${variant.price} €` : 'Sur devis'}</span>
      <button onClick={onEdit} className="p-1 text-warmgray-400 hover:text-bordeaux"><Edit2 size={13} /></button>
      <button onClick={onDelete} className="p-1 text-warmgray-400 hover:text-red-500"><Trash2 size={13} /></button>
    </div>
  )
}

// ── Flavors ───────────────────────────────────────────────────────
function FlavorsTab() {
  const catalog = useStore(s => s.catalog)
  const updateFlavor = useStore(s => s.updateFlavor)
  const addFlavor = useStore(s => s.addFlavor)
  const deleteFlavor = useStore(s => s.deleteFlavor)
  const flavors = catalog.flavors || []
  const [newFlavor, setNewFlavor] = useState({ name: '', category: 'gourmand' })
  const [showAdd, setShowAdd] = useState(false)

  function handleAdd() {
    if (!newFlavor.name) return
    addFlavor({ id: genId(), name: newFlavor.name, category: newFlavor.category, active: true })
    setNewFlavor({ name: '', category: 'gourmand' })
    setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      {['gourmand', 'fruite', 'premium'].map(cat => {
        const fs = flavors.filter(f => f.category === cat)
        return (
          <div key={cat} className="bg-white rounded-2xl border border-rose-100 shadow-card p-4">
            <p className="font-semibold text-chocolat mb-3">{CAT_LABELS[cat]}</p>
            <div className="space-y-2">
              {fs.map(f => (
                <FlavorRow key={f.id} flavor={f}
                  onUpdate={updates => updateFlavor(f.id, updates)}
                  onDelete={() => deleteFlavor(f.id)}
                />
              ))}
              {fs.length === 0 && <p className="text-xs text-warmgray-400 italic">Aucune saveur</p>}
            </div>
          </div>
        )
      })}

      {showAdd ? (
        <div className="card">
          <p className="text-sm font-semibold text-chocolat mb-3">Nouvelle saveur</p>
          <div className="flex gap-2">
            <input className="form-input flex-1" placeholder="Nom de la saveur" value={newFlavor.name} onChange={e => setNewFlavor(v => ({ ...v, name: e.target.value }))} />
            <select className="form-select w-40" value={newFlavor.category} onChange={e => setNewFlavor(v => ({ ...v, category: e.target.value }))}>
              <option value="gourmand">Gourmand</option>
              <option value="fruite">Fruité</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="btn-primary text-sm"><Save size={13} /> Ajouter</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm"><X size={13} /> Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm text-bordeaux hover:underline">
          <Plus size={15} /> Ajouter une saveur
        </button>
      )}
    </div>
  )
}

function FlavorRow({ flavor, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(flavor.name)
  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input className="form-input flex-1 text-sm" value={name} onChange={e => setName(e.target.value)} />
          <button onClick={() => { onUpdate({ name }); setEditing(false) }} className="btn-primary text-xs px-2 py-1.5"><Save size={12} /></button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-2 py-1.5"><X size={12} /></button>
        </>
      ) : (
        <>
          <span className={`flex-1 text-sm ${flavor.active ? 'text-chocolat' : 'text-warmgray-400 line-through'}`}>{flavor.name}</span>
          <button onClick={() => onUpdate({ active: !flavor.active })} className="p-1 text-warmgray-400 hover:text-bordeaux">
            {flavor.active ? <ToggleRight size={18} className="text-bordeaux" /> : <ToggleLeft size={18} />}
          </button>
          <button onClick={() => setEditing(true)} className="p-1 text-warmgray-400 hover:text-bordeaux"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-1 text-warmgray-400 hover:text-red-500"><Trash2 size={13} /></button>
        </>
      )}
    </div>
  )
}

// ── Supplements ───────────────────────────────────────────────────
function SupplementsTab() {
  const catalog = useStore(s => s.catalog)
  const updateSupplement = useStore(s => s.updateSupplement)
  const addSupplement = useStore(s => s.addSupplement)
  const deleteSupplement = useStore(s => s.deleteSupplement)
  const supplements = catalog.supplements || []
  const [showAdd, setShowAdd] = useState(false)
  const [newSupp, setNewSupp] = useState({ name: '', price: '' })

  function handleAdd() {
    if (!newSupp.name) return
    addSupplement({ id: genId(), name: newSupp.name, price: Number(newSupp.price) || 0, active: true })
    setNewSupp({ name: '', price: '' })
    setShowAdd(false)
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-card p-4 space-y-2">
        {supplements.map(s => (
          <SuppRow key={s.id} supp={s}
            onUpdate={updates => updateSupplement(s.id, updates)}
            onDelete={() => deleteSupplement(s.id)}
          />
        ))}
      </div>

      {showAdd ? (
        <div className="card">
          <p className="text-sm font-semibold text-chocolat mb-3">Nouveau supplément</p>
          <div className="flex gap-2">
            <input className="form-input flex-1" placeholder="Nom" value={newSupp.name} onChange={e => setNewSupp(v => ({ ...v, name: e.target.value }))} />
            <input className="form-input w-24" placeholder="Prix €" type="number" value={newSupp.price} onChange={e => setNewSupp(v => ({ ...v, price: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="btn-primary text-sm"><Save size={13} /> Ajouter</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm"><X size={13} /> Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm text-bordeaux hover:underline">
          <Plus size={15} /> Ajouter un supplément
        </button>
      )}
    </div>
  )
}

function SuppRow({ supp, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: supp.name, price: supp.price })
  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input className="form-input flex-1 text-sm" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} />
          <input className="form-input w-20 text-sm" type="number" value={form.price} onChange={e => setForm(v => ({ ...v, price: e.target.value }))} />
          <button onClick={() => { onUpdate({ name: form.name, price: Number(form.price) || 0 }); setEditing(false) }} className="btn-primary text-xs px-2 py-1.5"><Save size={12} /></button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-2 py-1.5"><X size={12} /></button>
        </>
      ) : (
        <>
          <span className={`flex-1 text-sm ${supp.active ? 'text-chocolat' : 'text-warmgray-400 line-through'}`}>{supp.name}</span>
          <span className="text-xs text-warmgray-400">{supp.price > 0 ? `+${supp.price} €` : 'Gratuit'}</span>
          <button onClick={() => onUpdate({ active: !supp.active })} className="p-1 text-warmgray-400 hover:text-bordeaux">
            {supp.active ? <ToggleRight size={18} className="text-bordeaux" /> : <ToggleLeft size={18} />}
          </button>
          <button onClick={() => setEditing(true)} className="p-1 text-warmgray-400 hover:text-bordeaux"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-1 text-warmgray-400 hover:text-red-500"><Trash2 size={13} /></button>
        </>
      )}
    </div>
  )
}
