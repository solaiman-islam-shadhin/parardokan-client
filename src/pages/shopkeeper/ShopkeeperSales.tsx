import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import api from "../../lib/api";
import { Sale } from "../../types";
import { DashboardTabSkeleton } from "../../components/ui/LoadingSkeleton";
import { useToast } from "../../context/ToastContext";

export default function ShopkeeperSales() {
  const { t } = useTheme();
  const { showToast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    price: "",
    customerName: "",
    customerPhone: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/sales").then((r) => {
      setSales(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/sales", { ...form, price: Number(form.price) });
      setForm({ itemName: "", price: "", customerName: "", customerPhone: "", note: "" });
      setShowForm(false);
      load();
      showToast("success", "Sale added successfully");
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to add sale";
      setError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("label.delete_sale_confirm"))) return;
    await api.delete(`/sales/${id}`);
    setSales((prev) => prev.filter((s) => s._id !== id));
  };

  const todaySales = sales.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.price, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);

  if (loading) return <DashboardTabSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("label.sales")}</h1>
          <p className="text-base-content/50 mt-1">{t("label.track_your_daily_sales")}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary gap-2"
        >
          <Plus size={18} />
          {t("label.add_sale")}
        </button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: t("label.todays_revenue"), value: `৳${todayRevenue}`, sub: `${todaySales.length} ${t("label.sales_count")}` },
          { label: t("label.total_revenue"), value: `৳${totalRevenue}`, sub: `${sales.length} ${t("label.total_sales")}` },
          { label: t("label.avg_sale"), value: sales.length ? `৳${Math.round(totalRevenue / sales.length)}` : "৳0", sub: t("label.per_transaction") },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <div className="w-9 h-9 bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp size={18} />
            </div>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-sm text-base-content/50 mt-1">{label}</p>
            <p className="text-xs text-base-content/30">{sub}</p>
          </div>
        ))}
      </div>

      {/* Add sale form */}
      {showForm && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">{t("label.record_new_sale")}</h2>
          {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("label.item_name")}</span>
                </label>
                <input
                  type="text"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder={t("label.rice_placeholder")}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("label.price")} (৳) *</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="0"
                  required
                  min={0}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("label.customer_name")}</span>
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder={t("label.optional")}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("label.customer_phone")}</span>
                </label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder={t("label.optional")}
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.note")}</span>
              </label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="input input-bordered w-full"
                placeholder={t("label.optional_note")}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? <span className="loading loading-spinner loading-sm" /> : t("label.save_sale")}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">
                {t("label.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales table */}
      {sales.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("label.no_sales_recorded_yet")}</p>
        </div>
      ) : (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs">
                  <th>{t("label.item")}</th>
                  <th>{t("label.price")}</th>
                  <th>{t("label.customer")}</th>
                  <th>{t("label.note")}</th>
                  <th>{t("label.date")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} className="hover">
                    <td className="font-medium">{s.itemName}</td>
                    <td className="font-semibold text-success">৳{s.price}</td>
                    <td className="text-sm text-base-content/60">
                      {s.customerName || "—"}
                      {s.customerPhone && (
                        <span className="block text-xs text-base-content/40">
                          {s.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-base-content/50">{s.note || "—"}</td>
                    <td className="text-xs text-base-content/40">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
