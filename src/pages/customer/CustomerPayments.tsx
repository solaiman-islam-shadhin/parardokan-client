import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Receipt, Smartphone } from "lucide-react";
import api from "../../lib/api";
import { Payment, BakiMember } from "../../types";
import { DashboardTabSkeleton } from "../../components/ui/LoadingSkeleton";
import { useToast } from "../../context/ToastContext";

const statusColor: Record<string, string> = {
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-error",
  cancelled: "badge-ghost",
  verified: "badge-info",
};

export default function CustomerPayments() {
  const { t } = useTheme();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [baki, setBaki] = useState<BakiMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedBakiId, setSelectedBakiId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Stripe");
  const [tranId, setTranId] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState<Array<{ name: string; phone: string }>>([]);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const normalizePaymentMethods = (value: unknown): Array<{ name: string; phone: string }> => {
    const normalizeName = (name: string) => {
      const key = name.trim().toLowerCase();
      if (key === "bkash") return "bKash";
      if (key === "nagad") return "Nagad";
      if (key === "other") return "Other";
      if (key === "stripe") return "Stripe";
      return name.trim();
    };
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is { name: string; phone: string } =>
          Boolean(item && typeof item === "object" && "name" in item && "phone" in item)
      ).map((item) => ({ name: normalizeName(item.name), phone: item.phone }));
    }
    if (value && typeof value === "object") {
      return Object.entries(value)
        .filter(([, phone]) => typeof phone === "string" && phone.trim())
        .map(([name, phone]) => ({ name: normalizeName(name), phone: String(phone) }));
    }
    return [];
  };

  useEffect(() => {
    const load = () => Promise.all([api.get("/payments/my"), api.get("/baki/my")]).then(
      ([p, b]) => {
        setPayments(p.data);
        setBaki(b.data.filter((bk: BakiMember) => bk.status === "approved" && bk.balance > 0));
        setLoading(false);
      }
    );
    const sessionId = searchParams.get("session_id");
    const confirmation = sessionId
      ? api.get(`/payments/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`)
      : Promise.resolve();
    confirmation.finally(load);
    const refresh = window.setInterval(load, 5000);
    return () => window.clearInterval(refresh);
  }, [searchParams]);

  useEffect(() => {
    const selectedMember = baki.find((item) => item._id === selectedBakiId);
    if (!selectedMember?.shopId) {
      setPaymentAccounts([]);
      return;
    }
    api.get(`/shops/${selectedMember.shopId}/payment-settings`)
      .then((response) => {
        const methods = normalizePaymentMethods(response.data);
        setPaymentAccounts(methods);
        if (methods.length) setMethod(methods[0].name);
      })
      .catch(() => setPaymentAccounts([]));
  }, [selectedBakiId, baki]);

  const handlePay = async () => {
    if (!selectedBakiId || !amount) return setError(t("label.select_baki_enter_amount"));
    const selected = baki.find((b) => b._id === selectedBakiId);
    if (!selected?.shopId) return setError("Please select a valid shop payment account.");
    setError("");
    setPaying(true);
    try {
      if (method === "Stripe") {
        const response = await api.post("/payments/stripe/checkout", {
          amount: Number(amount),
          bakiId: selectedBakiId,
          shopId: selected.shopId,
        });
        window.location.href = response.data.url;
        return;
      }
      const account = paymentAccounts.find((item) => item.name === method);
      if (!account) {
        setError("This shop has not configured that payment method.");
        setPaying(false);
        return;
      }
      if (!tranId.trim()) {
        setError("Enter the transaction ID.");
        setPaying(false);
        return;
      }
        await api.post("/payments/manual", {
          amount: Number(amount),
          bakiId: selectedBakiId,
          shopId: selected.shopId,
          method,
          tranId,
        });
        setAmount("");
        setTranId("");
        setError("");
        const refreshed = await api.get("/payments/my");
        setPayments(refreshed.data);
        setPaying(false);
    } catch (err: any) {
      const message = err.response?.data?.error || t("label.payment_failed");
      setError(message);
      showToast("error", message);
      setPaying(false);
    }
  };

  if (loading) return <DashboardTabSkeleton variant="form" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.payments")}</h1>
        <p className="text-base-content/50 mt-1">{t("label.pay_your_baki_balance")}</p>
      </div>

      {/* Pay baki */}
      {baki.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">{t("label.pay_baki_balance")}</h2>
          {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.select_baki")}</span>
              </label>
              <select
                value={selectedBakiId}
                onChange={(e) => setSelectedBakiId(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">{t("label.choose")}</option>
                {baki.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.shopName} — ৳{b.balance} outstanding
                  </option>
                ))}
              </select>
            </div>
            {baki.find((item) => item._id === selectedBakiId)?.shopId && (
              <div className="rounded-xl bg-base-200 p-4 text-sm">
                <p className="font-semibold">Send payment to the shop account</p>
                <p className="mt-1 text-base-content/60">
                  {method === "Stripe" ? "You will be redirected to secure Stripe checkout." : paymentAccounts.find((item) => item.name === method)?.phone || "Select a supported payment method"}
                </p>
              </div>
            )}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.amount_bdt")}</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full"
                placeholder={t("label.enter_amount")}
                min={1}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.payment_method")}</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Stripe", "bKash", "Nagad", "Other", ...paymentAccounts
                  .map((item) => item.name)
                  .filter((name) => !["bKash", "Nagad", "Other", "Stripe"].includes(name))]
                  .map((m) => {
                  const available = m === "Stripe" || paymentAccounts.some((item) => item.name === m);
                  const amountTooSmallForStripe = m === "Stripe" && Number(amount) > 0 && Number(amount) < 100;
                  return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    disabled={!available || amountTooSmallForStripe}
                    className={`flex-1 border-2 rounded-xl py-2 text-sm font-medium capitalize transition-all ${
                      method === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300"
                    } ${!available ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Smartphone size={16} />
                      {m}
                    </span>
                    {m !== "Stripe" && (
                      <span className="mt-1 block text-[11px] font-normal normal-case">
                        {paymentAccounts.find((item) => item.name === m)?.phone || "Not configured"}
                      </span>
                    )}
                    {amountTooSmallForStripe && <span className="mt-1 block text-[11px] font-normal">Minimum ৳100</span>}
                  </button>
                  );
                })}
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Transaction ID</span></label>
              {method !== "Stripe" && <input value={tranId} onChange={(e) => setTranId(e.target.value)} className="input input-bordered w-full" placeholder="Enter the transaction ID" />}
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn btn-primary w-full"
            >
              {paying ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                `Submit ৳${amount || "0"} payment`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="font-semibold mb-4">{t("label.payment_history")}</h2>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-base-content/40">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t("label.no_payments_yet")}</p>
          </div>
        ) : (
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs">
                    <th>{t("label.amount")}</th>
                    <th>{t("label.method")}</th>
                    <th>{t("label.status")}</th>
                    <th>{t("label.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="hover">
                      <td className="font-semibold">৳{p.amount}</td>
                      <td className="text-sm capitalize">{p.method}</td>
                      <td>
                        <span className={`badge badge-sm ${statusColor[p.status] || "badge-ghost"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/40">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
