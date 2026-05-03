import { useState } from 'react'
import { useDevice } from '../context/DeviceContext'
import { SHOE_PROFILES } from '../constants/processPipeline'
import styles from './StartProcessFlow.module.css'

const STEPS = {
  closed: 'closed',
  mode: 'mode',
  source: 'source',
  manual: 'manual',
  detect: 'detect',
  result: 'result',
}

export default function StartProcessFlow({ variant = 'default' }) {
  const { cyclePhase, mode, setMode, startCycle } = useDevice()
  const [step, setStep] = useState(STEPS.closed)
  const [localMode, setLocalMode] = useState(mode)
  const [pickedProfile, setPickedProfile] = useState(null)
  const [detectedProfile, setDetectedProfile] = useState(null)
  const [detectBusy, setDetectBusy] = useState(false)

  const idle = cyclePhase === 'idle'

  function open() {
    setLocalMode(mode)
    setPickedProfile(null)
    setDetectedProfile(null)
    setStep(STEPS.mode)
  }

  function close() {
    setStep(STEPS.closed)
    setDetectBusy(false)
  }

  function runDetection() {
    setDetectBusy(true)
    setStep(STEPS.detect)
    const delay = 2200 + Math.random() * 1200
    window.setTimeout(() => {
      const pick =
        SHOE_PROFILES[Math.floor(Math.random() * SHOE_PROFILES.length)].id
      setDetectedProfile(pick)
      setDetectBusy(false)
      setStep(STEPS.result)
    }, delay)
  }

  function confirmStart(profileId, source) {
    setMode(localMode)
    startCycle(localMode, { profileId, source })
    close()
  }

  return (
    <div className={variant === 'compact' ? styles.wrapCompact : styles.wrap}>
      <button
        type="button"
        className={styles.cta}
        onClick={open}
        disabled={!idle}
      >
        Start process
      </button>

      {step !== STEPS.closed ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={close}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        />
      ) : null}

      {step !== STEPS.closed ? (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="proc-title">
          <div className={styles.modalHead}>
            <h2 id="proc-title" className={styles.modalTitle}>
              Start cleaning
            </h2>
            <button type="button" className={styles.closeX} onClick={close} aria-label="Close">
              ×
            </button>
          </div>

          {step === STEPS.mode ? (
            <div className={styles.body}>
              <p className={styles.lead}>Choose program for this run.</p>
              <div className={styles.choiceRow}>
                <button
                  type="button"
                  className={`${styles.choice} ${localMode === 'deep_clean' ? styles.choiceOn : ''}`}
                  onClick={() => setLocalMode('deep_clean')}
                >
                  <strong>Deep clean</strong>
                  <span>Wash, rinse, dry, deodorize, UV</span>
                </button>
                <button
                  type="button"
                  className={`${styles.choice} ${localMode === 'dry_only' ? styles.choiceOn : ''}`}
                  onClick={() => setLocalMode('dry_only')}
                >
                  <strong>Dry only</strong>
                  <span>Skip liquids — dry &amp; hygiene pass</span>
                </button>
              </div>
              <button
                type="button"
                className={styles.next}
                onClick={() => setStep(STEPS.source)}
              >
                Next
              </button>
            </div>
          ) : null}

          {step === STEPS.source ? (
            <div className={styles.body}>
              <p className={styles.lead}>How should we set the shoe type?</p>
              <div className={styles.choiceRow}>
                <button
                  type="button"
                  className={styles.choice}
                  onClick={() => setStep(STEPS.manual)}
                >
                  <strong>Manual selection</strong>
                  <span>You pick Sports, Leather, Canvas, or Delicate</span>
                </button>
                <button
                  type="button"
                  className={styles.choice}
                  onClick={runDetection}
                >
                  <strong>Detect type</strong>
                  <span>Uses on-device sensors / model (simulated)</span>
                </button>
              </div>
              <button type="button" className={styles.back} onClick={() => setStep(STEPS.mode)}>
                Back
              </button>
            </div>
          ) : null}

          {step === STEPS.manual ? (
            <div className={styles.body}>
              <p className={styles.lead}>Select material profile for this cycle.</p>
              <div className={styles.grid4}>
                {SHOE_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.tile} ${pickedProfile === p.id ? styles.tileOn : ''}`}
                    onClick={() => setPickedProfile(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.back} onClick={() => setStep(STEPS.source)}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.next}
                  disabled={!pickedProfile}
                  onClick={() => confirmStart(pickedProfile, 'manual')}
                >
                  Start
                </button>
              </div>
            </div>
          ) : null}

          {step === STEPS.detect ? (
            <div className={styles.body}>
              <p className={styles.lead}>Analyzing chamber…</p>
              <div className={styles.spinner} aria-busy="true" />
              <p className={styles.muted}>
                {detectBusy ? 'Sensor fusion in progress…' : 'Finishing…'}
              </p>
            </div>
          ) : null}

          {step === STEPS.result ? (
            <div className={styles.body}>
              <p className={styles.lead}>Detected profile</p>
              <p className={styles.detected}>
                {SHOE_PROFILES.find((p) => p.id === detectedProfile)?.label ?? '—'}
              </p>
              <p className={styles.muted}>
                Confirm to run {localMode === 'dry_only' ? 'dry only' : 'deep clean'} with this
                profile. You can override defaults anytime under Profiles.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.back} onClick={() => setStep(STEPS.source)}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.next}
                  disabled={!detectedProfile}
                  onClick={() => confirmStart(detectedProfile, 'detect')}
                >
                  Start with detected type
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
