import { useState, useRef } from 'react'
import { Save, Copy, Check, ExternalLink, AlertCircle, Upload, FileText, CheckCircle2, Download } from 'lucide-react'
import useStore from '../store'
import { parseCSV, convertNotionOrders } from '../utils/notionImport'

export default function Settings() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const bulkImport = useStore(s => s.bulkImport)
  const orders = useStore(s => s.orders)
  const clients = useStore(s => s.clients)
  const catalog = useStore(s => s.catalog)

  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Notion import state
  const fileInputRef = useRef(null)
  const [importPreview, setImportPreview] = useState(null) // { orders, clients }
  const [importDone, setImportDone] = useState(false)
  const [importError, setImportError] = useState('')

  const formUrl = window.location.origin + '/formulaire'

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSave() {
    updateSettings({
      businessName: form.businessName,
      formIntro: form.formIntro,
      pickupInfo: form.pickupInfo,
      conditions: form.conditions,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportError('')
    setImportPreview(null)
    setImportDone(false)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target.result)
        const result = convertNotionOrders(rows)
        if (result.orders.length === 0) {
          setImportError('Aucune commande reconnue dans ce fichier. Vérifiez le format CSV Notion.')
        } else {
          setImportPreview(result)
        }
      } catch (err) {
        setImportError(`Erreur lors de la lecture : ${err.message}`)
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  function confirmImport() {
    if (!importPreview) return
    bulkImport(importPreview)
    setImportDone(true)
    setImportPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-chocolat">Paramètres</h1>
        <p className="text-sm text-warmgray-400 mt-0.5">Configuration de votre espace de gestion</p>
      </div>

      <div className="space-y-5">
        {/* General */}
        <div className="card">
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Informations générales</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="form-label">Nom de l'activité</label>
              <input className="form-input" value={form.businessName} onChange={e => setField('businessName', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Form link */}
        <div className="card">
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-4">Lien de formulaire client</h2>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 mb-4">
            <p className="text-xs text-warmgray-500 mb-2 font-medium">URL du formulaire (à copier et envoyer à vos clientes) :</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white rounded-lg px-3 py-2 border border-rose-200 text-bordeaux truncate">{formUrl}</code>
              <button onClick={copyLink} className="btn-secondary gap-1 text-sm flex-shrink-0">
                {copied ? <><Check size={13} /> Copié !</> : <><Copy size={13} /> Copier</>}
              </button>
              <a href="/formulaire" target="_blank" rel="noopener noreferrer" className="btn-ghost gap-1 text-sm flex-shrink-0">
                <ExternalLink size={13} /> Voir
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="form-label">Introduction du formulaire</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.formIntro}
                onChange={e => setField('formIntro', e.target.value)}
                placeholder="Texte affiché en haut du formulaire client..."
              />
            </div>
            <div className="space-y-1">
              <label className="form-label">Conditions / note d'information</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={form.conditions}
                onChange={e => setField('conditions', e.target.value)}
                placeholder="Ex: Ce formulaire ne confirme pas automatiquement une disponibilité..."
              />
            </div>
            <div className="space-y-1">
              <label className="form-label">Informations retrait</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={form.pickupInfo}
                onChange={e => setField('pickupInfo', e.target.value)}
                placeholder="Ex: Retrait possible du vendredi au dimanche sur rendez-vous..."
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary gap-2">
            {saved ? <><Check size={14} /> Enregistré !</> : <><Save size={14} /> Enregistrer</>}
          </button>
        </div>

        {/* Notion import */}
        <div className="card border-blue-100">
          <h2 className="font-playfair font-semibold text-chocolat text-lg mb-1">Importer depuis Notion</h2>
          <p className="text-xs text-warmgray-400 mb-4">Importez vos commandes exportées depuis Notion (fichier CSV). Les commandes existantes ne sont pas supprimées — l'import est cumulatif.</p>

          {importDone && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-700 mb-4">
              <CheckCircle2 size={15} />
              Import terminé avec succès !
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 mb-4">
              <AlertCircle size={15} />
              {importError}
            </div>
          )}

          {!importPreview ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary gap-2"
              >
                <Upload size={14} />
                Choisir un fichier CSV Notion
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                  <FileText size={14} />
                  Aperçu de l'import
                </div>
                <p className="text-sm text-blue-700">
                  <span className="font-bold">{importPreview.orders.length}</span> commandes détectées
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-bold">{importPreview.clients.length}</span> clientes uniques
                </p>
                <p className="text-xs text-blue-500 mt-2 italic">
                  Les photos Notion (chemins locaux) ne peuvent pas être importées — elles seront notées dans les commentaires internes.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmImport} className="btn-primary gap-2">
                  <Check size={14} /> Confirmer l'import
                </button>
                <button onClick={() => { setImportPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="btn-ghost">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="card border-red-100">
          <h2 className="font-playfair font-semibold text-red-700 text-lg mb-2">Zone dangereuse</h2>
          <p className="text-xs text-warmgray-400 mb-3">Ces actions sont irréversibles.</p>
          <button
            onClick={() => {
              if (window.confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) {
                localStorage.removeItem('mycookycake-v1')
                window.location.reload()
              }
            }}
            className="btn-danger text-sm"
          >
            Réinitialiser toutes les données
          </button>
        </div>
      </div>
    </div>
  )
}
