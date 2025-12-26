import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cartStore, hydrateCart, getCartTotals } from '@/stores/cart'
import { Button } from './ui/Button'
import { ThemeToggle } from './ui/ThemeToggle'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { user, isAuthenticated, logout, isLoggingOut } = useAuth()
  const cart = useStore(cartStore)
  const { itemCount } = getCartTotals(cart.items)

  // Hydrate cart on mount
  useEffect(() => {
    if (!cart.isHydrated) {
      hydrateCart()
    }
  }, [cart.isHydrated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/produits?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[--header-border] bg-[--header-bg] backdrop-blur-xl shadow-sm">
        <div className="container">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted] lg:hidden"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-primary-500 text-white">
                  <span className="font-display text-xl font-bold">B</span>
                </div>
                <span className="hidden font-display text-xl font-semibold text-[--text-primary] sm:block">
                  Boom Informatique
                </span>
              </Link>
            </div>

            {/* Center: Navigation (Desktop) */}
            <nav className="hidden items-center gap-6 lg:flex">
              <Link
                to="/produits"
                className="text-sm font-medium text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              >
                Produits
              </Link>
              <NavDropdown
                label="Catégories"
                items={[
                  { label: 'Ordinateurs', href: '/categories/ordinateurs' },
                  { label: 'Composants', href: '/categories/composants' },
                  { label: 'Périphériques', href: '/categories/peripheriques' },
                  { label: 'Réseau', href: '/categories/reseau' },
                  { label: 'Stockage', href: '/categories/stockage' },
                ]}
              />
              <Link
                to="/"
                className="text-sm font-medium text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              >
                Promotions
              </Link>
              <Link
                to="/"
                className="text-sm font-medium text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              >
                Contact
              </Link>
            </nav>

            {/* Right: Search, Cart, User */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart */}
              <Link
                to="/panier"
                className="relative rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                aria-label="Panier"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden text-sm font-medium sm:block">
                      {user?.firstName || 'Mon compte'}
                    </span>
                    <ChevronDown className="hidden h-4 w-4 sm:block" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[--radius-lg] border border-[--border-default] bg-white dark:bg-surface-900 p-2 shadow-xl">
                        <div className="border-b border-[--border-default] px-3 pb-2 mb-2">
                          <p className="text-sm font-medium text-[--text-primary]">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-[--text-muted]">
                            {user?.email}
                          </p>
                        </div>
                        <Link
                          to="/compte"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[--radius-md] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                        >
                          <User className="h-4 w-4" />
                          Mon compte
                        </Link>
                        <Link
                          to="/compte/commandes"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[--radius-md] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                        >
                          <Package className="h-4 w-4" />
                          Mes commandes
                        </Link>
                        <Link
                          to="/compte/adresses"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[--radius-md] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                        >
                          <MapPin className="h-4 w-4" />
                          Mes adresses
                        </Link>
                        <Link
                          to="/compte/favoris"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[--radius-md] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                        >
                          <Heart className="h-4 w-4" />
                          Mes favoris
                        </Link>
                        <hr className="my-2 border-[--border-default]" />
                        <button
                          onClick={() => {
                            logout()
                            setIsUserMenuOpen(false)
                          }}
                          disabled={isLoggingOut}
                          className="flex w-full items-center gap-2 rounded-[--radius-md] px-3 py-2 text-sm text-error transition-colors hover:bg-error-light"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/auth/connexion">
                  <Button variant="primary" size="sm" className="hidden sm:flex">
                    Connexion
                  </Button>
                  <button
                    className="rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted] sm:hidden"
                    aria-label="Connexion"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar (Expanded) */}
          {isSearchOpen && (
            <div className="border-t border-[--border-default] py-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full rounded-[--radius-md] border border-[--border-default] bg-[--bg-page] px-4 py-2.5 pl-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--text-muted]" />
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-80 flex-col bg-white dark:bg-surface-900 shadow-2xl border-r border-[--border-default]">
            <div className="flex items-center justify-between border-b border-[--border-default] p-4">
              <span className="font-display text-lg font-semibold text-[--text-primary]">
                Menu
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-[--radius-md] p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <Link
                to="/produits"
                onClick={() => setIsMenuOpen(false)}
                className="mb-2 flex items-center gap-3 rounded-[--radius-md] p-3 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
              >
                Tous les produits
              </Link>
              <p className="mb-2 mt-4 px-3 text-xs font-medium uppercase tracking-wider text-[--text-muted]">
                Catégories
              </p>
              {[
                'Ordinateurs',
                'Composants',
                'Périphériques',
                'Réseau',
                'Stockage',
              ].map((cat) => (
                <Link
                  key={cat}
                  to="/categories/$slug"
                  params={{ slug: cat.toLowerCase() }}
                  onClick={() => setIsMenuOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-[--radius-md] p-3 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                >
                  {cat}
                </Link>
              ))}
            </nav>

            <div className="border-t border-[--border-default] p-4">
              {isAuthenticated ? (
                <Link
                  to="/compte"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[--radius-md] p-3 text-[--text-secondary] transition-colors hover:bg-[--bg-muted]"
                >
                  <User className="h-5 w-5" />
                  Mon compte
                </Link>
              ) : (
                <Link to="/auth/connexion" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Connexion</Button>
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}

function NavDropdown({
  label,
  items,
}: {
  label: string
  items: Array<{ label: string; href: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-sm font-medium text-[--text-secondary] transition-colors hover:text-[--text-primary]">
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full pt-2">
          <div className="min-w-[200px] rounded-[--radius-lg] border border-[--border-default] bg-white dark:bg-surface-900 p-2 shadow-xl">
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block rounded-[--radius-md] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-[--text-primary]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
