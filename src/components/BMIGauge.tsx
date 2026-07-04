interface BMIGaugeProps {
  bmi: number;
}

export function getBMIPercentage(bmi: number): number {
  if (!bmi || bmi <= 15) return 4;
  if (bmi >= 35) return 96;
  if (bmi < 18.5) {
    // scale 15 to 18.5 on 4% to 25%
    return 4 + ((bmi - 15) / 3.5) * 21;
  } else if (bmi < 25) {
    // scale 18.5 to 25 on 25% to 55%
    return 25 + ((bmi - 18.5) / 6.5) * 30;
  } else if (bmi < 30) {
    // scale 25 to 30 on 55% to 80%
    return 55 + ((bmi - 25) / 5) * 25;
  } else {
    // scale 30 to 35 on 80% to 96%
    return 80 + ((bmi - 30) / 5) * 16;
  }
}

export function getBMICategory(bmi: number): { label: string; colorClass: string; textClass: string } {
  if (!bmi || bmi === 0) return { label: "Sem registros", colorClass: "bg-zinc-300", textClass: "text-zinc-500" };
  if (bmi < 18.5) return { label: "Abaixo do peso", colorClass: "bg-amber-300", textClass: "text-amber-600 dark:text-amber-400" };
  if (bmi < 25.0) return { label: "Faixa Saudável", colorClass: "bg-emerald-400", textClass: "text-emerald-600 dark:text-emerald-400" };
  if (bmi < 30.0) return { label: "Sobrepeso", colorClass: "bg-orange-400", textClass: "text-orange-600 dark:text-orange-400" };
  return { label: "Obesidade", colorClass: "bg-red-400", textClass: "text-red-600 dark:text-red-400" };
}

export default function BMIGauge({ bmi }: BMIGaugeProps) {
  const pct = getBMIPercentage(bmi);
  const status = getBMICategory(bmi);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
        <span>Abaixo</span>
        <span className="text-emerald-500 font-extrabold text-[10px]">Ideal</span>
        <span>Sobrepeso</span>
        <span>Obeso</span>
      </div>

      {/* Rail with gradient styling */}
      <div className="relative h-2.5 w-full rounded-full border border-black overflow-visible bg-gradient-to-r from-teal-200 via-emerald-300 via-yellow-250 to-orange-400">
        
        {/* Slider Indicator Handle */}
        <div
          style={{ left: `${pct}%` }}
          className="absolute top-[50%] -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border-2 border-white dark:border-[#1a1a1a] shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer"
          title={`Seu IMC está em: ${bmi}`}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
