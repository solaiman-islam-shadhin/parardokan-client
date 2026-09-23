import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import HomeLayout from "./components/layout/HomeLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Public pages
import { DashboardSkeleton } from "./components/ui/LoadingSkeleton";
import LoadingSpinner from "./components/ui/LoadingSpinner";
const HomePage = lazy(() => import("./pages/public/HomePage"));
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const RegisterPage = lazy(() => import("./pages/public/RegisterPage"));
const AuthPage = lazy(() => import("./pages/public/AuthPage"));

// Customer pages
const CustomerOverview = lazy(() => import("./pages/customer/CustomerOverview"));
const NearbyShops = lazy(() => import("./pages/customer/NearbyShops"));
const PlaceOrder = lazy(() => import("./pages/customer/PlaceOrder"));
const MyOrders = lazy(() => import("./pages/customer/MyOrders"));
const MyBaki = lazy(() => import("./pages/customer/MyBaki"));
const CustomerPayments = lazy(() => import("./pages/customer/CustomerPayments"));
const CustomerProfile = lazy(() => import("./pages/customer/CustomerProfile"));

// Shopkeeper pages
const ShopkeeperOverview = lazy(() => import("./pages/shopkeeper/ShopkeeperOverview"));
const ShopkeeperSales = lazy(() => import("./pages/shopkeeper/ShopkeeperSales"));
const ShopkeeperOrders = lazy(() => import("./pages/shopkeeper/ShopkeeperOrders"));
const ShopkeeperBaki = lazy(() => import("./pages/shopkeeper/ShopkeeperBaki"));
const ShopkeeperPayments = lazy(() => import("./pages/shopkeeper/ShopkeeperPayments"));
const ShopkeeperProfile = lazy(() => import("./pages/shopkeeper/ShopkeeperProfile"));

// Route guards
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route
                element={
                  <Suspense fallback={<LoadingSpinner fullScreen />}>
                    <HomeLayout />
                  </Suspense>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth" element={<AuthPage />} />
              </Route>

              {/* Customer Dashboard */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute role="customer">
                    <DashboardLayout role="customer" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<DashboardSkeleton />}><CustomerOverview /></Suspense>} />
                <Route path="shops" element={<Suspense fallback={<DashboardSkeleton />}><NearbyShops /></Suspense>} />
                <Route path="order" element={<Suspense fallback={<DashboardSkeleton />}><PlaceOrder /></Suspense>} />
                <Route path="orders" element={<Suspense fallback={<DashboardSkeleton />}><MyOrders /></Suspense>} />
                <Route path="baki" element={<Suspense fallback={<DashboardSkeleton />}><MyBaki /></Suspense>} />
                <Route path="payments" element={<Suspense fallback={<DashboardSkeleton />}><CustomerPayments /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<DashboardSkeleton />}><CustomerProfile /></Suspense>} />
              </Route>

              {/* Shopkeeper Dashboard */}
              <Route
                path="/shopkeeper"
                element={
                  <ProtectedRoute role="shopkeeper">
                    <DashboardLayout role="shopkeeper" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperOverview /></Suspense>} />
                <Route path="sales" element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperSales /></Suspense>} />
                <Route path="orders" element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperOrders /></Suspense>} />
                <Route path="baki" element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperBaki /></Suspense>} />
                <Route path="payments" element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperPayments /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<DashboardSkeleton />}><ShopkeeperProfile /></Suspense>} />
              </Route>
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
