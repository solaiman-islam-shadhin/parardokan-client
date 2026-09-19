import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, CreditCard, Receipt, MapPin, ArrowRight, Hand, Activity, Radar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { Order, BakiMember, Payment } from "../../types";
import { DashboardSkeleton } from "../../components/ui/LoadingSkeleton";
import OverviewCharts from "../../components/dashboard/OverviewCharts";

export default function CustomerOverview() {
  const { t } = useTheme();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [baki, setBaki] = useState<BakiMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/orders/my"),
      api.get("/baki/my"),
      api.get("/payments/my"),
    ]).then(([o, b, p]) => {
      setOrders(o.data.slice(0, 5));
      setBaki(b.data);
      setPayments(p.data.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const totalBakiBalance = baki.reduce((sum, b) => sum + (b.balance || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "badge-warning",
      approved: "badge-info",
      preparing: "badge-info",
      delivered: "badge-success",
      completed: "badge-success",
      rejected: "badge-error",
      cancelled: "badge-error",
    };
    return map[s] || "badge-ghost";
  };

  return (
    loading ? <DashboardSkeleton /> :
    <div className="dashboard-matrix space-y-8">
      <div>
        <p className="matrix-kicker"><Activity size={13} /> {t("overview.customer_matrix")}</p>
        <h1 className="font-display text-2xl font-bold">
          <span className="inline-flex items-center gap-2">{t("label.hello")}, {profile?.name?.split(" ")[0]} <Hand size={20} className="text-primary" /></span>
        </h1>
        <p className="text-base-content/50 mt-1">
          {t("label.neighborhood_update")}
        </p>
      </div>

      <div className="matrix-overview-panel">
        <div className="matrix-panel-glow" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="matrix-label">{t("overview.neighborhood_signal")}</p>
            <p className="mt-2 max-w-xl text-2xl font-bold tracking-tight">{t("overview.neighborhood_title")}</p>
          </div>
          <div className="matrix-pulse"><span /> {t("overview.live_connection")}</div>
        </div>
        <div className="matrix-grid-lines mt-8 grid gap-3 sm:grid-cols-3">
          <div><span>{t("overview.active_orders")}</span><strong>{pendingOrders}</strong><small>{t("overview.awaiting_action")}</small></div>
          <div><span>{t("overview.credit_balance")}</span><strong>৳{totalBakiBalance}</strong><small>{t("overview.across_shops")}: {baki.length}</small></div>
          <div><span>{t("overview.payment_flow")}</span><strong>{payments.length}</strong><small>{t("overview.recent_records")}</small></div>
        </div>
      </div>

      {/* Matrix metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("overview.total_orders"),
            value: orders.length,
            icon: ShoppingBag,
            color: "text-blue-500 bg-blue-50",
            to: "/customer/orders",
          },
          {
            label: t("overview.pending_orders"),
            value: pendingOrders,
            icon: ShoppingBag,
            color: "text-amber-500 bg-amber-50",
            to: "/customer/orders",
          },
          {
            label: t("overview.credit_balance"),
            value: `৳${totalBakiBalance}`,
            icon: CreditCard,
            color: "text-red-500 bg-red-50",
            to: "/customer/baki",
          },
          {
            label: t("overview.payments"),
            value: payments.length,
            icon: Receipt,
            color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20",
            to: "/customer/payments",
          },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="matrix-stat-card">
          <div className={`matrix-icon ${color}`}>
              <Icon size={20} />
            </div>
          <div className="mt-5 flex items-end justify-between gap-2"><p className="text-2xl font-display font-bold">{value}</p><Radar size={16} className="text-primary/60" /></div>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-base-content/50">{label}</p>
          <div className="matrix-meter mt-4"><span style={{ width: `${Math.min(100, Math.max(18, Number(value) * 12 || 18))}%` }} /></div>
          </Link>
        ))}
      </div>

      <OverviewCharts
        orders={orders}
        values={payments.map((payment) => ({ createdAt: payment.createdAt, amount: payment.amount }))}
        valueLabel={t("overview.payments")}
      />

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-lg mb-4">{t("label.quick_actions")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/customer/shops"
            className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-2xl p-5 hover:bg-primary/10 transition-colors group"
          >
            <div className="w-12 h-12 bg-primary text-primary-content rounded-xl flex items-center justify-center">
              <MapPin size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{t("label.find_nearby_shops")}</p>
              <p className="text-sm text-base-content/50">{t("label.shops_within_1_km")}</p>
            </div>
            <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/customer/order"
            className="flex items-center gap-4 bg-base-200 border border-base-300 rounded-2xl p-5 hover:bg-base-300 transition-colors group"
          >
            <div className="w-12 h-12 bg-neutral text-neutral-content rounded-xl flex items-center justify-center">
              <ShoppingBag size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{t("label.place_an_order")}</p>
              <p className="text-sm text-base-content/50">{t("label.order_from_a_shop")}</p>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      {!loading && orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{t("label.recent_orders")}</h2>
            <Link to="/customer/orders" className="text-sm text-primary hover:underline">
              {t("label.view_all")}
            </Link>
          </div>
          <div className="matrix-table-card bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs">
                    <th>{t("label.shop")}</th>
                    <th>{t("label.items")}</th>
                    <th>{t("label.status")}</th>
                    <th>{t("label.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="hover">
                      <td className="font-medium text-sm">{order.shopName}</td>
                      <td className="text-sm text-base-content/60 max-w-xs truncate">
                        {order.items}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/40">
                        {new Date(order.createdAt).toLocaleDateString()}
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
