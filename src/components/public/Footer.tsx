import { Store, Mail, Phone, Globe, ArrowUpRight, MapPin } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Footer() {
  const { t } = useTheme();
  const { toggleLang, lang } = useTheme();

  return (
    <footer className="relative overflow-hidden border-t border-base-300 bg-neutral text-neutral-content pt-20 pb-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8 lg:px-12">
        <div className="mb-12 grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
                <Store size={20} className="text-primary-content" />
              </div>
              <span className="brand-logo text-xl text-neutral-content">
                {t("brand.name")}
              </span>
            </div>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-neutral-content/70">
              {t("label.footer_description")}
            </p>
            <div className="space-y-3">
              <a
                href="mailto:hello@paradokan.com"
                className="flex items-center gap-2 text-sm text-neutral-content/70 transition-colors hover:translate-x-1 hover:text-primary"
              >
                <Mail size={14} />
                hello@paradokan.com
              </a>
              <a
                href="tel:+8801700000000"
                className="flex items-center gap-2 text-sm text-neutral-content/70 transition-colors hover:translate-x-1 hover:text-primary"
              >
                <Phone size={14} />
                +880 170 0000000
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-5 font-display font-semibold text-neutral-content">{t("label.product")}</h4>
            <ul className="space-y-2">
              {[
                ["features", "label.features"],
                ["pricing", "label.pricing"],
                ["how", "label.how_it_works"],
                ["dashboard", "nav.dashboard"],
              ].map(([id, key]) => (
                  <li key={id}>
                    <a
                      href={`/#${id}`}
                      className="group flex items-center gap-1 text-sm text-neutral-content/70 transition-colors hover:translate-x-1 hover:text-primary"
                    >
                      {t(key)} <ArrowUpRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-5 font-display font-semibold text-neutral-content">{t("label.resources")}</h4>
            <ul className="space-y-2">
              {[
                ["label.documentation", "Documentation"],
                ["label.help_center", "Help Center"],
                ["label.blog", "Blog"],
                ["label.status", "Status"],
              ].map(([key, id]) => (
                  <li key={id}>
                    <a
                      href="#"
                      className="group flex items-center gap-1 text-sm text-neutral-content/70 transition-colors hover:translate-x-1 hover:text-primary"
                    >
                      {t(key)} <ArrowUpRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 font-display font-semibold text-neutral-content">{t("label.company")}</h4>
            <ul className="space-y-2">
              {[
                ["label.about", "about"],
                ["label.careers", "careers"],
                ["label.privacy_policy", "privacy"],
                ["label.terms_of_service", "terms"],
              ].map(([key, id]) => (
                  <li key={id}>
                    <a
                      href="#"
                      className="group flex items-center gap-1 text-sm text-neutral-content/70 transition-colors hover:translate-x-1 hover:text-primary"
                    >
                      {t(key)} <ArrowUpRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="text-sm text-neutral-content/50">
            © {new Date().getFullYear()} <span className="brand-logo">{t("brand.name")}</span>. Built with React, Express
            & MongoDB.
          </p>
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 text-sm text-neutral-content/60 transition-colors hover:text-primary"
          >
            <Globe size={14} />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
        </div>
        <div className="mt-8 flex items-center gap-2 text-xs text-neutral-content/45">
          <MapPin size={13} /> Serving neighborhood shops and families across Bangladesh
        </div>
      </div>
    </footer>
  );
}
