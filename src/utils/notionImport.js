import { genId, computePaymentStatus } from './index'

// ── French month parser ───────────────────────────────────────────
const FR_MONTHS = {
  janvier: '01', février: '02', fevrier: '02', mars: '03',
  avril: '04', mai: '05', juin: '06', juillet: '07',
  août: '08', aout: '08', septembre: '09', octobre: '10',
  novembre: '11', décembre: '12', decembre: '12',
}

function parseFrenchDate(str) {
  if (!str?.trim()) return ''
  const clean = str.replace(/\(UTC[^)]*\)/g, '').trim()
  const m = clean.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (!m) return ''
  const month = FR_MONTHS[m[2].toLowerCase()]
  if (!month) return ''
  return `${m[3]}-${month}-${m[1].padStart(2, '0')}`
}

// ── Extract time from date string or heure field ──────────────────
function parseTime(heureStr) {
  if (!heureStr) return ''
  // "15h00" → "15:00", "15h" → "15:00", "15:00" → "15:00"
  const clean = heureStr.trim().split(' ')[0].split('/')[0].split('–')[0].trim()
  const m1 = clean.match(/^(\d{1,2})h(\d{2})?$/)
  if (m1) return `${m1[1].padStart(2, '0')}:${m1[2] || '00'}`
  const m2 = clean.match(/^(\d{1,2}):(\d{2})$/)
  if (m2) return `${m2[1].padStart(2, '0')}:${m2[2]}`
  return ''
}

// ── Amount parser: "30,00 €" → 30 ────────────────────────────────
function parseAmount(str) {
  if (!str) return 0
  const cleaned = str.replace(/[^\d,.  ]/g, '').replace(',', '.').replace(/\s/g, '')
  return Math.round(parseFloat(cleaned) || 0)
}

// ── Product type detection ────────────────────────────────────────
function detectProductType(produits, nom) {
  const src = ((produits || '') + ' ' + (nom || '')).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
  if (src.includes('layer cup')) return 'layer_cup'
  if (src.includes('bowl cake') || src.includes('bento bowl') || /bowl\b/.test(src)) return 'bowl_cake'
  if (src.includes('piece montee') || src.includes('pièce montée') || (src.includes('pi') && src.includes('montee'))) return 'piece_montee'
  if (src.includes('layer cake') || /\blayer\b/.test(src)) return 'layer_cake'
  if (src.includes('cupcake') || src.includes('cup ')) return 'cupcakes'
  if (src.includes('verrine') || src.includes('verine')) return 'verrines'
  if (src.includes('bento')) return 'bento_cake'
  return null // will be filtered out
}

function extractVariant(nom) {
  // e.g. "Bento 6 parts" → "6 parts"
  // "Layer 20-25 parts" → "20-25 parts"
  // "Pièce montée 40 parts" → "40 parts"
  const m = nom.match(/(\d+(?:[/-]\d+)?\s*(?:parts?|pièces?|pieces?|pi[eè]ces?))/i)
  if (m) return m[1].replace(/ +/, ' ')
  const m2 = nom.match(/(\d+)\s+parts?/i)
  if (m2) return `${m2[1]} parts`
  return ''
}

function mapStatus(s) {
  if (!s) return 'nouvelle'
  const l = s.toLowerCase().trim()
  if (l.includes('remis')) return 'remis'
  if (l === 'fini') return 'fini'
  if (l.includes('montage') || l.includes('lissage')) return 'confirmee'
  if (l === 'à faire') return 'nouvelle'
  return 'nouvelle'
}

function mapShape(forme) {
  if (!forme) return 'non_concerne'
  const l = forme.toLowerCase()
  if (l.includes('ur') || l.includes('eur') || l.includes('heart')) return 'coeur'
  if (l === 'rond') return 'rond'
  if (l) return 'autre'
  return 'non_concerne'
}

function mapDeliveryMode(adresse) {
  return adresse?.trim() ? 'livraison' : 'retrait'
}

// ── Extract address parts ─────────────────────────────────────────
function parseAddress(adresse) {
  if (!adresse?.trim()) return { address: '', zip: '', city: '' }
  // e.g. "88 Rue des Champs du Four, 78700 Conflans-Sainte-Honorine, France"
  const parts = adresse.split(',').map(s => s.trim())
  const zipCityMatch = parts.find(p => /\d{5}/.test(p))
  const zipCity = zipCityMatch?.match(/(\d{5})\s+(.+)/)
  return {
    address: parts[0] || adresse,
    zip: zipCity?.[1] || '',
    city: zipCity?.[2]?.replace(/,?\s*France\s*$/i, '').trim() || '',
  }
}

// Flavors: "Framboise chocolat blanc, Nutella Kinder" → main + secondary
function parseFlavors(saveur) {
  if (!saveur) return { main: '', secondary: '' }
  const parts = saveur.split(',').map(s => s.trim()).filter(Boolean)
  return { main: parts[0] || '', secondary: parts[1] || '' }
}

// Supplements: "Noeuds-papillon, Topper" → array
function parseSupplements(suppl) {
  if (!suppl) return []
  return suppl.split(',').map(s => s.trim()).filter(Boolean)
}

