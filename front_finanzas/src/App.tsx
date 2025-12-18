import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Ingresos from './components/Ingresos'
import Gastos from './components/Gastos'
import Tarjetas from './components/Tarjetas'
import Prestamos from './components/Prestamos'
import Inversiones from './components/Inversiones'
import Proyecciones from './components/Proyecciones'
import Reportes from './components/Reportes'
import Alertas from './components/Alertas'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">💰 Finanzas Personales</h1>
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/ingresos">Ingresos</Link>
              <Link to="/gastos">Gastos</Link>
              <Link to="/tarjetas">Tarjetas</Link>
              <Link to="/prestamos">Préstamos</Link>
              <Link to="/inversiones">Inversiones</Link>
              <Link to="/proyecciones">Proyecciones</Link>
              <Link to="/reportes">Reportes</Link>
              <Link to="/alertas">Alertas</Link>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/tarjetas" element={<Tarjetas />} />
            <Route path="/prestamos" element={<Prestamos />} />
            <Route path="/inversiones" element={<Inversiones />} />
            <Route path="/proyecciones" element={<Proyecciones />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/alertas" element={<Alertas />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App


