import { useMemo } from 'react'
import { useDevice } from '../context/DeviceContext'
import styles from './LiveMonitor.module.css'

function formatDateTime(dateString) {
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

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export default function LiveMonitor() {
  const {
    thingSpeakHistory,
    thingSpeakStatus,
    thingSpeakError,
    thingSpeakLastSync,
    thingSpeakLoading,
    refreshThingSpeakData,
    temperatureC,
    humidityPct,
    waterTankPct,
  } = useDevice()

  const latestEntry = thingSpeakHistory.length
    ? thingSpeakHistory[thingSpeakHistory.length - 1]
    : null

  const tempValue = safeNumber(latestEntry?.field1) ?? temperatureC
  const humValue = safeNumber(latestEntry?.field2) ?? humidityPct
  const waterValue = safeNumber(latestEntry?.field3) ?? waterTankPct

  const rows = useMemo(() => {
    if (!thingSpeakHistory || thingSpeakHistory.length === 0) {
      return (
        <tr>
          <td colSpan="5" className={styles.emptyRow}>
            🔄 Waiting for ThingSpeak data...
          </td>
        </tr>
      )
    }

    if (thingSpeakStatus === 'error') {
      return (
        <tr>
          <td colSpan="5" className={styles.errorRow}>
            ⚠️ {thingSpeakError ?? 'Unable to load ThingSpeak data.'}
          </td>
        </tr>
      )
    }

    return [...thingSpeakHistory].reverse().map((feed, index) => {
      const timeFormatted = formatDateTime(feed.created_at)
      const temp = safeNumber(feed.field1)
      const hum = safeNumber(feed.field2)
      const water = safeNumber(feed.field3)

      return (
        <tr key={feed.entry_id ?? `row-${index}`}>
          <td className={styles.badgeValue}>{index + 1}</td>
          <td>{timeFormatted}</td>
          <td>{temp !== null ? `${temp.toFixed(1)} °C` : '--'}</td>
          <td>{hum !== null ? `${hum.toFixed(1)} %` : '--'}</td>
          <td>{water !== null ? `${water.toFixed(1)} %` : '--'}</td>
        </tr>
      )
    })
  }, [thingSpeakHistory, thingSpeakStatus, thingSpeakError])

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live monitoring</h1>
          <p className={styles.subtitle}>
            Real-time telemetry from your smart shoe cleaner and storage chamber.
          </p>
        </div>
        <span className={`${styles.badge} ${thingSpeakStatus === 'ok' ? styles.badgeLive : ''}`}>
          {thingSpeakStatus === 'ok' ? 'LIVE' : thingSpeakStatus === 'loading' ? 'UPDATING' : 'OFFLINE'}
        </span>
      </div>

      <div className={styles.cardsGrid}>
        <article className={styles.sensorCard}>
          <div>
            <p className={styles.cardTitle}>🌡️ Temperature</p>
            <p className={styles.reading}>
              {tempValue !== null ? tempValue.toFixed(1) : '--'}
              <span className={styles.unit}>°C</span>
            </p>
            <p className={styles.cardMeta}>Storage chamber temperature</p>
          </div>
          <div className={styles.cardIcon}>🔥</div>
        </article>

        <article className={styles.sensorCard}>
          <div>
            <p className={styles.cardTitle}>💧 Humidity</p>
            <p className={styles.reading}>
              {humValue !== null ? humValue.toFixed(1) : '--'}
              <span className={styles.unit}>%</span>
            </p>
            <p className={styles.cardMeta}>Humidity level inside chamber</p>
          </div>
          <div className={styles.cardIcon}>💨</div>
        </article>

        <article className={styles.sensorCard}>
          <div>
            <p className={styles.cardTitle}>🧼 Water level</p>
            <p className={styles.reading}>
              {waterValue !== null ? waterValue.toFixed(1) : '--'}
              <span className={styles.unit}>%</span>
            </p>
            <p className={styles.cardMeta}>Reservoir fill level</p>
          </div>
          <div className={styles.cardIcon}>💧</div>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.statusText}>
          Auto-refresh every <strong>15 seconds</strong>
          {thingSpeakLastSync ? (
            <span> · last sync {new Date(thingSpeakLastSync).toLocaleTimeString()}</span>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={refreshThingSpeakData}
          disabled={thingSpeakLoading}
        >
          {thingSpeakLoading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Sensor history log</h2>
            <p className={styles.tableSubtitle}>Last 20 ThingSpeak entries</p>
          </div>
          <span className={styles.tableTag}>Data source: ThingSpeak channel</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Water (%)</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
