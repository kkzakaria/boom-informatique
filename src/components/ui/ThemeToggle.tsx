import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

  if (effectiveTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = getStoredTheme()
    setThemeState(stored)
    applyTheme(stored)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme, mounted }
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme()

  // Cycle through themes: light -> dark -> system
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={className} disabled>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const icons = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Monitor className="h-5 w-5" />,
  }

  const labels = {
    light: 'Thème clair',
    dark: 'Thème sombre',
    system: 'Thème système',
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn('relative', className)}
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      <span className="transition-transform duration-200">
        {icons[theme]}
      </span>
    </Button>
  )
}

// Theme selector dropdown (alternative)
export function ThemeSelector({ className }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme()

  if (!mounted) return null

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Clair', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Sombre', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'Système', icon: <Monitor className="h-4 w-4" /> },
  ]

  return (
    <div className={cn('flex gap-1 rounded-[--radius-md] bg-[--bg-muted] p-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-[--radius-sm] px-3 py-1.5',
            'text-sm font-medium transition-all duration-[--duration-fast]',
            theme === option.value
              ? 'bg-[--bg-card] text-[--text-primary] shadow-sm'
              : 'text-[--text-muted] hover:text-[--text-secondary]'
          )}
          aria-pressed={theme === option.value}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
