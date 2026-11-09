import React, { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './hooks/AuthProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import LaunchScreen, { isLaunched } from './components/LaunchScreen';
import Home from './pages/Home';
import News from './pages/News';
import Calendrier from './pages/Calendrier';
import MatchDetail from './pages/MatchDetail';
import NewsDetail from './pages/NewsDetail';
import Players from './pages/Players';
import Teams from './pages/Teams';
import EquipeA from './pages/EquipeA';
import TeamDetail from './pages/TeamDetail';
import EquipeU19 from './pages/EquipeU19';
import EquipeU17 from './pages/EquipeU17';
import EquipeU15 from './pages/EquipeU15';
import EquipeU12 from './pages/EquipeU12';
import Legends from './pages/Legends';
import History from './pages/History';
import President from './pages/President';
import LegendDetail from './pages/LegendDetail';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Subscriptions from './pages/Subscriptions';
import Gallery from './pages/Gallery';
import AlbumDetail from './pages/AlbumDetail';
import Billetterie from './pages/Billetterie';
import Dons from './pages/Dons';
import DonMerci from './pages/DonMerci';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Joueurs from './pages/admin/Joueurs';
import Produits from './pages/admin/Produits';
import ArticlesAdmin from './pages/admin/ArticlesAdmin';
import Parametres from './pages/admin/Parametres';
import LegendesAdmin from './pages/admin/LegendesAdmin';
import HistoireAdmin from './pages/admin/HistoireAdmin';
import CarrouselAdmin from './pages/admin/CarrouselAdmin';
import CalendrierAdmin from './pages/admin/CalendrierAdmin';
import GalerieAdmin from './pages/admin/GalerieAdmin';
import EquipesAdmin from './pages/admin/EquipesAdmin';
import BilletterieAdmin from './pages/admin/BilletterieAdmin';
import Commandes from './pages/admin/Commandes';
import Utilisateurs from './pages/admin/Utilisateurs';
import StatistiquesAdmin from './pages/admin/StatistiquesAdmin';
import ContenuSiteAdmin from './pages/admin/ContenuSiteAdmin';
import JoueurDuMoisAdmin from './pages/admin/JoueurDuMoisAdmin';
import DonsAdmin from './pages/admin/DonsAdmin';
import NotFound from './pages/NotFound';
import { CartProvider } from './hooks/CartProvider';

const InnerApp: React.FC = () => {
  const { loading, isStaff } = useAuth();
  const location = useLocation();
  const [launched, setLaunched] = useState(() => isLaunched());
  const handleLaunch = useCallback(() => setLaunched(true), []);
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-graphite"><LoadingSpinner /></div>;
  }
  // Avant l'ouverture, le public ne voit que l'écran de lancement ; l'équipe
  // du club garde l'accès à la connexion et à l'administration pour préparer.
  if (!launched && !isStaff && !isAdminRoute && location.pathname !== '/login') {
    return <CartProvider><LaunchScreen onLaunch={handleLaunch} /></CartProvider>;
  }
  return (
    <CartProvider>
      <div className="min-h-screen bg-graphite">
        {!isAdminRoute && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendrier" element={<Calendrier />} />
            <Route path="/calendrier/:id" element={<MatchDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/players" element={<Players />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
            <Route path="/equipe-a" element={<EquipeA />} />
            <Route path="/equipe-u19" element={<EquipeU19 />} />
            <Route path="/equipe-u17" element={<EquipeU17 />} />
            <Route path="/equipe-u15" element={<EquipeU15 />} />
            <Route path="/equipe-u12" element={<EquipeU12 />} />
            <Route path="/legends" element={<Legends />} />
            <Route path="/legends/:id" element={<LegendDetail />} />
            <Route path="/histoire" element={<History />} />
            <Route path="/mot-du-president" element={<President />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/commande" element={<Checkout />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/galerie" element={<Gallery />} />
            <Route path="/galerie/:id" element={<AlbumDetail />} />
            <Route path="/billetterie" element={<Billetterie />} />
            <Route path="/dons" element={<Dons />} />
            <Route path="/dons/merci" element={<DonMerci />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/dashbord" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/equipes" element={<ProtectedRoute permission="players:write"><AdminLayout><EquipesAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/joueurs" element={<ProtectedRoute permission="players:write"><AdminLayout><Joueurs /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/contenu" element={<ProtectedRoute permission="settings:write"><AdminLayout><ContenuSiteAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/joueur-du-mois" element={<ProtectedRoute permission="players:write"><AdminLayout><JoueurDuMoisAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/statistiques" element={<ProtectedRoute permission="players:write"><AdminLayout><StatistiquesAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/produits" element={<ProtectedRoute permission="products:write"><AdminLayout><Produits /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/commandes" element={<ProtectedRoute permission="orders:manage"><AdminLayout><Commandes /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/articles" element={<ProtectedRoute permission="articles:write"><AdminLayout><ArticlesAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/legendes" element={<ProtectedRoute permission="legends:write"><AdminLayout><LegendesAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/histoire" element={<ProtectedRoute permission="history:write"><AdminLayout><HistoireAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/carrousel" element={<ProtectedRoute permission="hero:write"><AdminLayout><CarrouselAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calendrier" element={<ProtectedRoute permission="matches:write"><AdminLayout><CalendrierAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/galerie" element={<ProtectedRoute permission="gallery:write"><AdminLayout><GalerieAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/billetterie" element={<ProtectedRoute permission="orders:manage"><AdminLayout><BilletterieAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/dons" element={<ProtectedRoute permission="orders:manage"><AdminLayout><DonsAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/utilisateurs" element={<ProtectedRoute permission="users:manage"><AdminLayout><Utilisateurs /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/parametres" element={<ProtectedRoute><AdminLayout><Parametres /></AdminLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </CartProvider>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  </Router>
);

export default App;
