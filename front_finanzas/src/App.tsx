import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Ingresos from './components/Ingresos'
import Gastos from './components/Gastos'
import Tarjetas from './components/Tarjetas'
import Prestamos from './components/Prestamos'
import Inversiones from './components/Inversiones'
import Proyecciones from './components/Proyecciones'
import Reportes from './components/Reportes'
import Alertas from './components/Alertas'
import ProcesarPDF from './components/ProcesarPDF'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">Finanzas Personales</h1>
            <div className="nav-links">
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/ingresos">Ingresos</NavLink>
              <NavLink to="/gastos">Gastos</NavLink>
              <NavLink to="/tarjetas">Tarjetas</NavLink>
              <NavLink to="/prestamos">Préstamos</NavLink>
              <NavLink to="/inversiones">Inversiones</NavLink>
              <NavLink to="/proyecciones">Proyecciones</NavLink>
              <NavLink to="/reportes">Reportes</NavLink>
              <NavLink to="/alertas">Alertas</NavLink>
              <NavLink to="/procesar-pdf">Procesar PDF</NavLink>
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
            <Route path="/procesar-pdf" element={<ProcesarPDF />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App


