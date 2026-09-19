import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Receipt,
  Power,
  Hand,
  Activity,
  Radar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { Shop, Order, Sale, BakiMember } from "../../types";
import { DashboardSkeleton } from "../../components/ui/LoadingSkeleton";
import OverviewCharts from "../../components/dashboard/OverviewCharts";

export default function ShopkeeperOverview() {
  const { t } = useTheme();
  const { profile } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [baki, setBaki] = useState<BakiMember[]>([]);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ planId?: string; status?: string; expiresAt?: string } | null>(null);

  const load = () => {
    Promise.all([
      api.get("/shops/my").catch(() => ({ data: null })),
      api.get("/orders").catch(() => ({ data: [] })),
      api.get("/sales").catch(() => ({ data: [] })),
      api.get("/baki").catch(() => ({ data: [] })),
      api.get("/subscriptions/me").catch(() => ({ data: null })),
    ]).then(([s, o, sa, b, sub]) => {
      setShop(s.data);
      setOrders(o.data);
      setSales(sa.data);
      setBaki(b.data);
      setSubscription(sub.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const toggleShopStatus = async () => {
    if (!shop) return;
    setToggling(true);
    try {
      await api.patch("/shops/open-status", { isOpen: !shop.isOpen });
      setShop({ ...shop, isOpen: !shop.isOpen });
    } finally {
      setToggling(false);
    }
  };

  const todaySales = sales.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.price, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalBakiBalance = baki.reduce((sum, b) => sum + b.balance, 0);
  const daysRemaining = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    loading ? <DashboardSkeleton /> :
    <div className="dashboard-matrix space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="matrix-kicker"><Activity size={13} /> {t("overview.shopkeeper_matrix")}</p>
          <h1 className="font-display text-2xl font-bold">
            <span className="inline-flex items-center gap-2">{t("label.welcome")}, {profile?.name?.split(" ")[0]} <Hand size={20} className="text-primary" /></span>
          </h1>
          <p className="text-base-content/50 mt-1">
            {shop?.name || t("label.your_shop_dashboard")}
          </p>
        </div>

        {/* Shop status toggle */}
        {shop && (
          <button
            onClick={toggleShopStatus}
            disabled={toggling}
            className={`matrix-status-btn btn gap-2 ${shop.isOpen ? "btn-success" : "btn-ghost border border-base-300"}`}
          >
            {toggling ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Power size={16} />
                {shop.isOpen ? t("label.shop_is_open") : t("label.shop_is_closed")}
              </>
            )}
          </button>
        )}
      </div>

      <div className="matrix-overview-panel">
        <div className="matrix-panel-glow" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="matrix-label">{t("overview.shop_signal")}</p>
            <p className="mt-2 max-w-xl text-2xl font-bold tracking-tight">{t("overview.shop_title")}</p>
          </div>
          {subscription?.planId && subscription.planId !== "basic" && (
            <div className={`rounded-2xl border p-5 ${daysRemaining !== null && daysRemaining <= 7 ? "border-warning bg-warning/10" : "border-primary/20 bg-primary/5"}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Subscription renewal</p>
              <p className="mt-2 text-lg font-semibold">{daysRemaining === 0 ? "Your plan has expired and is now Basic." : `${subscription.planId} plan · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}</p>
              {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && <p className="mt-1 text-sm text-base-content/60">Renew within a week to keep your Pro features unlocked.</p>}
            </div>
          )}
          <div className={`matrix-pulse ${shop?.isOpen ? "is-live" : "is-muted"}`}><span /> {shop?.isOpen ? t("overview.accepting_orders") : t("overview.offline_mode")}</div>
        </div>
        <div className="matrix-grid-lines mt-8 grid gap-3 sm:grid-cols-3">
          <div><span>{t("overview.todays_revenue")}</span><strong>৳{todayRevenue}</strong><small>{todaySales.length} {t("overview.sales_logged")}</small></div>
          <div><span>{t("overview.order_queue")}</span><strong>{pendingOrders}</strong><small>{t("overview.needs_attention")}</small></div>
          <div><span>{t("overview.baki_exposure")}</span><strong>৳{totalBakiBalance}</strong><small>{baki.length} {t("overview.customers")}</small></div>
        </div>
      </div>

      {/* Matrix metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("overview.todays_revenue"),
            value: `৳${todayRevenue}`,
            icon: TrendingUp,
            color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20",
            to: "/shopkeeper/sales",
          },
          {
            label: t("overview.pending_orders"),
            value: pendingOrders,
            icon: ShoppingBag,
            color: "text-amber-500 bg-amber-50",
            to: "/shopkeeper/orders",
          },
          {
            label: t("overview.total_baki"),
            value: `৳${totalBakiBalance}`,
            icon: CreditCard,
            color: "text-blue-500 bg-blue-50",
            to: "/shopkeeper/baki",
          },
          {
            label: t("overview.total_sales"),
            value: sales.length,
            icon: Receipt,
            color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
            to: "/shopkeeper/sales",
          },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="matrix-stat-card">
            <div className={`matrix-icon ${color}`}>
              <Icon size={20} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-2"><p className="text-2xl font-display font-bold">{value}</p><Radar size={16} className="text-primary/60" /></div>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-base-content/50">{label}</p>
            <div className="matrix-meter mt-4"><span style={{ width: `${Math.min(100, Math.max(18, Number(value) * 10 || 18))}%` }} /></div>
          </Link>
        ))}
      </div>

      <OverviewCharts
        orders={orders}
        values={sales.map((sale) => ({ createdAt: sale.createdAt, amount: sale.price }))}
        valueLabel={t("overview.revenue")}
      />

      {/* Recent orders */}
      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{t("label.recent_orders")}</h2>
            <Link to="/shopkeeper/orders" className="text-sm text-primary hover:underline">
              {t("label.view_all")}
            </Link>
          </div>
          <div className="matrix-table-card bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs">
                    <th>{t("label.customer")}</th>
                    <th>{t("label.items")}</th>
                    <th>{t("label.status")}</th>
                    <th>{t("label.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o._id} className="hover">
                      <td className="text-sm font-medium">{o.customerId.slice(0, 8)}…</td>
                      <td className="text-sm text-base-content/60 max-w-xs truncate">
                        {o.items}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${
                          o.status === "pending" ? "badge-warning" :
                          o.status === "completed" ? "badge-success" : "badge-ghost"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/40">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
