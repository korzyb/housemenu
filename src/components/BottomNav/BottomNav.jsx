import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const svgProps = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
}

const IconToday = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)

const IconPlan = () => (
  <svg {...svgProps}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconRecipes = () => (
  <svg {...svgProps}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
)

const IconShopping = () => (
  <svg {...svgProps}>
    <circle cx="9" cy="20" r="1.4"/>
    <circle cx="18" cy="20" r="1.4"/>
    <path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L22 7H6.2"/>
  </svg>
)

const tabs = [
  { to: '/today', label: 'Dziś', Icon: IconToday },
  { to: '/plan', label: 'Plan', Icon: IconPlan },
  { to: '/recipes', label: 'Przepisy', Icon: IconRecipes },
  { to: '/shopping', label: 'Zakupy', Icon: IconShopping },
]

export default function BottomNav() {
  return (
    <nav className={`glass ${styles.nav}`}>
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [styles.tab, isActive ? styles.active : ''].join(' ')
          }
        >
          <span className={styles.icon}><Icon /></span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
