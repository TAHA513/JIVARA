import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import { default as ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/hooks/use-cart";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import FloatingCartButton from "@/components/floating-cart-button";
import { useVisitorTracking } from "./hooks/use-visitor-tracking";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Offers from "@/pages/offers";
import About from "@/pages/about";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsConditions from "@/pages/terms-conditions";
import ReturnPolicy from "@/pages/return-policy";
import ShippingPolicy from "@/pages/shipping-policy";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminPrintOrders from "@/pages/admin/print-orders";
import AdminCustomers from "@/pages/admin/customers";
import AdminSettings from "@/pages/admin/settings";
import AdminReports from "@/pages/admin/reports";
import SalesTracker from "@/pages/admin/sales-tracker";
import ProfitReports from "@/pages/admin/profit-reports";
import FinancialProducts from "@/pages/admin/financial-products";
import ThemeGallery from "@/pages/admin/theme-gallery";
import NotFound from "@/pages/not-found";
import BuyNow from "@/pages/buy";
import BundlePage from "@/pages/bundle";
import BundleShoesPage from "@/pages/bundle-shoes";
import ShoesEasyPage from "@/pages/shoes-easy";
import BambooPage from "@/pages/bamboo";
import BambooPPage from "@/pages/bamboo-p";
import MamamePage from "@/pages/mamame";
import WatchesEasyPage from "@/pages/watches-easy";
import WatchesBPage from "@/pages/watches-b";
import ZtBambooPage from "@/pages/zt-bamboo";
import Zt2Page from "@/pages/zt2";
import NaturalWalkerPage from "@/pages/naturalwalker";
import NaturalWalker2Page from "@/pages/naturalwalker2";
import KneePadPage from "@/pages/knee-pad";
import KneePadQPage from "@/pages/knee-pad-q";
import KneePad2Page from "@/pages/knee-pad-2";
import BullcaptainBeltPage from "@/pages/bullcaptain-belt";
import PoedagarWatchPage from "@/pages/poedagar-watch";
import BundlePackPage from "@/pages/bundle-pack";
import BoxerMenPage from "@/pages/boxer-men";
import SocksUaePage from "@/pages/socks-uae";
import SocksIqPage from "@/pages/socks-iq";
import SocksPackPage from "@/pages/socks-pack";
import BambooSocksPage from "@/pages/bamboo-socks";
import JadafPage from "@/pages/jadaf";
import JadafProductDetail from "@/pages/jadaf-product-detail";
import ShopPage from "@/pages/shop";
import SupplierPage from "@/pages/supplier";
import CampaignLinks from "@/pages/admin/campaign-links";
import DiscountCodes from "@/pages/admin/discount-codes";
import AlwaseetPage from "@/pages/admin/alwaseet";
import WhatsAppSetup from "@/pages/admin/whatsapp";
import FbAdsPage from "@/pages/admin/fb-ads";
import MessengerBroadcast from "@/pages/admin/messenger-broadcast";
import PixelDashboard from "@/pages/admin/pixel-dashboard";
import SocialManager from "@/pages/admin/social-manager";
import FunnelAnalytics from "@/pages/admin/funnel-analytics";
import IntelligencePage from "@/pages/admin/intelligence";
import AiDesignerPage from "@/pages/admin/ai-designer";
import AiChatPage from "@/pages/admin/ai-chat";
import InventoryPage from "@/pages/admin/inventory";
import ReturnsPage from "@/pages/admin/returns";
import ExpensesPage from "@/pages/admin/expenses";
import NotificationsPage from "@/pages/admin/notifications";
import PermissionsPage from "@/pages/admin/permissions";
import CashierPage from "@/pages/admin/cashier";
import { useLocation } from "wouter";
import { useEffect } from "react";

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  const isBuyRoute = location.startsWith('/buy');
  const isBundleRoute = location.startsWith('/bundle') || location === '/bamboo' || location === '/bamboo-p' || location === '/mamame' || location === '/shoes-easy' || location === '/watches-easy' || location === '/watches-b' || location === '/shoes-b' || location === '/zt' || location === '/zt2' || location === '/naturalwalker' || location === '/naturalwalker2' || location === '/knee-pad' || location === '/knee-pad-q' || location === '/knee-pad-2' || location === '/bullcaptain-belt' || location === '/poedagar-watch' || location === '/boxer-men' || location === '/socks-uae' || location === '/socks-iq' || location === '/socks-pack' || location === '/bamboo-socks' || location === '/jadaf' || location.startsWith('/jadaf/') || location === '/supplier' || location === '/pack';
  const isShopRoute = location === '/shop';
  
  // استعادة التمرير إلى الأعلى عند تغيير الصفحة (حل مشكلة عدم فتح المنتج من الأعلى)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);
  
  // Track visitors (skip admin pages)
  useVisitorTracking(isAdminRoute);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <CartProvider>
            <div className="min-h-screen bg-background text-foreground" dir="rtl">
              {isShopRoute ? (
                <Route path="/shop" component={ShopPage} />
              ) : isBundleRoute ? (
                <Switch>
                  <Route path="/bundle" component={BundlePage} />
                  <Route path="/bundle-pack" component={BundlePackPage} />
                  <Route path="/pack" component={BundlePackPage} />
                  <Route path="/bundle-shoes" component={BundleShoesPage} />
                  <Route path="/shoes-b" component={BundleShoesPage} />
                  <Route path="/shoes-easy" component={ShoesEasyPage} />
                  <Route path="/bamboo" component={BambooPage} />
                  <Route path="/bamboo-p" component={BambooPPage} />
                  <Route path="/mamame" component={MamamePage} />
                  <Route path="/watches-easy" component={WatchesEasyPage} />
                  <Route path="/watches-b" component={WatchesBPage} />
                  <Route path="/zt" component={ZtBambooPage} />
                  <Route path="/zt2" component={Zt2Page} />
                  <Route path="/naturalwalker" component={NaturalWalkerPage} />
                  <Route path="/naturalwalker2" component={NaturalWalker2Page} />
                  <Route path="/knee-pad" component={KneePadPage} />
                  <Route path="/knee-pad-q" component={KneePadQPage} />
                  <Route path="/knee-pad-2" component={KneePad2Page} />
                  <Route path="/bullcaptain-belt" component={BullcaptainBeltPage} />
                  <Route path="/poedagar-watch" component={PoedagarWatchPage} />
                  <Route path="/boxer-men" component={BoxerMenPage} />
                  <Route path="/socks-uae" component={SocksUaePage} />
                  <Route path="/socks-iq" component={SocksIqPage} />
                  <Route path="/socks-pack" component={SocksPackPage} />
                  <Route path="/bamboo-socks" component={BambooSocksPage} />
                  <Route path="/jadaf" component={JadafPage} />
                  <Route path="/jadaf/product/:id" component={JadafProductDetail} />
                  <Route path="/supplier" component={SupplierPage} />
                </Switch>
              ) : isBuyRoute ? (
                <Switch>
                  <Route path="/buy/:id" component={BuyNow} />
                </Switch>
              ) : isAdminRoute ? (
                // Admin Layout - No Header/Footer
                <Switch>
                  <Route path="/admin/login" component={AdminLogin} />
                  <Route path="/admin/products/new" component={AdminProducts} />
                  <Route path="/admin/products" component={AdminProducts} />
                  <Route path="/admin/categories" component={AdminCategories} />
                  <Route path="/admin/orders" component={AdminOrders} />
                  <Route path="/admin/print-orders" component={AdminPrintOrders} />
                  <Route path="/admin/customers" component={AdminCustomers} />
                  <Route path="/admin/theme-gallery" component={ThemeGallery} />
                  <Route path="/admin/settings" component={AdminSettings} />
                  <Route path="/admin/reports" component={AdminReports} />
                  <Route path="/admin/financial-products" component={FinancialProducts} />
                  <Route path="/admin/sales-tracker" component={SalesTracker} />
                  <Route path="/admin/profit-reports" component={ProfitReports} />
                  <Route path="/admin/campaign-links" component={CampaignLinks} />
                  <Route path="/admin/discount-codes" component={DiscountCodes} />
                  <Route path="/admin/alwaseet" component={AlwaseetPage} />
                  <Route path="/admin/whatsapp" component={WhatsAppSetup} />
                  <Route path="/admin/fb-ads" component={FbAdsPage} />
                  <Route path="/admin/messenger-broadcast" component={MessengerBroadcast} />
                  <Route path="/admin/pixel-dashboard" component={PixelDashboard} />
                  <Route path="/admin/social-manager" component={SocialManager} />
                  <Route path="/admin/funnel-analytics" component={FunnelAnalytics} />
                  <Route path="/admin/intelligence" component={IntelligencePage} />
                  <Route path="/admin/ai-designer" component={AiDesignerPage} />
                  <Route path="/admin/ai-chat" component={AiChatPage} />
                  <Route path="/admin/inventory" component={InventoryPage} />
                  <Route path="/admin/returns" component={ReturnsPage} />
                  <Route path="/admin/expenses" component={ExpensesPage} />
                  <Route path="/admin/notifications" component={NotificationsPage} />
                  <Route path="/admin/permissions" component={PermissionsPage} />
                  <Route path="/admin/cashier" component={CashierPage} />
                  <Route path="/admin" component={AdminDashboard} />
                </Switch>
              ) : (
                // Customer Layout - With Header/Footer
                <>
                  <Header />
                  <main>
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/products" component={Products} />
                      <Route path="/product/:id" component={ProductDetail} />
                      <Route path="/cart" component={Cart} />
                      <Route path="/offers" component={Offers} />
                      <Route path="/about" component={About} />
                      <Route path="/privacy-policy" component={PrivacyPolicy} />
                      <Route path="/terms-conditions" component={TermsConditions} />
                      <Route path="/return-policy" component={ReturnPolicy} />
                      <Route path="/shipping-policy" component={ShippingPolicy} />
                      <Route component={NotFound} />
                    </Switch>
                  </main>
                  <Footer />
                  <FloatingCartButton />
                </>
              )}
              <Toaster />
            </div>
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;