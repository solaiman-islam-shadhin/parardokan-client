import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import HomeLayout from "./components/layout/HomeLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Public pages

import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import AuthPage from "./pages/public/AuthPage";

// Customer pages
import CustomerOverview from "./pages/customer/CustomerOverview";
import NearbyShops from "./pages/customer/NearbyShops";
import PlaceOrder from "./pages/customer/PlaceOrder";
import MyOrders from "./pages/customer/MyOrders";
import MyBaki from "./pages/customer/MyBaki";
import CustomerPayments from "./pages/customer/CustomerPayments";
import CustomerProfile from "./pages/customer/CustomerProfile";

// Shopkeeper pages
import ShopkeeperOverview from "./pages/shopkeeper/ShopkeeperOverview";
import ShopkeeperSales from "./pages/shopkeeper/ShopkeeperSales";
import ShopkeeperOrders from "./pages/shopkeeper/ShopkeeperOrders";
import ShopkeeperBaki from "./pages/shopkeeper/ShopkeeperBaki";
import ShopkeeperPayments from "./pages/shopkeeper/ShopkeeperPayments";
import ShopkeeperProfile from "./pages/shopkeeper/ShopkeeperProfile";

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
              <Route element={<HomeLayout />}>
                
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
                <Route index element={<CustomerOverview />} />
                <Route path="shops" element={<NearbyShops />} />
                <Route path="order" element={<PlaceOrder />} />
                <Route path="orders" element={<MyOrders />} />
                <Route path="baki" element={<MyBaki />} />
                <Route path="payments" element={<CustomerPayments />} />
                <Route path="profile" element={<CustomerProfile />} />
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
                <Route index element={<ShopkeeperOverview />} />
                <Route path="sales" element={<ShopkeeperSales />} />
                <Route path="orders" element={<ShopkeeperOrders />} />
                <Route path="baki" element={<ShopkeeperBaki />} />
                <Route path="payments" element={<ShopkeeperPayments />} />
                <Route path="profile" element={<ShopkeeperProfile />} />
              </Route>
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
