import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Componentes Globais da Vitrine
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Páginas do E-commerce (Vitrine)
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import LegalPage from './pages/LegalPage';

// Páginas da Gestão (Admin)
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ClientArea from './pages/ClientArea';
import PaymentSuccess from './pages/PaymentSuccess';

// Carrinho de Compras (Context + Drawer)
import { CartProvider } from './context/CartContext';
import { DataProvider } from './context/DataContext';
import CartDrawer from './components/CartDrawer';

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listener Global para redirecionamento inteligente de Admins
    // Útil para convites por e-mail e login social
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        // Verifica se é administrador
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .single();

        // Se for admin e estiver em uma rota de "cliente" ou "login", manda pro painel
        const publicPaths = ['/', '/login', '/minha-conta'];
        if (adminRecord && publicPaths.includes(window.location.pathname)) {
          navigate('/admin');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <DataProvider>
      <CartProvider>
        <CartDrawer />
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
          
          <Route path="/legal" element={
            <>
              <Navbar />
              <LegalPage />
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

          <Route path="/produtos/:id" element={
            <>
              <Navbar />
              <ProductDetail />
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

          <Route path="/checkout" element={
            <>
              <Navbar />
              <Checkout />
              <Footer />
            </>
          } />

          {/* ----- MÓDULO DE LOGIN ----- */}
          <Route path="/login" element={<Login />} />
          <Route path="/pagamento-sucesso" element={
            <>
              <Navbar />
              <PaymentSuccess />
              <Footer />
            </>
          } />
          <Route path="/minha-conta" element={
            <ProtectedRoute>
              <Navbar />
              <ClientArea />
              <Footer />
            </ProtectedRoute>
          } />

          {/* ----- GESTÃO ADMIN (Módulo Privado) ----- */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback 404 simple */}
          <Route path="*" element={<h1 style={{textAlign:'center', marginTop:'50px'}}>404 - Página não encontrada</h1>} />
        </Routes>
      </div>
    </CartProvider>
  </DataProvider>
);
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;