// ── Detect non-order rows ─────────────────────────────────────────
const NON_ORDER_KEYWORDS = [
  'rdv', 'blanchiment', 'cheveux', 'vente flash', 'vf 2 cup',
  'vf cup', 'sans titre', '6 cupcakes lilou', 'cupcakes 12',
  'layer 10 parts + 15', '12 cupcakes ', '24 cupcakes',
]

function isNonOrderRow(nom, pseudo) {
  if (!nom?.trim()) return true
  const l = nom.toLowerCase()
  if (NON_ORDER_KEYWORDS.some(k => l.startsWith(k))) return true
  // no product type detected and no pseudo → likely not an order
  return false
}

// ── CSV parser (handles quoted fields with commas) ────────────────
export function parseCSV(text) {
  // Strip BOM
  const clean = text.replace(/^﻿/, '')
  const lines = clean.split(/\r?\n/)
  if (lines.length < 2) return []

  function parseLine(line) {
    const result = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        result.push(cur)
        cur = ''
      } else {
        cur += c
      }
    }
    result.push(cur)
    return result
  }

  const headers = parseLine(lines[0]).map(h =>
    h.trim().replace(/﻿/g, '').replace(/[""]/g, '')
  )

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = parseLine(lines[i])
    const obj = {}
    headers.forEach((h, j) => { obj[h] = (cols[j] || '').trim() })
    rows.push(obj)
  }
  return rows
}

// ── Main converter ────────────────────────────────────────────────
export function convertNotionOrders(rows) {
  const orders = []
  const clientMap = new Map() // pseudo → client

  for (const row of rows) {
    const nom = row['Nom'] || row['Name'] || ''
    const produits = row['Produits'] || ''
    const pseudo = row['Pseudo'] || ''
    const date = row['Date'] || ''
    const heure = row['Heure de remise'] || ''
    const forme = row['Forme'] || ''
    const saveur = row['Saveur'] || ''
    const suppl = row['Suppléments'] || row['Supplements'] || ''
    const statut = row['Statut'] || ''
    const prixTotal = row['Prix Total'] || ''
    const acompte = row['Acompte'] || ''
    const allergie = row['Allergie et contraintes'] || ''
    const commentaires = row['Commentaires '] || row['Commentaires'] || ''
    const message = row['Message'] || ''
    const adresse = row['Adresse livraison (Optionnel)'] || row['Adresse livraison'] || ''
    const email = row['Email'] || ''
    const tel = row['Téléphone'] || row['Telephone'] || ''
    const nbParts = row['Nombre de parts'] || ''
    const photo = row['Photo'] || ''

    if (isNonOrderRow(nom, pseudo)) continue

    const productType = detectProductType(produits, nom)
    if (!productType) continue // skip rows with no recognisable product

    const deliveryDate = parseFrenchDate(date)
    const deliveryTime = parseTime(heure)
    const { main: flavorMain, secondary: flavorSecondary } = parseFlavors(saveur)
    const supplements = parseSupplements(suppl)
    const shape = mapShape(forme)
    const status = mapStatus(statut)
    const amountTotal = parseAmount(prixTotal)
    const amountPaid = parseAmount(acompte)
    const deliveryMode = mapDeliveryMode(adresse)
    const { address, zip, city } = parseAddress(adresse)
    const productVariant = extractVariant(nom) || nbParts

    // Photos stored as paths in notion – we keep them as notes since base64 not available
    const notesInternal = photo ? `Photo Notion : ${photo}` : ''

    const order = {
      id: genId(),
      createdAt: deliveryDate
        ? new Date(deliveryDate).toISOString()
        : new Date().toISOString(),
      status,
      clientFirstName: pseudo ? pseudo.replace(/^@/, '').split('_')[0] : '',
      clientLastName: '',
      clientInstagram: pseudo.startsWith('@') ? pseudo : pseudo ? `@${pseudo}` : '',
      clientPhone: tel,
      clientEmail: email,
      productType,
      productVariant,
      quantity: parseInt(nbParts) || 1,
      shape,
      flavorMain,
      flavorSecondary,
      supplements,
      theme: '',
      colors: '',
      messageOnCake: message,
      allergies: allergie,
      notesClient: commentaires,
      notesInternal,
      deliveryMode,
      deliveryDate,
      deliveryTime,
      deliveryAddress: address,
      deliveryZip: zip,
      deliveryCity: city,
      deliveryNote: '',
      amountTotal,
      amountPaid,
      paymentStatus: computePaymentStatus(amountTotal, amountPaid),
      photos: [],
    }

    orders.push(order)

    // Build client map
    if (pseudo && !clientMap.has(pseudo)) {
      clientMap.set(pseudo, {
        id: genId(),
        firstName: pseudo.replace(/^@/, '').split(/[._]/)[0],
        lastName: '',
        instagram: pseudo.startsWith('@') ? pseudo : `@${pseudo}`,
        phone: tel,
        email,
        notes: allergie ? `Allergie : ${allergie}` : '',
        createdAt: new Date().toISOString(),
      })
    }
  }

  return { orders, clients: [...clientMap.values()] }
}
