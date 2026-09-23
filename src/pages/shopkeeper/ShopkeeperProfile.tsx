import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, Save, Power, Crown, CreditCard, Plus, Trash2, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api, { uploadImage } from "../../lib/api";
import { Shop, PricingPlan, Subscription } from "../../types";
import LocationPicker from "../../components/registration/LocationPicker";
import ConfirmActionDialog from "../../components/ui/ConfirmActionDialog";
import { DashboardProfileSkeleton } from "../../components/ui/LoadingSkeleton";
import { useToast } from "../../context/ToastContext";

const weekDays = [
  ["1", "Monday"], ["2", "Tuesday"], ["3", "Wednesday"], ["4", "Thursday"],
  ["5", "Friday"], ["6", "Saturday"], ["0", "Sunday"],
] as const;

const defaultHours = Object.fromEntries(
  weekDays.map(([key]) => [key, { enabled: true, open: "08:00", close: "22:00" }])
);

export default function ShopkeeperProfile() {
  const { t } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: profile?.name || "",
    address: profile?.address || "",
    phoneNumber: profile?.phoneNumber || "",
    gender: profile?.gender || "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(profile?.latitude);
  const [longitude, setLongitude] = useState(profile?.longitude);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [openingHours, setOpeningHours] = useState<Record<string, { enabled: boolean; open: string; close: string }>>(defaultHours);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<Array<{ name: string; phone: string }>>([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [newPayment, setNewPayment] = useState({ name: "", phone: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { showToast } = useToast();
  const normalizePaymentMethods = (value: unknown): Array<{ name: string; phone: string }> => {
    const normalizeName = (name: string) => {
      const key = name.trim().toLowerCase();
      if (key === "bkash") return "bKash";
      if (key === "nagad") return "Nagad";
      if (key === "other") return "Other";
      return name.trim();
    };
    if (Array.isArray(value)) {
      return value.map((item) => ({ name: normalizeName(item.name), phone: item.phone }));
    }
    if (value && typeof value === "object") {
      return Object.entries(value)
        .filter(([, phone]) => typeof phone === "string" && phone.trim())
        .map(([name, phone]) => ({ name: normalizeName(name), phone: String(phone) }));
    }
    return [];
  };

  useEffect(() => {
    const shopRequest = api.get("/shops/my").then((r) => {
      setShop(r.data);
      setScheduleEnabled(Boolean(r.data.scheduleEnabled));
      setOpeningHours({ ...defaultHours, ...(r.data.openingHours || {}) });
      setPaymentAccounts(normalizePaymentMethods(r.data.paymentMethods));
    }).catch(() => {});
    const plansRequest = api.get("/subscriptions/pricing").then((r) => setPlans(r.data));
    const sessionId = searchParams.get("session_id");
    const confirm = sessionId
      ? api.get(`/subscriptions/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`)
      : Promise.resolve();
    const subscriptionRequest = confirm
      .then(() => api.get("/subscriptions/me"))
      .then((r) => setSubscription(r.data))
      .catch(() => {});
    Promise.all([shopRequest, plansRequest, subscriptionRequest])
      .finally(() => setProfileLoading(false));
  }, [searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmUpdate(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let image = profile?.image;
      if (imageFile) image = await uploadImage(imageFile);
      await api.patch("/profile/me", { ...form, image });
      if (latitude !== undefined && longitude !== undefined) {
        await api.patch("/profile/location", { latitude, longitude });
      }
      await refreshProfile();
      setSuccess("Profile updated successfully");
      showToast("success", t("label.update_success"));
      setImageFile(null);
      setConfirmUpdate(false);
    } catch {
      const message = t("label.update_failed");
      setError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile || profileLoading) return <DashboardProfileSkeleton />;

  const toggleShop = async () => {
    if (!shop) return;
    if (shop.scheduleEnabled) return;
    setToggling(true);
    try {
      await api.patch("/shops/open-status", { isOpen: !shop.isOpen });
      setShop({ ...shop, isOpen: !shop.isOpen });
    } finally {
      setToggling(false);
    }
  };

  const saveSchedule = async () => {
    setScheduleSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch("/shops/schedule", { scheduleEnabled, openingHours });
      setShop(res.data);
      setSuccess(t("label.schedule_updated"));
      showToast("success", t("label.schedule_updated"));
    } catch (err: any) {
      const message = err.response?.data?.error || "Could not update opening schedule";
      setError(message);
      showToast("error", message);
    } finally {
      setScheduleSaving(false);
    }
  };

  const savePaymentAccounts = async () => {
    setPaymentSaving(true);
    try {
      await api.patch("/shops/payment-settings", { methods: paymentAccounts });
      setSuccess("Digital payment accounts updated");
    } catch {
      setError("Could not update digital payment accounts");
    } finally {
      setPaymentSaving(false);
    }
  };

  const addPaymentMethod = () => {
    if (!newPayment.name.trim() || !newPayment.phone.trim()) return;
    if (paymentAccounts.length >= 2 && subscription?.planId !== "premium" && subscription?.planId !== "enterprise") {
      setError("Basic plan allows only 2 payment methods.");
      return;
    }
    setPaymentAccounts([...paymentAccounts, { name: newPayment.name.trim(), phone: newPayment.phone.trim() }]);
    setNewPayment({ name: "", phone: "" });
    setPaymentDialog(false);
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.id === "basic") {
      setSuccess("Basic is included free with every shopkeeper account.");
      return;
    }
    if (plan.id === "enterprise") {
      window.location.href = "mailto:sales@parardokan.com?subject=Enterprise%20plan";
      return;
    }
    const amount = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
    if (!amount) return;
    setSubLoading(plan.id);
    setError("");
    try {
      const res = await api.post("/subscriptions/stripe/checkout", { planId: plan.id, billingCycle });
      if (!res.data?.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }
      window.location.href = res.data.url;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        (err.code === "ECONNABORTED"
          ? "The payment server took too long to respond. Please try again."
          : err.message || "Subscription checkout failed");
      setError(message);
      showToast("error", message);
    } finally {
      setSubLoading(null);
    }
  };

  return (
    <div className="profile-page space-y-6 max-w-5xl">
      <ConfirmActionDialog open={confirmUpdate} title={t("label.confirm_update")} description={t("label.confirm_update_description")} confirmLabel={t("label.update")} busy={saving} onConfirm={saveProfile} onCancel={() => setConfirmUpdate(false)} />
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.shop_profile")}</h1>
        <p className="text-base-content/50 mt-1">{t("label.manage_your_shop_and_personal_info")}</p>
      </div>

      {/* Shop status card */}
      {shop && (
        <div className="profile-section bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">{shop.name}</h2>
            <p className="text-sm text-base-content/50">{shop.address}</p>
          </div>
          <button
            onClick={toggleShop}
            disabled={toggling || shop.scheduleEnabled}
            className={`btn gap-2 ${shop.isOpen ? "btn-success" : "btn-outline"}`}
          >
            {toggling ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Power size={16} />
                {shop.scheduleEnabled ? (shop.isOpen ? t("label.open_by_schedule_button") : t("label.closed_by_schedule_button")) : (shop.isOpen ? t("label.open") : t("label.closed"))}
              </>
            )}
          </button>
        </div>
      )}

      <div className="profile-section bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-semibold text-lg">{t("label.opening_hours")}</h2>
            <p className="text-sm text-base-content/50 mt-1">
              Set the weekly times customers can visit your shop. Times use Bangladesh time.
            </p>
          </div>
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-sm">{t("label.use_schedule")}</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
            />
          </label>
        </div>
        <div className="space-y-3">
          {weekDays.map(([key, label]) => {
            const day = openingHours[key];
            return (
              <div key={key} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={day.enabled}
                    onChange={(e) => setOpeningHours((current) => ({
                      ...current,
                      [key]: { ...current[key], enabled: e.target.checked },
                    }))}
                  />
                  {label}
                </label>
                <input
                  type="time"
                  className="input input-bordered input-sm"
                  value={day.open}
                  disabled={!day.enabled}
                  onChange={(e) => setOpeningHours((current) => ({
                    ...current,
                    [key]: { ...current[key], open: e.target.value },
                  }))}
                />
                <input
                  type="time"
                  className="input input-bordered input-sm"
                  value={day.close}
                  disabled={!day.enabled}
                  onChange={(e) => setOpeningHours((current) => ({
                    ...current,
                    [key]: { ...current[key], close: e.target.value },
                  }))}
                />
              </div>
            );
          })}
        </div>
        <button onClick={saveSchedule} disabled={scheduleSaving} className="btn btn-primary btn-sm mt-5">
          {scheduleSaving ? <span className="loading loading-spinner loading-xs" /> : t("label.save_opening_hours")}
        </button>
      </div>

      {/* Profile form */}
      <div className="profile-section profile-card bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-8">
        <h2 className="font-semibold mb-6">{t("label.personal_information")}</h2>

        <div className="profile-card-header flex items-center gap-5 mb-7">
          <div className="relative">
            <div className="avatar">
              <div className="w-20 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                <img
                  src={
                    imagePreview ||
                    profile?.image ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`
                  }
                  alt="Avatar"
                />
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-content rounded-full flex items-center justify-center"
            >
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <div>
            <p className="font-semibold">{profile?.name}</p>
            <p className="text-sm text-base-content/50">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label"><span className="label-text">{t("label.full_name")}</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input input-bordered w-full" />
            </div>
            <div className="form-control sm:col-span-2">
              <label className="label"><span className="label-text">{t("label.shop_location")}</span></label>
              <LocationPicker
                address={form.address}
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">{t("label.phone")}</span></label>
              <input type="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="input input-bordered w-full" />
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">{t("label.address")}</span></label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input input-bordered w-full" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">{t("label.gender")}</span></label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="select select-bordered w-full">
              <option value="">{t("label.prefer_not_to_say")}</option>
              <option value="male">{t("label.male")}</option>
              <option value="female">{t("label.female")}</option>
              <option value="other">{t("label.other")}</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : <><Save size={16} />{t("label.save_changes")}</>}
          </button>
        </form>
      </div>

      {/* Subscription */}
      <div className="profile-section bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-8">
        <h2 className="font-semibold text-lg">Digital payment accounts</h2>
        <p className="mt-1 text-sm text-base-content/60">Add the payment service name and account number customers should use.</p>
        <div className="mt-5 space-y-3">
          {paymentAccounts.map((method, index) => (
            <div key={`${method.name}-${index}`} className="flex items-center justify-between rounded-xl border border-base-300 p-4">
              <div className="flex items-center gap-3"><Smartphone size={18} className="text-primary" /><div><p className="font-semibold">{method.name}</p><p className="text-sm text-base-content/60">{method.phone}</p></div></div>
              <button onClick={() => setPaymentAccounts(paymentAccounts.filter((_, itemIndex) => itemIndex !== index))} className="btn btn-ghost btn-sm text-error"><Trash2 size={16} /></button>
            </div>
          ))}
          <button onClick={() => setPaymentDialog(true)} className="btn btn-outline gap-2"><Plus size={16} /> Add a payment method</button>
        </div>
        <button onClick={savePaymentAccounts} disabled={paymentSaving} className="btn btn-primary mt-5">
          {paymentSaving ? <span className="loading loading-spinner loading-sm" /> : "Save payment accounts"}
        </button>
      </div>
      {paymentDialog && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add a payment method</h3>
            <div className="mt-5 space-y-4">
              <input className="input input-bordered w-full" placeholder="Payment method name (e.g. bKash)" value={newPayment.name} onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Account phone number" value={newPayment.phone} onChange={(e) => setNewPayment({ ...newPayment, phone: e.target.value })} />
            </div>
            <div className="modal-action"><button onClick={() => setPaymentDialog(false)} className="btn">Cancel</button><button onClick={addPaymentMethod} className="btn btn-primary">Save</button></div>
          </div>
        </div>
      )}

      {/* Subscription */}
      <div className="bg-base-100 border border-base-300 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-2">
          <Crown size={20} className="text-amber-500" />
          <h2 className="font-semibold text-lg">{t("label.subscription_plan")}</h2>
        </div>

        {error && (
          <div className="alert alert-error mb-6 text-sm">
            {error}
          </div>
        )}

        {subscription && (
          <div className="alert alert-success mb-6 text-sm">
            You are on the <strong>{subscription.planId}</strong> plan. Paid via {subscription.method}.
          </div>
        )}

        <div className="mb-6 flex items-center gap-2 text-sm text-base-content/60">
          <CreditCard size={16} className="text-primary" />
          Subscriptions are processed securely through Stripe.
        </div>

        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm text-base-content/60">
            Choose monthly billing or save with the annual Premium plan.
          </p>
          <div className="join">
            <button className={`join-item btn btn-sm ${billingCycle === "monthly" ? "btn-primary" : "btn-outline"}`} onClick={() => setBillingCycle("monthly")}>Monthly</button>
            <button className={`join-item btn btn-sm ${billingCycle === "annual" ? "btn-primary" : "btn-outline"}`} onClick={() => setBillingCycle("annual")}>Annual</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-2xl p-5 ${
                plan.id === "premium"
                  ? "border-primary bg-primary/5"
                  : "border-base-300"
              }`}
            >
              {plan.id === "premium" && (
                <span className="badge badge-primary badge-sm mb-2">{t("label.popular")}</span>
              )}
              <h3 className="font-display font-bold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold my-2">
                {plan.id === "enterprise"
                  ? "Contact us"
                  : plan.id === "basic"
                    ? "Free"
                    : `৳${billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice}`}
                {plan.id === "premium" && (
                  <span className="text-sm font-normal text-base-content/50">
                    /{billingCycle === "annual" ? "year" : "mo"}
                  </span>
                )}
              </p>
              <ul className="text-xs text-base-content/60 space-y-1 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={!!subLoading || subscription?.planId === plan.id}
                className={`btn btn-sm w-full ${plan.id === "premium" ? "btn-primary" : "btn-outline"}`}
              >
                {subLoading === plan.id ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : subscription?.planId === plan.id ? "Current Plan" : plan.id === "enterprise" ? "Contact us" : plan.id === "basic" ? "Included" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
