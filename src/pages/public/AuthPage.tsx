import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Mail, Phone, Chrome, Camera, ShoppingCart } from "lucide-react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from "../../lib/firebase";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { uploadImage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import LocationPicker from "../../components/registration/LocationPicker";

type Tab = "google" | "email" | "phone";
type Mode = "login" | "register";

export default function AuthPage() {
  const { t } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"customer" | "shopkeeper">("customer");
  const [address, setAddress] = useState("");
  const [shopName, setShopName] = useState("");
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const confirmationRef = useRef<any>(null);
  const recaptchaRef = useRef<any>(null);

  // Load pending data from local storage
  useEffect(() => {
    const pending = localStorage.getItem("pending_registration");
    if (pending) {
      const data = JSON.parse(pending);
      if (data.role) setRole(data.role);
      if (data.name) setName(data.name);
      if (data.address) setAddress(data.address);
      if (data.shopName) setShopName(data.shopName);
      if (data.latitude) setLatitude(data.latitude);
      if (data.longitude) setLongitude(data.longitude);
    }
  }, []);

  useEffect(() => {
    if (mode !== "register") return;
    localStorage.setItem(
      "pending_registration",
      JSON.stringify({ role, name, address, shopName, latitude, longitude })
    );
  }, [mode, role, name, address, shopName, latitude, longitude]);

  // Redirect if already set up
  useEffect(() => {
    if (user && profile?.setupComplete) {
      navigate(profile.role === "customer" ? "/customer" : "/shopkeeper");
    }
  }, [user, profile]);

  const handlePostAuth = async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error("Google authentication did not complete. Please try again.");
      }
      await firebaseUser.getIdToken(true);
      if (mode === "register" && (latitude === undefined || longitude === undefined)) {
        setError("Please pin your location before creating your account");
        return;
      }
      if (mode === "register" && !name.trim()) {
        setError("Please enter your name before creating your account");
        return;
      }
      if (mode === "register" && role === "shopkeeper" && !shopName.trim()) {
        setError("Please enter your shop name before creating your account");
        return;
      }
      // Check if profile setup needed
      const res = await api.get("/profile/me").catch(() => null);
      if (!res || !res.data?.setupComplete) {
        // Setup profile
        const pending = JSON.parse(
          localStorage.getItem("pending_registration") || "{}"
        );
        const image = avatarFile
          ? await uploadImage(avatarFile)
          : firebaseUser.photoURL;
        await api.post("/profile/setup", {
          name: name || firebaseUser.displayName || firebaseUser.email?.split("@")[0],
          email: firebaseUser.email,
          image,
          role: pending.role || role,
          address: pending.address || address,
          shopName: pending.shopName || shopName,
          latitude: pending.latitude || latitude,
          longitude: pending.longitude || longitude,
        });
        localStorage.removeItem("pending_registration");
      }

      await refreshProfile();
      const profileRes = await api.get("/profile/me");
      const p = profileRes.data;
      navigate(p.role === "customer" ? "/customer" : "/shopkeeper");
    } catch (err: any) {
      const message = err.message || "Setup failed";
      setError(message);
      showToast("error", message);
    }
  };

  // Google
  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      await handlePostAuth();
    } catch (err: any) {
      const message = err.message || "Google sign-in failed";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  // Email
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await sendEmailVerification(cred.user);
        await auth.signOut();
        const message = t("auth.verification_sent");
        setError(message);
        showToast("success", message);
        return;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          const message = t("auth.verify_email");
          setError(message);
          showToast("error", message);
          await auth.signOut();
          return;
        }
      }
      await handlePostAuth();
    } catch (err: any) {
      const message = err.message || "Email sign-in failed";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError(t("label.email"));
      return;
    }
    setResettingPassword(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      const message = t("auth.reset_sent");
      setError(message);
      showToast("success", message);
    } catch {
      const message = t("auth.reset_failed");
      setError(message);
      showToast("error", message);
    } finally {
      setResettingPassword(false);
    }
  };

  // Phone - send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaRef.current
      );
      confirmationRef.current = confirmation;
      setOtpSent(true);
      showToast("success", "Verification code sent to your phone");
    } catch (err: any) {
      const message = err.message || "Could not send verification code";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    try {
      await confirmationRef.current.confirm(otp);
      await handlePostAuth();
    } catch (err: any) {
      const message = err.message || "Invalid verification code";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-base-100 to-amber-100 dark:from-[#24150d] dark:via-[#171412] dark:to-[#3b2417] flex items-center justify-center p-4 pt-20">
      <div id="recaptcha-container" />

      <div className="w-full lg:w-[70%] lg:max-w-5xl bg-base-100 rounded-3xl border border-base-300/70 shadow-xl p-8 sm:p-10 lg:p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store size={22} className="text-primary-content" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? t("label.welcome_back") : t("label.create_your_account")}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            {mode === "login"
              ? t("label.sign_in_to_your_neighborhood")
              : t("label.join_parar_dokan_today")}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab tab-sm flex-1 ${mode === "login" ? "tab-active" : ""}`}
            onClick={() => setMode("login")}
          >
            {t("label.sign_in")}
          </button>
          <button
            className={`tab tab-sm flex-1 ${mode === "register" ? "tab-active" : ""}`}
            onClick={() => setMode("register")}
          >
            {t("label.register")}
          </button>
        </div>

        {/* Role selector for register */}
        {mode === "register" && (
          <div className="mb-6">
            <label className="label">
              <span className="label-text font-medium">{t("label.i_am_a")}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["customer", "shopkeeper"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`border-2 rounded-xl p-3 text-sm font-medium capitalize transition-all ${
                    role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {r === "customer" ? <ShoppingCart size={16} /> : <Store size={16} />}
                    {r === "customer" ? "Customer" : "Shopkeeper"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "register" && tab !== "email" && (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Full name"
              required
            />
            <div className="flex items-center gap-3">
              <div className="avatar"><div className="w-12 rounded-full bg-base-200">
                <img src={avatarPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${name || "User"}`} alt="Avatar preview" />
              </div></div>
              <label className="btn btn-outline btn-sm">
                Choose avatar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                }} />
              </label>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Address / neighborhood"
            />
            <LocationPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => {
              setLatitude(lat); setLongitude(lng);
            }} />
            {role === "shopkeeper" && (
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Shop name"
                required
              />
            )}
          </div>
        )}

        {/* Auth method tabs */}
        <div className="flex border-b border-base-300 mb-6">
          {([
            { id: "email" as Tab, icon: Mail, label: "Email" },
            { id: "google" as Tab, icon: Chrome, label: "Google" },
            { id: "phone" as Tab, icon: Phone, label: "Phone" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/50 hover:text-base-content"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mb-4 text-sm py-2">
            <span>{error}</span>
          </div>
        )}

        {/* Google */}
        {tab === "google" && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn btn-outline w-full gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Chrome size={18} />
                Continue with Google
              </>
            )}
          </button>
        )}

        {/* Email */}
        {tab === "email" && (
          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("label.full_name")}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("label.avatar")}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-14 rounded-full bg-base-200">
                        <img src={avatarPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${name || "User"}`} alt="Avatar preview" />
                      </div>
                    </div>
                    <label className="btn btn-outline btn-sm gap-2">
                      <Camera size={15} /> Choose image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("label.address")}</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Your neighborhood"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("label.pin_your_location")}</span>
                  </label>
                  <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>
                {role === "shopkeeper" && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">{t("label.shop_name")}</span>
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Your shop name"
                      required
                    />
                  </div>
                )}
              </>
            )}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.email")}</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("label.password")}</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : mode === "login" ? (
                t("label.sign_in")
              ) : (
                t("label.create_account")
              )}
            </button>
            {mode === "login" && (
              <button type="button" onClick={handlePasswordReset} disabled={resettingPassword} className="btn btn-ghost btn-sm w-full">
                {resettingPassword ? <span className="loading loading-spinner loading-xs" /> : t("auth.forgot_password")}
              </button>
            )}
          </form>
        )}

        {/* Phone */}
        {tab === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("label.phone_number")}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    t("label.send_otp")
                  )}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-base-content/60">
                  Enter the 6-digit OTP sent to {phone}
                </p>
                <div className="form-control">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input input-bordered w-full text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    t("label.verify_otp")
                  )}
                </button>
                <button
                  onClick={() => setOtpSent(false)}
                  className="btn btn-ghost btn-sm w-full"
                >
                  Change number
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
