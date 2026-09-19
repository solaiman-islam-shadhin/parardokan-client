import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShoppingBag, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";
import { Shop } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function PlaceOrder() {
  const { t } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState(searchParams.get("shopId") || "");
  const [items, setItems] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "baki" | "online">("cod");
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "bkash" | "nagad" | "other">("stripe");
  const [paymentAccounts, setPaymentAccounts] = useState<Record<string, string>>({});
  const [transactionId, setTransactionId] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [bakiAllowed, setBakiAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const normalizePaymentMethods = (value: unknown): Record<string, string> => {
    if (Array.isArray(value)) {
      return Object.fromEntries(
        value
          .filter((item) => item && typeof item.name === "string" && typeof item.phone === "string")
          .map((item) => {
            const name = item.name.trim().toLowerCase();
            const key = name === "bkash" ? "bkash" : name === "nagad" ? "nagad" : name === "other" ? "other" : item.name.trim();
            return [key, item.phone.trim()];
          })
      );
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).filter(([, phone]) => typeof phone === "string" && phone.trim())
      );
    }
    return {};
  };

  useEffect(() => {
    if (profile?.latitude !== undefined && profile.longitude !== undefined) {
      api
        .get(`/shops/nearby?lat=${profile.latitude}&lng=${profile.longitude}&maxDistance=1000`)
        .then((res) => setShops(res.data));
      return;
    }
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      api
        .get(`/shops/nearby?lat=${coords.latitude}&lng=${coords.longitude}&maxDistance=1000`)
        .then((res) => setShops(res.data));
    }, () => {
      setError(t("nearby.location_permission"));
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
  }, [profile?.latitude, profile?.longitude]);

  useEffect(() => {
    if (!selectedShopId) return;
    api.get("/baki/my").then((res) => {
      setBakiAllowed(res.data.some((member: { shopId: string; status: string }) =>
        member.shopId === selectedShopId && member.status === "approved"
      ));
    }).catch(() => setBakiAllowed(false));
  }, [selectedShopId]);

  useEffect(() => {
    if (!selectedShopId) return;
    api.get(`/shops/${selectedShopId}/payment-settings`)
      .then((res) => setPaymentAccounts(normalizePaymentMethods(res.data)))
      .catch(() => setPaymentAccounts({}));
  }, [selectedShopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return setError("Please select a shop");
    if (!quantity.trim()) return setError("Please enter a quantity");
    if (!items.trim()) return setError("Please describe your order");
    if ((paymentMethod === "baki" || paymentMethod === "online") &&
      (!estimatedAmount || Number(estimatedAmount) <= 0)) {
      return setError("Please enter the estimated order amount");
    }
    if (paymentMethod === "online" && paymentProvider !== "stripe" && (!transactionId.trim() || !paymentAccounts[paymentProvider])) {
      return setError("Select a supported payment method and enter its transaction ID");
    }
    if (paymentMethod === "online" && paymentProvider === "stripe" && Number(estimatedAmount) < 100) {
      return setError("Stripe payments must be at least ৳100. Use bKash or Nagad for smaller payments.");
    }

    setLoading(true);
    setError("");
    try {
      const orderResponse = await api.post("/orders", {
        shopId: selectedShopId,
        items,
        quantity,
        notes,
        paymentMethod,
        paymentProvider: paymentMethod === "online" ? paymentProvider : undefined,
        estimatedAmount: estimatedAmount ? Number(estimatedAmount) : undefined,
      });
      if (paymentMethod === "online") {
        if (paymentProvider === "stripe") {
          const paymentResponse = await api.post(`/orders/${orderResponse.data.orderId}/payment`, {
            amount: Number(estimatedAmount),
            provider: "stripe",
          });
          window.location.href = paymentResponse.data.url;
          return;
        }
        await api.post("/payments/manual", {
          amount: Number(estimatedAmount), orderId: orderResponse.data.orderId,
          shopId: selectedShopId, method: paymentProvider, tranId: transactionId.trim(),
        });
        showToast("success", "Payment submitted successfully");
        setSuccess(true);
        return;
      }
      showToast("success", "Order placed successfully");
      setSuccess(true);
      setTimeout(() => navigate("/customer/orders"), 2000);
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to place order";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">{t("label.order_placed")}</h2>
          <p className="text-base-content/50">
            Your order has been sent to the shop. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("label.place_an_order")}</h1>
        <p className="text-base-content/50 mt-1">
          Describe what you need in plain language
        </p>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="alert alert-error text-sm">{error}</div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t("label.quantity")}</span>
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g. 2 kg, 500 g, 1 bottle"
              required
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">{t("label.payment_option")}</span></label>
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                ["cod", "Cash on delivery"],
                ["baki", "Baki"],
                ["online", "Online payment"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  disabled={value === "baki" && !bakiAllowed}
                  onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                  className={`border-2 rounded-xl p-3 text-sm text-left ${
                    paymentMethod === value ? "border-primary bg-primary/10 text-primary" : "border-base-300"
                  } ${value === "baki" && !bakiAllowed ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="font-medium">{label}</span>
                  {value === "baki" && !bakiAllowed && <span className="block text-xs mt-1">{t("label.not_approved_for_this_shop")}</span>}
                </button>
              ))}
            </div>
          </div>
          {(paymentMethod === "baki" || paymentMethod === "online") && (
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">{t("label.estimated_amount_bdt")}</span></label>
              <input type="number" min="1" value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} className="input input-bordered w-full" placeholder={t("label.shopkeeper_confirms_final_amount_placeholder")} required />
            </div>
          )}
          {paymentMethod === "online" && (
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">{t("label.online_payment_provider")}</span></label>
              <div className="flex gap-2">
                {(["stripe", "bkash", "nagad", "other"] as const).map((provider) => (
                  <button type="button" key={provider} disabled={provider !== "stripe" && !paymentAccounts[provider]} onClick={() => setPaymentProvider(provider)} className={`btn btn-sm flex-1 ${paymentProvider === provider ? "btn-primary" : "btn-outline"} ${provider !== "stripe" && !paymentAccounts[provider] ? "opacity-50" : ""}`}>
                    {provider === "stripe" ? "Stripe" : provider === "bkash" ? "bKash" : provider === "nagad" ? "Nagad" : "Other"}{provider !== "stripe" && ` — ${paymentAccounts[provider]}`}
                  </button>
                ))}
              </div>
              {paymentProvider !== "stripe" && <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="input input-bordered mt-3" placeholder="Transaction ID" />}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t("label.select_shop_label")}</span>
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="select select-bordered w-full"
              required
            >
              <option value="">{t("label.choose_a_nearby_shop")}</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id} disabled={!shop.isOpen}>
                  {shop.name} {!shop.isOpen ? "(Closed)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t("label.what_do_you_need")}</span>
              <span className="label-text-alt text-base-content/40">
                Write naturally
              </span>
            </label>
            <textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              className="textarea textarea-bordered w-full h-32"
              placeholder="e.g. 2 kg rice, 500g sugar, 1 bottle of cooking oil, 6 eggs..."
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t("label.delivery_notes")}</span>
              <span className="label-text-alt text-base-content/40">{t("label.optional")}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g. Please deliver before 6 PM"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <ShoppingBag size={18} />
                Place Order
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
