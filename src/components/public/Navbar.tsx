import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Store, Sun, Moon, Globe, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { user, profile } = useAuth();
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    setExploreOpen(false);
    if (window.location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const dashboardPath =
    profile?.role === "shopkeeper" ? "/shopkeeper" : "/customer";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-base-100/95 backdrop-blur-md shadow-sm border-b border-base-300"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/20 transition-transform group-hover:rotate-[-4deg] group-hover:scale-105">
              <Store size={20} className="text-primary-content" />
            </div>
            <span className="brand-logo navbar-brand-logo">{t("brand.name")}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ["about", "nav.about"],
              ["features", "nav.features"],
              ["how", "nav.how"],
              ["pricing", "nav.pricing"],
            ].map(([id, key]) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="navbar-route-label font-medium text-base-content/60 transition-colors hover:text-primary"
              >
                {t(key)}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setExploreOpen((open) => !open)}
                className="navbar-route-label flex items-center gap-1 font-medium text-base-content/60 transition-colors hover:text-primary"
                aria-expanded={exploreOpen}
              >
                {t("nav.explore")} <ChevronDown size={15} className={exploreOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
              {exploreOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl">
                  {[
                    ["dashboard", "nav.dashboard_preview"],
                    ["network", "nav.network"],
                    ["ledger", "nav.ledger"],
                    ["roles", "nav.features"],
                    ["how", "nav.how"],
                    ["pricing", "nav.pricing"],
                    ["contact", "nav.contact"],
                  ].map(([id, key]) => (
                    <button
                      key={id}
                      onClick={() => scrollToSection(id)}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200 hover:text-primary"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user && profile && (
              <Link
                to={dashboardPath}
                className="navbar-route-label font-medium text-base-content/70 hover:text-primary transition-colors"
              >
                {t("nav.dashboard")}
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm btn-circle hidden sm:flex"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={toggleLang}
              className="btn btn-ghost btn-sm hidden sm:flex gap-1 text-xs font-medium"
            >
              <Globe size={14} />
              {lang.toUpperCase()}
            </button>

            {user && profile ? (
              <Link to={dashboardPath} className="btn btn-primary btn-sm">
                {t("nav.dashboard")}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn btn-ghost btn-sm hidden sm:flex"
                >
                  {t("nav.login")}
                </Link>
                <Link to="/auth?mode=register" className="btn btn-primary btn-sm">
                  {t("nav.getStarted")}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn btn-ghost btn-sm btn-circle md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-base-100 border-t border-base-300 py-4 space-y-1">
            {[
              ["about", "nav.about"],
              ["features", "nav.features"],
              ["how", "nav.how"],
              ["pricing", "nav.pricing"],
            ].map(([id, key]) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-base-200 rounded-lg"
              >
                {t(key)}
              </button>
            ))}
            <div className="mt-2 border-t border-base-300 pt-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">
                {t("nav.explore")}
              </p>
              {[
                ["dashboard", "nav.dashboard_preview"],
                ["network", "nav.network"],
                ["ledger", "nav.ledger"],
                ["roles", "nav.features"],
                ["contact", "nav.contact"],
              ].map(([id, key]) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="w-full rounded-lg px-8 py-2 text-left text-sm font-medium hover:bg-base-200"
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-4 pt-2">
              <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button
                onClick={toggleLang}
                className="btn btn-ghost btn-sm text-xs"
              >
                <Globe size={14} />
                {lang.toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
