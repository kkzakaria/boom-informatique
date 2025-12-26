import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getFeaturedProducts, getNewArrivals, getCategories } from '@/server/catalog'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/hooks/useCart'
import {
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  Headphones,
  Printer,
  ArrowRight,
  Zap,
  Truck,
  Shield,
  Phone,
} from 'lucide-react'
import { Suspense } from 'react'

export const Route = createFileRoute('/')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['featured-products'],
        queryFn: () => getFeaturedProducts(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['new-arrivals'],
        queryFn: () => getNewArrivals(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
      }),
    ])
  },
  component: HomePage,
})

const categoryIcons: Record<string, React.ReactNode> = {
  ordinateurs: <Monitor className="h-8 w-8" />,
  composants: <Cpu className="h-8 w-8" />,
  stockage: <HardDrive className="h-8 w-8" />,
  peripheriques: <Keyboard className="h-8 w-8" />,
  audio: <Headphones className="h-8 w-8" />,
  impression: <Printer className="h-8 w-8" />,
}

function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Categories */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* Featured Products */}
      <Suspense fallback={<ProductsSectionSkeleton title="Produits en vedette" />}>
        <FeaturedProductsSection />
      </Suspense>

      {/* New Arrivals */}
      <Suspense fallback={<ProductsSectionSkeleton title="Nouveautés" />}>
        <NewArrivalsSection />
      </Suspense>

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-16 lg:py-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Votre partenaire informatique
            <span className="mt-2 block text-primary-200">professionnel</span>
          </h1>
          <p className="mt-6 text-lg text-primary-100 sm:text-xl">
            Matériel informatique de qualité pour entreprises et particuliers.
            Plus de 5000 références disponibles avec livraison rapide.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/produits">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Voir nos produits
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/inscription">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto"
              >
                Créer un compte pro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustBadges() {
  const badges = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Livraison rapide',
      description: 'Expédition sous 24/48h',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Garantie 2 ans',
      description: 'Sur tous nos produits',
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Support expert',
      description: 'Conseils personnalisés',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Prix compétitifs',
      description: 'Tarifs pro négociés',
    },
  ]

  return (
    <section className="border-b border-[--border-default] bg-white dark:bg-surface-900 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {badge.icon}
              </div>
              <div>
                <p className="font-semibold text-[--text-primary]">{badge.title}</p>
                <p className="text-sm text-[--text-muted]">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  const { data: categories } = useSuspenseQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[--text-primary] lg:text-3xl">
            Nos catégories
          </h2>
          <Link to="/produits" className="text-primary-600 hover:text-primary-700">
            <span className="flex items-center gap-1 text-sm font-medium">
              Tout voir
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              to="/produits"
              search={{ category: category.slug }}
              className="group flex flex-col items-center gap-3 rounded-xl border border-[--border-default] bg-white dark:bg-surface-900 p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 dark:hover:border-primary-600"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:group-hover:bg-primary-900/30">
                {categoryIcons[category.slug] || <Monitor className="h-8 w-8" />}
              </div>
              <span className="text-center font-medium text-[--text-primary]">
                {category.name}
              </span>
              <span className="text-xs text-[--text-muted]">
                {category.productCount} produits
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedProductsSection() {
  const { addItem } = useCart()
  const { data: products } = useSuspenseQuery({
    queryKey: ['featured-products'],
    queryFn: () => getFeaturedProducts(),
  })

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="bg-surface-50 dark:bg-surface-950 py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[--text-primary] lg:text-3xl">
              Produits en vedette
            </h2>
            <p className="mt-1 text-[--text-muted]">
              Notre sélection de produits populaires
            </p>
          </div>
          <Link to="/produits" search={{ featured: true }}>
            <Button variant="outline" size="sm">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <Link key={product.id} to="/produits/$slug" params={{ slug: product.slug }}>
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                brand={product.brand?.name || 'Marque'}
                imageUrl={product.images[0]?.url || '/placeholder-product.png'}
                priceTtc={product.priceTtc}
                priceHt={product.priceHt}
                stockQuantity={product.stockQuantity}
                stockAlertThreshold={product.stockAlertThreshold || 5}
                onAddToCart={() =>
                  addItem({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    priceHt: product.priceHt,
                    priceTtc: product.priceTtc,
                    imageUrl: product.images[0]?.url || '/placeholder-product.png',
                    quantity: 1,
                    stockQuantity: product.stockQuantity,
                  })
                }
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function NewArrivalsSection() {
  const { addItem } = useCart()
  const { data: products } = useSuspenseQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => getNewArrivals(),
  })

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[--text-primary] lg:text-3xl">
              Nouveautés
            </h2>
            <p className="mt-1 text-[--text-muted]">Les derniers produits ajoutés</p>
          </div>
          <Link to="/produits" search={{ sortBy: 'newest' }}>
            <Button variant="outline" size="sm">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <Link key={product.id} to="/produits/$slug" params={{ slug: product.slug }}>
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                brand={product.brand?.name || 'Marque'}
                imageUrl={product.images[0]?.url || '/placeholder-product.png'}
                priceTtc={product.priceTtc}
                priceHt={product.priceHt}
                stockQuantity={product.stockQuantity}
                stockAlertThreshold={product.stockAlertThreshold || 5}
                isNew
                onAddToCart={() =>
                  addItem({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    priceHt: product.priceHt,
                    priceTtc: product.priceTtc,
                    imageUrl: product.images[0]?.url || '/placeholder-product.png',
                    quantity: 1,
                    stockQuantity: product.stockQuantity,
                  })
                }
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">
          Vous êtes un professionnel ?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
          Bénéficiez de tarifs préférentiels, de devis personnalisés et d'un
          accompagnement dédié pour vos projets informatiques.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/auth/inscription">
            <Button variant="secondary" size="lg">
              Créer mon compte pro
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Nous contacter
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoriesSkeleton() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 h-8 w-48 animate-shimmer rounded bg-surface-200 dark:bg-surface-700" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-xl border border-[--border-default] bg-white dark:bg-surface-900 p-6 shadow-sm"
            >
              <div className="h-16 w-16 animate-shimmer rounded-xl bg-surface-100 dark:bg-surface-800" />
              <div className="h-4 w-20 animate-shimmer rounded bg-surface-100 dark:bg-surface-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductsSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-[--text-primary] lg:text-3xl">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
