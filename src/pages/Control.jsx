import { useDevice } from '../context/DeviceContext'
import StartProcessFlow from '../components/StartProcessFlow'
import { profileLabel } from '../constants/processPipeline'
import styles from './Pages.module.css'

export default function Control() {
  const {
    cyclePhase,
    mode,
    setMode,
    startCycle,
    pauseCycle,
    resumeCycle,
    stopCycle,
    prefs,
  } = useDevice()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Remote control</h1>
      <p className={styles.intro}>
        <strong>Start process</strong> walks through program, then manual type or auto-detect.
        Quick actions use your saved default ({profileLabel(prefs.shoeProfile)}) from{' '}
        <strong>Profiles</strong>.
      </p>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Guided start</h2>
        <StartProcessFlow variant="compact" />
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Quick modes</h2>
        <div className={styles.modeRow}>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'deep_clean' ? styles.modeOn : ''}`}
            onClick={() => setMode('deep_clean')}
            disabled={cyclePhase !== 'idle'}
          >
            Deep clean
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'dry_only' ? styles.modeOn : ''}`}
            onClick={() => setMode('dry_only')}
            disabled={cyclePhase !== 'idle'}
          >
            Dry only
          </button>
        </div>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Transport</h2>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => startCycle()}
            disabled={cyclePhase !== 'idle'}
          >
            Quick start (default profile)
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => startCycle('deep_clean')}
            disabled={cyclePhase !== 'idle'}
          >
            Quick: Deep clean
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => startCycle('dry_only')}
            disabled={cyclePhase !== 'idle'}
          >
            Quick: Dry only
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={pauseCycle}
            disabled={cyclePhase === 'idle' || cyclePhase === 'paused'}
          >
            Pause
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={resumeCycle}
            disabled={cyclePhase !== 'paused'}
          >
            Resume
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={stopCycle}
            disabled={cyclePhase === 'idle'}
          >
            Stop
          </button>
        </div>
      </article>
    </div>
  )
}
