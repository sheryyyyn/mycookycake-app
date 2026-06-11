import { ShoppingCart, RotateCcw, Check } from 'lucide-react'
import useStore from '../store'
import { getWeekOrders, aggregateFlavors, aggregateSupplements } from '../utils'

export default function Courses() {
  const orders = useStore(s => s.orders)
  const shoppingChecked = useStore(s => s.shoppingChecked)
  const toggleShoppingItem = useStore(s => s.toggleShoppingItem)
  const clearShoppingChecked = useStore(s => s.clearShoppingChecked)

  const weekOrders = getWeekOrders(orders)
  const flavors = aggregateFlavors(weekOrders)
  const supplements = aggregateSupplements(weekOrders)

  const total = flavors.length + supplements.length
  const checked = Object.values(shoppingChecked).filter(Boolean).length

  function ShoppingItem({ itemKey, label, count }) {
    const done = !!shoppingChecked[itemKey]
    return (
      <button
        onClick={() => toggleShoppingItem(itemKey)}
        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border transition-all text-left ${
          done
            ? 'bg-green-50 border-green-200 opacity-60'
            : 'bg-white border-rose-100 hover:border-rose-300 hover:bg-rose-50'
        }`}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          done ? 'bg-green-500 border-green-500' : 'border-beige'
        }`}>
          {done && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>
        <span className={`flex-1 text-sm font-medium ${done ? 'line-through text-warmgray-400' : 'text-chocolat'}`}>
          {label}
        </span>
        <span className={`badge ${done ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-bordeaux'}`}>
          × {count}
        </span>
      </button>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Courses</h1>
          <p className="text-sm text-warmgray-400 mt-0.5">
            Basé sur les commandes de la semaine en cours · {checked}/{total} acheté{checked > 1 ? 's' : ''}
          </p>
        </div>
        {checked > 0 && (
          <button
            onClick={clearShoppingChecked}
            className="btn-ghost text-sm flex-shrink-0"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {weekOrders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart size={32} className="text-warmgray-400 mx-auto mb-3" />
          <p className="text-warmgray-400 text-sm">Aucune commande cette semaine</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Saveurs */}
          {flavors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-3">
                Saveurs
              </p>
              <div className="space-y-2">
                {flavors.map(([name, count]) => (
                  <ShoppingItem
                    key={`flavor_${name}`}
                    itemKey={`flavor_${name}`}
                    label={name}
                    count={count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suppléments */}
          {supplements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-3">
                Suppléments
              </p>
              <div className="space-y-2">
                {supplements.map(([name, count]) => (
                  <ShoppingItem
                    key={`supp_${name}`}
                    itemKey={`supp_${name}`}
                    label={name}
                    count={count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {total > 0 && (
            <div className="card bg-rose-50 border-rose-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-bordeaux uppercase tracking-wide">Progression</span>
                <span className="text-xs text-bordeaux font-bold">{checked}/{total}</span>
              </div>
              <div className="w-full bg-rose-200 rounded-full h-2">
                <div
                  className="bg-bordeaux h-2 rounded-full transition-all"
                  style={{ width: total > 0 ? `${(checked / total) * 100}%` : '0%' }}
                />
              </div>
              {checked === total && total > 0 && (
                <p className="text-xs text-bordeaux font-semibold mt-2 text-center">
                  ✓ Toutes les courses sont faites !
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
