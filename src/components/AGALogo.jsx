// "Logo White Mode .png" = dark-colored logo, visible on white/light backgrounds
// "Logo Dark Mode .png"  = white-colored logo, visible on dark/navy backgrounds
import logoOnLight from '../assets/Logo White Mode .png'
import logoOnDark  from '../assets/Logo Dark Mode .png'
import { useTheme } from '../contexts/ThemeContext'

// variant: 'auto' (follows app theme) | 'light' (light bg) | 'dark' (dark bg)
// size:    'sm' | 'md' | 'lg'
const HEIGHTS = { sm: 32, md: 42, lg: 56 }

export default function AGALogo({ size = 'md', variant = 'auto', className = '' }) {
  const { theme } = useTheme()
  const h = HEIGHTS[size] ?? HEIGHTS.md

  let src
  if (variant === 'dark') {
    src = logoOnDark
  } else if (variant === 'light') {
    src = logoOnLight
  } else {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    src = isDark ? logoOnDark : logoOnLight
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={src}
        alt="AngloGold Ashanti"
        style={{ height: h, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}
