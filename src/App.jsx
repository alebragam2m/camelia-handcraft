import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componentes Globais da Vitrine
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Páginas do E-commerce (Vitrine)
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductsPage from './pages/ProductsPage';
import Contact from './pages/Contact';

// Páginas da Gestão (Admin)
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ----- E-COMMERCE (Módulo Público) ----- */}
          <Route path="/" element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          } />
          
          <Route path="/colecoes" element={
            <>
              <Navbar />
              <Collections />
              <Footer />
            </>
          } />
          
          <Route path="/produtos" element={
            <>
              <Navbar />
              <ProductsPage />
              <Footer />
            </>
          } />

          <Route path="/contato" element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          } />

          {/* ----- MÓDULO DE LOGIN ----- */}
          <Route path="/login" element={<Login />} />

          {/* ----- GESTÃO ADMIN (Módulo Privado) ----- */}
          {/* As rotas de painel estão envelopadas no ProtectedRoute */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback 404 simple */}
          <Route path="*" element={<h1 style={{textAlign:'center', marginTop:'50px'}}>404 - Página não encontrada</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;