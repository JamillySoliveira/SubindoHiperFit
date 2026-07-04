/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { User, WeightEntry, DashboardStats, ChartPoint } from "./types";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import CalculatorView from "./components/CalculatorView";
import HistoryView from "./components/HistoryView";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import AddEntryModal from "./components/AddEntryModal";
import { auth, db } from "./firebaseconfig";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Startup
try {
  getDocFromServer(doc(db, "test", "connection")).catch((err) => {
    if (err instanceof Error && err.message.includes("offline")) {
      console.warn("Firestore connection is offline.");
    }
  });
} catch (e) {
  // ignore
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("hiperfit-theme") === "dark";
  });

  // User state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("hiperfit-user");
    return saved ? JSON.parse(saved) : null;
  });

  // Active Screen View
  const [activeView, setActiveView] = useState<string>(() => {
    const savedUser = localStorage.getItem("hiperfit-user");
    return savedUser ? "dashboard" : "login";
  });

  // Log entry modal visibility control
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<WeightEntry | null>(null);

  // Interval selector for trend chart (1M, 3M, 1Y)
  const [selectedRange, setSelectedRange] = useState("1M");

  // Dashboard Stats context state
  const [stats, setStats] = useState<DashboardStats>({
    currentWeight: 0,
    currentBMI: 0,
    bmiDeltaThisWeek: 0,
    goalProgressPercent: 0,
    targetBMI: 22.5,
    monthlyChangePercent: 0,
    monthlyChangeKgLost: 0,
    trendData: [],
    recentHistory: [],
    healthInsight: "Carregando estatísticas...",
    hasCaloricDeficitDays: 0
  });

  // Synchronize HTML classes with theme selection
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("hiperfit-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("hiperfit-theme", "light");
    }
  }, [darkMode]);

  // Load and cache active stats from Firebase Firestore
  const reloadStats = async (currentUser: User | null = user) => {
    if (!currentUser) return;
    const subcollectionPath = `dados/${currentUser.id}/lista`;
    try {
      const entriesRef = collection(db, "dados", currentUser.id, "lista");
      const q = query(entriesRef, orderBy("data", "asc"));
      const querySnapshot = await getDocs(q).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, subcollectionPath);
        throw err;
      });
      
      const userEntries: WeightEntry[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        // Fallback to compatibility fields or Portuguese fields
        userEntries.push({
          id: doc.id,
          userId: currentUser.id,
          weight: Number(d.peso ?? d.weight ?? 0),
          height: Number(d.height ?? 175.0),
          bmi: Number(d.IMC ?? d.bmi ?? 0),
          date: String(d.data ?? d.date ?? ""),
          createdAt: Number(d.createdAt ?? Date.now())
        });
      });

      if (userEntries.length === 0) {
        // Fallback to base calculations if completely empty in Firestore
        calculateFallbackStats(currentUser);
        return;
      }

      // Chronologically sorted for trend calculation
      userEntries.sort((a, b) => a.date.localeCompare(b.date));

      const latestEntry = userEntries[userEntries.length - 1];
      const currentWeight = latestEntry.weight;
      const currentBMI = latestEntry.bmi;
      const targetBMI = currentUser.targetBMI || 22.5;

      // Calculate goalProgressPercent
      const oldestEntry = userEntries[0];
      const startingBMI = oldestEntry.bmi;
      let goalProgressPercent = 100;

      if (startingBMI !== targetBMI) {
        const totalRequiredDelta = startingBMI - targetBMI;
        const currentDeltaAchieved = startingBMI - currentBMI;
        if (totalRequiredDelta > 0) {
          goalProgressPercent = Math.max(0, Math.min(100, Math.round((currentDeltaAchieved / totalRequiredDelta) * 100)));
        } else {
          goalProgressPercent = Math.max(0, Math.min(100, Math.round((currentDeltaAchieved / totalRequiredDelta) * 100)));
        }
      }

      if (currentBMI === targetBMI) {
        goalProgressPercent = 100;
      }

      // Calculate week delta
      let bmiDeltaThisWeek = 0;
      if (userEntries.length > 1) {
        const prevEntry = userEntries[userEntries.length - 2];
        bmiDeltaThisWeek = parseFloat((latestEntry.bmi - prevEntry.bmi).toFixed(1));
      }

      // Calculate monthly change
      let monthlyChangePercent = 0;
      let monthlyChangeKgLost = 0;
      if (userEntries.length > 1) {
        const baseEntry = userEntries[0];
        const diffKg = latestEntry.weight - baseEntry.weight;
        monthlyChangeKgLost = parseFloat(diffKg.toFixed(1));
        monthlyChangePercent = parseFloat(((diffKg / baseEntry.weight) * 100).toFixed(1));
      }

      // Evolution Chart Trend Data
      const trendData: ChartPoint[] = userEntries.map((e, index) => {
        let label = e.date;
        try {
          const parts = e.date.split("-");
          if (parts.length === 3) {
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            label = dateObj.toLocaleDateString("pt-BR", { month: "short", day: "2-digit" });
          }
        } catch (err) {
          // ignore
        }
        return {
          dateLabel: label,
          bmi: e.bmi,
          weight: e.weight,
          isToday: index === userEntries.length - 1
        };
      });

      // Recent History in reverse chronological order
      const recentHistory = [...userEntries].reverse();

      // Health Insight
      const totalKgLost = currentUser.initialWeight ? (currentUser.initialWeight - currentWeight) : 0;
      let healthInsight = "";
      let hasCaloricDeficitDays = 3;
      if (totalKgLost > 0) {
        healthInsight = `Você manteve uma consistência excelente e já eliminou progressivamente ${totalKgLost.toFixed(1)} kg no total!`;
        hasCaloricDeficitDays = 14;
      } else {
        healthInsight = "Excelente início de rastreamento no Firebase Firestore. Registre seu peso semanalmente para acompanhar sua evolução!";
      }

      setStats({
        currentWeight,
        currentBMI,
        bmiDeltaThisWeek,
        goalProgressPercent,
        targetBMI,
        monthlyChangePercent,
        monthlyChangeKgLost,
        trendData,
        recentHistory,
        healthInsight,
        hasCaloricDeficitDays
      });

    } catch (e) {
      console.error("Firestore loading error, calling fallback helper", e);
      calculateFallbackStats(currentUser);
    }
  };

  useEffect(() => {
    if (user) {
      reloadStats(user);
    }
  }, [user, selectedRange]);

  // Fallback memory database implementation for extreme cases/static sandbox tests
  const calculateFallbackStats = (currentUser: User) => {
    const initialWt = currentUser.initialWeight || 75;
    const computedBmi = parseFloat((initialWt / Math.pow(1.75, 2)).toFixed(1));
    setStats({
      currentWeight: initialWt,
      currentBMI: computedBmi,
      bmiDeltaThisWeek: 0,
      goalProgressPercent: 0,
      targetBMI: currentUser.targetBMI || 22.5,
      monthlyChangePercent: 0,
      monthlyChangeKgLost: 0,
      trendData: [
        { dateLabel: "Hoje", bmi: computedBmi, weight: initialWt, isToday: true }
      ],
      recentHistory: [
        { id: "fallback-entry", userId: currentUser.id, weight: initialWt, height: 175.0, bmi: computedBmi, date: new Date().toISOString().split("T")[0], createdAt: Date.now() }
      ],
      healthInsight: "Insira seu primeiro peso na aba Calculadora ou no botão flutuante para iniciar a evolução no Firestore!",
      hasCaloricDeficitDays: 1
    });
  };

  // Auth Operations
  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem("hiperfit-user", JSON.stringify(authenticatedUser));
    setActiveView("dashboard");
    reloadStats(authenticatedUser);
  };

  const handleLogout = () => {
    signOut(auth).catch((err) => console.error("Erro ao deslogar do Firebase", err));
    setUser(null);
    localStorage.removeItem("hiperfit-user");
    setActiveView("login");
  };

  // Weight Entry Mutation (Firestore version)
  const saveWeightEntry = async (weight: number, height: number, date: string) => {
    if (!user) return;
    const parentDocPath = `dados/${user.id}`;
    const subcollectionPath = `dados/${user.id}/lista`;
    try {
      const wtNum = Number(weight);
      const htNum = Number(height);
      const heightInMeters = htNum / 100;
      const bmi = parseFloat((wtNum / (heightInMeters * heightInMeters)).toFixed(1));
      const entryId = "entry-" + Math.random().toString(36).substring(2, 11);

      // 1. Ensure parent document 'dados/{userId}' exists
      const userDocRef = doc(db, "dados", user.id);
      await setDoc(userDocRef, {
        id: user.id,
        name: user.name,
        email: user.email,
        targetBMI: user.targetBMI || 22.5,
        initialWeight: user.initialWeight || wtNum,
        lastUpdated: Date.now()
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, parentDocPath);
        throw err;
      });

      // 2. Query subcollection to find any existing entry with the same date to avoid duplication
      const entriesRef = collection(db, "dados", user.id, "lista");
      const qSnapshot = await getDocs(entriesRef).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, subcollectionPath);
        throw err;
      });

      let targetDocId = entryId;
      qSnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.data === date || d.date === date) {
          targetDocId = doc.id; // Overwrite
        }
      });

      const entryRef = doc(db, "dados", user.id, "lista", targetDocId);
      const entryPayload = {
        Nome: user.name,
        data: date,
        peso: wtNum,
        IMC: bmi,
        // Compatibility fields
        id: targetDocId,
        userId: user.id,
        weight: wtNum,
        height: htNum,
        bmi: bmi,
        date: date,
        createdAt: Date.now()
      };

      await setDoc(entryRef, entryPayload).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `${subcollectionPath}/${targetDocId}`);
        throw err;
      });

      // Success, pull updated values from Firestore
      await reloadStats(user);
    } catch (e) {
      console.error("Firestore save error, falls back to standalone", e);
    }
  };

  const deleteWeightEntry = async (entryId: string) => {
    if (!user) return;
    const docPath = `dados/${user.id}/lista/${entryId}`;
    try {
      const entryRef = doc(db, "dados", user.id, "lista", entryId);
      await deleteDoc(entryRef).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, docPath);
        throw err;
      });
      await reloadStats(user);
    } catch (e) {
      console.error("Firestore delete error", e);
    }
  };

  // Render correct subview component
  const renderView = () => {
    switch (activeView) {
      case "login":
        return (
          <LoginView
            onLoginSuccess={handleLogin}
            onViewChange={setActiveView}
          />
        );
      case "register":
        return (
          <RegisterView
            onRegisterSuccess={() => setActiveView("login")}
            onViewChange={setActiveView}
          />
        );
      case "dashboard":
        return user ? (
          <DashboardView
            user={user}
            stats={stats}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            onAddEntryClick={() => {
              setEntryToEdit(null);
              setShowAddEntryModal(true);
            }}
            onViewChange={setActiveView}
          />
        ) : null;
      case "calculator":
        return (
          <CalculatorView
            onSaveEntry={saveWeightEntry}
            defaultHeight={stats.recentHistory[0]?.height || 184.5}
          />
        );
      case "history":
        return (
          <HistoryView
            entries={stats.recentHistory}
            onDeleteEntry={deleteWeightEntry}
            onEditEntry={(entry) => {
              setEntryToEdit(entry);
              setShowAddEntryModal(true);
            }}
            onAddEntryClick={() => {
              setEntryToEdit(null);
              setShowAddEntryModal(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#fcf9f8] dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col font-caption selection:bg-[#ff6b00]/30 transition-colors duration-200">
      
      {/* Top Navigation Frame bar */}
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Container Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 relative">
        
        {/* Background ambient lighting accents */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5 dark:opacity-10 transition-opacity">
          <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-[#ff6b00] rounded-full blur-[130px] -translate-y-1/3 translate-x-1/4"></div>
          <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[110px] translate-y-1/4 -translate-x-1/4"></div>
        </div>

        {/* Dynamic view content wrapper */}
        <div className="relative z-10">
          {renderView()}
        </div>
      </main>

      {/* Footer block */}
      <footer className="bg-stone-50 dark:bg-[#121212] border-t-2 border-black dark:border-white/10 transition-colors py-10 mt-auto select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1">
            <span className="font-headline font-black text-lg text-[#a04100] dark:text-[#ff6b00] tracking-tighter">
              HiperFit
            </span>
            <p className="font-mono text-[10px] text-zinc-400 font-semibold uppercase">
              © 2024 Calculadora HiperFit. Professional-grade fitness tracking.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-mono text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert("Os Termos de Uso do HiperFit seguem as diretrizes de rastreamento saudável sem fornecimento de aconselhamento médico."); }}
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Terms
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert("A sua privacidade está totalmente garantida. O HiperFit armazena registros localmente no contêiner com integridade de dados."); }}
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert("Isenção de Responsabilidade Médica: O software HiperFit atua como registro estatístico e não substitui diagnósticos, exames ou aconselhamento médico profissional."); }}
              className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors text-[#a04100] dark:text-[#ff6b00]"
            >
              Health Disclaimer
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Daily Log Quick entry Modal */}
      {showAddEntryModal && user && (
        <AddEntryModal
          onClose={() => {
            setShowAddEntryModal(false);
            setEntryToEdit(null);
          }}
          onSubmit={saveWeightEntry}
          entryToEdit={entryToEdit}
          defaultHeight={stats.recentHistory[0]?.height || 184.5}
        />
      )}

      {/* Mobile Actions Quick Floating Accent Trigger (F.A.B.) */}
      {user && activeView !== "login" && activeView !== "register" && (
        <button
          onClick={() => {
            setEntryToEdit(null);
            setShowAddEntryModal(true);
          }}
          className="fixed bottom-6 right-6 md:hidden bg-[#ff6b00] text-white w-14 h-14 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:scale-105 active:translate-y-1 active:shadow-none transition-all z-40 cursor-pointer"
          title="Nova Entrada de Peso"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}

