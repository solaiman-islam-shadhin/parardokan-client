import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Store } from "lucide-react";
import api from "../../lib/api";
import { uploadImage } from "../../lib/api";
import { BakiMember, Shop } from "../../types";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

export default function MyBaki() {
  const { t } = useTheme();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [baki, setBaki] = useState<BakiMember[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState(searchParams.get("shopId") || "");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState("");
  const [nidBackPreview, setNidBackPreview] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joining, setJoining] = useState(false);

  const load = () => {
    api.get("/baki/my").then((r) => {
      setBaki(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    if (profile?.latitude !== undefined && profile.longitude !== undefined) {
      api
        .get(`/shops/nearby?lat=${profile.latitude}&lng=${profile.longitude}&maxDistance=2000`)
        .then((r) => setShops(r.data));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        api
          .get(`/shops/nearby?lat=${coords.latitude}&lng=${coords.longitude}&maxDistance=2000`)
          .then((r) => setShops(r.data));
      }, () => {
        setMessage("Could not get your current location. Please enable location access to find nearby shops.");
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    }
  }, [profile?.latitude, profile?.longitude]);

  useEffect(() => {
    const query = shopSearch.trim();
    if (!query) return;
    const timer = window.setTimeout(() => {
      api.get(`/shops/search?q=${encodeURIComponent(query)}`).then((r) => setShops(r.data));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [shopSearch]);

  useEffect(() => {
    if (!nidFront) return setNidFrontPreview("");
    const url = URL.createObjectURL(nidFront);
    setNidFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [nidFront]);

  useEffect(() => {
    if (!nidBack) return setNidBackPreview("");
    const url = URL.createObjectURL(nidBack);
    setNidBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [nidBack]);

  const requestBaki = async () => {
    if (!selectedShopId || !nidNumber || !nidFront || !nidBack) {
      setMessage("Select a shop and provide your NID number and both NID photos.");
      return;
    }
    setRequesting(true);
    try {
      const [nidFrontUrl, nidBackUrl] = await Promise.all([uploadImage(nidFront), uploadImage(nidBack)]);
      await api.post("/baki/request", { shopId: selectedShopId, nidNumber, nidFrontUrl, nidBackUrl });
      setMessage("Request sent! The shopkeeper will review and approve.");
      setNidNumber("");
      setNidFront(null);
      setNidBack(null);
      load();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  const joinByPhone = async () => {
    if (!selectedShopId || !joinPhone.trim()) {
      setMessage("Select a shop and enter the phone number saved on your account.");
      return;
    }
    setJoining(true);
    try {
      await api.post("/baki/join-by-phone", {
        shopId: selectedShopId,
        phoneNumber: joinPhone.trim(),
      });
      setMessage("Your approved credit account has been linked to this shop.");
      setJoinPhone("");
      load();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Could not link the credit account");
    } finally {
      setJoining(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error",
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.my_baki")}</h1>
        <p className="text-base-content/50 mt-1">
          Manage your credit relationships with local shops
        </p>
      </div>

      {/* Request baki */}
      <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">{t("label.request_baki_membership")}</h2>
        {message && (
          <div className="alert alert-info mb-4 text-sm">{message}</div>
        )}
        <input value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} className="input input-bordered mb-3 w-full" placeholder="Search by shop name" />
        <div className="grid gap-4">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">{t("label.select_shop")}</option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold">Already registered by the shopkeeper?</h3>
            <p className="mt-1 text-sm text-base-content/60">Enter the same phone number you gave the shopkeeper. You can join even when the shop is outside 1 km.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input value={joinPhone} onChange={(e) => setJoinPhone(e.target.value)} className="input input-bordered input-lg flex-1 bg-base-100" placeholder="Your registered phone number" />
              <button onClick={joinByPhone} disabled={!selectedShopId || !joinPhone.trim() || joining} className="btn btn-secondary btn-lg">
                {joining ? <span className="loading loading-spinner loading-sm" /> : "Join with phone"}
              </button>
            </div>
          </div>
          <div className="divider">Or send a new Baki request</div>
          <input value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} className="input input-bordered w-full" placeholder="NID number" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-xl border border-dashed border-base-300 p-3">
              <span className="mb-2 block text-sm font-semibold">NID front photo</span>
              <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={(e) => setNidFront(e.target.files?.[0] || null)} />
              {nidFrontPreview && <img src={nidFrontPreview} alt="NID front preview" className="mt-3 h-28 w-full rounded-lg object-cover" />}
            </label>
            <label className="rounded-xl border border-dashed border-base-300 p-3">
              <span className="mb-2 block text-sm font-semibold">NID back photo</span>
              <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={(e) => setNidBack(e.target.files?.[0] || null)} />
              {nidBackPreview && <img src={nidBackPreview} alt="NID back preview" className="mt-3 h-28 w-full rounded-lg object-cover" />}
            </label>
          </div>
          <button
            onClick={requestBaki}
            disabled={!selectedShopId || requesting || !nidNumber || !nidFront || !nidBack}
            className="btn btn-primary"
          >
            {requesting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              t("label.request")
            )}
          </button>
        </div>
      </div>

      {/* My baki memberships */}
      {baki.length === 0 ? (
        <div className="text-center py-12 text-base-content/40">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t("label.no_baki_memberships_yet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {baki.map((b) => (
            <div
              key={b._id}
              className="bg-base-100 border border-base-300 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Store size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{b.shopName || t("label.shop")}</p>
                    <p className="font-mono text-xs text-primary">{t("label.member_id")}: {b.memberCode || "—"}</p>
                    <span className={`badge badge-sm mt-1 ${statusColor[b.status] || "badge-ghost"}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-base-300 pt-4 sm:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-wide text-base-content/40">{t("label.member_id")}</p><p className="font-mono font-semibold text-primary">{b.memberCode || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-base-content/40">{t("label.customer_details")}</p><p className="text-sm">{b.customerEmail || profile?.email || "—"}</p><p className="text-sm text-base-content/60">{b.customerPhone || profile?.phoneNumber || "—"}</p><p className="text-sm text-base-content/60">{b.customerAddress || profile?.address || "—"}</p></div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-error">
                    ৳{b.balance}
                  </p>
                  <p className="text-xs text-base-content/40">{t("label.outstanding")}</p>
                </div>
              </div>
              {b.status === "approved" && b.balance > 0 && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <a
                    href="/customer/payments"
                    className="btn btn-primary btn-sm"
                  >
                    Pay Now
                  </a>
                </div>
              )}
              {b.transactions && b.transactions.length > 0 && (
                <div className="mt-4 border-t border-base-300 pt-4">
                  <p className="text-sm font-semibold mb-2">{t("label.purchase_history")}</p>
                  <div className="space-y-2">
                    {b.transactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between text-sm">
                        <span>{transaction.productDetails}</span>
                        <span className="text-error font-medium">৳{transaction.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
