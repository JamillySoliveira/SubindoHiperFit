import { useState, FormEvent } from "react";
import { Mail, Eye, EyeOff, Bolt, ShieldCheck, Activity } from "lucide-react";
import { auth, googleProvider, db } from "../firebaseconfig";
import { signInWithEmailAndPassword, signInWithPopup, sendEmailVerification, reload, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  onViewChange: (view: string) => void;
}

export default function LoginView({
  onLoginSuccess,
  onViewChange
}: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<any | null>(null);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState("");

  const checkVerificationStatus = async () => {
    if (!unverifiedUser) return;
    setError("");
    setVerificationSuccessMessage("");
    setLoading(true);
    try {
      // Recarrega o estado do usuário atual no Firebase para pegar a atualização de emailVerified
      await reload(unverifiedUser);
      
      if (unverifiedUser.emailVerified) {
        // Agora está verificado! Sincronizar com o Firestore
        const userDocRef = doc(db, "dados", unverifiedUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userData: any;
        
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
        } else {
          userData = {
            id: unverifiedUser.uid,
            name: unverifiedUser.displayName || unverifiedUser.email?.split("@")[0] || "Usuário",
            email: unverifiedUser.email,
            targetBMI: 22.5,
            initialWeight: 75.0,
            lastUpdated: Date.now()
          };
          await setDoc(userDocRef, userData);
        }

        // Sucesso
        onLoginSuccess(userData);
      } else {
        setError("O e-mail ainda não foi verificado. Por favor, acesse sua caixa de entrada e clique no link de ativação.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao verificar o status.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setError("");
    setVerificationSuccessMessage("");
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setVerificationSuccessMessage("E-mail de verificação reenviado com sucesso! Verifique sua caixa de entrada.");
    } catch (err: any) {
      if (err?.code === "auth/too-many-requests") {
        setError("Muitas solicitações recentes. Por favor, aguarde alguns instantes antes de tentar novamente.");
      } else {
        setError(err?.message || "Erro ao reenviar o e-mail de verificação.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVerification = async () => {
    setError("");
    setVerificationSuccessMessage("");
    setUnverifiedUser(null);
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Erro ao deslogar usuário não verificado:", err);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, digite seu e-mail no campo acima antes de solicitar a redefinição de senha.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enviamos um link de redefinição de senha para o e-mail: " + email);
    } catch (err: any) {
      let friendlyError = err?.message || "Erro ao solicitar a redefinição de senha.";
      if (err?.code === "auth/user-not-found") {
        friendlyError = "Não encontramos nenhuma conta cadastrada com este e-mail.";
      } else if (err?.code === "auth/invalid-email") {
        friendlyError = "Formato de e-mail inválido.";
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email e senha são campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar com o Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Se o e-mail não estiver verificado, bloquear e exibir a tela de verificação
      if (!firebaseUser.emailVerified) {
        setUnverifiedUser(firebaseUser);
        setLoading(false);
        return;
      }

      // 2. Sincronizar dados com o Firestore
      const userDocRef = doc(db, "dados", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userData: any;

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      } else {
        userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
          email: firebaseUser.email,
          targetBMI: 22.5,
          initialWeight: 75.0,
          lastUpdated: Date.now()
        };
        await setDoc(userDocRef, userData);
      }

      // Sucesso
      onLoginSuccess(userData);
    } catch (err: any) {
      let friendlyError = err?.message || "Erro de rede ou dados inválidos.";
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found") {
        friendlyError = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (err?.code === "auth/invalid-email") {
        friendlyError = "Formato de email inválido.";
      } else if (err?.code === "auth/user-disabled") {
        friendlyError = "Esta conta de usuário foi desativada.";
      } else if (err?.code === "auth/network-request-failed") {
        friendlyError = "Erro de rede. Verifique se o Firebase está configurado.";
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Autenticar com o Google via Firebase Auth popup
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      // Se o e-mail do Google por algum motivo não for verificado, bloquear e exibir a tela de verificação
      if (!firebaseUser.emailVerified) {
        setUnverifiedUser(firebaseUser);
        setLoading(false);
        return;
      }

      // 2. Sincronizar com o Firestore
      const userDocRef = doc(db, "dados", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userData: any;

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        if (!userData.photoURL && firebaseUser.photoURL) {
          userData.photoURL = firebaseUser.photoURL;
          await setDoc(userDocRef, { photoURL: firebaseUser.photoURL }, { merge: true });
        }
      } else {
        userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
          email: firebaseUser.email,
          targetBMI: 22.5,
          initialWeight: 75.0,
          photoURL: firebaseUser.photoURL || undefined,
          lastUpdated: Date.now()
        };
        await setDoc(userDocRef, userData);
      }

      onLoginSuccess(userData);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("O popup de login do Google foi fechado antes de completar.");
      } else if (err?.code === "auth/network-request-failed") {
        setError("Erro de rede. Verifique a configuração do seu Firebase.");
      } else {
        setError(err?.message || "Falha na autenticação do Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto z-10 py-8 animate-in fade-in zoom-in-95 duration-200 select-none">
      
      {/* Login Card */}
      <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] relative transition-colors duration-200">
        
        {/* Branding Accent */}
        <div className="absolute -top-1 -left-1 w-12 h-2 bg-emerald-500 border border-black"></div>

        {unverifiedUser ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="mb-6 text-center">
              <h1 className="font-headline font-black text-2xl md:text-3xl uppercase italic tracking-tighter text-black dark:text-white mb-2">
                VERIFIQUE SEU E-MAIL
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Sua conta foi criada, mas é necessário validar seu e-mail para prosseguir no app.
              </p>
            </div>

            <div className="mb-5 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500 p-4 text-xs flex flex-col gap-2 rounded">
              <div className="flex items-center gap-1.5 font-bold uppercase text-amber-700 dark:text-amber-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>E-MAIL NÃO CONFIRMADO</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                Enviamos um link de verificação para o e-mail: <br />
                <strong className="font-mono text-black dark:text-white text-xs break-all">{unverifiedUser.email}</strong>
              </p>
              <p className="text-zinc-600 dark:text-zinc-450 mt-1">
                Por favor, acesse sua caixa de entrada, clique no link de ativação e clique em <strong>RE-CHECAR STATUS</strong> abaixo para entrar no app.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border-2 border-red-500 text-red-700 p-2.5 text-xs font-mono">
                {error}
              </div>
            )}

            {verificationSuccessMessage && (
              <div className="mb-4 bg-emerald-100 border-2 border-emerald-500 text-emerald-700 p-2.5 text-xs font-mono">
                {verificationSuccessMessage}
              </div>
            )}

            <div className="space-y-3">
              {/* Core Check status action */}
              <button
                type="button"
                onClick={checkVerificationStatus}
                disabled={loading}
                className="w-full bg-[#ff6b00] text-white py-3 border-2 border-black font-headline font-extrabold text-xs uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] shadow-active active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">VERIFICANDO...</span>
                ) : (
                  <>
                    RE-CHECAR STATUS DO E-MAIL <Bolt className="h-4 w-4 fill-white text-white" />
                  </>
                )}
              </button>

              {/* Resend email action */}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-white dark:bg-zinc-900 text-black dark:text-white py-3 border-2 border-black dark:border-white/20 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                REENVIAR E-MAIL DE CONFIRMAÇÃO
              </button>

              {/* Cancel / Sign out / Back to login */}
              <button
                type="button"
                onClick={handleCancelVerification}
                disabled={loading}
                className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 font-mono text-[11px] font-bold uppercase transition-colors flex items-center justify-center cursor-pointer"
              >
                VOLTAR PARA O LOGIN / OUTRA CONTA
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="font-headline font-black text-3xl md:text-4xl uppercase italic tracking-tighter text-black dark:text-white mb-2">
                WELCOME BACK
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Access your performance hub and data analytics.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border-2 border-red-500 text-red-700 p-2.5 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase text-zinc-500 tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@hiperfit.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 font-medium outline-none text-zinc-900 dark:text-white"
                    required
                  />
                  <Mail className="absolute right-4 top-[50%] -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-xs font-bold uppercase text-zinc-500 tracking-wider">
                    Password
                  </label>
                  <a 
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-mono text-[#ff6b00] hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 font-medium outline-none text-zinc-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[50%] -translate-y-1/2 cursor-pointer p-0 text-zinc-400 hover:text-black dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-[#ff6b00] border-2 border-black rounded-sm focus:ring-0 active:translate-y-0.5"
                  defaultChecked
                />
                <label htmlFor="remember" className="font-mono text-[10px] text-zinc-400 select-none">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Core Login action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff6b00] text-white py-3.5 border-2 border-black font-headline font-extrabold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] shadow-active active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-pulse">AUTHORIZING...</span>
                ) : (
                  <>
                    LOGIN <Bolt className="h-4 w-4 fill-white text-white" />
                  </>
                )}
              </button>
            </form>

            {/* Action Separator */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t-2 border-black/10 dark:border-white/10"></div>
              <span className="px-4 font-mono text-[9px] uppercase text-zinc-400 font-extrabold">
                OR CONTINUE WITH
              </span>
              <div className="flex-grow border-t-2 border-black/10 dark:border-white/10"></div>
            </div>

            {/* Google Oauth trigger button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full bg-white dark:bg-zinc-900 text-black dark:text-white py-3 border-2 border-black dark:border-white/20 font-bold text-xs uppercase flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <div className="w-4 h-4 shrink-0">
                <svg viewBox="0 0 18 18" className="w-full h-full">
                  <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.85 2.22c1.68-1.55 2.64-3.83 2.64-6.57z" fill="#4285F4"></path>
                  <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.85-2.22c-.79.53-1.8.85-3.11.85-2.39 0-4.41-1.61-5.14-3.77H.95v2.33C2.43 15.99 5.46 18 9 18z" fill="#34A853"></path>
                  <path d="M3.86 10.68c-.19-.56-.3-1.16-.3-1.78s.11-1.22.3-1.78V4.79H.95C.35 6.01 0 7.42 0 8.9c0 1.48.35 2.89.95 4.11l2.91-2.33z" fill="#FBBC05"></path>
                  <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.46 0 2.43 2.01.95 4.79l2.91 2.33c.73-2.16 2.75-3.77 5.14-3.77z" fill="#EA4335"></path>
                </svg>
              </div>
              Google
            </button>

            {/* Link to Register view */}
            <p className="text-center font-semibold text-xs text-zinc-550 dark:text-zinc-400 mt-6 font-mono">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => onViewChange("register")}
                className="text-[#ff6b00] font-extrabold hover:underline ml-1 uppercase"
              >
                Sign up for free
              </button>
            </p>
          </>
        )}
      </div>

      {/* Security and analytic badges */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-[#a4f0be]/20 border border-[#1f6b43]/30 p-3.5 rounded-lg flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase leading-tight">
            Secure Data Encryption
          </span>
        </div>
        <div className="bg-[#a04100]/5 dark:bg-white/5 border border-[#a04100]/20 dark:border-white/10 p-3.5 rounded-lg flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#ff6b00] shrink-0" />
          <span className="font-mono text-[9px] text-zinc-600 dark:text-zinc-400 font-extrabold uppercase leading-tight">
            Real-time Analytics
          </span>
        </div>
      </div>
    </div>
  );
}
