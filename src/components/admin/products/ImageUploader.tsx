import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Upload,
  X,
  Star,
  GripVertical,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_PRODUCT,
} from '@/lib/validations/product'
import { cn } from '@/lib/utils'

export interface ImageFile {
  id?: number
  file?: File
  url: string
  position: number
  isMain: boolean
  isNew: boolean
  isUploading?: boolean
}

interface ImageUploaderProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  onUpload?: (file: File, position: number, isMain: boolean) => Promise<{ id: number; url: string }>
  onDelete?: (imageId: number) => Promise<void>
  error?: string
  disabled?: boolean
}

export function ImageUploader({
  images,
  onChange,
  onUpload,
  onDelete,
  error,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        ACCEPTED_IMAGE_TYPES.includes(file.type)
      )

      handleFiles(files)
    },
    [disabled, images, onChange]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      ACCEPTED_IMAGE_TYPES.includes(file.type)
    )
    handleFiles(files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFiles = async (files: File[]) => {
    const remainingSlots = MAX_IMAGES_PER_PRODUCT - images.length
    const filesToAdd = files.slice(0, remainingSlots)

    for (const file of filesToAdd) {
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`Le fichier "${file.name}" dépasse la limite de 5 MB`)
        continue
      }

      const position = images.length
      const isMain = images.length === 0

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)

      // Add to state with uploading flag
      const newImage: ImageFile = {
        file,
        url: previewUrl,
        position,
        isMain,
        isNew: true,
        isUploading: true,
      }

      const updatedImages = [...images, newImage]
      onChange(updatedImages)

      // If onUpload is provided, upload the file
      if (onUpload) {
        try {
          const result = await onUpload(file, position, isMain)
          // Update the image with the server response
          onChange(
            updatedImages.map((img) =>
              img.url === previewUrl
                ? { ...img, id: result.id, url: result.url, isUploading: false, isNew: false }
                : img
            )
          )
          // Revoke the blob URL
          URL.revokeObjectURL(previewUrl)
        } catch (err) {
          // Remove the failed image
          onChange(updatedImages.filter((img) => img.url !== previewUrl))
          URL.revokeObjectURL(previewUrl)
          alert(`Erreur lors de l'upload de "${file.name}"`)
        }
      }
    }
  }

  const handleRemove = async (index: number) => {
    const image = images[index]

    if (image.id && onDelete) {
      try {
        await onDelete(image.id)
      } catch {
        alert("Erreur lors de la suppression de l'image")
        return
      }
    }

    // Revoke blob URL if it's a new image
    if (image.isNew && image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url)
    }

    const newImages = images.filter((_, i) => i !== index)

    // If removed image was main and there are other images, set first as main
    if (image.isMain && newImages.length > 0) {
      newImages[0].isMain = true
    }

    // Update positions
    newImages.forEach((img, i) => {
      img.position = i
    })

    onChange(newImages)
  }

  const handleSetMain = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }))
    onChange(newImages)
  }

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const [removed] = newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, removed)

    // Update positions
    newImages.forEach((img, i) => {
      img.position = i
    })

    onChange(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[--text-primary]">
          Images du produit
        </h3>
        <span className="text-sm text-[--text-muted]">
          {images.length}/{MAX_IMAGES_PER_PRODUCT}
        </span>
      </div>

      {/* Drop zone */}
      {images.length < MAX_IMAGES_PER_PRODUCT && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-[--radius-lg] border-2 border-dashed p-8 transition-colors',
            isDragging
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10'
              : 'border-[--border-default] hover:border-[--border-strong] hover:bg-surface-50 dark:hover:bg-surface-800',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <Upload className="mb-3 h-8 w-8 text-[--text-muted]" />
          <p className="text-sm font-medium text-[--text-primary]">
            Glissez-déposez des images ici
          </p>
          <p className="mt-1 text-sm text-[--text-muted]">
            ou cliquez pour parcourir
          </p>
          <p className="mt-2 text-xs text-[--text-muted]">
            JPG, PNG ou WebP • Max 5 MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.url}
              draggable={!image.isUploading}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border border-[--border-default] bg-surface-100 dark:bg-surface-800',
                draggedIndex === index && 'opacity-50',
                image.isUploading && 'animate-pulse'
              )}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Uploading overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}

              {/* Hover overlay */}
              {!image.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Drag handle */}
                  <div className="cursor-grab text-white">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Set as main */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleSetMain(index)}
                    className={cn(
                      'text-white hover:bg-white/20',
                      image.isMain && 'text-yellow-400'
                    )}
                    title={image.isMain ? 'Image principale' : 'Définir comme principale'}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={image.isMain ? 'currentColor' : 'none'}
                    />
                  </Button>

                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(index)}
                    className="text-white hover:bg-white/20 hover:text-red-400"
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Main badge */}
              {image.isMain && !image.isUploading && (
                <div className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-black">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[--border-default] bg-surface-50 p-4 dark:bg-surface-800">
          <ImageIcon className="h-5 w-5 text-[--text-muted]" />
          <p className="text-sm text-[--text-muted]">
            Aucune image ajoutée. La première image sera l'image principale.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
