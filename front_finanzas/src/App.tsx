import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
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
            <h1 className="nav-title">💰 Finanzas Personales</h1>
            <ul className="nav-menu">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/ingresos">Ingresos</Link></li>
              <li><Link to="/gastos">Gastos</Link></li>
              <li><Link to="/tarjetas">Tarjetas</Link></li>
              <li><Link to="/prestamos">Préstamos</Link></li>
              <li><Link to="/inversiones">Inversiones</Link></li>
              <li><Link to="/proyecciones">Proyecciones</Link></li>
              <li><Link to="/reportes">Reportes</Link></li>
              <li><Link to="/alertas">Alertas</Link></li>
              <li><Link to="/procesar-pdf">Procesar PDF</Link></li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
