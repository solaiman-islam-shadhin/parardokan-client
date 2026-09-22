import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { ShoppingBag, ChevronDown, CreditCard } from "lucide-react";
import api from "../../lib/api";
import { Order } from "../../types";
import { DashboardTabSkeleton } from "../../components/ui/LoadingSkeleton";

const STATUSES = ["pending","approved","rejected","preparing","delivered","completed","cancelled"];

const statusColor: Record<string, string> = {
  pending: "badge-warning",
  approved: "badge-info",
  preparing: "badge-info",
  delivered: "badge-success",
  completed: "badge-success",
  rejected: "badge-error",
  cancelled: "badge-error",
};

export default function ShopkeeperOrders() {
  const { t } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/orders").then((r) => {
      setOrders(r.data);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, {
        status,
        billedAmount: amounts[id] ? Number(amounts[id]) : undefined,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: status as Order["status"] } : o))
      );
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <DashboardTabSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("label.orders")}</h1>
          <p className="text-base-content/50 mt-1">{t("label.manage_incoming_customer_orders")}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="all">{t("label.all_orders")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("label.no_orders_found")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order._id}
              className="bg-base-100 border border-base-300 rounded-2xl p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge ${statusColor[order.status] || "badge-ghost"}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-base-content/40">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-base-content/70 text-sm mb-1">
                    <span className="font-medium">{t("label.items_colon")}</span> {order.items}
                  </p>
                  <p className="text-base-content/70 text-sm mb-1">
                    <span className="font-medium">{t("label.quantity_colon")}</span> {order.quantity || t("label.not_specified")}
                  </p>
                  <div className="flex flex-wrap gap-2 my-3">
                    <span className="badge badge-outline gap-1"><CreditCard size={12} /> {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod === "baki" ? "Baki" : `Online (${order.paymentProvider || "provider"})`}</span>
                    {order.billedAmount !== undefined && <span className="badge badge-success">৳{order.billedAmount}</span>}
                  </div>
                  {order.notes && (
                    <p className="text-base-content/50 text-xs italic">
                      Note: {order.notes}
                    </p>
                  )}
                  <p className="text-xs text-base-content/40 mt-2">
                    Customer: {order.customerId.slice(0, 12)}…
                  </p>
                </div>

                {order.status === "pending" && (
                  <div className="w-full md:w-52">
                    <label className="label py-1"><span className="label-text text-xs">{t("label.final_amount_bdt")}</span></label>
                    <input type="number" min="1" value={amounts[order._id] || String(order.estimatedAmount || "")} onChange={(e) => setAmounts({ ...amounts, [order._id]: e.target.value })} className="input input-bordered input-sm w-full mb-2"                     placeholder={t("label.required_to_approve")} />
                  </div>
                )}

                {/* Status update dropdown */}
                <div className="dropdown dropdown-end">
                  <label
                    tabIndex={0}
                    className="btn btn-sm btn-ghost border border-base-300 gap-1"
                  >
                    {updating === order._id ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <>{t("label.update")} <ChevronDown size={14} /></>
                    )}
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-10 border border-base-300"
                  >
                    {STATUSES.filter((s) => s !== order.status).map((s) => (
                      <li key={s}>
                        <button
                          onClick={() => updateStatus(order._id, s)}
                          className="capitalize text-sm"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
