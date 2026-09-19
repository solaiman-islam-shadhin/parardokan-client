import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { Receipt, CheckCircle, Eye, Mail, Phone, MapPin, X } from "lucide-react";
import api from "../../lib/api";
import { Payment } from "../../types";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const statusColor: Record<string, string> = {
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-error",
  cancelled: "badge-ghost",
  verified: "badge-info",
};

export default function ShopkeeperPayments() {
  const { t } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const load = () => api.get("/payments").then((r) => {
      setPayments(r.data);
      setLoading(false);
    });
    load();
    const refresh = window.setInterval(load, 5000);
    return () => window.clearInterval(refresh);
  }, []);

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      await api.patch(`/payments/${id}/verify`);
      setPayments((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: "verified" } : p))
      );
    } finally {
      setVerifying(null);
    }
  };

  const totalReceived = payments
    .filter((p) => p.status === "paid" || p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.payments")}</h1>
        <p className="text-base-content/50 mt-1">{t("label.review_and_verify_customer_payments")}</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: t("label.total_received"), value: `৳${totalReceived}` },
          { label: t("label.pending"), value: payments.filter((p) => p.status === "pending").length },
          { label: t("label.verified"), value: payments.filter((p) => p.status === "verified").length },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-sm text-base-content/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <Receipt size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t("label.no_payments_yet")}</p>
        </div>
      ) : (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs">
                  <th>{t("label.customer")}</th>
                  <th>{t("label.amount")}</th>
                  <th>{t("label.method")}</th>
                  <th>{t("label.status")}</th>
                  <th>{t("label.date")}</th>
                  <th>{t("label.action")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="hover">
                    <td className="text-sm text-base-content/60">
                      {p.customer?.name || "Unknown customer"}
                    </td>
                    <td className="font-semibold">৳{p.amount}</td>
                    <td className="text-sm capitalize">{p.method}</td>
                    <td>
                      <span className={`badge badge-sm ${statusColor[p.status] || "badge-ghost"}`}>
                        {p.status}
                      </span>
                      {p.tranId && <p className="mt-1 text-[11px] text-base-content/50">{p.tranId}</p>}
                    </td>
                    <td className="text-xs text-base-content/40">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPayment(p)} className="btn btn-xs btn-outline gap-1">
                          <Eye size={12} /> Details
                        </button>
                        {p.status === "pending" && p.method !== "stripe" && (
                          <button
                            onClick={() => handleVerify(p._id)}
                            disabled={verifying === p._id}
                            className="btn btn-xs btn-success gap-1"
                          >
                            {verifying === p._id ? <span className="loading loading-spinner loading-xs" /> : <><CheckCircle size={12} /> Verify</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selectedPayment && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Customer details</h3>
              <button onClick={() => setSelectedPayment(null)} className="btn btn-sm btn-circle btn-ghost">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 mt-5">
              <p className="font-semibold text-xl">{selectedPayment.customer?.name || "Unknown customer"}</p>
              <p className="flex items-center gap-2 text-sm"><Mail size={16} />{selectedPayment.customer?.email || "Email unavailable"}</p>
              <p className="flex items-center gap-2 text-sm"><Phone size={16} />{selectedPayment.customer?.phoneNumber || t("label.phone_unavailable")}</p>
              <p className="flex items-center gap-2 text-sm"><MapPin size={16} />{selectedPayment.customer?.address || t("label.address_unavailable")}</p>
            </div>
            <div className="modal-action">
              <button onClick={() => setSelectedPayment(null)} className="btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
