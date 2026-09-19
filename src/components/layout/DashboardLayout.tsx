import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  CreditCard,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  TrendingUp,
  MapPin,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import PageTransition from "../ui/PageTransition";

interface Props {
  role: "customer" | "shopkeeper";
}

const customerLinks = [
  { to: "/customer", label: "dashboard.overview", icon: LayoutDashboard, end: true },
  { to: "/customer/shops", label: "dashboard.shops", icon: MapPin },
  { to: "/customer/orders", label: "dashboard.orders", icon: ShoppingBag },
  { to: "/customer/baki", label: "dashboard.baki", icon: CreditCard },
  { to: "/customer/payments", label: "dashboard.payments", icon: Receipt },
  { to: "/customer/profile", label: "dashboard.profile", icon: User },
];

const shopkeeperLinks = [
  { to: "/shopkeeper", label: "dashboard.overview", icon: LayoutDashboard, end: true },
  { to: "/shopkeeper/sales", label: "dashboard.sales", icon: TrendingUp },
  { to: "/shopkeeper/orders", label: "dashboard.orders", icon: ShoppingBag },
  { to: "/shopkeeper/baki", label: "dashboard.baki", icon: CreditCard },
  { to: "/shopkeeper/payments", label: "dashboard.payments", icon: Receipt },
  { to: "/shopkeeper/profile", label: "dashboard.profile", icon: User },
];

export default function DashboardLayout({ role }: Props) {
  const { profile, logout } = useAuth();
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = role === "customer" ? customerLinks : shopkeeperLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-base-300">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Store size={18} className="text-primary-content" />
          </div>
          <span className="brand-logo text-lg">{t("brand.name")}</span>
        </a>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={
                  profile?.image ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`
                }
                alt={profile?.name}
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{profile?.name}</p>
            <p className="text-xs text-base-content/50 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `dashboard-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} />
            <span>{t(label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-base-300 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm btn-circle"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={toggleLang}
            className="btn btn-ghost btn-sm btn-circle"
            title="Toggle language"
          >
            <Globe size={16} />
          </button>
          <span className="text-xs text-base-content/40 uppercase">
            {lang}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="dashboard-link w-full text-error hover:bg-error/10 hover:text-error"
        >
          <LogOut size={18} />
          <span>{t("dashboard.logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-base-200 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-base-100/95 border-r border-base-300/80 fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[min(16rem,85vw)] bg-base-100 z-40 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-base-100/95 backdrop-blur-md border-b border-base-300/80 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <Menu size={20} />
          </button>
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Store size={14} className="text-primary-content" />
            </div>
            <span className="brand-logo">{t("brand.name")}</span>
          </a>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <div className="hidden items-center justify-between border-b border-base-300/70 bg-base-100/70 px-8 py-4 lg:flex lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {role === "customer" ? t("dashboard.customer_space") : t("dashboard.shopkeeper_space")}
            </p>
            <p className="mt-1 text-sm text-base-content/50">
              {profile?.name
                ? `${t("dashboard.welcome_back_name")}, ${profile.name.split(" ")[0]}`
                : t("dashboard.neighborhood_commerce")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs text-base-content/50 xl:block">
              {t("dashboard.nearby_simple_connected")}
            </span>
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-base-300 bg-base-200">
              <img
                src={profile?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
        <main className="dashboard-main min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 md:p-8 lg:p-10">
          <PageTransition pageKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
