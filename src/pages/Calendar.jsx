import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, addWeeks, subWeeks, format, isSameMonth,
  isSameDay, isToday, parseISO, getHours,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import useStore from '../store'
import { getStatusColor, getProductLabel } from '../utils'
import { StatusBadge } from '../components/ui'

const VIEWS = ['Mois', 'Semaine', 'Jour']

export default function Calendar() {
  const orders = useStore(s => s.orders)
  const navigate = useNavigate()
  const [view, setView] = useState('Mois')
  const [currentDate, setCurrentDate] = useState(new Date())

  const validOrders = orders.filter(o => o.deliveryDate && o.status !== 'annulee')

  function getOrdersForDay(date) {
    return validOrders.filter(o => isSameDay(parseISO(o.deliveryDate), date))
      .sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''))
  }

  function prev() {
    if (view === 'Mois') setCurrentDate(d => subMonths(d, 1))
    else if (view === 'Semaine') setCurrentDate(d => subWeeks(d, 1))
    else setCurrentDate(d => addDays(d, -1))
  }
  function next() {
    if (view === 'Mois') setCurrentDate(d => addMonths(d, 1))
    else if (view === 'Semaine') setCurrentDate(d => addWeeks(d, 1))
    else setCurrentDate(d => addDays(d, 1))
  }

  const headerLabel = useMemo(() => {
    if (view === 'Mois') return format(currentDate, 'MMMM yyyy', { locale: fr })
    if (view === 'Semaine') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(start, 'd MMM', { locale: fr })} – ${format(end, 'd MMM yyyy', { locale: fr })}`
    }
    return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
  }, [currentDate, view])

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Calendrier</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-beige overflow-hidden bg-white">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === v ? 'bg-rose-100 text-bordeaux' : 'text-warmgray-400 hover:bg-rose-50'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="btn-ghost text-sm">
            Aujourd'hui
          </button>
          <div className="flex gap-1">
            <button onClick={prev} className="p-2 rounded-xl border border-beige bg-white text-warmgray-400 hover:text-bordeaux hover:border-bordeaux transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="p-2 rounded-xl border border-beige bg-white text-warmgray-400 hover:text-bordeaux hover:border-bordeaux transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-card overflow-hidden">
        {/* Month label */}
        <div className="px-5 py-3 border-b border-rose-50">
          <p className="font-playfair font-semibold text-chocolat capitalize text-lg">{headerLabel}</p>
        </div>

        {view === 'Mois' && <MonthView date={currentDate} getOrdersForDay={getOrdersForDay} navigate={navigate} />}
        {view === 'Semaine' && <WeekView date={currentDate} getOrdersForDay={getOrdersForDay} navigate={navigate} />}
        {view === 'Jour' && <DayView date={currentDate} getOrdersForDay={getOrdersForDay} navigate={navigate} />}
      </div>
    </div>
  )
}

function MonthView({ date, getOrdersForDay, navigate }) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  const days = []
  let d = start
  while (d <= end) { days.push(d); d = addDays(d, 1) }

  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-rose-50">
        {DAY_LABELS.map(dl => (
          <div key={dl} className="py-2 text-center text-xs font-semibold text-warmgray-400 uppercase">{dl}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayOrders = getOrdersForDay(day)
          const isCurrentMonth = isSameMonth(day, date)
          const today = isToday(day)
          return (
            <div
              key={i}
              className={`min-h-[90px] border-b border-r border-rose-50 p-1.5 ${!isCurrentMonth ? 'bg-beige-light/30' : ''} ${today ? 'bg-rose-50/50' : ''}`}
            >
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${today ? 'bg-bordeaux text-white' : isCurrentMonth ? 'text-chocolat' : 'text-warmgray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayOrders.slice(0, 3).map(o => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/commandes/${o.id}`)}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded font-medium truncate transition-opacity hover:opacity-80 ${getStatusColor(o.status).replace('border-', '')}`}
                  >
                    {o.deliveryTime && <span className="opacity-70">{o.deliveryTime} </span>}
                    {o.clientFirstName}
                  </button>
                ))}
                {dayOrders.length > 3 && (
                  <p className="text-xs text-warmgray-400 px-1">+{dayOrders.length - 3}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ date, getOrdersForDay, navigate }) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[600px]">
        {days.map((day, i) => {
          const dayOrders = getOrdersForDay(day)
          const today = isToday(day)
          return (
            <div key={i} className="border-r border-rose-50 last:border-r-0">
              <div className={`py-3 text-center border-b border-rose-50 ${today ? 'bg-rose-50' : ''}`}>
                <p className="text-xs text-warmgray-400 font-medium">{format(day, 'EEE', { locale: fr })}</p>
                <p className={`text-lg font-bold mt-0.5 ${today ? 'text-bordeaux' : 'text-chocolat'}`}>{format(day, 'd')}</p>
              </div>
              <div className="p-2 space-y-1.5 min-h-[200px]">
                {dayOrders.map(o => (
                  <button key={o.id} onClick={() => navigate(`/commandes/${o.id}`)}
                    className={`w-full text-left p-2 rounded-xl text-xs border transition-opacity hover:opacity-80 ${getStatusColor(o.status)}`}>
                    <p className="font-semibold">{o.clientFirstName}</p>
                    <p className="opacity-80">{o.deliveryTime} · {getProductLabel(o.productType)}</p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ date, getOrdersForDay, navigate }) {
  const dayOrders = getOrdersForDay(date)
  return (
    <div className="p-5">
      {dayOrders.length === 0 ? (
        <div className="text-center py-12">
          <CalIcon size={32} className="text-warmgray-400 mx-auto mb-2" />
          <p className="text-warmgray-400">Aucune commande ce jour</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayOrders.map(o => (
            <button
              key={o.id}
              onClick={() => navigate(`/commandes/${o.id}`)}
              className="w-full text-left card hover:border-rose-300 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-chocolat">{o.clientFirstName} {o.clientLastName}</p>
                  <p className="text-xs text-rose-500">{o.clientInstagram}</p>
                  <p className="text-sm text-warmgray-500 mt-1">{getProductLabel(o.productType)} · {o.productVariant}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">⏰ {o.deliveryTime} · {o.deliveryMode === 'livraison' ? `Livraison — ${o.deliveryCity}` : 'Retrait'}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
