import type { DateRange } from '@/server/admin/stats'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

const options: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: '12m', label: '12 derniers mois' },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[--text-muted]">Période :</span>
      <div className="flex rounded-lg border border-[--border-default] bg-[--bg-card] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-primary-600 text-white'
                : 'text-[--text-secondary] hover:bg-[--bg-muted]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
