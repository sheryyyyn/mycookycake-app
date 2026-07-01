import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { computePaymentStatus } from '../utils'

const DEFAULT_SETTINGS = {
  businessName: 'Mycookycake',
  adminPassword: 'mycookycake2024',
  formIntro: "Merci de remplir ce formulaire après notre échange. Il me permettra d'enregistrer tous les détails de ta commande.",
  pickupInfo: 'Retrait possible du vendredi au dimanche sur rendez-vous.',
  conditions: "Ce formulaire ne confirme pas automatiquement une disponibilité. Il sert à récapituler les informations validées ensemble.",
  logoUrl: '',
}

const DEFAULT_CATALOG = { products: [], flavors: [], supplements: [] }

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function saveAppData(key, value) {
  await supabase.from('app_data').upsert({ key, value })
}

// ── Store ─────────────────────────────────────────────────────────────────────

const useStore = create((set, get) => ({

  // ── Loading ───────────────────────────────────────────────────────────────
  loading: true,
  connectionError: false,

  async loadData() {
    set({ connectionError: false })
    let ordersRes, clientsRes, catalogRes, settingsRes
    try {
      ;[ordersRes, clientsRes, catalogRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('data').order('created_at', { ascending: false }),
        supabase.from('clients').select('data'),
        supabase.from('app_data').select('value').eq('key', 'catalog').maybeSingle(),
        supabase.from('app_data').select('value').eq('key', 'settings').maybeSingle(),
      ])
    } catch {
      set({ loading: false, connectionError: true })
      return
    }

    if (ordersRes.error || clientsRes.error || catalogRes.error || settingsRes.error) {
      set({ loading: false, connectionError: true })
      return
    }

    const remoteOrders = ordersRes.data?.map(r => r.data) ?? []
    const remoteClients = clientsRes.data?.map(r => r.data) ?? []
    const remoteCatalog = catalogRes.data?.value ?? null
    const remoteSettings = settingsRes.data?.value ?? null

    // ── Migration depuis localStorage (une seule fois) ─────────────────────
    if (remoteOrders.length === 0 && remoteClients.length === 0) {
      try {
        const raw = localStorage.getItem('mycookycake-v1')
        if (raw) {
          const local = JSON.parse(raw)?.state ?? {}
          const localOrders = local.orders ?? []
          const localClients = local.clients ?? []
          const localCatalog = local.catalog ?? null
          const localSettings = local.settings ?? null

          if (localOrders.length > 0) {
            await supabase.from('orders').upsert(localOrders.map(o => ({ id: o.id, data: o })))
          }
          if (localClients.length > 0) {
            await supabase.from('clients').upsert(localClients.map(c => ({ id: c.id, data: c })))
          }
          if (localCatalog) await saveAppData('catalog', localCatalog)
          if (localSettings) await saveAppData('settings', localSettings)

          set({
            orders: localOrders,
            clients: localClients,
            catalog: localCatalog ?? DEFAULT_CATALOG,
            settings: { ...DEFAULT_SETTINGS, ...(localSettings ?? {}) },
            loading: false,
          })
          return
        }
      } catch (_) {}
    }

    set({
      orders: remoteOrders,
      clients: remoteClients,
      catalog: remoteCatalog ?? DEFAULT_CATALOG,
      settings: { ...DEFAULT_SETTINGS, ...(remoteSettings ?? {}) },
      loading: false,
    })
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: [],

  async addOrder(order) {
    set(s => ({ orders: [order, ...s.orders] }))
    await supabase.from('orders').upsert({ id: order.id, data: order })
  },

  async updateOrder(id, updates) {
    set(s => ({
      orders: s.orders.map(o =>
        o.id === id
          ? {
              ...o,
              ...updates,
              paymentStatus: computePaymentStatus(
                updates.amountTotal ?? o.amountTotal,
                updates.amountPaid ?? o.amountPaid,
              ),
            }
          : o,
      ),
    }))
    const updated = get().orders.find(o => o.id === id)
    if (updated) await supabase.from('orders').upsert({ id, data: updated })
  },

  async deleteOrder(id) {
    set(s => ({ orders: s.orders.filter(o => o.id !== id) }))
    await supabase.from('orders').delete().eq('id', id)
  },

  async bulkImport({ orders: newOrders, clients: newClients }) {
    const { orders, clients } = get()
    const existingOrderIds = new Set(orders.map(o => o.id))
    const existingInsta = new Set(clients.map(c => c.instagram?.toLowerCase()).filter(Boolean))
    const filteredOrders = newOrders.filter(o => !existingOrderIds.has(o.id))
    const filteredClients = newClients.filter(c => !existingInsta.has(c.instagram?.toLowerCase()))

    set({
      orders: [...filteredOrders, ...orders],
      clients: [...filteredClients, ...clients],
    })

    if (filteredOrders.length > 0) {
      await supabase.from('orders').upsert(filteredOrders.map(o => ({ id: o.id, data: o })))
    }
    if (filteredClients.length > 0) {
      await supabase.from('clients').upsert(filteredClients.map(c => ({ id: c.id, data: c })))
    }
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  clients: [],

  async addClient(client) {
    set(s => ({ clients: [client, ...s.clients] }))
    await supabase.from('clients').upsert({ id: client.id, data: client })
  },

  async updateClient(id, updates) {
    set(s => ({
      clients: s.clients.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }))
    const updated = get().clients.find(c => c.id === id)
    if (updated) await supabase.from('clients').upsert({ id, data: updated })
  },

  async deleteClient(id) {
    set(s => ({ clients: s.clients.filter(c => c.id !== id) }))
    await supabase.from('clients').delete().eq('id', id)
  },

  // ── Catalog ───────────────────────────────────────────────────────────────
  catalog: DEFAULT_CATALOG,

  async updateCatalogProduct(id, updates) {
    set(s => ({
      catalog: {
        ...s.catalog,
        products: s.catalog.products.map(p => (p.id === id ? { ...p, ...updates } : p)),
      },
    }))
    await saveAppData('catalog', get().catalog)
  },

  async addCatalogProduct(product) {
    set(s => ({ catalog: { ...s.catalog, products: [...s.catalog.products, product] } }))
    await saveAppData('catalog', get().catalog)
  },

  async deleteCatalogProduct(id) {
    set(s => ({ catalog: { ...s.catalog, products: s.catalog.products.filter(p => p.id !== id) } }))
    await saveAppData('catalog', get().catalog)
  },

  async updateFlavor(id, updates) {
    set(s => ({
      catalog: {
        ...s.catalog,
        flavors: s.catalog.flavors.map(f => (f.id === id ? { ...f, ...updates } : f)),
      },
    }))
    await saveAppData('catalog', get().catalog)
  },

  async addFlavor(flavor) {
    set(s => ({ catalog: { ...s.catalog, flavors: [...s.catalog.flavors, flavor] } }))
    await saveAppData('catalog', get().catalog)
  },

  async deleteFlavor(id) {
    set(s => ({ catalog: { ...s.catalog, flavors: s.catalog.flavors.filter(f => f.id !== id) } }))
    await saveAppData('catalog', get().catalog)
  },

  async updateSupplement(id, updates) {
    set(s => ({
      catalog: {
        ...s.catalog,
        supplements: s.catalog.supplements.map(x => (x.id === id ? { ...x, ...updates } : x)),
      },
    }))
    await saveAppData('catalog', get().catalog)
  },

  async addSupplement(supp) {
    set(s => ({ catalog: { ...s.catalog, supplements: [...s.catalog.supplements, supp] } }))
    await saveAppData('catalog', get().catalog)
  },

  async deleteSupplement(id) {
    set(s => ({ catalog: { ...s.catalog, supplements: s.catalog.supplements.filter(x => x.id !== id) } }))
    await saveAppData('catalog', get().catalog)
  },

  // ── Shopping ──────────────────────────────────────────────────────────────
  shoppingChecked: {},

  toggleShoppingItem(key) {
    set(s => ({
      shoppingChecked: { ...s.shoppingChecked, [key]: !s.shoppingChecked[key] },
    }))
  },

  clearShoppingChecked() {
    set({ shoppingChecked: {} })
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: DEFAULT_SETTINGS,

  async updateSettings(updates) {
    set(s => ({ settings: { ...s.settings, ...updates } }))
    await saveAppData('settings', get().settings)
  },
}))

export default useStore
