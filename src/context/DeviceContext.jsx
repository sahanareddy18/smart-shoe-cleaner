import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  deepStepIndex,
  dryStepIndex,
  profileLabel,
} from '../constants/processPipeline'

const STORAGE_KEY = 'ssc-thingspeak-prefs'
const LOG_KEY = 'ssc-cleaning-logs'

const defaultPrefs = {
  shoeProfile: 'sports',
  intensity: 3,
  notificationsEnabled: true,
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultPrefs }
    return { ...defaultPrefs, ...JSON.parse(raw) }
  } catch {
    return { ...defaultPrefs }
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)))
  } catch {
    /* ignore */
  }
}

function parseSensorValue(field) {
  if (field === undefined || field === null || field === '') return null
  const num = parseFloat(field)
  return Number.isFinite(num) ? num : null
}

const THINGSPEAK_CHANNEL_ID = import.meta.env.VITE_THINGSPEAK_CHANNEL_ID ?? '453963'
const THINGSPEAK_API_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?results=20`

const DeviceContext = createContext(null)

export function DeviceProvider({ children }) {
  const [prefs, setPrefsState] = useState(loadPrefs)
  const [cyclePhase, setCyclePhase] = useState('idle')
  const [mode, setMode] = useState('deep_clean')
  const [progress, setProgress] = useState(0)
  const [timeRemainingSec, setTimeRemainingSec] = useState(0)
  const [temperatureC, setTemperatureC] = useState(28.0)
  const [humidityPct, setHumidityPct] = useState(35)
  const [waterTankPct, setWaterTankPct] = useState(22)
  const [shoeConditionScore, setShoeConditionScore] = useState(52)
  const [waterUsedMl, setWaterUsedMl] = useState(0)
  const [energyWh, setEnergyWh] = useState(0)
  const [filterLifePct, setFilterLifePct] = useState(64)
  const [uvLampHoursLeft, setUvLampHoursLeft] = useState(420)
  const [thingSpeakHistory, setThingSpeakHistory] = useState([])
  const [thingSpeakStatus, setThingSpeakStatus] = useState('waiting')
  const [thingSpeakError, setThingSpeakError] = useState(null)
  const [thingSpeakLastSync, setThingSpeakLastSync] = useState(null)
  const [thingSpeakLoading, setThingSpeakLoading] = useState(false)
  const [schedules, setSchedules] = useState([
    { id: '1', label: 'Weekday morning', weekday: 1, hour: 7, minute: 30, mode: 'deep_clean' },
    { id: '2', label: 'Sunday refresh', weekday: 0, hour: 10, minute: 0, mode: 'dry_only' },
  ])
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      type: 'maintenance',
      title: 'Water level moderate',
      body: 'Refill tank before next deep clean.',
      time: Date.now() - 3600000,
      read: false,
    },
    {
      id: 'n2',
      type: 'insight',
      title: 'Shoe health insight',
      body: 'Random Forest model estimates ~38 wash cycles remaining for current pair profile.',
      time: Date.now() - 86400000,
      read: true,
    },
  ])
  const [cleaningLogs, setCleaningLogs] = useState(loadLogs)
  const [cycleActiveProfile, setCycleActiveProfile] = useState(null)
  const [cycleProfileSource, setCycleProfileSource] = useState(null)
  const [processStepIndex, setProcessStepIndex] = useState(0)

  const tickRef = useRef(null)
  const totalDurationRef = useRef(0)
  const completionLockRef = useRef(false)
  const warnedWaterRef = useRef(false)
  const warnedTempRef = useRef(false)

  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  const pushNotification = useCallback((n) => {
    setNotifications((list) => [
      { id: `n-${Date.now()}`, time: Date.now(), read: false, ...n },
      ...list,
    ].slice(0, 50))
  }, [])

  const markNotificationRead = useCallback((id) => {
    setNotifications((list) =>
      list.map((x) => (x.id === id ? { ...x, read: true } : x)),
    )
  }, [])

  const appendLog = useCallback((entry) => {
    setCleaningLogs((logs) => {
      const next = [entry, ...logs].slice(0, 200)
      saveLogs(next)
      return next
    })
  }, [])

  const startCycle = useCallback(
    (quickMode, opts = {}) => {
      const m = quickMode ?? mode
      const profileId = opts.profileId ?? prefs.shoeProfile
      const source = opts.source ?? 'manual'
      setMode(m)
      setCycleActiveProfile(profileId)
      setCycleProfileSource(source)
      setProcessStepIndex(0)
      const baseSec = m === 'dry_only' ? 420 : m === 'deep_clean' ? 900 : 600
      totalDurationRef.current = baseSec
      completionLockRef.current = false
      setTimeRemainingSec(baseSec)
      setProgress(0)
      setCyclePhase(m === 'dry_only' ? 'drying' : 'washing')
      pushNotification({
        type: 'cycle',
        title: 'Cycle started',
        body: `${profileLabel(profileId)} · ${m === 'dry_only' ? 'Dry only' : 'Deep clean'} (${source === 'detect' ? 'auto-detected' : 'manual'}).`,
      })
    },
    [mode, prefs.shoeProfile, pushNotification],
  )

  const pauseCycle = useCallback(() => {
    if (cyclePhase === 'idle' || cyclePhase === 'paused') return
    setCyclePhase('paused')
    pushNotification({ type: 'cycle', title: 'Paused', body: 'Cycle paused by user.' })
  }, [cyclePhase, pushNotification])

  const resumeCycle = useCallback(() => {
    if (cyclePhase !== 'paused') return
    setCyclePhase((prev) => (mode === 'dry_only' ? 'drying' : 'washing'))
  }, [cyclePhase, mode])

  const stopCycle = useCallback(() => {
    if (cyclePhase === 'idle') return
    setCyclePhase('idle')
    setProgress(0)
    setTimeRemainingSec(0)
    setProcessStepIndex(0)
    setCycleActiveProfile(null)
    setCycleProfileSource(null)
    appendLog({
      id: `log-${Date.now()}`,
      endedAt: Date.now(),
      mode,
      waterMl: waterUsedMl,
      wh: energyWh,
      outcome: 'stopped',
    })
    pushNotification({
      type: 'cycle',
      title: 'Cycle stopped',
      body: 'Operation ended before completion.',
    })
  }, [cyclePhase, mode, waterUsedMl, energyWh, appendLog, pushNotification])

  useEffect(() => {
    if (cyclePhase === 'idle' || cyclePhase === 'paused') {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }

    tickRef.current = setInterval(() => {
      setTimeRemainingSec((t) => {
        if (t <= 0) return 0
        const next = t - 1
        const total = totalDurationRef.current || 900
        if (next === 0 && !completionLockRef.current) {
          completionLockRef.current = true
          setCyclePhase('idle')
          setProgress(100)
          setCycleActiveProfile(null)
          setCycleProfileSource(null)
          appendLog({
            id: `log-${Date.now()}`,
            endedAt: Date.now(),
            mode,
            waterMl: waterUsedMl + (mode === 'dry_only' ? 0 : 120),
            wh: energyWh + 8,
            outcome: 'complete',
          })
          pushNotification({
            type: 'cycle',
            title: 'Cycle complete',
            body: 'Your shoes are ready. Chamber drying complete.',
          })
          setFilterLifePct((f) => Math.max(0, f - 0.4))
          return 0
        }
        setProgress(Math.round(((total - next) / total) * 100))
        return next
      })

      setTemperatureC((x) => +(x + (Math.random() - 0.45) * 0.3).toFixed(1))
      setHumidityPct((h) =>
        Math.min(95, Math.max(25, Math.round(h + (Math.random() - 0.5) * 2))),
      )
      if (mode !== 'dry_only') {
        setWaterTankPct((w) => Math.max(5, w - 0.02))
        setWaterUsedMl((w) => w + 2)
      }
      setEnergyWh((e) => e + 0.05)
      setShoeConditionScore((s) =>
        Math.min(100, Math.max(40, Math.round(s + (Math.random() - 0.52)))),
      )
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [cyclePhase, mode, appendLog, pushNotification, waterUsedMl, energyWh])

  useEffect(() => {
    if (cyclePhase === 'idle') {
      if (progress >= 100) {
        setProcessStepIndex(mode === 'dry_only' ? 5 : 7)
      }
      return
    }
    if (cyclePhase === 'paused') return
    setProcessStepIndex(
      mode === 'dry_only' ? dryStepIndex(progress) : deepStepIndex(progress),
    )
  }, [cyclePhase, progress, mode])

  useEffect(() => {
    if (waterTankPct < 15) {
      if (!warnedWaterRef.current) {
        warnedWaterRef.current = true
        pushNotification({
          type: 'warning',
          title: 'Low water',
          body: 'Tank critically low. Refill to avoid damage.',
        })
      }
    } else if (waterTankPct > 25) {
      warnedWaterRef.current = false
    }
  }, [waterTankPct, pushNotification])

  useEffect(() => {
    if (temperatureC > 48) {
      if (!warnedTempRef.current) {
        warnedTempRef.current = true
        pushNotification({
          type: 'warning',
          title: 'Temperature anomaly',
          body: 'Chamber temperature high. Cycle safeguards engaged.',
        })
      }
    } else if (temperatureC < 44) {
      warnedTempRef.current = false
    }
  }, [temperatureC, pushNotification])

  const addSchedule = useCallback((item) => {
    setSchedules((s) => [...s, { id: `s-${Date.now()}`, ...item }])
  }, [])

  const removeSchedule = useCallback((id) => {
    setSchedules((s) => s.filter((x) => x.id !== id))
  }, [])

  const restoreOptimalReadings = useCallback(() => {
    setWaterTankPct(55)
    setTemperatureC(22)
    setHumidityPct(50)
    setShoeConditionScore(82)
    pushNotification({
      type: 'maintenance',
      title: 'Readings normalized',
      body: 'Tank and chamber values set to the optimal band.',
    })
  }, [pushNotification])

  const refreshThingSpeakData = useCallback(async () => {
    setThingSpeakLoading(true)
    setThingSpeakStatus('loading')
    setThingSpeakError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 9000)
      const response = await fetch(THINGSPEAK_API_URL, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      let feeds = data.feeds || []
      if (feeds.length > 20) feeds = feeds.slice(-20)

      setThingSpeakHistory(feeds)
      setThingSpeakLastSync(Date.now())
      setThingSpeakStatus('ok')

      const latest = feeds[feeds.length - 1]
      if (latest) {
        const temp = parseSensorValue(latest.field1)
        const hum = parseSensorValue(latest.field2)
        const water = parseSensorValue(latest.field3)

        if (temp !== null) setTemperatureC(temp)
        if (hum !== null) setHumidityPct(hum)
        if (water !== null) setWaterTankPct(water)
      }
    } catch (error) {
      setThingSpeakStatus('error')
      setThingSpeakError(error?.message ?? 'Network error')
    } finally {
      setThingSpeakLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshThingSpeakData()
    const interval = setInterval(refreshThingSpeakData, 15000)
    return () => clearInterval(interval)
  }, [refreshThingSpeakData])

  const value = useMemo(
    () => ({
      prefs,
      setPrefs,
      cyclePhase,
      mode,
      setMode,
      progress,
      timeRemainingSec,
      temperatureC,
      humidityPct,
      waterTankPct,
      shoeConditionScore,
      waterUsedMl,
      energyWh,
      filterLifePct,
      uvLampHoursLeft,
      schedules,
      addSchedule,
      removeSchedule,
      notifications,
      pushNotification,
      markNotificationRead,
      cleaningLogs,
      startCycle,
      pauseCycle,
      resumeCycle,
      stopCycle,
      cycleActiveProfile,
      cycleProfileSource,
      processStepIndex,
      restoreOptimalReadings,
      thingSpeakHistory,
      thingSpeakStatus,
      thingSpeakError,
      thingSpeakLastSync,
      thingSpeakLoading,
      refreshThingSpeakData,
    }),
    [
      prefs,
      setPrefs,
      cyclePhase,
      mode,
      progress,
      timeRemainingSec,
      temperatureC,
      humidityPct,
      waterTankPct,
      shoeConditionScore,
      waterUsedMl,
      energyWh,
      filterLifePct,
      uvLampHoursLeft,
      schedules,
      addSchedule,
      removeSchedule,
      notifications,
      pushNotification,
      markNotificationRead,
      cleaningLogs,
      startCycle,
      pauseCycle,
      resumeCycle,
      stopCycle,
      cycleActiveProfile,
      cycleProfileSource,
      processStepIndex,
      restoreOptimalReadings,
      thingSpeakHistory,
      thingSpeakStatus,
      thingSpeakError,
      thingSpeakLastSync,
      thingSpeakLoading,
      refreshThingSpeakData,
    ],
  )

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  )
}

export function useDevice() {
  const ctx = useContext(DeviceContext)
  if (!ctx) throw new Error('useDevice must be used within DeviceProvider')
  return ctx
}
