import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus, X, ChevronDown } from 'lucide-react'
import { ATTRIBUTE_SUGGESTIONS } from '@/lib/validations/product'
import { cn } from '@/lib/utils'

export interface Attribute {
  id?: number
  name: string
  value: string
}

interface AttributesEditorProps {
  attributes: Attribute[]
  onChange: (attributes: Attribute[]) => void
  error?: string
}

export function AttributesEditor({
  attributes,
  onChange,
  error,
}: AttributesEditorProps) {
  const handleAddAttribute = () => {
    onChange([...attributes, { name: '', value: '' }])
  }

  const handleRemoveAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index))
  }

  const handleAttributeChange = (
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    const newAttributes = [...attributes]
    newAttributes[index] = { ...newAttributes[index], [field]: value }
    onChange(newAttributes)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[--text-primary]">
          Spécifications techniques
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAttribute}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {attributes.length === 0 ? (
        <p className="text-sm text-[--text-muted]">
          Aucune spécification ajoutée
        </p>
      ) : (
        <div className="space-y-3">
          {attributes.map((attr, index) => (
            <AttributeRow
              key={index}
              attribute={attr}
              index={index}
              onChange={handleAttributeChange}
              onRemove={handleRemoveAttribute}
            />
          ))}
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

interface AttributeRowProps {
  attribute: Attribute
  index: number
  onChange: (index: number, field: 'name' | 'value', value: string) => void
  onRemove: (index: number) => void
}

function AttributeRow({
  attribute,
  index,
  onChange,
  onRemove,
}: AttributeRowProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNameChange = (value: string) => {
    onChange(index, 'name', value)

    if (value.length > 0) {
      const filtered = ATTRIBUTE_SUGGESTIONS.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([...ATTRIBUTE_SUGGESTIONS])
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(index, 'name', suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex-1">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={attribute.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => {
              if (attribute.name.length === 0) {
                setFilteredSuggestions([...ATTRIBUTE_SUGGESTIONS])
              }
              setShowSuggestions(true)
            }}
            placeholder="Nom (ex: Processeur)"
            className={cn(
              'w-full rounded-[--radius-md] border border-[--border-default] bg-[--bg-card] px-3.5 py-2.5',
              'text-[15px] text-[--text-primary] placeholder:text-[--text-muted]',
              'transition-all duration-[--duration-fast]',
              'hover:border-[--border-strong]',
              'focus:border-primary-400 focus:outline-none focus:ring-[3px] focus:ring-primary-500/10'
            )}
          />
          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted] transition-transform',
              showSuggestions && 'rotate-180'
            )}
          />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-[--radius-md] border border-[--border-default] bg-[--bg-card] py-1 shadow-lg"
          >
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm text-[--text-primary] hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1">
        <Input
          type="text"
          value={attribute.value}
          onChange={(e) => onChange(index, 'value', e.target.value)}
          placeholder="Valeur (ex: Intel Core i7)"
          inputSize="md"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(index)}
        className="mt-1.5 text-[--text-muted] hover:text-error"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
