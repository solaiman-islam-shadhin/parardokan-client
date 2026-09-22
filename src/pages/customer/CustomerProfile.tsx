import { useTheme } from "../../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import { Camera, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api, { uploadImage } from "../../lib/api";
import LocationPicker from "../../components/registration/LocationPicker";
import ConfirmActionDialog from "../../components/ui/ConfirmActionDialog";
import { DashboardProfileSkeleton } from "../../components/ui/LoadingSkeleton";
import { useToast } from "../../context/ToastContext";

export default function CustomerProfile() {
  const { t } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: profile?.name || "",
    address: profile?.address || "",
    phoneNumber: profile?.phoneNumber || "",
    gender: profile?.gender || "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState(profile?.latitude);
  const [longitude, setLongitude] = useState(profile?.longitude);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const { showToast } = useToast();

  if (!profile) return <DashboardProfileSkeleton />;

  useEffect(() => {
    setLatitude(profile?.latitude);
    setLongitude(profile?.longitude);
    setForm({
      name: profile?.name || "",
      address: profile?.address || "",
      phoneNumber: profile?.phoneNumber || "",
      gender: profile?.gender || "",
    });
  }, [profile]);

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
      if (imageFile) {
        image = await uploadImage(imageFile);
      }
      await api.patch("/profile/me", { ...form, image });
      if (latitude !== undefined && longitude !== undefined) {
        await api.patch("/profile/location", { latitude, longitude });
      }
      await refreshProfile();
      setSuccess("Profile updated successfully");
      showToast("success", t("label.update_success"));
      setImageFile(null);
      setConfirmUpdate(false);
    } catch (err: any) {
      const message = err.response?.data?.error || "Update failed";
      setError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page max-w-4xl">
      <ConfirmActionDialog open={confirmUpdate} title={t("label.confirm_update")} description={t("label.confirm_update_description")} confirmLabel={t("label.update")} busy={saving} onConfirm={saveProfile} onCancel={() => setConfirmUpdate(false)} />
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("label.my_profile")}</h1>
        <p className="text-base-content/50 mt-1">{t("label.manage_your_account_information")}</p>
      </div>

      <div className="profile-card bg-base-100 border border-base-300 rounded-2xl p-5 sm:p-8">
        {/* Avatar */}
        <div className="profile-card-header flex items-center gap-5 mb-8">
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
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-content rounded-full flex items-center justify-center shadow-md"
            >
              <Camera size={12} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <p className="font-semibold text-lg">{profile?.name}</p>
            <p className="text-sm text-base-content/50">{profile?.email}</p>
            <span className="badge badge-primary badge-sm mt-1 capitalize">
              {profile?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.full_name")}</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control sm:col-span-2 sm:order-3">
              <label className="label"><span className="label-text">{t("label.location")}</span></label>
              <LocationPicker
                address={form.address}
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
              />
            </div>
            <div className="form-control sm:order-2">
              <label className="label">
                <span className="label-text">{t("label.phone_number")}</span>
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="input input-bordered w-full"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("label.address")}</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Your neighborhood"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("label.gender")}</span>
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="select select-bordered w-full"
            >
              <option value="">{t("label.prefer_not_to_say")}</option>
              <option value="male">{t("label.male")}</option>
              <option value="female">{t("label.female")}</option>
              <option value="other">{t("label.other")}</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary gap-2"
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
