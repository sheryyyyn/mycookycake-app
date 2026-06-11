import { useState, useRef } from 'react'
import { Printer, Tag, Filter, Heart, Square, Clock, MapPin } from 'lucide-react'
import useStore from '../store'
import { parseISO, getDay } from 'date-fns'

const DAY_BG = {
  5: 'bg-rose-50',   // vendredi → rose
  6: 'bg-blue-50',   // samedi → bleu
  0: 'bg-green-50',  // dimanche → vert
}

function getLabelBg(dateStr) {
  if (!dateStr) return 'bg-white'
  try {
    const d = parseISO(dateStr)
    return DAY_BG[getDay(d)] || 'bg-white'
  } catch {
    return 'bg-white'
  }
}

function EtiquetteLabel({ order, forPrint }) {
  const bg = getLabelBg(order.deliveryDate)

  return (
    <div
      className={`${bg} border border-gray-300 rounded p-2 flex flex-col gap-1 text-[10px] leading-tight ${
        forPrint ? 'w-[90mm] h-[45mm] overflow-hidden' : 'w-full'
      }`}
      style={forPrint ? { pageBreakInside: 'avoid', boxSizing: 'border-box' } : undefined}
    >
      <div className="flex gap-2 items-start">
        {order.photos?.[0] && (
          <img
            src={order.photos[0]}
            alt=""
            className="w-10 h-10 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-bordeaux text-xs truncate">{order.clientInstagram || order.clientFirstName}</p>
          <div className="flex items-center gap-0.5 text-gray-600">
            {order.shape === 'coeur' ? <Heart size={8} /> : <Square size={8} />}
            <span>{order.shape === 'coeur' ? 'Cœur' : order.shape === 'rond' ? 'Rond' : ''}</span>
            {order.productVariant && <span>· {order.productVariant}</span>}
          </div>
          {order.colors && <p className="text-gray-500 truncate">Couv : {order.colors}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 text-gray-500 mt-auto pt-1 border-t border-gray-200">
        <Clock size={8} />
        <span>{order.deliveryTime || '—'}</span>
        <span>·</span>
        {order.deliveryMode === 'livraison' ? (
          <><MapPin size={8} /><span>Livraison</span></>
        ) : (
          <span>Retrait</span>
        )}
      </div>
    </div>
  )
}

const FILTER_OPTIONS = [
  { id: 'all',       label: 'Toutes' },
  { id: 'vendredi',  label: 'Vendredi' },
  { id: 'samedi',    label: 'Samedi' },
  { id: 'dimanche',  label: 'Dimanche' },
]

const DAY_NUM = { vendredi: 5, samedi: 6, dimanche: 0 }

export default function Etiquettes() {
  const orders = useStore(s => s.orders)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const printRef = useRef(null)

  const activeOrders = orders.filter(o => o.status !== 'annulee' && o.status !== 'remis' && o.deliveryDate)

  const filtered = activeOrders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'selected') return selected.has(o.id)
    try {
      return getDay(parseISO(o.deliveryDate)) === DAY_NUM[filter]
    } catch { return false }
  }).sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || '') || (a.deliveryTime || '').localeCompare(b.deliveryTime || ''))

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handlePrint() {
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-zone, #print-zone * { visibility: visible; }
        #print-zone { position: absolute; top: 0; left: 0; width: 100%; }
        .etiquette-grid { display: flex; flex-wrap: wrap; gap: 4mm; padding: 8mm; }
        .etiquette-item { width: 90mm; page-break-inside: avoid; }
        .cut-line { border-top: 1px dashed #ccc; width: 100%; margin: 2mm 0; }
      }
    `
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-chocolat">Étiquettes</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">
            Générez et imprimez vos étiquettes frigo
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={filtered.length === 0}
          className="btn-primary"
        >
          <Printer size={16} />
          Imprimer ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              filter === opt.id
                ? 'bg-bordeaux text-white border-bordeaux'
                : 'bg-white text-warmgray-500 border-beige hover:border-rose-300 hover:text-bordeaux'
            }`}
          >
            <Filter size={13} />
            {opt.label}
          </button>
        ))}
        {selected.size > 0 && (
          <button
            onClick={() => setFilter('selected')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              filter === 'selected'
                ? 'bg-bordeaux text-white border-bordeaux'
                : 'bg-white text-warmgray-500 border-beige hover:border-rose-300 hover:text-bordeaux'
            }`}
          >
            <Tag size={13} />
            Sélection ({selected.size})
          </button>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 mb-6 text-xs text-warmgray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Vendredi</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Samedi</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Dimanche</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Tag size={32} className="text-warmgray-400 mx-auto mb-3" />
          <p className="text-warmgray-400 text-sm">Aucune commande pour ce filtre</p>
        </div>
      ) : (
        <>
          {/* Preview grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            {activeOrders.map(o => {
              const isFiltered = filtered.find(f => f.id === o.id)
              const isSel = selected.has(o.id)
              return (
                <div
                  key={o.id}
                  onClick={() => toggleSelect(o.id)}
                  className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                    isSel ? 'border-bordeaux shadow-soft' : isFiltered ? 'border-transparent opacity-100' : 'border-transparent opacity-40'
                  }`}
                >
                  <EtiquetteLabel order={o} forPrint={false} />
                  {isSel && (
                    <div className="bg-bordeaux text-white text-xs text-center py-0.5 font-semibold">
                      ✓ Sélectionnée
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Hidden print zone */}
          <div id="print-zone" ref={printRef} className="hidden print:block">
            <div className="etiquette-grid">
              {filtered.map(o => (
                <div key={o.id} className="etiquette-item">
                  <EtiquetteLabel order={o} forPrint={true} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
