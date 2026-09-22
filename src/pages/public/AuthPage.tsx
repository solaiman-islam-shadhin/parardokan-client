import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
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

  const goToRegisterStep = (nextStep: 1 | 2 | 3) => {
    setError("");
    setRegisterStep(nextStep);
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setRegisterStep(1);
  };

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

  return (<main className={"auth-page-new "+(mode==="register"?"is-register":"is-login")}><div id="recaptcha-container"/><div className="auth-layout-new"><aside className="auth-side-card"><span className="auth-side-mark"><Store size={24}/></span><span className="auth-side-kicker">PARAR DOKAN</span><h2>Your neighborhood, closer to you.</h2><p>Shop locally, connect confidently, and keep everyday purchases simple.</p><div className="auth-side-points"><span>01 <b>Trusted local shops</b></span><span>02 <b>Simple everyday orders</b></span><span>03 <b>One connected community</b></span></div></aside><section className={"auth-surface "+(mode==="register"?"is-register":"is-login")}><header className="auth-topbar"><div className="auth-brand-new"><span className="auth-brand-icon"><Store size={19}/></span><span>Parar Dokan</span></div><div className="auth-mode-switch"><button type="button" className={mode==="login"?"active":""} onClick={()=>handleModeChange("login")}>{t("label.sign_in")}</button><button type="button" className={mode==="register"?"active":""} onClick={()=>handleModeChange("register")}>{t("label.register")}</button></div></header><div className="auth-heading-new"><span className="auth-kicker">{mode==="login"?"Welcome back":"Get started"}</span><h1>{mode==="login"?t("label.welcome_back"):t("label.create_your_account")}</h1><p>{mode==="login"?t("label.sign_in_to_your_neighborhood"):t("label.join_parar_dokan_today")}</p></div>{mode==="register"&&<div className="auth-registration-layout"><nav className="auth-rail">{(["Account","Location","Verify"] as const).map((label,index)=>{const step=(index+1) as 1|2|3,complete=registerStep>step;return <button key={label} type="button" className={"auth-rail-step "+(registerStep===step?"active ":"")+(complete?"complete":"")} onClick={()=>complete&&goToRegisterStep(step)} disabled={!complete&&registerStep!==step}><span>{complete?"✓":step}</span><small>{label}</small></button>})}</nav><div className="auth-registration-body">{registerStep===1&&<div className="auth-step-content"><div className="auth-section-intro"><span>01</span><div><h2>Tell us about you</h2><p>Choose your account type and add a profile photo.</p></div></div><label className="auth-label">{t("label.i_am_a")}</label><div className="auth-role-grid">{(["customer","shopkeeper"] as const).map(r=><button key={r} type="button" onClick={()=>setRole(r)} className={role===r?"selected":""}>{r==="customer"?<ShoppingCart size={17}/>:<Store size={17}/>}<span>{r==="customer"?"Customer":"Shopkeeper"}</span></button>)}</div><label className="auth-label">{t("label.full_name")}</label><input value={name} onChange={e=>setName(e.target.value)} className="input input-bordered auth-input" placeholder="Your name"/><div className="auth-avatar-row"><div className="auth-avatar"><img src={avatarPreview||"https://api.dicebear.com/7.x/initials/svg?seed="+(name||"User")} alt="Avatar preview"/></div><label className="auth-upload"><Camera size={15}/> Upload profile photo<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file){setAvatarFile(file);setAvatarPreview(URL.createObjectURL(file))}}}/></label></div><button type="button" className="btn btn-primary auth-main-button" onClick={()=>{if(!name.trim()){setError("Please enter your name before continuing");return}goToRegisterStep(2)}}>Continue to location</button></div>}{registerStep===2&&<div className="auth-step-content"><div className="auth-section-intro"><span>02</span><div><h2>Set your location</h2><p>Help us connect you with nearby shops and customers.</p></div></div><label className="auth-label">{t("label.address")}</label><input value={address} onChange={e=>setAddress(e.target.value)} className="input input-bordered auth-input" placeholder="Your neighborhood"/><label className="auth-label">{t("label.pin_your_location")}</label><LocationPicker address={address} latitude={latitude} longitude={longitude} autoDetectOnMount={!localStorage.getItem("pending_registration")&&latitude===undefined&&longitude===undefined} onChange={(lat,lng)=>{setLatitude(lat);setLongitude(lng)}}/>{role==="shopkeeper"&&<><label className="auth-label">{t("label.shop_name")}</label><input value={shopName} onChange={e=>setShopName(e.target.value)} className="input input-bordered auth-input" placeholder="Your shop name"/></>}<div className="auth-actions"><button type="button" className="btn btn-ghost" onClick={()=>goToRegisterStep(1)}>Back</button><button type="button" className="btn btn-primary" onClick={()=>{if(latitude===undefined||longitude===undefined){setError("Please pin your location before continuing");return}if(role==="shopkeeper"&&!shopName.trim()){setError("Please enter your shop name before continuing");return}goToRegisterStep(3)}}>Continue to verification</button></div></div>}</div></div>}{(mode==="login"||registerStep===3)&&<div className="auth-method-area">{mode==="register"&&<div className="auth-verify-heading"><div><span className="auth-kicker">03 / VERIFY</span><p>Choose how you want to create your account.</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={()=>goToRegisterStep(2)}>Back</button></div>}<div className="auth-provider-tabs">{([{id:"email" as Tab,icon:Mail,label:"Email"},{id:"google" as Tab,icon:Chrome,label:"Google"},{id:"phone" as Tab,icon:Phone,label:"Phone"}]).map(({id,icon:Icon,label})=><button key={id} type="button" className={tab===id?"active":""} onClick={()=>{setTab(id);setError("")}}><Icon size={15}/>{label}</button>)}</div>{error&&<div className="auth-error-new">{error}</div>}{tab==="google"&&<button onClick={handleGoogle} disabled={loading} className="btn btn-outline auth-main-button">{loading?<span className="loading loading-spinner loading-sm"/>:<><Chrome size={18}/> Continue with Google</>}</button>}{tab==="email"&&<form onSubmit={handleEmail} className="auth-form-new"><label className="auth-label">{t("label.email")}</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input input-bordered auth-input" placeholder="you@example.com" required/><label className="auth-label">{t("label.password")}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input input-bordered auth-input" placeholder="Min. 6 characters" minLength={6} required/><button type="submit" disabled={loading} className="btn btn-primary auth-main-button">{loading?<span className="loading loading-spinner loading-sm"/>:mode==="login"?t("label.sign_in"):t("label.create_account")}</button>{mode==="login"&&<button type="button" onClick={handlePasswordReset} disabled={resettingPassword} className="btn btn-ghost btn-sm">{resettingPassword?<span className="loading loading-spinner loading-xs"/>:t("auth.forgot_password")}</button>}</form>}{tab==="phone"&&<div className="auth-form-new">{!otpSent?<><label className="auth-label">{t("label.phone_number")}</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="input input-bordered auth-input" placeholder="+8801XXXXXXXXX"/><button onClick={handleSendOTP} disabled={loading||!phone} className="btn btn-primary auth-main-button">{loading?<span className="loading loading-spinner loading-sm"/>:t("label.send_otp")}</button></>:<><p className="auth-help">Enter the 6-digit OTP sent to {phone}</p><input value={otp} onChange={e=>setOtp(e.target.value)} className="input input-bordered auth-input auth-otp" placeholder="000000" maxLength={6}/><button onClick={handleVerifyOTP} disabled={loading||otp.length!==6} className="btn btn-primary auth-main-button">{loading?<span className="loading loading-spinner loading-sm"/>:t("label.verify_otp")}</button><button onClick={()=>setOtpSent(false)} className="btn btn-ghost btn-sm">Change number</button></>}</div>}</div>}</section></div></main>);
}
