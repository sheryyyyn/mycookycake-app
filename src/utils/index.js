import { format, addDays, isToday, isTomorrow, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
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
