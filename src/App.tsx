import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Global View Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// E-commerce Pages
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import LegalPage from './pages/LegalPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ClientArea from './pages/ClientArea';
import PaymentSuccess from './pages/PaymentSuccess';

// Contexts
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * MISSION CRITICAL: Auth Listener
     * Redireciona admins para o painel se tentarem acessar rotas públicas logados.
     *
     * navigate excluído das deps intencionalmente: a referência estável do
     * router é suficiente e evita re-registrar o listener a cada render,
     * o que causava múltiplos onAuthStateChange simultâneos e o erro
     * "Lock stolen" no localStorage do Supabase.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const { data: adminRecord, error } = await supabase
          .from('admin_users')
          .select('access_level, is_active')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error("[Auth Auditor] Erro de Schema detectado. Fallback ativado.");
        }

        const publicPaths = ['/', '/login', '/minha-conta'];
        if (adminRecord?.is_active && (adminRecord.access_level || 0) >= 2 && publicPaths.includes(window.location.pathname)) {
          navigate('/admin');
        }
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartProvider>
      <CartDrawer />
      <div className="App">
        <Routes>
          {/* ----- PUBLIC MODULE ----- */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/legal" element={<><Navbar /><LegalPage /><Footer /></>} />
          <Route path="/colecoes" element={<><Navbar /><Collections /><Footer /></>} />
          <Route path="/produtos" element={<><Navbar /><ProductsPage /><Footer /></>} />
          <Route path="/produtos/:id" element={<><Navbar /><ProductDetail /><Footer /></>} />
          <Route path="/contato" element={<><Navbar /><Contact /><Footer /></>} />
          <Route path="/checkout" element={<><Navbar /><Checkout /><Footer /></>} />

          {/* ----- AUTH MODULE ----- */}
          <Route path="/login" element={<Login />} />
          <Route path="/pagamento-sucesso" element={<><Navbar /><PaymentSuccess /><Footer /></>} />
          <Route path="/minha-conta" element={
            <ProtectedRoute>
              <Navbar />
              <ClientArea />
              <Footer />
            </ProtectedRoute>
          } />

          {/* ----- ADMIN MODULE (PRIVATE) ----- */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* 404 Fallback */}
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center font-serif text-2xl text-secundaria italic">404 - Página não encontrada</div>} />
        </Routes>
      </div>
    </CartProvider>
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
