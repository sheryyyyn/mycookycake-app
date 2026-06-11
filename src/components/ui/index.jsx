import { X, ChevronDown, ClipboardPaste } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getStatusLabel, getStatusColor, getPaymentLabel, getPaymentColor } from '../../utils'
import clsx from 'clsx'

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ children, color = 'bg-rose-100 text-bordeaux border-rose-200', className = '' }) {
  return (
    <span className={clsx('badge border', color, className)}>
      {children}
    </span>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <Badge color={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  )
}

// ── PaymentBadge ──────────────────────────────────────────────────
export function PaymentBadge({ status }) {
  return (
    <Badge color={getPaymentColor(status)}>
      {getPaymentLabel(status)}
    </Badge>
  )
}

// ── ModeBadge ─────────────────────────────────────────────────────
export function ModeBadge({ mode }) {
  const isLivraison = mode === 'livraison'
  return (
    <Badge
      color={isLivraison
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : 'bg-teal-50 text-teal-700 border-teal-200'
      }
    >
      {isLivraison ? '🚗 Livraison' : '🏪 Retrait'}
    </Badge>
  )
}

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: '',
    lg: 'px-5 py-3 text-base',
  }
  return (
    <button
      className={clsx(variants[variant], sizes[size] !== '' ? sizes[size] : '', className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className = '', ...props }) {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-chocolat/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full overflow-hidden', maxWidth)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
          <h3 className="font-playfair font-semibold text-chocolat text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warmgray-400 hover:bg-rose-50 hover:text-bordeaux transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ label, required, hint, className = '', ...props }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="form-label">
          {label}{required && <span className="text-bordeaux ml-0.5">*</span>}
        </label>
      )}
      <input className="form-input" {...props} />
      {hint && <p className="text-xs text-warmgray-400">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────
export function Select({ label, required, hint, children, className = '', ...props }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="form-label">
          {label}{required && <span className="text-bordeaux ml-0.5">*</span>}
        </label>
      )}
      <select className="form-select" {...props}>
        {children}
      </select>
      {hint && <p className="text-xs text-warmgray-400">{hint}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────
export function Textarea({ label, required, hint, rows = 3, className = '', ...props }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="form-label">
          {label}{required && <span className="text-bordeaux ml-0.5">*</span>}
        </label>
      )}
      <textarea className="form-textarea" rows={rows} {...props} />
      {hint && <p className="text-xs text-warmgray-400">{hint}</p>}
    </div>
  )
}

// ── SectionTitle ──────────────────────────────────────────────────
export function SectionTitle({ children, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div>
        <h2 className="font-playfair font-semibold text-chocolat text-xl">{children}</h2>
        {sub && <p className="text-sm text-warmgray-400 mt-0.5">{sub}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({ title, sub, action, back }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3">
      <div>
        {back && <div className="mb-2">{back}</div>}
        <h1 className="font-playfair font-bold text-chocolat text-2xl">{title}</h1>
        {sub && <p className="text-sm text-warmgray-400 mt-1">{sub}</p>}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, accent = false }) {
  return (
    <div className={clsx(
      'card flex items-start gap-4',
      accent && 'border-rose-200 bg-rose-50/30',
    )}>
      <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-warmgray-400 uppercase tracking-wide">{label}</p>
        <p className="font-playfair text-2xl font-bold text-chocolat leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-warmgray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── StatusSelect (inline dropdown) ────────────────────────────────
export function StatusSelect({ current, onChange }) {
  const statuses = ['nouvelle', 'confirmee', 'fini', 'remis', 'annulee']
  return (
    <select
      value={current}
      onChange={e => onChange(e.target.value)}
      className={clsx(
        'text-xs font-semibold rounded-full border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300',
        getStatusColor(current),
      )}
    >
      {statuses.map(s => (
        <option key={s} value={s}>{getStatusLabel(s)}</option>
      ))}
    </select>
  )
}

// ── PhotoGallery ──────────────────────────────────────────────────
function readFileAsDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

export function PhotoGallery({ photos = [], onDelete, onAdd }) {
  const zoneRef = useRef(null)
  const [pasted, setPasted] = useState(false)

  useEffect(() => {
    if (!onAdd) return

    async function handlePaste(e) {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter(item => item.type.startsWith('image/'))
      if (!imageItems.length) return
      e.preventDefault()
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue
        const dataUrl = await readFileAsDataUrl(file)
        // call onAdd with a synthetic event-like object
        onAdd({ target: { files: [file] }, _dataUrl: dataUrl })
      }
      setPasted(true)
      setTimeout(() => setPasted(false), 1500)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [onAdd])

  return (
    <div ref={zoneRef}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative group aspect-square">
            <img
              src={src}
              alt={`Inspiration ${i + 1}`}
              className="w-full h-full object-cover rounded-xl border border-rose-100 cursor-pointer"
              onClick={() => window.open(src, '_blank')}
            />
            {onDelete && (
              <button
                onClick={() => onDelete(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {onAdd && (
          <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            pasted ? 'border-green-400 bg-green-50' : 'border-beige hover:border-rose-300 hover:bg-rose-50'
          }`}>
            <span className="text-2xl text-warmgray-400">+</span>
            <span className="text-xs text-warmgray-400 text-center px-1 leading-tight">
              {pasted ? '✓ Collé !' : 'Ajouter'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onAdd}
            />
          </label>
        )}
      </div>
      {onAdd && (
        <p className="text-xs text-warmgray-400 mt-2 flex items-center gap-1">
          <ClipboardPaste size={12} />
          Vous pouvez aussi coller une image avec Ctrl+V / ⌘+V
        </p>
      )}
      {photos.length === 0 && !onAdd && (
        <p className="text-sm text-warmgray-400 italic">Aucune photo d'inspiration</p>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────
export function EmptyState({ icon = '🎂', title = 'Aucun résultat', sub = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="font-playfair text-lg text-chocolat font-semibold">{title}</p>
      {sub && <p className="text-sm text-warmgray-400 mt-1">{sub}</p>}
    </div>
  )
}
