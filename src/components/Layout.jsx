import { NavLink, Outlet } from 'react-router-dom'
import { useDevice } from '../context/DeviceContext'
import styles from './Layout.module.css'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/control', label: 'Control' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/personalize', label: 'Profiles' },
  { to: '/analytics', label: 'Analytics' },
]

export default function Layout() {
  const { notifications } = useDevice()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar} aria-label="Site">
        <div className={styles.sideTop}>
          <span className={styles.logo} aria-hidden />
          <div>
            <strong className={styles.brandName}>Smart Shoe Cleaner</strong>
            <span className={styles.brandMeta}>Web console</span>
          </div>
        </div>

        <nav className={styles.sideNav} aria-label="Primary">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sideBottom}>
          <NavLink to="/alerts" className={styles.alertsLink}>
            <span>Alerts</span>
            {unread > 0 ? <span className={styles.badge}>{unread}</span> : null}
          </NavLink>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
