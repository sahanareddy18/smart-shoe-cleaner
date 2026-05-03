import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Control from './pages/Control'
import Schedule from './pages/Schedule'
import Personalize from './pages/Personalize'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="control" element={<Control />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="personalize" element={<Personalize />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
