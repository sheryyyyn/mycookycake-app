import { Link } from 'react-router-dom'
import { Cake, Clock, MapPin, ChevronRight, Layers, FlameKindling, ShoppingCart, Star } from 'lucide-react'
import useStore from '../store'
import { format, parseISO, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  todayUpperCase,
  getWeekOrders,
  aggregateProduction,
  aggregateGenoises,
  aggregateFlavors,
  aggregateSupplements,
  getTodayPickups,
} from '../utils'

const BENTO_VARIANTS = ['2 parts', '4 parts', '6 parts']
const LAYER_VARIANTS = ['10 parts', '15 parts', '20-25 parts', '30-35 parts']

export default function Dashboard() {
  const orders = useStore(s => s.orders)

  const weekOrders = getWeekOrders(orders)
  const { bentoByVariantShape, layerByVariantShape, cupcakesQty, layerCupQty } = aggregateProduction(weekOrders)
  const genoises = aggregateGenoises(weekOrders)
  const flavors = aggregateFlavors(weekOrders)
  const supplements = aggregateSupplements(weekOrders)
  const todayPickups = getTodayPickups(orders)

  const shapes = ['rond', 'coeur']

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-widest mb-1">
          {todayUpperCase()}
        </p>
        <h1 className="font-playfair text-4xl font-bold text-chocolat leading-tight">Production de la semaine</h1>
        <p className="text-warmgray-400 mt-1 text-sm">{weekOrders.length} commande{weekOrders.length !== 1 ? 's' : ''} cette semaine</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Bloc: Production */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Cake size={16} className="text-bordeaux" />
            </div>
            <h2 className="font-semibold text-chocolat">Gâteaux à réaliser</h2>
          </div>

          {weekOrders.length === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-4">Aucune commande cette semaine</p>
          ) : (
            <div className="space-y-4">
              {/* Bento Cakes */}
              {BENTO_VARIANTS.some(v => shapes.some(s => bentoByVariantShape[`${v}|${s}`])) && (
                <div>
                  <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-wide mb-2">Bento Cakes</p>
                  <div className="space-y-1">
                    {BENTO_VARIANTS.map(v =>
                      shapes.map(s => {
                        const count = bentoByVariantShape[`${v}|${s}`]
                        if (!count) return null
                        return (
                          <div key={`${v}|${s}`} className="flex items-center justify-between py-1 border-b border-rose-50 last:border-0">
                            <span className="text-sm text-chocolat-light">{v} • {s === 'coeur' ? 'Cœur' : 'Rond'}</span>
                            <span className="text-sm font-bold text-bordeaux">× {count}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Layer Cakes */}
              {LAYER_VARIANTS.some(v => shapes.some(s => layerByVariantShape[`${v}|${s}`])) && (
                <div>
                  <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-wide mb-2">Layer Cakes</p>
                  <div className="space-y-1">
                    {LAYER_VARIANTS.map(v =>
                      shapes.map(s => {
                        const count = layerByVariantShape[`${v}|${s}`]
                        if (!count) return null
                        return (
                          <div key={`${v}|${s}`} className="flex items-center justify-between py-1 border-b border-rose-50 last:border-0">
                            <span className="text-sm text-chocolat-light">{v} • {s === 'coeur' ? 'Cœur' : 'Rond'}</span>
                            <span className="text-sm font-bold text-bordeaux">× {count}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Autres */}
              {(cupcakesQty > 0 || layerCupQty > 0) && (
                <div>
                  <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-wide mb-2">Autres</p>
                  <div className="space-y-1">
                    {cupcakesQty > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-rose-50 last:border-0">
                        <span className="text-sm text-chocolat-light">Cupcakes</span>
                        <span className="text-sm font-bold text-bordeaux">× {cupcakesQty}</span>
                      </div>
                    )}
                    {layerCupQty > 0 && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-chocolat-light">Layer Cups</span>
                        <span className="text-sm font-bold text-bordeaux">× {layerCupQty}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bloc: Génoises */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Layers size={16} className="text-bordeaux" />
            </div>
            <h2 className="font-semibold text-chocolat">Génoises à préparer</h2>
          </div>

          {genoises.total === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-4">Aucune génoise cette semaine</p>
          ) : (
            <div className="space-y-2">
              {genoises.bento > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-rose-50">
                  <span className="text-sm text-chocolat-light">Bento (2 tranches / gâteau)</span>
                  <span className="text-sm font-semibold text-chocolat">{genoises.bento} tranches</span>
                </div>
              )}
              {genoises.layer10 > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-rose-50">
                  <span className="text-sm text-chocolat-light">Layer 10 parts (3 tranches)</span>
                  <span className="text-sm font-semibold text-chocolat">{genoises.layer10} tranches</span>
                </div>
              )}
              {genoises.layer15 > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-rose-50">
                  <span className="text-sm text-chocolat-light">Layer 15 parts (4 tranches)</span>
                  <span className="text-sm font-semibold text-chocolat">{genoises.layer15} tranches</span>
                </div>
              )}
              {genoises.layer2025 > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-rose-50">
                  <span className="text-sm text-chocolat-light">Layer 20/25 parts (5 tranches)</span>
                  <span className="text-sm font-semibold text-chocolat">{genoises.layer2025} tranches</span>
                </div>
              )}
              {genoises.layer3035 > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-rose-50">
                  <span className="text-sm text-chocolat-light">Layer 30/35 parts (5 tranches)</span>
                  <span className="text-sm font-semibold text-chocolat">{genoises.layer3035} tranches</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 mt-1">
                <span className="text-sm font-bold text-chocolat">Total</span>
                <span className="text-lg font-bold text-bordeaux">{genoises.total} tranches</span>
              </div>
            </div>
          )}
        </div>

        {/* Bloc: Saveurs */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Star size={16} className="text-bordeaux" />
            </div>
            <h2 className="font-semibold text-chocolat">Saveurs de la semaine</h2>
          </div>

          {flavors.length === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-4">Aucune saveur renseignée</p>
          ) : (
            <div className="space-y-1">
              {flavors.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-rose-50 last:border-0">
                  <span className="text-sm text-chocolat-light">{name}</span>
                  <span className="badge bg-rose-100 text-bordeaux">× {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloc: Suppléments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <ShoppingCart size={16} className="text-bordeaux" />
            </div>
            <h2 className="font-semibold text-chocolat">Suppléments à prévoir</h2>
          </div>

          {supplements.length === 0 ? (
            <p className="text-sm text-warmgray-400 text-center py-4">Aucun supplément cette semaine</p>
          ) : (
            <div className="space-y-1">
              {supplements.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-rose-50 last:border-0">
                  <span className="text-sm text-chocolat-light">{name}</span>
                  <span className="badge bg-rose-100 text-bordeaux">× {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bloc: Retraits / Livraisons du jour */}
      <div className="card mt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bordeaux flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            <h2 className="font-semibold text-chocolat">Retraits & Livraisons du jour</h2>
          </div>
          <Link to="/commandes" className="btn-secondary text-xs py-1.5 px-3">
            Toutes les commandes
          </Link>
        </div>

        {todayPickups.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-warmgray-400 text-sm">Aucun retrait ni livraison aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayPickups.map(o => (
              <Link key={o.id} to={`/commandes/${o.id}`}>
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors group">
                  <div className="w-16 text-right flex-shrink-0">
                    <span className="font-bold text-bordeaux text-sm">{o.deliveryTime || '—'}</span>
                  </div>
                  <div className="w-px h-8 bg-rose-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-chocolat text-sm">{o.clientInstagram || o.clientFirstName}</span>
                      <span className={`badge text-xs ${o.deliveryMode === 'livraison' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {o.deliveryMode === 'livraison' ? (
                          <><MapPin size={10} /> Livraison</>
                        ) : (
                          'Retrait'
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-warmgray-400 mt-0.5 truncate">
                      {o.productType === 'bento_cake' ? 'Bento Cake' : o.productType === 'layer_cake' ? 'Layer Cake' : o.productType} · {o.productVariant}
                      {o.shape && o.shape !== 'non_concerne' && ` · ${o.shape === 'coeur' ? 'Cœur' : 'Rond'}`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-warmgray-400 group-hover:text-bordeaux transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
