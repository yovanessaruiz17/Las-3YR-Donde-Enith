/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';

import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { ScrollToTop } from './components/common/ScrollToTop';

import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { CategoryPage } from './pages/CategoryPage';
import { BrandPage } from './pages/BrandPage';
import { OffersPage } from './pages/OffersPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { Checkout } from './pages/Checkout';
import { ContactPage } from './pages/ContactPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsAndConditions } from './pages/legal/TermsAndConditions';
import { ShippingPolicy } from './pages/legal/ShippingPolicy';
import { ReturnsPolicy } from './pages/legal/ReturnsPolicy';

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <div className="min-h-screen flex flex-col bg-[#FCFAF8] text-[#163E2B] font-sans antialiased selection:bg-[#FCE7F0] selection:text-[#D83173]">
                {/* Main Navigation Header (includes the sticky announcement bar without duplication) */}
                <Header />

                {/* Main Content Area */}
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/productos" element={<Products />} />
                    <Route path="/producto/:slug" element={<ProductDetail />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="/marca/:slug" element={<BrandPage />} />
                    <Route path="/ofertas" element={<OffersPage />} />
                    <Route path="/favoritos" element={<FavoritesPage />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contacto" element={<ContactPage />} />
                    <Route path="/cuenta" element={<AccountPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Legal and Policy Pages */}
                    <Route path="/politicas-de-privacidad" element={<PrivacyPolicy />} />
                    <Route path="/privacidad" element={<PrivacyPolicy />} />
                    <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
                    <Route path="/terminos" element={<TermsAndConditions />} />
                    <Route path="/politica-de-envios" element={<ShippingPolicy />} />
                    <Route path="/envios" element={<ShippingPolicy />} />
                    <Route path="/cambios-y-devoluciones" element={<ReturnsPolicy />} />
                    <Route path="/devoluciones" element={<ReturnsPolicy />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                {/* Slide-out Shopping Cart matching screenshot */}
                <CartDrawer />

                {/* WhatsApp Floating Contact Button */}
                <FloatingWhatsApp />

                {/* Site Footer matching screenshot */}
                <Footer />
              </div>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </StoreProvider>
  );
}
