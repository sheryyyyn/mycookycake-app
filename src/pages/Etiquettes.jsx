import { useState } from 'react'
import { Printer, Heart, Circle, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import useStore from '../store'
import { parseISO, format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

// Couleurs par index de jour sélectionné — inline styles pour garantir le rendu print
const DAY_COLORS = [
  { bg: '#fff',     border: '#d1d5db' },
  { bg: '#fef2f2',  border: '#fca5a5' }, // rose
  { bg: '#eff6ff',  border: '#93c5fd' }, // bleu
  { bg: '#f0fdf4',  border: '#86efac' }, // vert
  { bg: '#fefce8',  border: '#fde047' }, // jaune
  { bg: '#faf5ff',  border: '#d8b4fe' }, // violet
  { bg: '#fff7ed',  border: '#fdba74' }, // orange
]

function EtiquetteLabel({ order, colorIndex = 0 }) {
  const { bg, border } = DAY_COLORS[colorIndex % DAY_COLORS.length]
  const isLayerCup = order.productType === 'layer_cup'

  return (
    <div style={{ backgroundColor: bg, borderColor: border }} className="border rounded-lg p-2.5 flex flex-col gap-1.5 text-[11px] leading-snug break-inside-avoid">
      <div className="flex gap-2 items-start">
        {order.photos?.[0] && (
          <img src={order.photos[0]} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-bordeaux text-sm truncate">{order.clientInstagram || order.clientFirstName}</p>
          <div className="flex items-center gap-1 text-gray-600 mt-0.5">
            {!isLayerCup && (
              <>
                {order.shape === 'coeur' ? <Heart size={9} /> : <Circle size={9} />}
                <span>{order.shape === 'coeur' ? 'Cœur' : order.shape === 'rond' ? 'Rond' : ''}</span>
                {order.productVariant && <span>·</span>}
              </>
            )}
            {order.productVariant && <span>{order.productVariant}</span>}
          </div>
          {order.colors && <p className="text-gray-500 truncate mt-0.5">Couv : {order.colors}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 text-gray-500 pt-1 border-t border-gray-200">
        <Clock size={9} />
        <span>{order.deliveryTime || '—'}</span>
        <span>·</span>
        {order.deliveryMode === 'livraison'
          ? <><MapPin size={9} /><span>Livraison</span></>
          : <span>Retrait</span>}
      </div>
    </div>
  )
}

export default function Etiquettes() {
  const orders = useStore(s => s.orders)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDays, setSelectedDays] = useState([])

  const baseWeek = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(baseWeek, i))

  const activeOrders = orders.filter(o => o.status !== 'annulee' && o.deliveryDate)

  function ordersForDay(day) {
    return activeOrders
      .filter(o => isSameDay(parseISO(o.deliveryDate), day))
      .sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''))
  }

  function toggleDay(day) {
    setSelectedDays(prev => {
      const exists = prev.some(d => isSameDay(d, day))
      return exists ? prev.filter(d => !isSameDay(d, day)) : [...prev, day]
    })
  }

  const sortedSelectedDays = [...selectedDays].sort((a, b) => a - b)

  const labelOrders = sortedSelectedDays
    .flatMap((day, dayIdx) => ordersForDay(day).map(o => ({ order: o, colorIndex: dayIdx })))

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Print styles — on cache uniquement .etiquettes-screen, pas tout body */}
      <style>{`
        @media print {
          .etiquettes-screen { display: none !important; }
          .etiquettes-print  { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 6mm; padding: 10mm; }
        }
        .etiquettes-print { display: none; }
      `}</style>

      <div className="etiquettes-screen p-3 sm:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Étiquettes</h1>
            <p className="text-sm text-warmgray-400 mt-0.5">
              {selectedDays.length === 0
                ? 'Sélectionnez un ou plusieurs jours'
                : `${selectedDays.length} jour${selectedDays.length > 1 ? 's' : ''} sélectionné${selectedDays.length > 1 ? 's' : ''} · ${labelOrders.length} étiquette${labelOrders.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={handlePrint}
            disabled={labelOrders.length === 0}
            className="btn-primary disabled:opacity-40"
          >
            <Printer size={16} />
            Imprimer ({labelOrders.length})
          </button>
        </div>

        {/* Week navigation */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost py-1.5 px-3">
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold text-chocolat capitalize">
              Semaine du {format(baseWeek, 'd MMMM yyyy', { locale: fr })}
            </p>
            <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost py-1.5 px-3">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day pills */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const count = ordersForDay(day).length
              const selectedIdx = sortedSelectedDays.findIndex(d => isSameDay(d, day))
              const isSelected = selectedIdx !== -1
              const isTodayDay = isSameDay(day, new Date())
              const dayColor = isSelected ? DAY_COLORS[selectedIdx % DAY_COLORS.length] : null
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => count > 0 && toggleDay(day)}
                  style={isSelected && dayColor.bg !== '#fff' ? { backgroundColor: dayColor.bg, borderColor: dayColor.border } : {}}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? dayColor.bg === '#fff' ? 'bg-white border-gray-400 text-chocolat' : 'text-chocolat'
                      : count > 0
                      ? 'bg-rose-50 border-rose-200 text-chocolat hover:border-bordeaux'
                      : 'bg-white border-beige text-warmgray-400 cursor-default'
                  }`}
                  disabled={count === 0}
                >
                  <span className={`text-xs font-semibold uppercase tracking-wide ${isSelected ? 'text-white/70' : isTodayDay ? 'text-bordeaux' : ''}`}>
                    {format(day, 'EEE', { locale: fr })}
                  </span>
                  <span className={`text-lg font-bold leading-none ${isTodayDay && !isSelected ? 'text-bordeaux' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-bordeaux text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Labels preview */}
        {selectedDays.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-3">
              Aperçu · {labelOrders.length} étiquette{labelOrders.length > 1 ? 's' : ''}
            </p>
            {labelOrders.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-warmgray-400 text-sm">Aucune commande ces jours</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {labelOrders.map(({ order: o, colorIndex }) => (
                  <EtiquetteLabel key={o.id} order={o} colorIndex={colorIndex} />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDays.length === 0 && (
          <div className="card text-center py-12 text-warmgray-400">
            <p className="text-sm">Cliquez sur un ou plusieurs jours pour afficher les étiquettes</p>
          </div>
        )}
      </div>

      {/* Zone d'impression — toujours dans le DOM, visible uniquement à l'impression */}
      <div className="etiquettes-print">
        {labelOrders.map(({ order: o, colorIndex }) => (
          <EtiquetteLabel key={o.id} order={o} colorIndex={colorIndex} />
        ))}
      </div>
    </>
  )
}
