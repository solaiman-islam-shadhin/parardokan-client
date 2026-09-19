import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { CreditCard, Plus, CheckCircle, Edit3, X, Eye, UserRound } from "lucide-react";
import api from "../../lib/api";
import { uploadImage } from "../../lib/api";
import { BakiMember } from "../../types";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ConfirmActionDialog from "../../components/ui/ConfirmActionDialog";
import { useToast } from "../../context/ToastContext";

export default function ShopkeeperBaki() {
  const { t } = useTheme();
  const [members, setMembers] = useState<BakiMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState<{ id: string; productDetails: string; amount: string } | null>(null);
  const [editingLimit, setEditingLimit] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [nearbyCustomers, setNearbyCustomers] = useState<Array<{ firebaseUid: string; name?: string; phoneNumber?: string; address?: string }>>([]);
  const [manualPhone, setManualPhone] = useState("");
  const [search, setSearch] = useState("");
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "credit-customer">("members");
  const [creditForm, setCreditForm] = useState({ name: "", phoneNumber: "", email: "", address: "", nidNumber: "", creditLimit: "" });
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState("");
  const [nidBackPreview, setNidBackPreview] = useState("");
  const [selectedMember, setSelectedMember] = useState<BakiMember | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: "delete" | "update"; member?: BakiMember; action?: () => Promise<void> } | null>(null);
  const { showToast } = useToast();

  const handleRemoveMember = async (member: BakiMember) => {
    setConfirmation({ type: "delete", member });
  };

  const load = () => {
    api.get("/baki").then((r) => {
      setMembers(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!nidFront) {
      setNidFrontPreview("");
      return;
    }
    const url = URL.createObjectURL(nidFront);
    setNidFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [nidFront]);
  useEffect(() => {
    if (!nidBack) {
      setNidBackPreview("");
      return;
    }
    const url = URL.createObjectURL(nidBack);
    setNidBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [nidBack]);
  useEffect(() => {
    api.get("/baki/nearby-customers").then((r) => setNearbyCustomers(r.data)).catch(() => setNearbyCustomers([]));
  }, [members.length]);

  const handleApprove = async (id: string) => {
    const approve = async () => {
      await api.patch(`/baki/${id}/approve`);
      setMembers((prev) => prev.map((m) => (m._id === id ? { ...m, status: "approved" } : m)));
      showToast("success", t("label.update_success"));
    };
    setConfirmation({ type: "update", action: approve });
  };

  const confirmMemberAction = async () => {
    if (!confirmation?.member) return;
    setSaving(true);
    try {
      if (confirmation.type === "delete") {
        await api.delete(`/baki/${confirmation.member._id}`);
        setSelectedMember(null);
        setMembers((prev) => prev.filter((item) => item._id !== confirmation.member?._id));
        showToast("success", t("label.delete_success"));
      } else if (confirmation.action) {
        await confirmation.action();
      }
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!editingBalance) return;
    setSaving(true);
    try {
      await api.patch(`/baki/${editingBalance.id}/balance`, {
        productDetails: editingBalance.productDetails,
        amount: Number(editingBalance.amount),
      });
      setMembers((prev) =>
        prev.map((m) =>
          m._id === editingBalance.id
            ? { ...m, balance: m.balance + Number(editingBalance.amount) }
            : m
        )
      );
      setEditingBalance(null);
      showToast("success", t("label.update_success"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddByPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualPhone.trim()) return;
    setSaving(true);
    try {
      await api.post("/baki/add-member", { customerPhone: manualPhone.trim() });
      setManualPhone("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!editingLimit) return;
    setSaving(true);
    try {
      const creditLimit = Number(editingLimit.value);
      const response = await api.patch(`/baki/${editingLimit.id}/credit-limit`, { creditLimit });
      setMembers((prev) => prev.map((member) =>
        member._id === editingLimit.id ? { ...member, creditLimit: response.data.member.creditLimit } : member
      ));
      setEditingLimit(null);
      showToast("success", t("label.update_success"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCreditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidFront || !nidBack) return;
    setSaving(true);
    try {
      const [nidFrontUrl, nidBackUrl] = await Promise.all([uploadImage(nidFront), uploadImage(nidBack)]);
      await api.post("/baki/credit-customer", { ...creditForm, nidFrontUrl, nidBackUrl, creditLimit: Number(creditForm.creditLimit) });
      setCreditForm({ name: "", phoneNumber: "", email: "", address: "", nidNumber: "", creditLimit: "" });
      setNidFront(null);
      setNidBack(null);
      setShowCreditForm(false);
      setActiveTab("members");
      load();
    } finally {
      setSaving(false);
    }
  };

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("label.baki_management")}</h1>
          <p className="text-base-content/50 mt-1">{t("label.manage_customer_credit_accounts")}</p>
        </div>

        {nearbyCustomers.length > 0 && (
          <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
            <h2 className="font-semibold mb-1">{t("label.nearby_customers")}</h2>
            <p className="text-sm text-base-content/50 mb-4">{t("label.customers_within_1km")}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {nearbyCustomers.map((customer) => (
                <div key={customer.firebaseUid} className="border border-base-300 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div><p className="font-medium">{customer.name || "Unnamed customer"}</p><p className="text-xs text-base-content/50">{customer.phoneNumber || customer.address || "Location available"}</p></div>
                  <button onClick={async () => { await api.post("/baki/add-member", { customerId: customer.firebaseUid, customerName: customer.name, customerPhone: customer.phoneNumber }); setNearbyCustomers((prev) => prev.filter((item) => item.firebaseUid !== customer.firebaseUid)); load(); }} className="btn btn-primary btn-xs">{t("label.add_to_baki")}</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid max-w-2xl grid-cols-2 gap-3 rounded-2xl border border-base-300 bg-base-200/50 p-2">
        <button onClick={() => { setActiveTab("members"); setEditingBalance(null); }} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === "members" ? "bg-base-100 text-primary shadow-sm" : "text-base-content/60 hover:bg-base-100/70"}`}>
          <CreditCard size={18} /> {t("label.active_members")}
        </button>
        <button onClick={() => { setActiveTab("credit-customer"); setShowCreditForm(true); }} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === "credit-customer" ? "bg-base-100 text-primary shadow-sm" : "text-base-content/60 hover:bg-base-100/70"}`}>
          <Plus size={18} /> {t("label.add_credit_customer")}
        </button>
      </div>

      {activeTab === "credit-customer" && showCreditForm && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-6">
          <h2 className="font-semibold mb-1">{t("label.add_credit_customer")}</h2>
          <p className="text-sm text-base-content/50 mb-4">{t("label.credit_customer_nid_help")}</p>
          <form onSubmit={handleAddCreditCustomer} className="grid gap-5 md:grid-cols-2">
            <input className="input input-bordered input-lg" placeholder={t("label.full_name")} value={creditForm.name} onChange={(e) => setCreditForm({ ...creditForm, name: e.target.value })} required />
            <input className="input input-bordered input-lg" placeholder={t("label.phone_number")} value={creditForm.phoneNumber} onChange={(e) => setCreditForm({ ...creditForm, phoneNumber: e.target.value })} required />
            <input type="email" className="input input-bordered input-lg" placeholder={t("label.email")} value={creditForm.email} onChange={(e) => setCreditForm({ ...creditForm, email: e.target.value })} required />
            <input className="input input-bordered input-lg md:col-span-2" placeholder={t("label.address")} value={creditForm.address} onChange={(e) => setCreditForm({ ...creditForm, address: e.target.value })} required />
            <input className="input input-bordered input-lg" placeholder={t("label.nid_number")} value={creditForm.nidNumber} onChange={(e) => setCreditForm({ ...creditForm, nidNumber: e.target.value })} required />
            <input type="number" min="0" className="input input-bordered input-lg" placeholder={t("label.credit_limit")} value={creditForm.creditLimit} onChange={(e) => setCreditForm({ ...creditForm, creditLimit: e.target.value })} required />
            <label className="rounded-xl border border-dashed border-base-300 p-4"><span className="label-text mb-3 block font-semibold">{t("label.nid_front")}</span><input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={(e) => setNidFront(e.target.files?.[0] || null)} required />{nidFrontPreview && <img src={nidFrontPreview} alt={t("label.nid_front")} className="mt-3 h-32 w-full rounded-lg object-cover" />}</label>
            <label className="rounded-xl border border-dashed border-base-300 p-4"><span className="label-text mb-3 block font-semibold">{t("label.nid_back")}</span><input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={(e) => setNidBack(e.target.files?.[0] || null)} required />{nidBackPreview && <img src={nidBackPreview} alt={t("label.nid_back")} className="mt-3 h-32 w-full rounded-lg object-cover" />}</label>
            <div className="md:col-span-2 flex gap-3"><button className="btn btn-primary btn-lg" disabled={saving}>{saving ? <span className="loading loading-spinner" /> : t("label.save")}</button><button type="button" onClick={() => { setShowCreditForm(false); setActiveTab("members"); }} className="btn btn-ghost btn-lg">{t("label.cancel")}</button></div>
          </form>
        </div>
      )}

      {activeTab === "members" && (
      <>
      <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <div className="mb-3">
          <h2 className="font-semibold">Add registered customer by phone</h2>
          <p className="text-sm text-base-content/50">The customer can be outside 1 km. Ask for the phone number linked to their account.</p>
        </div>
        <form onSubmit={handleAddByPhone} className="flex flex-col gap-3 sm:flex-row">
          <input type="tel" value={manualPhone} onChange={(event) => setManualPhone(event.target.value)} className="input input-bordered input-lg flex-1" placeholder={t("label.phone_number_placeholder")} required />
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">{saving ? <span className="loading loading-spinner loading-sm" /> : t("label.add")}</button>
        </form>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="badge badge-warning">{pending.length}</span>
            Pending Approvals
          </h2>
          <div className="space-y-3">
            {pending.map((m) => (
              <div
                key={m._id}
                className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{m.customerName || "Unknown"}</p>
                  <p className="text-sm text-base-content/50">{m.customerPhone}</p>
                </div>
                <button
                  onClick={() => handleApprove(m._id)}
                  className="btn btn-success btn-sm gap-1"
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
                <button onClick={() => setSelectedMember(m)} className="btn btn-ghost btn-sm gap-1">
                  <Eye size={14} /> {t("label.view_details")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved members */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{t("label.active_members")} ({approved.length})</h2>
          <input className="input input-bordered input-lg w-full sm:w-80" placeholder={t("label.search_credit_members")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {approved.length === 0 ? (
          <div className="text-center py-12 text-base-content/40">
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t("label.no_active_baki_members")}</p>
          </div>
        ) : (
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs">
                    <th>{t("label.customer")}</th>
                    <th>{t("label.phone")}</th>
                    <th>{t("label.balance")} / {t("label.credit_limit")}</th>
                    <th>{t("label.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.filter((m) => `${m.memberCode || ""} ${m.customerName || ""} ${m.customerPhone || ""} ${m.customerEmail || ""}`.toLowerCase().includes(search.toLowerCase())).map((m) => (
                    <tr key={m._id} className="hover">
                      <td className="font-medium"><button onClick={() => setSelectedMember(m)} className="flex items-center gap-2 text-left hover:text-primary"><UserRound size={16} />{m.customerName || "—"}</button><span className="font-mono text-xs text-base-content/50">{m.memberCode || "—"}</span></td>
                      <td className="text-sm text-base-content/60">{m.customerPhone || "—"}<br /><span className="text-xs">{m.customerEmail || ""}</span></td>
                      <td>
                          <div>
                            <span className={`font-semibold ${m.balance > 0 ? "text-error" : "text-success"}`}>৳{m.balance}</span>
                            <p className="text-xs text-base-content/50">{t("label.limit")}: {m.creditLimit === undefined ? t("label.no_limit") : `৳${m.creditLimit}`}</p>
                          </div>
                      </td>
                      <td>
                        {editingLimit?.id !== m._id && (
                          <button
                            onClick={() =>
                              setEditingBalance({ id: m._id, productDetails: "", amount: "" })
                            }
                            className="btn btn-ghost btn-xs gap-1"
                          >
                            <Edit3 size={12} />
                            {t("label.add_purchase")}
                          </button>
                        )}
                        <button onClick={() => setSelectedMember(m)} className="btn btn-ghost btn-xs gap-1"><Eye size={13} /> {t("label.view_details")}</button>
                        <button onClick={() => handleRemoveMember(m)} className="btn btn-ghost btn-xs text-error">{t("label.remove")}</button>
                        {editingLimit?.id === m._id ? (
                          <div className="mt-2 flex items-center gap-1">
                            <input type="number" min="0" value={editingLimit.value} onChange={(e) => setEditingLimit({ ...editingLimit, value: e.target.value })} className="input input-bordered input-lg w-32" placeholder={t("label.credit_limit")} />
                            <button onClick={() => setConfirmation({ type: "update", action: handleUpdateLimit })} disabled={saving} className="btn btn-primary btn-xs">{t("label.save")}</button>
                            <button onClick={() => setEditingLimit(null)} className="btn btn-ghost btn-xs">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingLimit({ id: m._id, value: String(m.creditLimit ?? "") })} className="btn btn-ghost btn-xs">
                            {t("label.set_credit_limit")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

        {editingBalance && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingBalance(null)}>
                <div className="w-full max-w-lg rounded-2xl bg-base-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{t("label.add_purchase")}</h2>
                      <p className="text-sm text-base-content/50">{t("label.product_details")}</p>
                    </div>
                    <button onClick={() => setEditingBalance(null)} className="btn btn-ghost btn-sm btn-circle"><X size={18} /></button>
                  </div>
                  <div className="space-y-4">
                    <input type="text" placeholder={t("label.product_details")} value={editingBalance.productDetails} onChange={(e) => setEditingBalance({ ...editingBalance, productDetails: e.target.value })} className="input input-bordered input-lg w-full" autoFocus />
                    <input type="number" min="0.01" placeholder={t("label.amount")} value={editingBalance.amount} onChange={(e) => setEditingBalance({ ...editingBalance, amount: e.target.value })} className="input input-bordered input-lg w-full" />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setEditingBalance(null)} className="btn btn-ghost">{t("label.cancel")}</button>
                                      <button onClick={() => setConfirmation({ type: "update", action: handleUpdateBalance })} disabled={saving} className="btn btn-primary">{t("label.save")}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedMember(null)}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-base-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-start justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("label.credit_customer_details")}</p><h2 className="text-2xl font-bold">{selectedMember.customerName}</h2><p className="font-mono text-sm text-base-content/50">{selectedMember.memberCode}</p></div>
                <button onClick={() => setSelectedMember(null)} className="btn btn-ghost btn-sm btn-circle"><X size={18} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[["label.email", selectedMember.customerEmail], ["label.phone_number", selectedMember.customerPhone], ["label.address", selectedMember.customerAddress], ["label.nid_number", selectedMember.nidNumber]].map(([label, value]) => <div key={label} className="rounded-xl bg-base-200/60 p-4"><p className="text-xs uppercase tracking-wide text-base-content/50">{t(label ?? "")}</p><p className="mt-1 break-words font-medium">{value || "—"}</p></div>)}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {selectedMember.nidFrontUrl && <img src={selectedMember.nidFrontUrl} alt={t("label.nid_front")} className="h-48 w-full rounded-xl border object-cover" />}
                {selectedMember.nidBackUrl && <img src={selectedMember.nidBackUrl} alt={t("label.nid_back")} className="h-48 w-full rounded-xl border object-cover" />}
              </div>
              <div className="mt-5 flex justify-end">
                <button onClick={() => handleRemoveMember(selectedMember)} className="btn btn-error btn-outline">{t("label.remove_baki_member")}</button>
              </div>
            </div>
          </div>
        )}
        <ConfirmActionDialog
          open={Boolean(confirmation)}
          title={confirmation?.type === "delete" ? t("label.confirm_delete") : t("label.confirm_update")}
          description={confirmation?.type === "delete" ? `${t("label.remove_baki_member")}: ${confirmation.member?.customerName || confirmation.member?.memberCode}?` : t("label.confirm_update_description")}
          confirmLabel={confirmation?.type === "delete" ? t("label.remove") : t("label.update")}
          busy={saving}
          onConfirm={confirmMemberAction}
          onCancel={() => setConfirmation(null)}
        />
        </>
      )}
    </div>
  );
}
