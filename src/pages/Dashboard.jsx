import { useMemo } from 'react'
import { useDevice } from '../context/DeviceContext'
import ThingSpeakPanels from '../components/ThingSpeakPanels'
import StartProcessFlow from '../components/StartProcessFlow'
import ProcessPipeline from '../components/ProcessPipeline'
import styles from './Dashboard.module.css'

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function sensorsInOptimal(waterPct, tempC, humPct) {
  return (
    waterPct >= 30 &&
    waterPct <= 70 &&
    tempC >= 15 &&
    tempC <= 25 &&
    humPct >= 40 &&
    humPct <= 60
  )
}

function RangeBar({ value, optimalLo, optimalHi, accentVar }) {
  const v = clamp(value, 0, 100)
  return (
    <div className={styles.rangeTrack}>
      <div
        className={styles.rangeOptimal}
        style={{
          left: `${optimalLo}%`,
          width: `${optimalHi - optimalLo}%`,
        }}
      />
      <div
        className={styles.rangeMarker}
        style={{ left: `${v}%`, background: `var(${accentVar})` }}
      />
    </div>
  )
}

function IconWater() {
  return (
    <svg className={styles.cardIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5c2 4 6 8.2 6 12.3a6 6 0 1 1-12 0c0-4.1 4-8.3 6-12.3z"
      />
    </svg>
  )
}

function IconTemp() {
  return (
    <svg className={styles.cardIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M10 15.5V4a2 2 0 1 1 4 0v11.5a4 4 0 1 1-4 0zm2 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
      />
    </svg>
  )
}

function IconHum() {
  return (
    <svg className={styles.cardIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 14c0-3 4-8 4-8s4 5 4 8a4 4 0 0 1-8 0zm14-1c0-2.2 2.5-5.5 2.5-5.5S22 10.8 22 13a2.5 2.5 0 0 1-5 0z"
      />
    </svg>
  )
}

function IconFeet() {
  return (
    <svg className={styles.heroIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M8 18c-1.5-3-2-6-1-8s3-3 5-2 2 4 1 7-2 5-5 3zm7-1c-1-2.5-1.5-5-.5-6.5s3-2 4.5-.5 1.5 4 .5 6.5-2 3.5-4.5 1z"
      />
    </svg>
  )
}

export default function Dashboard() {
  const {
    temperatureC,
    humidityPct,
    waterTankPct,
    shoeConditionScore,
    cyclePhase,
    restoreOptimalReadings,
    thingSpeakHistory,
    thingSpeakStatus,
    thingSpeakLastSync,
    refreshThingSpeakData,
    thingSpeakLoading,
  } = useDevice()

  const optimalEnv = useMemo(
    () => sensorsInOptimal(waterTankPct, temperatureC, humidityPct),
    [waterTankPct, temperatureC, humidityPct],
  )

  const shoeBad = !optimalEnv || shoeConditionScore < 65

  const waterDisplay = waterTankPct.toFixed(1)
  const tempDisplay = temperatureC.toFixed(1)
  const humDisplay = humidityPct.toFixed(1)

  const online = thingSpeakStatus === 'ok'

  const formatDateTime = (dateString) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const parseSensorValue = (field) => {
    const num = Number(field)
    return Number.isFinite(num) ? num : null
  }

  const rows = useMemo(() => {
    if (!thingSpeakHistory || thingSpeakHistory.length === 0) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
            🔄 Waiting for ThingSpeak data...
          </td>
        </tr>
      )
    }

    if (thingSpeakStatus === 'error') {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#b91c1c' }}>
            ⚠️ Unable to load ThingSpeak data.
          </td>
        </tr>
      )
    }

    return [...thingSpeakHistory].reverse().map((feed, index) => {
      const timeFormatted = formatDateTime(feed.created_at)
      const temp = parseSensorValue(feed.field1)
      const hum = parseSensorValue(feed.field2)
      const water = parseSensorValue(feed.field3)

      return (
        <tr key={feed.entry_id ?? `row-${index}`}>
          <td style={{ fontWeight: 700 }}>{index + 1}</td>
          <td>{timeFormatted}</td>
          <td>{temp !== null ? `${temp.toFixed(1)} °C` : '--'}</td>
          <td>{hum !== null ? `${hum.toFixed(1)} %` : '--'}</td>
          <td>{water !== null ? `${water.toFixed(1)} %` : '--'}</td>
        </tr>
      )
    })
  }, [thingSpeakHistory, thingSpeakStatus])

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <IconFeet />
          <div>
            <h1 className={styles.heroTitle}>Smart Shoe Cleaner &amp; Storage Unit</h1>
            <p className={styles.heroSub}>
              IoT-Powered Shoe Maintenance System · Real-time monitoring dashboard
            </p>
          </div>
        </div>
        <div className={styles.statusRow}>
          <span className={online ? styles.pillOk : styles.pillOff}>
            <span className={styles.pillDot} aria-hidden />
            {online ? 'Live Data' : 'Offline'}
          </span>
          {thingSpeakLastSync ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '1rem' }}>
              Last sync: {new Date(thingSpeakLastSync).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </header>

      <StartProcessFlow />

      <ProcessPipeline />

      <div className={styles.metricsRow}>
        <article className={`${styles.metricCard} ${styles.metricWater}`}>
          <div className={styles.metricHead}>
            <IconWater />
            <div>
              <h2 className={styles.metricTitle}>Water Level</h2>
              <p className={styles.fieldTag}>Field 1 · ThingSpeak</p>
            </div>
          </div>
          <p className={styles.metricValue}>
            {waterDisplay}
            <span className={styles.metricUnit}>%</span>
          </p>
          <RangeBar
            value={waterTankPct}
            optimalLo={30}
            optimalHi={70}
            accentVar="--water-accent"
          />
          <p className={styles.metricFoot}>Optimal range: 30% – 70%</p>
        </article>

        <article className={`${styles.metricCard} ${styles.metricTemp}`}>
          <div className={styles.metricHead}>
            <IconTemp />
            <div>
              <h2 className={styles.metricTitle}>Temperature</h2>
              <p className={styles.fieldTag}>Field 2 · ThingSpeak</p>
            </div>
          </div>
          <p className={styles.metricValue}>
            {tempDisplay}
            <span className={styles.metricUnit}>°C</span>
          </p>
          <RangeBar
            value={clamp(((temperatureC - 5) / 40) * 100, 0, 100)}
            optimalLo={((15 - 5) / 40) * 100}
            optimalHi={((25 - 5) / 40) * 100}
            accentVar="--temp-accent"
          />
          <p className={styles.metricFoot}>Optimal range: 15°C – 25°C</p>
        </article>

        <article className={`${styles.metricCard} ${styles.metricHum}`}>
          <div className={styles.metricHead}>
            <IconHum />
            <div>
              <h2 className={styles.metricTitle}>Humidity</h2>
              <p className={styles.fieldTag}>Field 3 · ThingSpeak</p>
            </div>
          </div>
          <p className={styles.metricValue}>
            {humDisplay}
            <span className={styles.metricUnit}>%</span>
          </p>
          <RangeBar
            value={humidityPct}
            optimalLo={40}
            optimalHi={60}
            accentVar="--hum-accent"
          />
          <p className={styles.metricFoot}>Optimal range: 40% – 60%</p>
        </article>
      </div>

      <article
        className={`${styles.shoeCard} ${shoeBad ? styles.shoeBad : styles.shoeGood}`}
      >
        <div className={styles.shoeHead}>
          <IconFeet />
          <div>
            <h2 className={styles.shoeTitle}>Shoe Condition</h2>
            <p className={styles.fieldTag}>AI Analysis</p>
          </div>
        </div>
        <div className={shoeBad ? styles.shoeInnerBad : styles.shoeInnerGood}>
          <div className={styles.shoeEmoji} aria-hidden>
            {shoeBad ? '😟' : '😊'}
          </div>
          <div>
            <p className={styles.shoeState}>{shoeBad ? 'Bad Condition' : 'Good Condition'}</p>
            <p className={styles.shoeDesc}>
              {shoeBad
                ? 'Your shoes need attention. One or more chamber parameters are outside optimal ranges, or the hygiene score is low. Consider running a deep clean or adjusting storage conditions.'
                : 'Chamber readings and hygiene score are in a healthy band. Keep scheduled maintenance for filters and UV lamp as recommended.'}
            </p>
            <p className={styles.shoeScore}>Score {shoeConditionScore}/100</p>
          </div>
        </div>
      </article>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>Sensor History</h2>
        <button
          type="button"
          onClick={refreshThingSpeakData}
          disabled={thingSpeakLoading}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-h)',
            cursor: 'pointer',
          }}
        >
          {thingSpeakLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{
        background: 'var(--surface)',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        marginBottom: '1rem',
      }}>
        <div style={{
          overflowX: 'auto',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '640px',
            fontSize: '0.9rem',
          }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Temp (°C)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Humidity (%)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Water (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
      </div>

      {cyclePhase === 'idle' ? (
        <button type="button" className={styles.demoBtn} onClick={restoreOptimalReadings}>
          Set optimal readings
        </button>
      ) : null}

      <ThingSpeakPanels />
    </div>
  )
}
