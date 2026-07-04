import { useState, FormEvent } from "react";
import { Calculator, Calendar, ArrowRight, Sparkles, Flame } from "lucide-react";
import { getBMICategory, getBMIPercentage } from "./BMIGauge";

interface CalculatorViewProps {
  onSaveEntry: (weight: number, height: number, date: string) => Promise<void>;
  defaultHeight?: number;
}

export default function CalculatorView({
  onSaveEntry,
  defaultHeight = 184.5
}: CalculatorViewProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState(defaultHeight > 0 ? defaultHeight.toString() : "175");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [lastCalculatedResult, setLastCalculatedResult] = useState<{
    bmi: number;
    weight: number;
    height: number;
    category: { label: string; textClass: string; colorClass: string };
  } | null>(null);

  const handleCalculate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum <= 0) {
      setError("Por favor, digite um peso válido em KG (ex: 82.5).");
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0) {
      setError("Por favor, digite uma altura válida em CM (ex: 184).");
      return;
    }

    setLoading(true);
    try {
      // Send saving request to database
      await onSaveEntry(weightNum, heightNum, date);

      const computedBmi = parseFloat((weightNum / Math.pow(heightNum / 100, 2)).toFixed(1));
      const category = getBMICategory(computedBmi);

      setLastCalculatedResult({
        bmi: computedBmi,
        weight: weightNum,
        height: heightNum,
        category
      });

      setSuccess("Seu registro foi processado, calculado e gravado no banco de dados com absoluto sucesso!");
      // Reset weight input
      setWeight("");
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao registrar as métricas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250 select-none">
      
      {/* Header section */}
      <div>
        <h1 className="font-headline font-extrabold text-3xl text-black dark:text-white uppercase tracking-tight">
          BMI Calculator
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
          Precision tracking for your fitness evolution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column - Input fields */}
        <form onSubmit={handleCalculate} className="space-y-5">
          {error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 text-xs font-mono">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[#a4f0be] border-2 border-emerald-500 text-emerald-800 p-3 text-xs font-mono">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* WEIGHT input card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex flex-col justify-between h-32 relative">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2 font-mono">
                Weight (KG)
              </span>
              <div className="flex items-baseline justify-between">
                <input
                  type="number"
                  step="0.1"
                  placeholder="00.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-transparent text-black dark:text-white font-headline font-black text-4xl w-32 focus:ring-0 focus:outline-none placeholder-zinc-200 dark:placeholder-zinc-800 pr-1"
                  required
                />
                <span className="font-mono text-xs font-extrabold text-zinc-400">KG</span>
              </div>
            </div>

            {/* HEIGHT input card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex flex-col justify-between h-32 relative">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2 font-mono">
                Height (CM)
              </span>
              <div className="flex items-baseline justify-between">
                <input
                  type="number"
                  step="0.5"
                  placeholder="000"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-transparent text-black dark:text-white font-headline font-black text-4xl w-32 focus:ring-0 focus:outline-none placeholder-zinc-200 dark:placeholder-zinc-800 pr-1"
                  required
                />
                <span className="font-mono text-xs font-extrabold text-zinc-400">CM</span>
              </div>
            </div>
          </div>

          {/* MEASUREMENT DATE Input */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] relative">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2 font-mono">
              Measurement Date
            </span>
            <div className="flex items-center justify-between">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-black dark:text-white font-mono text-lg font-bold border-0 p-0 focus:ring-0 focus:outline-none"
                required
              />
              <Calendar className="h-5 w-5 text-[#ff6b00]" />
            </div>
          </div>

          {/* Core Calculate trigger action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6b00] text-white border-2 border-black py-4 font-headline font-extrabold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">PROCESSANDO...</span>
            ) : (
              <>
                CALCULATE BMI
                <Flame className="h-4 w-4 fill-white text-white rotate-12" />
              </>
            )}
          </button>
        </form>

        {/* Right Column - Results context */}
        <div className="flex flex-col gap-6">
          
          {/* Output block display */}
          <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] min-h-[190px] flex flex-col items-center justify-center text-center transition-colors">
            {lastCalculatedResult ? (
              <div className="space-y-4 w-full text-left">
                <span className="text-[9px] font-mono font-black text-[#ff6b00] uppercase tracking-wider">
                  Calculated Result
                </span>
                
                <div className="flex items-center justify-between border-b pb-4 border-black/10 dark:border-white/10">
                  <div>
                    <h4 className="font-headline font-black text-4xl text-black dark:text-white">
                      {lastCalculatedResult.bmi}
                    </h4>
                    <p className={`font-mono text-xs font-extrabold uppercase tracking-wide ${lastCalculatedResult.category.textClass}`}>
                      {lastCalculatedResult.category.label}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs text-zinc-400 font-bold space-y-1">
                    <p>Peso: {lastCalculatedResult.weight} kg</p>
                    <p>Altura: {lastCalculatedResult.height} cm</p>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
                  <p>
                    O Índice de Massa Corporal (IMC) é uma estatística internacional que serve de referência na Organização Mundial da Saúde (OMS) para diagnosticar a obesidade.
                  </p>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                    💡 Para a sua altura de {lastCalculatedResult.height}cm, o peso ideal recomendável situa-se na faixa de{" "}
                    <span className="font-bold underline">
                      {((18.5 * Math.pow(lastCalculatedResult.height / 100, 2))).toFixed(1)} kg
                    </span>{" "}
                    a{" "}
                    <span className="font-bold underline">
                      {((24.9 * Math.pow(lastCalculatedResult.height / 100, 2))).toFixed(1)} kg
                    </span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                  <Calculator className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold font-mono text-zinc-400 dark:text-zinc-500 select-none">
                  Enter your metrics to see result
                </p>
              </div>
            )}
          </div>

          {/* Bottom Gym Atmosphere Photo */}
          <div className="border-2 border-black dark:border-white/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] relative h-44 overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=1000"
              alt="High-contrast gym environment with warm light accents"
              className="w-full h-full object-cover grayscale brightness-50 contrast-125 group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            
            {/* Elegant overlay text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <span className="font-mono text-[9px] text-[#ff6b00] font-extrabold uppercase tracking-widest mb-1">
                HiperFit Atmosphere
              </span>
              <h4 className="font-headline font-bold text-sm text-white uppercase tracking-tight">
                Train hard. Eat right. Track everything.
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
