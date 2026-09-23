import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShoppingBag,
  CreditCard,
  Shield,
  ArrowRight,
  CheckCircle2,
  Store,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock3,
  WalletCards,
  Navigation,
  Mail,
  Send,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import ReviewMarquee from "../../components/public/ReviewMarquee";
import { SectionReveal, TextReveal } from "../../components/ui/ScrollReveal";
import { useToast } from "../../context/ToastContext";

function AnimatedCounter({ value, active }: { value: string; active: boolean }) {
  const target = Number(value.replace(/[^\d]/g, ""));
  const suffix = value.replace(/[\d,]/g, "");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1400;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return <p className="font-display text-lg font-bold">{count.toLocaleString()}{suffix}</p>;
}

export default function HomePage() {
  const { t } = useTheme();
  const { showToast } = useToast();
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [heroStatsStarted, setHeroStatsStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroStatsStarted(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setContactStatus("error");
      showToast("error", t("contact.config_error"));
      return;
    }

    setContactStatus("sending");
    try {
      const formData = new FormData(form);
      const name = String(formData.get("from_name") || "").trim();
      const email = String(formData.get("reply_to") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name,
          name,
          reply_to: email,
          from_email: email,
          email,
          subject,
          time: new Date().toLocaleString(),
          message,
        },
        publicKey
      );
      form.reset();
      setContactStatus("success");
      showToast("success", t("contact.success"));
    } catch {
      setContactStatus("error");
      showToast("error", t("contact.error"));
    }
  };

  const features = [
    {
      icon: MapPin,
      title: t("features.shops"),
      desc: t("features.shops.desc"),
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
    },
    {
      icon: ShoppingBag,
      title: t("features.orders"),
      desc: t("features.orders.desc"),
      color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
    },
    {
      icon: CreditCard,
      title: t("features.baki"),
      desc: t("features.baki.desc"),
      color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
    },
    {
      icon: Shield,
      title: t("features.payments"),
      desc: t("features.payments.desc"),
      color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300",
    },
  ];

  const audienceFeatures = [
    {
      eyebrow: t("home.feature_customer_eyebrow"),
      title: t("home.feature_discover_title"),
      description: t("home.feature_discover_description"),
      icon: ShoppingBag,
      accent: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
      visual: "shops",
    },
    {
      eyebrow: t("home.feature_customer_eyebrow"),
      title: t("home.feature_profile_title"),
      description: t("home.feature_profile_description"),
      icon: Navigation,
      accent: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
      visual: "profile",
    },
    {
      eyebrow: t("home.feature_customer_eyebrow"),
      title: t("home.feature_baki_title"),
      description: t("home.feature_baki_description"),
      icon: WalletCards,
      accent: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
      visual: "baki",
    },
    {
      eyebrow: t("home.feature_shopkeeper_eyebrow"),
      title: t("home.feature_shopkeeper_title"),
      description: t("home.feature_shopkeeper_description"),
      icon: Store,
      accent: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300",
      visual: "shopkeeper",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: t("label.step_create_account"),
      desc: t("label.step_create_account_desc"),
    },
    {
      step: "2",
      title: t("label.step_discover_shops"),
      desc: t("label.step_discover_shops_desc"),
    },
    {
      step: "3",
      title: t("label.step_order_pay"),
      desc: t("label.step_order_pay_desc"),
    },
  ];

  const testimonials = [
    {
      name: "Rina Begum",
      role: t("label.customer_mirpur"),
      text: t("label.testimonial_rina"),
    },
    {
      name: "Mohammad Karim",
      role: t("label.shopkeeper_mirpur"),
      text: t("label.testimonial_karim"),
    },
    {
      name: "Nusrat Jahan",
      role: t("label.customer_uttara"),
      text: t("label.testimonial_nusrat"),
    },
  ];

  const pricing = [
    {
      id: "basic",
      name: t("label.basic"),
      price: "Free",
      period: "forever",
      features: [
        t("label.up_to_50_orders"),
        "Up to 20 Baki members",
        "Up to 2 payment methods",
        t("label.baki_management"),
        t("label.basic_analytics"),
      ],
      highlighted: false,
    },
    {
      id: "premium",
      name: t("label.premium"),
      price: "৳599/mo",
      period: "or ৳5,990/year",
      features: [
        t("label.unlimited_orders"),
        t("label.baki_management"),
        t("label.advanced_analytics"),
        t("label.priority_support"),
        "Unlimited payment methods",
        "Renewal reminders before expiry",
      ],
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Contact us",
      period: "",
      features: [
        "Everything in Premium",
        "Multiple shops",
        "Custom branding",
        "Dedicated account support",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="home-page overflow-x-hidden">
      {/* Hero */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="home-hero relative min-h-screen flex items-center pt-16">
        <div className="hero-animated-bg absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-one absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="hero-orb hero-orb-two absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="hero-orb hero-orb-three absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="hero-content-grid grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="hero-copy max-w-3xl min-w-0">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              {t("label.now_live_across_bangladesh")}
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-base-content leading-tight mb-6">
              {t("hero.title")}
            </h1>

            <p className="text-xl text-base-content/60 leading-relaxed mb-10 max-w-xl">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg gap-2">
                {t("hero.cta")}
                <ArrowRight size={18} />
              </Link>
              <button
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn btn-ghost btn-lg"
              >
                {t("hero.secondary")}
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-14">
              {[
              { icon: Store, label: t("label.local_shops"), value: "500+" },
              { icon: Users, label: t("label.active_users"), value: "2,000+" },
              { icon: TrendingUp, label: t("label.orders_day"), value: "1,500+" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <AnimatedCounter value={value} active={heroStatsStarted} />
                    <p className="text-xs text-base-content/50">{label}</p>
                  </div>
                </div>
              ))}
              </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="dashboard-matrix relative rounded-[2rem] border border-base-300/80 bg-base-100/90 p-4 shadow-2xl shadow-orange-950/10 backdrop-blur">
              <div className="flex items-center justify-between border-b border-base-300/80 px-3 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-content"><Store size={17} /></div>
                  <div><p className="brand-logo text-xs text-base-content/50">{t("brand.name")}</p><p className="font-semibold">{t("label.good_morning_rina")}</p></div>
                </div>
                <span className="badge badge-success badge-sm">{t("label.live")}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-3">
                {[
                  [t("label.orders"), "24", "text-blue-500"],
                  [t("label.baki"), "৳1,250", "text-amber-500"],
                  [t("label.nearby"), "12", "text-primary"],
                ].map(([label, value, color]) => (
                  <div key={label} className="matrix-stat-card rounded-2xl p-3">
                    <p className="text-[11px] text-base-content/50">{label}</p>
                    <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[1.3fr_0.7fr] gap-3 px-3 pb-3">
                <div className="matrix-table-card rounded-2xl border border-base-300/80 bg-base-100 p-4">
                  <div className="mb-3 flex items-center justify-between"><p className="matrix-label">{t("label.nearby_shops")}</p><ArrowUpRight size={15} className="text-primary" /></div>
                  {["Karim Store", "Mina Pharmacy", "Rahman Mart"].map((shop, index) => (
                    <div key={shop} className="flex items-center justify-between border-t border-base-300/70 py-3 text-xs">
                      <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${index === 1 ? "bg-amber-400" : "bg-primary"}`} />{shop}</span>
                      <span className="text-base-content/45">{index + 0.3} km</span>
                    </div>
                  ))}
                </div>
                <div className="matrix-overview-panel rounded-2xl bg-primary p-4 text-primary-content">
                  <WalletCards size={20} />
                  <p className="mt-8 text-xs text-primary-content/70">{t("label.digital_baki")}</p>
                  <p className="mt-1 text-lg font-bold">৳1,250</p>
                  <div className="mt-3 h-1.5 rounded-full bg-white/25"><div className="h-full w-2/3 rounded-full bg-white" /></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl border border-base-300/80 bg-base-100 px-4 py-3 shadow-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-600"><Navigation size={17} /></div>
              <div><p className="text-[11px] text-base-content/50">{t("label.closest_shop")}</p><p className="text-sm font-semibold">Karim Store · 0.3 km</p></div>
            </div>
          </motion.div>
          </div>
        </div>
      </motion.section>

      <SectionReveal className="border-y border-base-300/70 bg-base-100">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-7 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            ["01", t("label.local_first")],
            ["02", t("label.discovery_1km")],
            ["03", t("label.digital_baki")],
            ["04", t("label.secure_checkout")],
          ].map(([number, label]) => (
            <div key={number} className="flex items-center gap-3">
              <span className="font-display text-sm font-bold text-primary">{number}</span>
              <span className="text-sm font-medium text-base-content/65">{label}</span>
            </div>
          ))}
        </div>
      </SectionReveal>

      <SectionReveal>
      <motion.section id="dashboard" className="py-24 bg-base-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <TextReveal><h2 className="font-display text-4xl font-bold mb-4">{t("label.your_neighborhood_at_a_glance")}</h2></TextReveal>
            <TextReveal delay={0.08}><p className="text-base-content/60">{t("label.a_simple_dashboard_for_orders_baki_and_local_shops")}</p></TextReveal>
          </div>
          <div className="dashboard-matrix rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-xl md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-base-300/70 pb-5">
              <div><p className="text-sm text-base-content/50">{t("label.good_morning_rina")}</p><h3 className="font-display text-2xl font-bold">{t("label.customer_dashboard")}</h3></div>
              <div className="matrix-pulse"><span /> {t("label.all_systems_live")}</div>
            </div>
            <div className="matrix-grid-lines mb-6 grid gap-4 sm:grid-cols-3">
              {[[t("label.total_orders"), "24", "text-sky-500"], [t("label.baki_balance"), "৳1,250", "text-rose-500"], [t("label.nearby_shops"), "12", "text-teal-500"]].map(([label, value, color], index) => (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} key={label} className="rounded-2xl bg-base-200 p-5">
                  <span>{label}</span><strong className={color}>{value}</strong><small>{t("overview.recent_records")}</small>
                </motion.div>
              ))}
            </div>
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="matrix-table-card lg:col-span-3 rounded-2xl border border-base-300/70 bg-base-100 p-5"><p className="matrix-label mb-4">{t("label.recent_orders")}</p>{["Karim Store · Groceries", "Mina Pharmacy · Medicine", "Rahman Mart · Household"].map((item, i) => <div key={item} className="flex justify-between border-t border-base-300/70 py-3 text-sm"><span>{item}</span><span className={`badge badge-sm ${i === 0 ? "badge-warning" : "badge-success"}`}>{i === 0 ? t("status.preparing") : t("status.delivered")}</span></div>)}</div>
              <div className="matrix-overview-panel lg:col-span-2 p-5"><p className="matrix-label mb-2">{t("label.quick_order")}</p><p className="text-sm text-base-content/60 mb-5">{t("label.describe_what_you_need_and_send_it_to_a_nearby_shop")}</p><Link to="/auth?mode=register" className="btn btn-primary btn-sm">{t("label.try_it_now")} <ArrowRight size={14} /></Link></div>
            </div>
          </div>
        </div>
      </motion.section>
      </SectionReveal>

      <SectionReveal><section id="network" className="bg-base-100 py-24">
        <div className="mx-auto grid max-w-[90rem] items-center gap-12 px-4 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
          <motion.div initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("home.network_eyebrow")}</p>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-tight sm:text-5xl">{t("home.network_title")}</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-base-content/60">{t("home.network_body")}</p>
            <Link to="/auth?mode=register" className="btn btn-primary mt-8 gap-2">{t("hero.cta")} <ArrowRight size={17} /></Link>
          </motion.div>
          <div className="relative grid gap-4 sm:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="home-panel home-panel-warm min-h-64 rounded-[1.75rem] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><ShoppingBag size={21} /></div>
              <h3 className="mt-12 font-display text-2xl font-bold">{t("home.customer_title")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-base-content/60">{t("home.customer_body")}</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-amber-700"><Clock3 size={14} /> {t("label.open_shops_near_you")}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="home-panel home-panel-green min-h-64 rounded-[1.75rem] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white"><Store size={21} /></div>
              <h3 className="mt-12 font-display text-2xl font-bold text-white">{t("home.shopkeeper_title")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{t("home.shopkeeper_body")}</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white"><TrendingUp size={14} /> {t("label.everything_in_one_view")}</div>
            </motion.div>
          </div>
        </div>
      </section></SectionReveal>

      <SectionReveal><section id="ledger" className="bg-base-200 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div className="order-2 lg:order-1">
            <div className="rounded-[1.75rem] border border-base-300/80 bg-base-100 p-5 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs text-base-content/50">Karim Store</p><h3 className="font-display text-xl font-bold">{t("home.ledger_title")}</h3></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><WalletCards size={19} /></div>
              </div>
              <div className="rounded-2xl bg-primary p-5 text-primary-content">
                <p className="text-xs text-primary-content/70">{t("label.current_balance")}</p><p className="mt-1 text-3xl font-bold">৳1,250</p>
                <div className="mt-5 flex items-center justify-between text-xs"><span>{t("label.monthly_limit")}</span><span>৳2,000</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/25"><div className="h-full w-3/5 rounded-full bg-white" /></div>
              </div>
              <div className="mt-4 space-y-1">
                {[
                  [t("home.paid"), "− ৳500", "text-primary"],
                  [t("home.approved"), "+ ৳850", "text-amber-600"],
                  [t("home.order_ready"), "৳320", "text-blue-600"],
                ].map(([label, amount, color]) => <div key={label} className="flex items-center justify-between border-b border-base-300/70 py-3 text-sm last:border-0"><span className="text-base-content/60">{label}</span><span className={`font-semibold ${color}`}>{amount}</span></div>)}
              </div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("home.activity")}</p>
            <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{t("home.ledger_title")}</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-base-content/60">{t("home.ledger_body")}</p>
          </motion.div>
        </div>
      </section></SectionReveal>

      {/* About */}
      <SectionReveal><section id="about" className="py-24 bg-base-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <TextReveal><h2 className="font-display text-4xl font-bold mb-6">
                {t("label.about_title")}
              </h2></TextReveal>
              <TextReveal delay={0.08}><p className="text-base-content/60 leading-relaxed mb-6">
                {t("label.about_intro")}
              </p></TextReveal>
              <p className="text-base-content/60 leading-relaxed mb-8">
                {t("label.about_description")}
              </p>
              <Link to="/auth?mode=register" className="btn btn-primary gap-2">
                {t("label.join_your_neighborhood")} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Store, title: t("label.shops_count"), desc: t("label.across_bangladesh"), color: "text-primary bg-primary/10" },
                { icon: ShoppingBag, title: t("label.easy_ordering"), desc: t("label.plain_language_orders"), color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" },
                { icon: CreditCard, title: t("label.digital_baki"), desc: t("label.credit_made_transparent"), color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300" },
                { icon: MapPin, title: t("label.radius_1km"), desc: t("label.truly_local"), color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-base-300/70 bg-base-200 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${color}`}><Icon size={21} /></div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-base-content/50">{desc}</p>
                </div>
              ))}
              </div>
          </div>
        </div>
      </section></SectionReveal>

      {/* Features */}
      <SectionReveal><section id="features" className="py-24 bg-base-200">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <TextReveal><h2 className="font-display text-4xl font-bold mb-4">
              {t("features.title")}
            </h2></TextReveal>
            <p className="text-base-content/60 max-w-xl mx-auto">
              {t("label.features_description")}
            </p>
          </div>

          <div className="home-feature-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${color}`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {title}
                </h3>
                <p className="text-sm text-base-content/60 leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section></SectionReveal>

      {/* Customer and shopkeeper features */}
      <SectionReveal><section id="roles" className="bg-base-100 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <TextReveal><h2 className="font-display text-4xl font-bold sm:text-5xl">
              {t("home.audience_features_title")}
            </h2></TextReveal>
            <p className="mt-5 text-lg leading-relaxed text-base-content/60">
              {t("home.audience_features_description")}
            </p>
          </div>

          <div className="space-y-10">
            {audienceFeatures.map(({ eyebrow, title, description, icon: Icon, accent, visual }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`grid items-center gap-8 lg:grid-cols-2 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="dashboard-matrix relative overflow-hidden rounded-[1.75rem] border border-base-300/70 bg-base-100 p-5 shadow-lg md:p-7">
                  <div className="matrix-panel-glow" />
                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between border-b border-base-300/70 pb-4">
                      <div className="flex items-center gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}><Icon size={17} /></div><span className="text-xs font-semibold text-base-content/50">{t("brand.name")}</span></div>
                      <span className="matrix-pulse"><span /> {t("label.live")}</span>
                    </div>
                    {visual === "shops" && <div className="grid grid-cols-[1.15fr_0.85fr] gap-3"><div className="relative h-40 overflow-hidden rounded-xl bg-base-200"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(253,116,36,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(253,116,36,.16) 1px, transparent 1px)", backgroundSize: "22px 22px" }} /><MapPin className="absolute left-1/3 top-1/3 text-primary" /><MapPin className="absolute right-1/4 top-1/2 text-teal-500" /><MapPin className="absolute bottom-4 left-1/2 text-blue-500" /></div><div className="space-y-2">{["Karim Store", "Mina Pharmacy", "Rahman Mart"].map((shop, i) => <div key={shop} className="flex items-center gap-2 rounded-lg border border-base-300/70 p-2 text-xs"><span className={`h-2 w-2 rounded-full ${i === 1 ? "bg-amber-400" : "bg-primary"}`} />{shop}<span className="ml-auto text-base-content/40">{i + 0.3} km</span></div>)}</div></div>}
                    {visual === "profile" && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-base-200 p-4"><div className="h-12 w-12 rounded-full bg-primary/20" /><div className="flex-1"><div className="h-3 w-28 rounded bg-base-content/20" /><div className="mt-2 h-2 w-20 rounded bg-base-content/10" /></div><CheckCircle2 className="text-success" size={18} /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-base-300/70 p-3"><MapPin size={16} className="text-primary" /><div className="mt-3 h-2 w-24 rounded bg-base-content/15" /></div><div className="rounded-xl border border-base-300/70 p-3"><Users size={16} className="text-sky-500" /><div className="mt-3 h-2 w-20 rounded bg-base-content/15" /></div></div></div>}
                    {visual === "baki" && <div className="space-y-3"><div className="rounded-xl bg-primary p-4 text-primary-content"><p className="text-xs opacity-70">{t("label.current_balance")}</p><p className="mt-1 text-2xl font-bold">৳1,250</p><div className="mt-4 h-1.5 rounded-full bg-white/25"><div className="h-full w-3/5 rounded-full bg-white" /></div></div>{[t("home.paid"), t("home.approved"), t("home.order_ready")].map((item, i) => <div key={item} className="flex items-center justify-between border-b border-base-300/70 py-2 text-xs"><span>{item}</span><span className={i === 0 ? "text-primary" : "text-amber-600"}>{i === 0 ? "− ৳500" : "+ ৳850"}</span></div>)}</div>}
                    {visual === "shopkeeper" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[[t("overview.todays_revenue"), "৳8,420"], [t("overview.order_queue"), "12"], [t("overview.baki_exposure"), "৳24k"]].map(([label, value]) => <div key={label} className="matrix-stat-card p-3"><span>{label}</span><strong>{value}</strong><small>{t("overview.needs_attention")}</small></div>)}<div className="col-span-1 rounded-xl border border-base-300/70 p-3 sm:col-span-3"><div className="flex h-20 items-end gap-2">{[35, 55, 42, 78, 62, 88, 70].map((height, i) => <span key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${height}%` }} />)}</div></div></div>}
                  </div>
                </div>
                <div className="px-2 lg:px-6">
                  <p className="matrix-kicker">{eyebrow}</p>
                  <h3 className="mt-3 font-display text-3xl font-bold">{title}</h3>
                  <p className="mt-5 max-w-lg leading-relaxed text-base-content/60">{description}</p>
                  <Link to="/auth?mode=register" className="btn btn-primary btn-sm mt-7 gap-2">{t("home.explore_for_role")} <ArrowRight size={15} /></Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section></SectionReveal>

      {/* How it works */}
      <SectionReveal><section id="how" className="py-24 bg-base-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <TextReveal><h2 className="font-display text-4xl font-bold mb-4">
              {t("label.up_and_running_in_minutes")}
            </h2></TextReveal>
            <p className="text-base-content/60 max-w-xl mx-auto">
              {t("label.no_training_needed")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map(({ step, title, desc }) => (
              <motion.div key={step} whileHover={{ y: -8 }} className="group relative rounded-3xl border border-base-300/70 bg-base-200/60 p-6 transition-shadow hover:shadow-xl hover:shadow-primary/10">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-content shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    {step}
                  </div>
                  <ArrowUpRight className="text-primary/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" size={22} />
                </div>
                <div>
                    <h3 className="mb-2 font-display text-xl font-semibold">
                      {title}
                    </h3>
                    <p className="leading-relaxed text-base-content/60">{desc}</p>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section></SectionReveal>

      {/* Testimonials */}
      <SectionReveal><section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <TextReveal><h2 className="font-display text-4xl font-bold mb-4">
              {t("label.loved_by_neighborhoods")}
            </h2></TextReveal>
          </div>
          <div className="space-y-10">
            <ReviewMarquee reviews={testimonials} />
            <ReviewMarquee reviews={[...testimonials].reverse()} reverse />
          </div>
        </div>
      </section></SectionReveal>

      {/* Pricing */}
      <SectionReveal><section id="pricing" className="py-24 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <TextReveal><h2 className="font-display text-4xl font-bold mb-4">
              {t("label.simple_honest_pricing")}
            </h2></TextReveal>
            <p className="text-base-content/60">{t("label.for_shopkeepers_customers_use_the_app_free")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map(({ id, name, price, period, features, highlighted }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 border-2 transition-all ${
                  highlighted
                    ? "border-primary bg-primary text-primary-content shadow-xl scale-105"
                    : "border-base-300 bg-base-100"
                }`}
              >
                <h3 className="font-display text-xl font-bold mb-1">{name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-bold">{price}</span>
                  <span className={highlighted ? "text-primary-content/70" : "text-base-content/50"}>
                    {period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        size={16}
                        className={highlighted ? "text-primary-content" : "text-primary"}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {id === "enterprise" ? (
                  <a
                    href="#contact"
                    className={`btn w-full ${
                      highlighted ? "bg-white text-primary hover:bg-white/90 border-0" : "btn-primary"
                    }`}
                  >
                    Contact us
                  </a>
                ) : (
                  <Link
                    to="/auth?mode=register"
                    className={`btn w-full ${
                      highlighted ? "bg-white text-primary hover:bg-white/90 border-0" : "btn-primary"
                    }`}
                  >
                    {t("nav.getStarted")}
                  </Link>
                )}
              </motion.div>
            ))}
            </div>
          </div>
      </section></SectionReveal>

      {/* FAQ */}
      <SectionReveal><section className="py-24 bg-base-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <TextReveal><h2 className="font-display text-4xl font-bold text-center mb-12">
            {t("label.frequently_asked_questions")}
          </h2></TextReveal>
          <div className="space-y-4">
            {[
              {
                q: t("faq.customers_pay"),
                a: t("faq.customers_pay.answer"),
              },
              {
                q: t("faq.baki"),
                a: t("faq.baki.answer"),
              },
              {
                q: t("faq.location"),
                a: t("faq.location.answer"),
              },
              {
                q: t("faq.switch_role"),
                a: t("faq.switch_role.answer"),
              },
            ].map(({ q, a }) => (
              <div key={q} className="collapse collapse-arrow bg-base-100 border border-base-300">
                <input type="checkbox" />
                <div className="collapse-title font-semibold">{q}</div>
                <div className="collapse-content text-base-content/60 text-sm leading-relaxed">
                  {a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section></SectionReveal>

      {/* Contact */}
      <SectionReveal><section id="contact" className="home-contact py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div className="flex flex-col justify-center">
            <p className="matrix-kicker"><Mail size={14} /> {t("contact.eyebrow")}</p>
            <TextReveal><h2 className="mt-4 font-display text-4xl font-bold">{t("contact.title")}</h2></TextReveal>
            <p className="mt-5 max-w-md leading-relaxed text-base-content/60">{t("contact.description")}</p>
            <a href="mailto:hello@paradokan.com" className="mt-8 inline-flex w-fit items-center gap-3 text-sm font-semibold text-primary transition-transform hover:translate-x-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Mail size={18} /></span>
              <span><small className="block text-xs font-normal text-base-content/50">{t("contact.email_label")}</small>hello@paradokan.com</span>
            </a>
          </div>
          <form onSubmit={submitContact} className="contact-form">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-control"><span className="mb-2 text-sm font-semibold">{t("contact.name")}</span><input name="from_name" required className="input input-bordered w-full" /></label>
              <label className="form-control"><span className="mb-2 text-sm font-semibold">{t("contact.email")}</span><input name="reply_to" type="email" required className="input input-bordered w-full" /></label>
            </div>
            <label className="form-control mt-5"><span className="mb-2 text-sm font-semibold">{t("contact.subject")}</span><input name="subject" required className="input input-bordered w-full" /></label>
            <label className="form-control mt-5"><span className="mb-2 text-sm font-semibold">{t("contact.message")}</span><textarea name="message" required rows={5} className="textarea textarea-bordered w-full resize-y" /></label>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <button type="submit" disabled={contactStatus === "sending"} className="btn btn-primary gap-2">
                {contactStatus === "sending" ? <span className="loading loading-spinner loading-sm" /> : <Send size={16} />}
                {contactStatus === "sending" ? t("contact.sending") : t("contact.send")}
              </button>
            </div>
          </form>
        </div>
      </section></SectionReveal>

      {/* CTA Banner */}
      <section className="home-cta py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-content mb-6">
            {t("label.your_neighborhood_is_waiting")}
          </h2>
          <p className="text-primary-content/80 text-xl mb-10">
            {t("label.join_thousands_connected")}
          </p>
          <Link
            to="/auth?mode=register"
            className="btn bg-white text-primary hover:bg-white/90 btn-lg border-0 gap-2"
          >
            {t("hero.cta")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
