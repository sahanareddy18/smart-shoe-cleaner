import { useMemo, useState } from 'react'
import { useDevice } from '../context/DeviceContext'
import styles from './Pages.module.css'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Schedule() {
  const { schedules, addSchedule, removeSchedule } = useDevice()
  const [label, setLabel] = useState('Morning cycle')
  const [weekday, setWeekday] = useState(1)
  const [hour, setHour] = useState(7)
  const [minute, setMinute] = useState(0)
  const [schedMode, setSchedMode] = useState('deep_clean')

  const sorted = useMemo(
    () => [...schedules].sort((a, b) => a.weekday - b.weekday || a.hour - b.hour),
    [schedules],
  )

  function submit(e) {
    e.preventDefault()
    addSchedule({
      label: label.trim() || 'Scheduled clean',
      weekday: Number(weekday),
      hour: Number(hour),
      minute: Number(minute),
      mode: schedMode,
    })
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = useMemo(() => {
    const out = []
    for (let i = 0; i < firstDow; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(d)
    return out
  }, [firstDow, daysInMonth])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Scheduling</h1>
      <p className={styles.intro}>
        Custom cleaning schedules with a month calendar (local view). Integrate
        Export to your system calendar can be added later.
      </p>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className={styles.calHead}>
          {weekdays.map((w) => (
            <span key={w} className={styles.calDow}>
              {w}
            </span>
          ))}
        </div>
        <div className={styles.calGrid}>
          {cells.map((d, i) => (
            <div
              key={i}
              className={`${styles.calCell} ${d === now.getDate() ? styles.calToday : ''}`}
            >
              {d ?? ''}
            </div>
          ))}
        </div>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>New weekly rule</h2>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            Label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            Weekday
            <select
              className={styles.input}
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
            >
              {weekdays.map((w, idx) => (
                <option key={w} value={idx}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.timeRow}>
            <label className={styles.field}>
              Hour
              <input
                type="number"
                min={0}
                max={23}
                className={styles.input}
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              Minute
              <input
                type="number"
                min={0}
                max={59}
                className={styles.input}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
            </label>
          </div>
          <label className={styles.field}>
            Mode
            <select
              className={styles.input}
              value={schedMode}
              onChange={(e) => setSchedMode(e.target.value)}
            >
              <option value="deep_clean">Deep clean</option>
              <option value="dry_only">Dry only</option>
            </select>
          </label>
          <button type="submit" className={styles.primary}>
            Add schedule
          </button>
        </form>
      </article>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Upcoming rules</h2>
        <ul className={styles.list}>
          {sorted.map((s) => (
            <li key={s.id} className={styles.listItem}>
              <div>
                <strong>{s.label}</strong>
                <div className={styles.muted}>
                  {weekdays[s.weekday]} · {String(s.hour).padStart(2, '0')}:
                  {String(s.minute).padStart(2, '0')} ·{' '}
                  {s.mode === 'dry_only' ? 'Dry only' : 'Deep clean'}
                </div>
              </div>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => removeSchedule(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
