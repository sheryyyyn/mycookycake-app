import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedOrders, seedClients, seedCatalog } from '../data/seed'
import { computePaymentStatus } from '../utils'

const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────
      isAuthenticated: false,

      login(password) {
        const { settings } = get()
        if (password === settings.adminPassword) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout() {
        set({ isAuthenticated: false })
      },

      // ── Orders ────────────────────────────────────────────
      orders: [],

      addOrder(order) {
        set(s => ({ orders: [order, ...s.orders] }))
      },

      bulkImport({ orders: newOrders, clients: newClients }) {
        const { orders, clients } = get()
        const existingOrderIds = new Set(orders.map(o => o.id))
        const existingInsta = new Set(clients.map(c => c.instagram?.toLowerCase()).filter(Boolean))
        const filteredOrders = newOrders.filter(o => !existingOrderIds.has(o.id))
        const filteredClients = newClients.filter(c => !existingInsta.has(c.instagram?.toLowerCase()))
        set({
          orders: [...filteredOrders, ...orders],
          clients: [...filteredClients, ...clients],
        })
      },

      updateOrder(id, updates) {
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
      },

      deleteOrder(id) {
        set(s => ({ orders: s.orders.filter(o => o.id !== id) }))
      },

      // ── Clients ───────────────────────────────────────────
      clients: [],

      addClient(client) {
        set(s => ({ clients: [client, ...s.clients] }))
      },

      updateClient(id, updates) {
        set(s => ({
          clients: s.clients.map(c => (c.id === id ? { ...c, ...updates } : c)),
        }))
      },

      deleteClient(id) {
        set(s => ({ clients: s.clients.filter(c => c.id !== id) }))
      },

      // ── Catalog ───────────────────────────────────────────
      catalog: { products: [], flavors: [], supplements: [] },

      // Products
      updateCatalogProduct(id, updates) {
        set(s => ({
          catalog: {
            ...s.catalog,
            products: s.catalog.products.map(p => (p.id === id ? { ...p, ...updates } : p)),
          },
        }))
      },
      addCatalogProduct(product) {
        set(s => ({ catalog: { ...s.catalog, products: [...s.catalog.products, product] } }))
      },
      deleteCatalogProduct(id) {
        set(s => ({ catalog: { ...s.catalog, products: s.catalog.products.filter(p => p.id !== id) } }))
      },

      // Flavors
      updateFlavor(id, updates) {
        set(s => ({
          catalog: {
            ...s.catalog,
            flavors: s.catalog.flavors.map(f => (f.id === id ? { ...f, ...updates } : f)),
          },
        }))
      },
      addFlavor(flavor) {
        set(s => ({ catalog: { ...s.catalog, flavors: [...s.catalog.flavors, flavor] } }))
      },
      deleteFlavor(id) {
        set(s => ({ catalog: { ...s.catalog, flavors: s.catalog.flavors.filter(f => f.id !== id) } }))
      },

      // Supplements
      updateSupplement(id, updates) {
        set(s => ({
          catalog: {
            ...s.catalog,
            supplements: s.catalog.supplements.map(x => (x.id === id ? { ...x, ...updates } : x)),
          },
        }))
      },
      addSupplement(supp) {
        set(s => ({ catalog: { ...s.catalog, supplements: [...s.catalog.supplements, supp] } }))
      },
      deleteSupplement(id) {
        set(s => ({ catalog: { ...s.catalog, supplements: s.catalog.supplements.filter(x => x.id !== id) } }))
      },

      // ── Shopping (Courses) ────────────────────────────────
      shoppingChecked: {},

      toggleShoppingItem(key) {
        set(s => ({
          shoppingChecked: { ...s.shoppingChecked, [key]: !s.shoppingChecked[key] },
        }))
      },

      clearShoppingChecked() {
        set({ shoppingChecked: {} })
      },

      // ── Settings ──────────────────────────────────────────
      settings: {
        businessName: 'Mycookycake',
        adminPassword: 'mycookycake2024',
        formIntro: 'Merci de remplir ce formulaire après notre échange. Il me permettra d\'enregistrer tous les détails de ta commande.',
        pickupInfo: 'Retrait possible du vendredi au dimanche sur rendez-vous.',
        conditions: 'Ce formulaire ne confirme pas automatiquement une disponibilité. Il sert à récapituler les informations validées ensemble.',
        logoUrl: '',
      },

      updateSettings(updates) {
        set(s => ({ settings: { ...s.settings, ...updates } }))
      },

      // ── Seed ──────────────────────────────────────────────
      deleteSeedOrders() {
        const SEED_INSTAS = new Set([
          '@lea_martin', '@camille.d', '@sofia_b',
          '@jademoreau', '@emma_l', '@chloe_petit_',
        ])
        set(s => ({
          orders: s.orders.filter(o => !SEED_INSTAS.has(o.clientInstagram)),
          clients: s.clients.filter(c => !SEED_INSTAS.has(c.instagram)),
        }))
      },

      initSeed() {
        const { orders } = get()
        if (orders.length === 0) {
          set({
            orders: seedOrders,
            clients: seedClients,
            catalog: seedCatalog,
          })
        }
      },
    }),
    {
      name: 'mycookycake-v1',
    },
  ),
)

export default useStore
