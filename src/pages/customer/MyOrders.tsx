import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import api from "../../lib/api";
import { Order } from "../../types";
import { DashboardTabSkeleton } from "../../components/ui/LoadingSkeleton";

const statusColor: Record<string, string> = {
  pending: "badge-warning",
  approved: "badge-info",
  preparing: "badge-info",
  delivered: "badge-success",
  completed: "badge-success",
  rejected: "badge-error",
  cancelled: "badge-error",
};

export default function MyOrders() {
  const { t } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my").then((r) => {
      setOrders(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardTabSkeleton variant="list" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.my_orders")}</h1>
        <p className="text-base-content/50 mt-1">{t("label.track_all_your_orders")}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("label.no_orders_yet")}</p>
          <p className="text-sm mt-1">{t("label.place_your_first_order_from_a_nearby_shop")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-base-100 border border-base-300 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-lg">{order.shopName}</p>
                  <p className="text-base-content/60 text-sm mt-1 max-w-md">
                    {order.items}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-base-content/40 mt-1 italic">
                      Note: {order.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`badge ${statusColor[order.status] || "badge-ghost"}`}
                  >
                    {order.status}
                  </span>
                  <p className="text-xs text-base-content/40 mt-2">
                    {new Date(order.createdAt).toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
