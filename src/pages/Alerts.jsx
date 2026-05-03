import { useDevice } from '../context/DeviceContext'
import styles from './Pages.module.css'

export default function Alerts() {
  const { notifications, markNotificationRead } = useDevice()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Intelligent notifications</h1>
      <p className={styles.intro}>
        Cycle completion, maintenance (water, filter, UV lamp), abnormal sensors, and
        ML-based shoe health tips.
      </p>

      <ul className={styles.notifList}>
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={`${styles.notifItem} ${n.read ? styles.notifRead : ''}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className={styles.notifTop}>
                <span className={styles.notifType}>{n.type}</span>
                <time className={styles.muted}>
                  {new Date(n.time).toLocaleString()}
                </time>
              </div>
              <strong>{n.title}</strong>
              <p className={styles.notifBody}>{n.body}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
