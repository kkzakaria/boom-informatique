import { z } from 'zod'

/**
 * Schéma de validation pour le formulaire produit
 */
export const productFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  slug: z
    .string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(200, 'Le slug ne peut pas dépasser 200 caractères')
    .regex(
      /^[a-z0-9-]+$/,
      'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'
    ),

  description: z
    .string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .or(z.literal('')),

  sku: z
    .string()
    .min(1, 'Le SKU est requis')
    .max(50, 'Le SKU ne peut pas dépasser 50 caractères')
    .regex(
      /^[A-Z0-9-]+$/i,
      'Le SKU ne peut contenir que des lettres, chiffres et tirets'
    ),

  ean: z
    .string()
    .max(13, 'Le code EAN ne peut pas dépasser 13 caractères')
    .regex(/^[0-9]*$/, 'Le code EAN ne peut contenir que des chiffres')
    .optional()
    .or(z.literal('')),

  brandId: z.number().nullable(),
  categoryId: z.number().nullable(),

  priceHt: z
    .number()
    .min(0, 'Le prix doit être positif')
    .max(999999.99, 'Le prix est trop élevé'),

  taxRate: z
    .number()
    .min(0, 'Le taux de TVA doit être positif')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100%')
    .default(20),

  stockQuantity: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif')
    .default(0),

  stockAlertThreshold: z
    .number()
    .int('Le seuil doit être un nombre entier')
    .min(0, 'Le seuil ne peut pas être négatif')
    .default(5),

  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),

  attributes: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Le nom de l'attribut est requis"),
        value: z.string().min(1, "La valeur de l'attribut est requise"),
      })
    )
    .default([]),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

/**
 * Suggestions d'attributs courants pour produits informatiques
 */
export const ATTRIBUTE_SUGGESTIONS = [
  'Processeur',
  'Mémoire RAM',
  'Stockage',
  'Taille écran',
  'Résolution',
  'Système d\'exploitation',
  'Carte graphique',
  'Autonomie',
  'Poids',
  'Dimensions',
  'Connectique',
  'Garantie',
  'Couleur',
  'Type de panneau',
  'Fréquence',
  'Socket',
  'Chipset',
  'Format',
  'Interface',
  'Débit',
  'Ports',
  'Puissance',
  'Certification',
] as const

/**
 * Valeurs par défaut pour un nouveau produit
 */
export const defaultProductValues: Partial<ProductFormValues> = {
  name: '',
  slug: '',
  description: '',
  sku: '',
  ean: '',
  brandId: null,
  categoryId: null,
  priceHt: 0,
  taxRate: 20,
  stockQuantity: 0,
  stockAlertThreshold: 5,
  isActive: true,
  featured: false,
  attributes: [],
}

/**
 * Formats d'images acceptés
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Taille maximale d'une image en octets (5 MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/**
 * Nombre maximum d'images par produit
 */
export const MAX_IMAGES_PER_PRODUCT = 10
