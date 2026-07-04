import { useState, FormEvent } from "react";
import { ArrowRight, Sparkles, Trophy, CheckSquare, Dumbbell, ShieldAlert } from "lucide-react";
import { auth, db } from "../firebaseconfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onViewChange: (view: string) => void;
}

export default function RegisterView({
  onRegisterSuccess,
  onViewChange
}: RegisterViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initial stats triggers
  const [weight, setWeight] = useState("75");
  const [height, setHeight] = useState("175");
  const [targetBMI, setTargetBMI] = useState("22.5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Todos os campos básicos são de preenchimento obrigatório.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Enviar e-mail de verificação
      await sendEmailVerification(firebaseUser);

      // 2. Salvar os metadados do usuário diretamente no Firestore
      const userDocRef = doc(db, "dados", firebaseUser.uid);
      const targetBMINum = parseFloat(targetBMI) || 22.5;
      const initialWeightNum = parseFloat(weight) || 75.0;
      const heightNum = parseFloat(height) || 175.0;

      await setDoc(userDocRef, {
        id: firebaseUser.uid,
        name,
        email: email.toLowerCase().trim(),
        targetBMI: targetBMINum,
        initialWeight: initialWeightNum,
        lastUpdated: Date.now()
      });

      // 3. Criar uma entrada de peso inicial no Firestore se peso e altura foram fornecidos
      if (weight && height) {
        const bmi = parseFloat((initialWeightNum / Math.pow(heightNum / 100, 2)).toFixed(1));
        const entryId = "entry-" + Math.random().toString(36).substring(2, 11);
        const entryRef = doc(db, "dados", firebaseUser.uid, "lista", entryId);
        
        await setDoc(entryRef, {
          Nome: name,
          data: new Date().toISOString().split("T")[0],
          peso: initialWeightNum,
          IMC: bmi,
          // Campos de compatibilidade
          id: entryId,
          userId: firebaseUser.uid,
          weight: initialWeightNum,
          height: heightNum,
          bmi: bmi,
          date: new Date().toISOString().split("T")[0],
          createdAt: Date.now()
        });
      }

      // Alerta de sucesso
      alert("Cadastro realizado! Enviamos um e-mail de verificação para " + email + ". Por favor, confirme seu e-mail antes de realizar o login.");
      onRegisterSuccess();
    } catch (err: any) {
      let friendlyError = err?.message || "Erro no servidor ou dados de registro inválidos.";
      if (err?.code === "auth/email-already-in-use") {
        friendlyError = "Este email já está sendo utilizado no Firebase.";
      } else if (err?.code === "auth/invalid-email") {
        friendlyError = "Formato de email inválido.";
      } else if (err?.code === "auth/weak-password") {
        friendlyError = "A senha fornecida é muito fraca pelo Firebase.";
      } else if (err?.code === "auth/network-request-failed") {
        friendlyError = "Erro de rede. Verifique a configuração do seu Firebase.";
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto z-10 py-4 animate-in fade-in slide-in-from-bottom-2 duration-250 select-none">
      
      {/* Registration Double Grid Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] overflow-hidden transition-colors">
        
        {/* Left Side - Interactive form */}
        <section className="p-6 md:p-8 flex flex-col justify-center">
          
          <div className="mb-6">
            <h1 className="font-headline font-black text-2xl md:text-3xl uppercase tracking-tight text-black dark:text-white">
              Join the Elite
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Start your journey to professional-grade fitness today.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border-2 border-red-500 text-red-700 p-2.5 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Full name field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none text-xs font-bold text-black dark:text-white"
                required
              />
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none text-xs font-bold text-black dark:text-white"
                required
              />
            </div>

            {/* Password block row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none text-xs font-bold text-black dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Confirm
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none text-xs font-bold text-black dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Sub-block optional initial metrics for high performance custom user profile */}
            <div className="border-t border-black/10 dark:border-white/10 pt-4 mt-2">
              <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-widest font-mono mb-2">
                ⚡ Initial Physical Targets (Optional)
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] font-bold uppercase font-mono text-zinc-400 mb-0.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-2 bg-stone-50 dark:bg-zinc-950 border border-black focus:border-[#ff6b00] focus:ring-0 font-mono text-[10px] text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold uppercase font-mono text-zinc-400 mb-0.5">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-2 bg-stone-50 dark:bg-zinc-950 border border-black focus:border-[#ff6b00] focus:ring-0 font-mono text-[10px] text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold uppercase font-mono text-zinc-400 mb-0.5">
                    Target BMI
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetBMI}
                    onChange={(e) => setTargetBMI(e.target.value)}
                    className="w-full p-2 bg-stone-50 dark:bg-zinc-950 border border-black focus:border-[#ff6b00] focus:ring-0 font-mono text-[10px] text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action key */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b00] text-white py-3.5 border-2 border-black font-headline font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>CREATE ACCOUNT</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          </form>

          {/* Quick link back to Login view */}
          <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 text-center font-mono text-xs font-semibold text-zinc-400">
            Already part of the squad?{" "}
            <button
              onClick={() => onViewChange("login")}
              className="text-[#ff6b00] hover:underline font-extrabold uppercase ml-1"
            >
              Log In here
            </button>
          </div>
        </section>

        {/* Right Side - Visual image matching mockup */}
        <section className="hidden md:block relative overflow-hidden border-l-2 border-black dark:border-white/20 select-none">
          <div className="absolute inset-0 z-0 bg-zinc-950">
            <img
              className="w-full h-full object-cover grayscale brightness-50 contrast-125"
              alt="Professional Athlete lifting heavy weight"
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1000"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Glassmorphic Motivational Quote overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-10 bg-white/90 dark:bg-black/90 p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-headline font-extrabold text-[#ff6b00] text-sm block tracking-widest mb-1.5 uppercase">
              HIPERFIT PHILOSOPHY
            </span>
            <p className="font-headline font-bold text-sm italic text-black dark:text-white leading-relaxed">
              "Precision is the difference between a workout and training."
            </p>
          </div>

          {/* Status widgets */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-3 font-mono text-[9px] font-extrabold uppercase">
            <div className="bg-[#a4f0be] text-black border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 fill-black" />
              <span>High Precision</span>
            </div>
            
            <div className="bg-zinc-100 text-black border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Data Driven</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
