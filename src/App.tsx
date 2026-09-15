import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import DataSync from './components/DataSync';
import SessionProvider from './components/SessionProvider';

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
import Signup from './pages/Signup';
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
  return (
    <CartProvider>
      <DataSync />
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
          <Route path="/cadastro" element={<Signup />} />
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
      <SessionProvider><AppContent /></SessionProvider>
    </Router>
  );
}

export default App;
