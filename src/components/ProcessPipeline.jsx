import { useDevice } from '../context/DeviceContext'
import {
  PIPELINE_DEEP,
  PIPELINE_DRY,
  profileLabel,
} from '../constants/processPipeline'
import styles from './ProcessPipeline.module.css'

export default function ProcessPipeline() {
  const {
    cyclePhase,
    mode,
    progress,
    timeRemainingSec,
    processStepIndex,
    cycleActiveProfile,
    cycleProfileSource,
  } = useDevice()

  const pipeline = mode === 'dry_only' ? PIPELINE_DRY : PIPELINE_DEEP
  const active = cyclePhase !== 'idle' || progress >= 100

  if (!active && progress < 100) {
    return (
      <section className={styles.section}>
        <h2 className={styles.h2}>Process timeline</h2>
        <p className={styles.idle}>
          Idle — use <strong>Start process</strong> to choose manual type or auto-detect,
          then watch each stage advance here.
        </p>
      </section>
    )
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.h2}>Whole process</h2>
        {cyclePhase !== 'idle' ? (
          <span className={styles.timer}>{fmt(timeRemainingSec)} left</span>
        ) : progress >= 100 ? (
          <span className={styles.done}>Completed</span>
        ) : null}
      </div>
      {cycleActiveProfile ? (
        <p className={styles.profileLine}>
          Active profile: <strong>{profileLabel(cycleActiveProfile)}</strong>
          <span className={styles.src}>
            ({cycleProfileSource === 'detect' ? 'auto-detected' : 'manual'})
          </span>
        </p>
      ) : null}
      <p className={styles.progressLine}>
        Overall progress <strong>{progress}%</strong>
        {cyclePhase === 'paused' ? <span className={styles.paused}> · Paused</span> : null}
      </p>
      <ol className={styles.steps}>
        {pipeline.map((step, i) => {
          const done =
            i < processStepIndex ||
            (cyclePhase === 'idle' && progress >= 100 && i <= processStepIndex)
          const current =
            i === processStepIndex && cyclePhase !== 'idle' && cyclePhase !== 'paused'
          const currentPaused =
            i === processStepIndex && cyclePhase === 'paused'
          return (
            <li
              key={step.id}
              className={`${styles.step} ${done ? styles.stepDone : ''} ${current || currentPaused ? styles.stepCurrent : ''} ${currentPaused ? styles.stepPaused : ''}`}
            >
              <span className={styles.dot} aria-hidden />
              <span className={styles.label}>{step.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
