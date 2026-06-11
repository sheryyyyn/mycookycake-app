import { format, addDays, isToday, isTomorrow, differenceInCalendarDays, parseISO, startOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

export function genId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'd MMMM yyyy', { locale: fr })
  } catch { return dateStr }
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'dd/MM/yy', { locale: fr })
  } catch { return dateStr }
}

export function formatDayFull(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, 'EEEE d MMMM yyyy', { locale: fr })
  } catch { return dateStr }
}

export function formatDateTime(dateStr, time) {
  if (!dateStr) return '—'
  const d = formatDate(dateStr)
  return time ? `${d} à ${time}` : d
}

export function todayUpperCase() {
  return format(new Date(), 'EEEE d MMMM yyyy', { locale: fr }).toUpperCase()
}

export const STATUS_CONFIG = {
  nouvelle:   { label: 'Nouvelle commande', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmee:  { label: 'Confirmée',          color: 'bg-amber-50 text-amber-700 border-amber-200' },
  fini:       { label: 'Fini',               color: 'bg-violet-50 text-violet-700 border-violet-200' },
  remis:      { label: 'Remis',              color: 'bg-green-50 text-green-700 border-green-200' },
  annulee:    { label: 'Annulée',            color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export function getStatusLabel(s) {
  return STATUS_CONFIG[s]?.label ?? s
}

export function getStatusColor(s) {
  return STATUS_CONFIG[s]?.color ?? 'bg-gray-100 text-gray-500 border-gray-200'
}

export const PAYMENT_CONFIG = {
  non_paye: { label: 'Non payé',           color: 'bg-red-50 text-red-600 border-red-200' },
  partiel:  { label: 'Part. payé',         color: 'bg-orange-50 text-orange-600 border-orange-200' },
  paye:     { label: 'Payé',               color: 'bg-green-50 text-green-700 border-green-200' },
}

export function getPaymentLabel(s) {
  return PAYMENT_CONFIG[s]?.label ?? s
}

export function getPaymentColor(s) {
  return PAYMENT_CONFIG[s]?.color ?? 'bg-gray-100 text-gray-500'
}

export function computePaymentStatus(total, paid) {
  const t = Number(total) || 0
  const p = Number(paid) || 0
  if (p <= 0) return 'non_paye'
  if (p >= t) return 'paye'
  return 'partiel'
}

export function getUpcomingOrders(orders) {
  const now = startOfDay(new Date())
  const limit = addDays(now, 7)
  return orders
    .filter(o => {
      if (!o.deliveryDate) return false
      if (o.status === 'remis' || o.status === 'annulee') return false
      const d = parseISO(o.deliveryDate)
      return d >= now && d <= limit
    })
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
}

export function getOrdersIn3Days(orders) {
  const now = startOfDay(new Date())
  const limit = addDays(now, 3)
  return orders.filter(o => {
    if (!o.deliveryDate) return false
    if (o.status === 'remis' || o.status === 'annulee') return false
    const d = parseISO(o.deliveryDate)
    return d >= now && d <= limit
  })
}

export function getTodayOrders(orders) {
  return orders.filter(o => {
    if (!o.deliveryDate) return false
    if (o.status === 'remis' || o.status === 'annulee') return false
    return isToday(parseISO(o.deliveryDate))
  })
}

export function getTomorrowOrders(orders) {
  return orders.filter(o => {
    if (!o.deliveryDate) return false
    if (o.status === 'remis' || o.status === 'annulee') return false
    return isTomorrow(parseISO(o.deliveryDate))
  })
}

export function getWeekOrders(orders) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  return orders.filter(o => {
    if (!o.deliveryDate) return false
    if (o.status === 'annulee') return false
    const d = parseISO(o.deliveryDate)
    return d >= weekStart && d <= weekEnd
  }).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
}

// Returns genoise slices needed per order (0 if not applicable)
export function getGenoiseCount(order) {
  if (order.productType === 'bento_cake') return 2
  if (order.productType === 'layer_cake') {
    const v = order.productVariant || ''
    if (v.includes('10')) return 3
    if (v.includes('15')) return 4
    if (v.includes('20') || v.includes('25')) return 5
    if (v.includes('30') || v.includes('35')) return 5
  }
  return 0
}

// Aggregate production summary for a list of orders
export function aggregateProduction(orders) {
  const bentoByVariantShape = {} // "4 parts|coeur" → count
  const layerByVariantShape = {}
  let cupcakesQty = 0
  let layerCupQty = 0

  for (const o of orders) {
    if (o.productType === 'bento_cake') {
      const key = `${o.productVariant || '?'}|${o.shape || 'rond'}`
      bentoByVariantShape[key] = (bentoByVariantShape[key] || 0) + 1
    } else if (o.productType === 'layer_cake') {
      const key = `${o.productVariant || '?'}|${o.shape || 'rond'}`
      layerByVariantShape[key] = (layerByVariantShape[key] || 0) + 1
    } else if (o.productType === 'cupcakes') {
      cupcakesQty += Number(o.quantity) || 0
    } else if (o.productType === 'layer_cup') {
      layerCupQty += Number(o.quantity) || 1
    }
  }

  return { bentoByVariantShape, layerByVariantShape, cupcakesQty, layerCupQty }
}

// Aggregate genoise counts grouped by (type, variant, shape)
// Returns { rows: [{ label, slicesEach, count, total }], total }
export function aggregateGenoises(orders) {
  const map = {} // key → { label, slicesEach, count }

  for (const o of orders) {
    let slicesEach = 0
    let sizeLabel = ''

    if (o.productType === 'bento_cake') {
      slicesEach = 2
      sizeLabel = o.productVariant ? o.productVariant : ''
    } else if (o.productType === 'layer_cup') {
      slicesEach = 2
      sizeLabel = ''
    } else if (o.productType === 'layer_cake') {
      const v = o.productVariant || ''
      if (v.includes('10'))       { slicesEach = 3; sizeLabel = '10 parts' }
      else if (v.includes('15'))  { slicesEach = 4; sizeLabel = '15 parts' }
      else if (v.includes('20') || v.includes('25')) { slicesEach = 5; sizeLabel = '20-25 parts' }
      else if (v.includes('30') || v.includes('35')) { slicesEach = 5; sizeLabel = '30-35 parts' }
      else { slicesEach = 0 }
    }

    if (slicesEach === 0) continue

    const shapeRaw = o.productType === 'layer_cup' ? 'rond' : (o.shape || 'rond')
    const shapeLabel = shapeRaw === 'coeur' ? 'Cœur' : 'Rond'
    const typeLabel = o.productType === 'bento_cake' ? 'Bento Cake' : o.productType === 'layer_cup' ? 'Layer Cup' : 'Layer Cake'

    const parts = [typeLabel]
    if (sizeLabel) parts.push(sizeLabel)
    parts.push(shapeLabel)
    const label = parts.join(' · ')

    const qty = o.productType === 'layer_cup' ? (Number(o.quantity) || 1) : 1
    const key = `${o.productType}|${sizeLabel}|${shapeRaw}`
    if (!map[key]) map[key] = { label, slicesEach, count: 0 }
    map[key].count += qty
  }

  const rows = Object.values(map)
    .map(r => ({ ...r, total: r.slicesEach * r.count }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const total = rows.reduce((s, r) => s + r.total, 0)
  return { rows, total }
}

// Aggregate flavors from orders
export function aggregateFlavors(orders) {
  const counts = {}
  for (const o of orders) {
    const f = o.flavorMain?.trim()
    if (f) counts[f] = (counts[f] || 0) + 1
    const f2 = o.flavorSecondary?.trim()
    if (f2) counts[f2] = (counts[f2] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

// Aggregate supplements from orders
export function aggregateSupplements(orders) {
  const counts = {}
  for (const o of orders) {
    for (const s of o.supplements || []) {
      counts[s] = (counts[s] || 0) + 1
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

// Orders due today, sorted by time
export function getTodayPickups(orders) {
  return orders
    .filter(o => {
      if (!o.deliveryDate) return false
      if (o.status === 'annulee') return false
      return isToday(parseISO(o.deliveryDate))
    })
    .sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''))
}

export function getLateOrders(orders) {
  const now = startOfDay(new Date())
  return orders.filter(o => {
    if (!o.deliveryDate) return false
    if (o.status === 'remis' || o.status === 'annulee') return false
    return parseISO(o.deliveryDate) < now
  })
}

export const PRODUCT_LABELS = {
  bento_cake:     'Bento Cake',
  layer_cake:     'Layer Cake',
  cupcakes:       'Cupcakes',
  verrines:       'Verrines',
  bowl_cake:      'Bowl Cake',
  layer_cup:      'Layer Cup',
  piece_montee:   'Pièce montée',
  box:            'Box événementielle',
  autre:          'Autre',
}

export function getProductLabel(key) {
  return PRODUCT_LABELS[key] ?? key
}

export function formatAmount(n) {
  const v = Number(n) || 0
  return v.toFixed(2).replace('.', ',') + ' €'
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  return differenceInCalendarDays(parseISO(dateStr), startOfDay(new Date()))
}
