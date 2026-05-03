import { useDevice } from '../context/DeviceContext'
import { SHOE_PROFILES } from '../constants/processPipeline'
import styles from './Pages.module.css'

export default function Personalize() {
  const { prefs, setPrefs } = useDevice()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profiles</h1>
      <p className={styles.intro}>
        Defaults for <strong>quick start</strong> when you do not pick a type in the guided flow.
        Saved in this browser.
      </p>

      

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Shoe type profile</h2>
        <div className={styles.modeRow}>
          {SHOE_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.modeBtn} ${prefs.shoeProfile === p.id ? styles.modeOn : ''}`}
              onClick={() => setPrefs({ shoeProfile: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Cleaning intensity</h2>
        <label className={styles.field}>
          Level {prefs.intensity} / 5
          <input
            type="range"
            min={1}
            max={5}
            value={prefs.intensity}
            onChange={(e) => setPrefs({ intensity: Number(e.target.value) })}
            className={styles.range}
          />
        </label>
        <p className={styles.hint}>
          Higher intensity maps to longer brush contact and pump duty cycles on the
          embedded controller.
        </p>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Notifications</h2>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={prefs.notificationsEnabled}
            onChange={(e) =>
              setPrefs({ notificationsEnabled: e.target.checked })
            }
          />
          Enable intelligent alerts (cycle complete, maintenance, anomalies, ML
          insights)
        </label>
      </article>
    </div>
  )
}
