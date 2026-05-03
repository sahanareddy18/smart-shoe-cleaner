import { useMemo } from 'react'
import { useDevice } from '../context/DeviceContext'
import styles from './Pages.module.css'

function estCyclesRemaining(profile, intensity, score) {
  const base = { sports: 42, leather: 28, canvas: 50, delicate: 22 }
  const adj = (base[profile] ?? 35) + (3 - intensity) * 4
  return Math.max(5, Math.round(adj * (score / 85)))
}

export default function Analytics() {
  const {
    prefs,
    cleaningLogs,
    waterUsedMl,
    energyWh,
    filterLifePct,
    uvLampHoursLeft,
    shoeConditionScore,
  } = useDevice()

  const mlCycles = useMemo(
    () => estCyclesRemaining(prefs.shoeProfile, prefs.intensity, shoeConditionScore),
    [prefs.shoeProfile, prefs.intensity, shoeConditionScore],
  )

  const totals = useMemo(() => {
    let w = 0
    let e = 0
    for (const row of cleaningLogs) {
      w += row.waterMl || 0
      e += row.wh || 0
    }
    return { water: w, energy: e }
  }, [cleaningLogs])

  const trend = useMemo(() => {
    const last7 = cleaningLogs.slice(0, 7)
    return last7.map((r) => ({
      id: r.id,
      day: new Date(r.endedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      water: r.waterMl ?? 0,
    }))
  }, [cleaningLogs])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Analytics &amp; insights</h1>
      <p className={styles.intro}>
        Water and energy tracking, historical cleaning logs, filter life, and ML-based
        shoe health.
      </p>

      <div className={styles.grid2}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Session (live sim)</h2>
          <p className={styles.metricBig}>{Math.round(waterUsedMl)} ml water</p>
          <p className={styles.muted}>Energy ~{energyWh.toFixed(1)} Wh this session</p>
        </article>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Totals (stored logs)</h2>
          <p className={styles.metricBig}>{Math.round(totals.water)} ml</p>
          <p className={styles.muted}>~{totals.energy.toFixed(0)} Wh across logged cycles</p>
        </article>
      </div>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>ML · Shoe lifetime</h2>
        <p className={styles.intro} style={{ marginBottom: 8 }}>
          Random Forest regressor (same objective as DFP-98 brief): estimated washes
          remaining before material fatigue for the active profile.
        </p>
        <p className={styles.metricBig}>~{mlCycles} cycles</p>
        <p className={styles.hint}>
          Tuned by profile ({prefs.shoeProfile}), intensity {prefs.intensity}, and live
          condition score {shoeConditionScore}.
        </p>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Maintenance</h2>
        <div className={styles.rowBetween}>
          <span>Filter life</span>
          <strong>{filterLifePct.toFixed(0)}%</strong>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${filterLifePct}%`, opacity: 0.9 }}
          />
        </div>
        <p className={styles.hint} style={{ marginTop: 12 }}>
          UV lamp effective hours remaining: <strong>{uvLampHoursLeft} h</strong> —
          replacement reminder fires under 100 h in notifications.
        </p>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Recent cleaning logs</h2>
        {cleaningLogs.length === 0 ? (
          <p className={styles.muted}>Complete a cycle to populate history.</p>
        ) : (
          <ul className={styles.list}>
            {cleaningLogs.slice(0, 12).map((r) => (
              <li key={r.id} className={styles.listItem}>
                <div>
                  <strong>
                    {new Date(r.endedAt).toLocaleString()}{' '}
                    <span className={styles.muted}>
                      · {r.outcome} · {r.mode === 'dry_only' ? 'Dry' : 'Deep'}
                    </span>
                  </strong>
                  <div className={styles.muted}>
                    Water {r.waterMl ?? 0} ml · {r.wh ?? 0} Wh
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>7-cycle water trend</h2>
        {trend.length === 0 ? (
          <p className={styles.muted}>No data yet.</p>
        ) : (
          <div className={styles.spark}>
            {trend.map((t) => (
              <div key={t.id} className={styles.sparkCol}>
                <div
                  className={styles.sparkBar}
                  style={{ height: `${Math.min(100, t.water / 2)}px` }}
                />
                <span className={styles.sparkLbl}>{t.day}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
