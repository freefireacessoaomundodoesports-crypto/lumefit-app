import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Flame,
  Home,
  ImagePlus,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  activityLevels,
  cities,
  mealLabels,
  mockMealResults,
  quotes,
  tips,
  weeklyGoals,
  weeklyPlan,
  type MealType,
  type MockMealResult,
} from "@/lib/lumefit-data";

export const Route = createFileRoute("/")({
  component: LumeFitApp,
});

type ViewKey = "splash" | "setup" | "home" | "refeicoes" | "progresso" | "plano" | "perfil";
type MealFlowStage = "camera" | "preview" | "analyzing" | "result";

type Profile = {
  name: string;
  age: number;
  city: string;
  weight: number;
  height: number;
  targetWeight: number;
  weeklyGoal: string;
  activityLevel: string;
  calorieGoal: number;
};

type MealEntry = {
  id: string;
  meal: MealType;
  foodName: string;
  calories: number;
  quantity: number;
  timestamp: string;
  photo?: string;
};

type RecentMealAnalysis = {
  id: string;
  name: string;
  image: string;
  resultId: string;
  timestampLabel: string;
};

const STORAGE_KEY = "lumefit_state_v1";

const ANALYSIS_MESSAGES = [
  "🔍 A identificar os alimentos...",
  "🌿 A reconhecer ingredientes locais...",
  "⚖️ A estimar as porções...",
  "🔥 A calcular as calorias...",
  "💪 A analisar macronutrientes...",
  "✨ A preparar o relatório...",
];

const confettiOffsets = [
  "3%",
  "8%",
  "12%",
  "18%",
  "24%",
  "31%",
  "38%",
  "44%",
  "49%",
  "56%",
  "61%",
  "67%",
  "73%",
  "79%",
  "84%",
  "89%",
  "94%",
];

function makePlaceholder(label: string, tone = "#dff7e7") {
  const encoded = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='600' height='420'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${tone}' stop-opacity='0.95' />
          <stop offset='100%' stop-color='#2ecc71' stop-opacity='0.68' />
        </linearGradient>
      </defs>
      <rect width='600' height='420' rx='38' fill='url(#g)' />
      <circle cx='120' cy='96' r='88' fill='white' fill-opacity='0.12' />
      <circle cx='520' cy='320' r='108' fill='white' fill-opacity='0.12' />
      <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='#1a7a45' font-size='42' font-family='Poppins, sans-serif' font-weight='700'>${label}</text>
    </svg>
  `);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

const initialRecentAnalyses: RecentMealAnalysis[] = [
  {
    id: "seed-1",
    name: "Xima com Matapa",
    image: makePlaceholder("Xima + Matapa"),
    resultId: mockMealResults[0].id,
    timestampLabel: "Hoje, 11:48",
  },
  {
    id: "seed-2",
    name: "Arroz com Frango",
    image: makePlaceholder("Arroz + Frango", "#dcfce7"),
    resultId: mockMealResults[1].id,
    timestampLabel: "Hoje, 09:10",
  },
  {
    id: "seed-3",
    name: "Feijão Nhemba",
    image: makePlaceholder("Feijão Nhemba"),
    resultId: mockMealResults[2].id,
    timestampLabel: "Ontem, 20:16",
  },
  {
    id: "seed-4",
    name: "Peixe com Xima",
    image: makePlaceholder("Peixe + Xima", "#bbf7d0"),
    resultId: mockMealResults[3].id,
    timestampLabel: "Ontem, 13:40",
  },
  {
    id: "seed-5",
    name: "Frango Legumes",
    image: makePlaceholder("Frango + Legumes"),
    resultId: mockMealResults[5].id,
    timestampLabel: "Ontem, 08:24",
  },
];

function calcGoal(weight: number, height: number, age: number, activity: string, weeklyGoal: string) {
  const bmr = 10 * weight + 6.25 * height - 5 * age - 120;
  const activityFactor =
    activity === "Fico muito em casa" ? 1.2 : activity === "Caminho um pouco" ? 1.35 : 1.5;
  const deficit = weeklyGoal.includes("1.5") ? 500 : weeklyGoal.includes("1kg") ? 350 : 220;
  return Math.max(1200, Math.round(bmr * activityFactor - deficit));
}

function getTodayLabel() {
  return new Date().toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function animateToward(current: number, target: number, ratio = 0.2) {
  if (Math.abs(target - current) < 0.5) return target;
  return current + (target - current) * ratio;
}

function pickMockResult(seed?: string): MockMealResult {
  const source = (seed || "").toLowerCase();
  const direct = mockMealResults.find(
    (item) =>
      source.includes(item.mealName.toLowerCase().split(" ")[0]) ||
      source.includes("xima") ||
      source.includes("matapa") ||
      source.includes("frango") ||
      source.includes("feij") ||
      source.includes("peixe"),
  );

  if (direct) return direct;
  return mockMealResults[Math.floor(Math.random() * mockMealResults.length)];
}

function LumeFitApp() {
  const [view, setView] = useState<ViewKey>("splash");
  const [setupStep, setSetupStep] = useState(1);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("almoco");
  const [expandedMeals, setExpandedMeals] = useState<MealType[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [metric, setMetric] = useState(true);

  const [mealStage, setMealStage] = useState<MealFlowStage>("camera");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessageIndex, setAnalysisMessageIndex] = useState(0);
  const [activeResult, setActiveResult] = useState<MockMealResult | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentMealAnalysis[]>(initialRecentAnalyses);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [animatedKcal, setAnimatedKcal] = useState(0);
  const [animatedProtein, setAnimatedProtein] = useState(0);
  const [animatedCarbs, setAnimatedCarbs] = useState(0);
  const [animatedFat, setAnimatedFat] = useState(0);

  const [profile, setProfile] = useState<Profile>({
    name: "",
    age: 30,
    city: "Maputo",
    weight: 78,
    height: 163,
    targetWeight: 68,
    weeklyGoal: weeklyGoals[1],
    activityLevel: activityLevels[1],
    calorieGoal: 1400,
  });

  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [weightHistory, setWeightHistory] = useState([
    { week: "Sem 1", weight: 80 },
    { week: "Sem 2", weight: 79.2 },
    { week: "Sem 3", weight: 78.6 },
    { week: "Sem 4", weight: 78 },
    { week: "Sem 5", weight: 77.3 },
    { week: "Sem 6", weight: 76.8 },
  ]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        profile?: Profile;
        entries?: MealEntry[];
        notifications?: boolean;
        metric?: boolean;
        recentAnalyses?: RecentMealAnalysis[];
      };

      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.entries) setEntries(parsed.entries);
      if (typeof parsed.notifications === "boolean") setNotifications(parsed.notifications);
      if (typeof parsed.metric === "boolean") setMetric(parsed.metric);
      if (parsed.recentAnalyses && parsed.recentAnalyses.length > 0) {
        setRecentAnalyses(parsed.recentAnalyses.slice(0, 5));
      }
      setView("home");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile,
        entries,
        notifications,
        metric,
        recentAnalyses,
      }),
    );
  }, [profile, entries, notifications, metric, recentAnalyses]);

  useEffect(() => {
    if (mealStage !== "analyzing") return;

    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);

    const progressTick = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(100, prev + 2.35));
    }, 80);

    const msgTick = setInterval(() => {
      setAnalysisMessageIndex((prev) => (prev + 1) % ANALYSIS_MESSAGES.length);
    }, 1200);

    const finish = setTimeout(() => {
      setAnalysisProgress(100);
      const selected = pickMockResult(activeResult?.mealName);
      setActiveResult(selected);
      setPortionMultiplier(1);
      setMealStage("result");
    }, 3500);

    return () => {
      clearInterval(progressTick);
      clearInterval(msgTick);
      clearTimeout(finish);
    };
  }, [mealStage, activeResult?.mealName]);

  useEffect(() => {
    if (!activeResult || mealStage !== "result") return;

    const targetKcal = Math.round(activeResult.estimatedKcal * portionMultiplier);
    const targetProtein = activeResult.protein * portionMultiplier;
    const targetCarbs = activeResult.carbs * portionMultiplier;
    const targetFat = activeResult.fat * portionMultiplier;

    const timer = setInterval(() => {
      setAnimatedKcal((prev) => animateToward(prev, targetKcal));
      setAnimatedProtein((prev) => animateToward(prev, targetProtein));
      setAnimatedCarbs((prev) => animateToward(prev, targetCarbs));
      setAnimatedFat((prev) => animateToward(prev, targetFat));
    }, 32);

    const stopper = setTimeout(() => {
      setAnimatedKcal(targetKcal);
      setAnimatedProtein(targetProtein);
      setAnimatedCarbs(targetCarbs);
      setAnimatedFat(targetFat);
      clearInterval(timer);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(stopper);
    };
  }, [activeResult, portionMultiplier, mealStage]);

  const todayQuote = quotes[new Date().getDate() % quotes.length];

  const consumedCalories = entries.reduce((sum, item) => sum + item.calories, 0);
  const remainingCalories = Math.max(profile.calorieGoal - consumedCalories, 0);
  const caloriePercent = Math.min((consumedCalories / profile.calorieGoal) * 100, 100);
  const ringGlow =
    caloriePercent < 70
      ? "var(--color-brand-success)"
      : caloriePercent < 92
        ? "var(--color-brand-warning)"
        : "var(--color-brand-danger)";

  const macros = {
    protein: Math.min(100, (consumedCalories * 0.3) / 4),
    carbs: Math.min(100, (consumedCalories * 0.45) / 4),
    fat: Math.min(100, (consumedCalories * 0.25) / 9),
  };

  const mealsByType = entries.reduce<Record<MealType, MealEntry[]>>(
    (acc, item) => {
      acc[item.meal].push(item);
      return acc;
    },
    { "pequeno-almoco": [], almoco: [], jantar: [], lanches: [] },
  );

  const weeklyBars = useMemo(
    () =>
      ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, index) => {
        const base = profile.calorieGoal - 160 + index * 40;
        return { day: d, calories: base };
      }),
    [profile.calorieGoal],
  );

  const currentTimestamp = new Date().toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const shellClass =
    "mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-5 text-foreground animate-fade-in sm:max-w-2xl";

  const handleImagePick = (file: File | null) => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setPreviewImage(fileUrl);
    setActiveResult(pickMockResult(file.name));
    setMealStage("preview");
    setNutritionOpen(false);
    setExpandedIngredient(null);
  };

  const confirmAddToDiary = () => {
    if (!activeResult) return;
    const kcal = Math.round(activeResult.estimatedKcal * portionMultiplier);
    const nextEntry: MealEntry = {
      id: crypto.randomUUID(),
      meal: selectedMeal,
      foodName: activeResult.mealName,
      calories: kcal,
      quantity: portionMultiplier,
      timestamp: new Date().toISOString(),
      photo: previewImage || undefined,
    };

    setIsSavingMeal(true);
    setEntries((prev) => [nextEntry, ...prev]);
    setRecentAnalyses((prev) => {
      const stamp = `Hoje, ${currentTimestamp}`;
      const first: RecentMealAnalysis = {
        id: crypto.randomUUID(),
        name: activeResult.mealName,
        image: previewImage || makePlaceholder(activeResult.mealName),
        resultId: activeResult.id,
        timestampLabel: stamp,
      };
      return [first, ...prev].slice(0, 5);
    });

    setToastMessage(`✅ ${kcal} kcal adicionadas ao ${mealLabels[selectedMeal].replace(/^[^ ]+ /, "").toLowerCase()}!`);
    setShowToast(true);
    setShowConfetti(true);

    setTimeout(() => setShowConfetti(false), 1500);
    setTimeout(() => {
      setIsSavingMeal(false);
      setMealStage("camera");
      setView("home");
    }, 1600);

    setTimeout(() => setShowToast(false), 2600);
  };

  const resetMealFlow = () => {
    setMealStage("camera");
    setPreviewImage(null);
    setActiveResult(null);
    setPortionMultiplier(1);
    setNutritionOpen(false);
    setExpandedIngredient(null);
    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);
  };

  const currentMealTitle = mealLabels[selectedMeal];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {view === "splash" && (
        <section className={shellClass}>
          <div className="glass-card mt-6 rounded-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent-3/30">
              <Flame className="h-8 w-8 text-brand-accent-2" />
            </div>
            <h1 className="text-4xl font-bold">LUMEfit</h1>
            <p className="mt-3 text-sm text-muted-foreground">O teu caminho para uma vida mais leve</p>
            <div className="mt-8 space-y-3">
              <Button
                onClick={() => setView("setup")}
                className="h-11 w-full bg-brand-accent-1 text-primary-foreground hover:scale-[1.02] hover:bg-brand-accent-2"
              >
                Começar Agora
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("setup")}
                className="h-11 w-full bg-glass-muted hover:scale-[1.02]"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>
      )}

      {view === "setup" && (
        <section className={shellClass}>
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-muted-foreground">Configuração {setupStep}/3</p>
            {setupStep === 1 && (
              <div className="mt-4 space-y-4">
                <h2 className="text-xl font-semibold">Dados pessoais</h2>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="O teu nome"
                  className="bg-glass-muted"
                />
                <Input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) || 0 }))}
                  placeholder="Idade"
                  className="bg-glass-muted"
                />
                <select
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="h-10 w-full rounded-md border border-glass-border bg-glass-muted px-3 text-sm"
                >
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}

            {setupStep === 2 && (
              <div className="mt-4 space-y-5">
                <h2 className="text-xl font-semibold">Medidas corporais</h2>
                <div>
                  <p className="text-sm">Peso atual: {profile.weight} kg</p>
                  <Slider
                    min={40}
                    max={140}
                    value={[profile.weight]}
                    onValueChange={([value]) => setProfile((p) => ({ ...p, weight: value }))}
                  />
                </div>
                <div>
                  <p className="text-sm">Altura: {profile.height} cm</p>
                  <Slider
                    min={140}
                    max={195}
                    value={[profile.height]}
                    onValueChange={([value]) => setProfile((p) => ({ ...p, height: value }))}
                  />
                </div>
                <Input
                  type="number"
                  value={profile.targetWeight}
                  onChange={(e) => setProfile((p) => ({ ...p, targetWeight: Number(e.target.value) || 0 }))}
                  placeholder="Peso alvo (kg)"
                  className="bg-glass-muted"
                />
              </div>
            )}

            {setupStep === 3 && (
              <div className="mt-4 space-y-4">
                <h2 className="text-xl font-semibold">Objetivos</h2>
                <select
                  value={profile.weeklyGoal}
                  onChange={(e) => setProfile((p) => ({ ...p, weeklyGoal: e.target.value }))}
                  className="h-10 w-full rounded-md border border-glass-border bg-glass-muted px-3 text-sm"
                >
                  {weeklyGoals.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
                <select
                  value={profile.activityLevel}
                  onChange={(e) => setProfile((p) => ({ ...p, activityLevel: e.target.value }))}
                  className="h-10 w-full rounded-md border border-glass-border bg-glass-muted px-3 text-sm"
                >
                  {activityLevels.map((activity) => (
                    <option key={activity}>{activity}</option>
                  ))}
                </select>
                <div className="rounded-lg border border-glass-border bg-glass-muted p-4">
                  <p className="text-xs text-muted-foreground">Meta diária estimada</p>
                  <p className="text-2xl font-bold text-brand-accent-2">
                    {calcGoal(
                      profile.weight,
                      profile.height,
                      profile.age,
                      profile.activityLevel,
                      profile.weeklyGoal,
                    )}{" "}
                    kcal
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                disabled={setupStep === 1}
                onClick={() => setSetupStep((s) => Math.max(1, s - 1))}
                className="flex-1"
              >
                Voltar
              </Button>
              {setupStep < 3 ? (
                <Button onClick={() => setSetupStep((s) => Math.min(3, s + 1))} className="flex-1">
                  Continuar
                </Button>
              ) : (
                <Button onClick={() => {
                  setProfile((prev) => ({
                    ...prev,
                    calorieGoal: calcGoal(
                      prev.weight,
                      prev.height,
                      prev.age,
                      prev.activityLevel,
                      prev.weeklyGoal,
                    ),
                  }));
                  setView("home");
                }} className="flex-1 bg-brand-accent-1 hover:bg-brand-accent-2">
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {view !== "splash" && view !== "setup" && (
        <section className={shellClass}>
          {(view === "home" || view === "refeicoes") && (
            <>
              <header className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{getTodayLabel()}</p>
                <h2 className="mt-1 text-2xl font-semibold">Bom dia, {profile.name || "Campeã"}! 🌟</h2>
                <p className="mt-2 text-sm text-muted-foreground">{todayQuote}</p>
              </header>

              {view === "home" && (
                <>
                  <article className="glass-card mt-4 rounded-xl p-5 text-center">
                    <h3 className="text-sm text-muted-foreground">Calorias de hoje</h3>
                    <div className="mx-auto mt-4 h-40 w-40">
                      <svg viewBox="0 0 120 120" className="h-full w-full">
                        <defs>
                          <linearGradient id="calorieRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-brand-accent-1)" />
                            <stop offset="100%" stopColor="var(--color-brand-accent-2)" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="var(--color-glass-border)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="url(#calorieRingGradient)"
                          strokeWidth="8"
                          strokeDasharray={`${(caloriePercent / 100) * 327} 327`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          className="transition-all duration-500"
                          style={{ filter: `drop-shadow(0 0 6px ${ringGlow})` }}
                        />
                      </svg>
                      <div className="-mt-24 text-center">
                        <p className="text-2xl font-bold">{consumedCalories}</p>
                        <p className="text-xs text-muted-foreground">/ {profile.calorieGoal} kcal</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm">Restam {remainingCalories} calorias hoje</p>
                  </article>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Proteínas", value: macros.protein },
                      { label: "Carboidratos", value: macros.carbs },
                      { label: "Gorduras", value: macros.fat },
                    ].map((macro) => (
                      <article key={macro.label} className="glass-card rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">{macro.label}</p>
                        <p className="my-2 text-sm font-medium">{Math.round(macro.value)}g</p>
                        <Progress value={Math.min(macro.value, 100)} />
                      </article>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(Object.keys(mealLabels) as MealType[]).map((meal) => {
                      const mealEntries = mealsByType[meal];
                      const total = mealEntries.reduce((sum, item) => sum + item.calories, 0);
                      const isOpen = expandedMeals.includes(meal);

                      return (
                        <article
                          key={meal}
                          className="glass-card rounded-xl border-l-4 border-l-transparent p-3 hover:border-l-brand-accent-1 hover:bg-white/85"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMeals((prev) =>
                                prev.includes(meal)
                                  ? prev.filter((item) => item !== meal)
                                  : [...prev, meal],
                              )
                            }
                            className="w-full text-left"
                          >
                            <p className="text-sm font-medium">{mealLabels[meal]}</p>
                            <p className="text-xs text-muted-foreground">{total} kcal</p>
                          </button>
                          <Button
                            size="sm"
                            className="mt-3 w-full bg-brand-accent-3/80 hover:bg-brand-accent-3"
                            onClick={() => {
                              setSelectedMeal(meal);
                              setView("refeicoes");
                              setMealStage("camera");
                            }}
                          >
                            + Adicionar
                          </Button>
                          {isOpen && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {mealEntries.slice(0, 3).map((entry) => (
                                <li key={entry.id} className="flex items-center gap-2">
                                  {entry.photo ? (
                                    <img
                                      src={entry.photo}
                                      alt={entry.foodName}
                                      className="h-6 w-6 rounded-md object-cover"
                                      loading="lazy"
                                    />
                                  ) : null}
                                  <span className="truncate">{entry.foodName}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {view === "refeicoes" && (
                <>
                  {mealStage === "camera" && (
                    <div className="mt-4 space-y-4">
                      <article className="glass-card rounded-[20px] p-5 shadow-[0_0_0_1px_var(--color-brand-accent-1)_inset,0_8px_28px_oklch(0.64_0.12_152_/_20%)]">
                        <p className="text-xs text-muted-foreground">Adicionar em: {currentMealTitle}</p>
                        <h3 className="mt-1 text-2xl font-bold text-primary">Analisar Refeição</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tira uma foto do teu prato e a IA faz o resto ✨
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => cameraInputRef.current?.click()}
                            className="camera-pulse h-14 rounded-[18px] text-sm"
                          >
                            <Camera className="h-4 w-4" />
                            Tirar Foto
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => galleryInputRef.current?.click()}
                            className="h-14 rounded-[18px] border-brand-accent-1/40 bg-glass text-primary"
                          >
                            <ImagePlus className="h-4 w-4" />
                            Carregar da Galeria
                          </Button>
                        </div>
                      </article>

                      <article className="glass-card rounded-[20px] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Análises Recentes</h4>
                          <span className="text-xs text-muted-foreground">Últimas 5</span>
                        </div>
                        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                          {recentAnalyses.map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => {
                                const matched = mockMealResults.find((m) => m.id === item.resultId) || mockMealResults[0];
                                setPreviewImage(item.image);
                                setActiveResult(matched);
                                setMealStage("result");
                                setPortionMultiplier(1);
                              }}
                              className="w-[82px] shrink-0 text-left"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-[72px] w-[72px] rounded-full border border-brand-accent-1/30 object-cover shadow-[0_6px_20px_oklch(0.64_0.12_152_/_20%)]"
                                loading="lazy"
                              />
                              <p className="mt-1 truncate text-[11px] font-medium">{item.name}</p>
                            </button>
                          ))}
                        </div>
                      </article>

                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
                      />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}

                  {mealStage === "preview" && previewImage && (
                    <div className="mt-4 space-y-4">
                      <article className="glass-card rounded-[20px] p-4 shadow-[0_0_0_1px_var(--color-brand-accent-1)_inset]">
                        <img
                          src={previewImage}
                          alt="Pré-visualização da refeição"
                          className="h-64 w-full rounded-2xl border border-brand-accent-1/40 object-cover"
                        />
                      </article>

                      <div className="space-y-3">
                        <Button className="h-12 w-full rounded-[18px]" onClick={() => setMealStage("analyzing")}>
                          <Sparkles className="h-4 w-4" />
                          Analisar este prato
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 w-full rounded-[18px]"
                          onClick={() => {
                            setPreviewImage(null);
                            setMealStage("camera");
                          }}
                        >
                          Escolher outra foto
                        </Button>
                      </div>
                    </div>
                  )}

                  {mealStage === "result" && activeResult && (
                    <div className="mt-4 space-y-4 pb-36">
                      <article className="glass-card animate-enter rounded-[20px] p-5">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={activeResult.mealName}
                            className="h-48 w-full rounded-2xl border border-brand-accent-1/45 object-cover shadow-[0_0_0_1px_var(--color-brand-accent-1)_inset,0_10px_24px_oklch(0.64_0.12_152_/_20%)]"
                          />
                        ) : null}
                        <h3 className="mt-3 text-xl font-bold">{activeResult.mealName}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-brand-accent-1/40 bg-brand-accent-1/20 px-3 py-1 text-xs font-medium text-primary">
                            {activeResult.confidence}% de precisão ✓
                          </span>
                          <span className="rounded-full border border-glass-border bg-glass px-3 py-1 text-xs">
                            {activeResult.cuisineTag}
                          </span>
                          <span className="text-xs text-muted-foreground">Hoje, {currentTimestamp}</span>
                        </div>
                      </article>

                      <article className="glass-card animate-enter rounded-[20px] p-5 text-center">
                        <p className="text-xs text-muted-foreground">Estimativa total</p>
                        <p className="mt-1 text-5xl font-bold text-primary">{Math.round(animatedKcal)}</p>
                        <p className="text-sm font-medium">kcal estimadas</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Baseado nas porções visíveis no prato
                        </p>
                        <div className="mt-4">
                          <div className="h-3 overflow-hidden rounded-full bg-brand-accent-3/40">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-accent-1 to-brand-accent-2 transition-all duration-700"
                              style={{ width: `${Math.min(100, activeResult.dailyGoalPercent * portionMultiplier)}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Este prato = {Math.round(activeResult.dailyGoalPercent * portionMultiplier)}% da tua meta diária
                          </p>
                        </div>
                      </article>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            key: "prot",
                            label: "Proteínas",
                            value: animatedProtein,
                            target: activeResult.protein * portionMultiplier,
                            ring: "var(--color-brand-danger)",
                            bg: "bg-brand-danger/10 border-brand-danger/30",
                          },
                          {
                            key: "carb",
                            label: "Carboidratos",
                            value: animatedCarbs,
                            target: activeResult.carbs * portionMultiplier,
                            ring: "var(--color-brand-warning)",
                            bg: "bg-brand-warning/10 border-brand-warning/30",
                          },
                          {
                            key: "fat",
                            label: "Gorduras",
                            value: animatedFat,
                            target: activeResult.fat * portionMultiplier,
                            ring: "var(--color-brand-success)",
                            bg: "bg-brand-success/10 border-brand-success/30",
                          },
                        ].map((macro, index) => {
                          const pct = Math.min(100, (macro.value / Math.max(macro.target, 1)) * 100);
                          return (
                            <article
                              key={macro.key}
                              className={`glass-card rounded-[20px] border p-3 animate-enter ${macro.bg}`}
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="mx-auto mb-2 h-12 w-12">
                                <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
                                  <circle cx="24" cy="24" r="18" stroke="var(--color-glass-border)" strokeWidth="5" fill="none" />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="18"
                                    stroke={macro.ring}
                                    strokeWidth="5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(pct / 100) * 113} 113`}
                                    className="transition-all duration-700"
                                  />
                                </svg>
                              </div>
                              <p className="text-[11px] text-muted-foreground">{macro.label}</p>
                              <p className="text-base font-bold">{Math.round(macro.value)}g</p>
                            </article>
                          );
                        })}
                      </div>

                      <article className="glass-card rounded-[20px] p-4">
                        <h4 className="text-sm font-semibold">Ingredientes Identificados</h4>
                        <div className="mt-3 space-y-2">
                          {activeResult.ingredients.map((item, index) => {
                            const expanded = expandedIngredient === item.name;
                            return (
                              <button
                                type="button"
                                key={item.name}
                                onClick={() => setExpandedIngredient((prev) => (prev === item.name ? null : item.name))}
                                className="glass-chip animate-enter w-full rounded-xl border border-glass-border bg-glass p-3 text-left"
                                style={{ animationDelay: `${index * 0.08}s` }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-4 w-4 text-brand-accent-1" />
                                    <div>
                                      <p className="text-sm font-medium">{item.name}</p>
                                      <p className="text-xs text-muted-foreground">{Math.round(item.calories * portionMultiplier)} kcal</p>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{expanded ? "−" : "+"}</span>
                                </div>
                                {expanded ? <p className="mt-2 text-xs text-muted-foreground">{item.note}</p> : null}
                              </button>
                            );
                          })}
                        </div>
                      </article>

                      <article className="glass-card rounded-[20px] p-4">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between"
                          onClick={() => setNutritionOpen((prev) => !prev)}
                        >
                          <h4 className="text-sm font-semibold">Detalhes Nutricionais</h4>
                          {nutritionOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {nutritionOpen ? (
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {[
                              `🧂 Sódio: ${Math.round(activeResult.sodiumMg * portionMultiplier)}mg`,
                              `🫀 Fibra: ${(activeResult.fiberG * portionMultiplier).toFixed(1)}g`,
                              `🍬 Açúcares: ${(activeResult.sugarsG * portionMultiplier).toFixed(1)}g`,
                              `💊 Vitamina A: ${Math.round(activeResult.vitaminAPct * portionMultiplier)}% VD`,
                              `💊 Vitamina C: ${Math.round(activeResult.vitaminCPct * portionMultiplier)}% VD`,
                              `⚡ Ferro: ${Math.round(activeResult.ironPct * portionMultiplier)}% VD`,
                              `🦴 Cálcio: ${Math.round(activeResult.calciumPct * portionMultiplier)}% VD`,
                            ].map((value) => (
                              <div key={value} className="rounded-lg border border-glass-border bg-glass px-3 py-2">
                                {value}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </article>

                      <article className="glass-card rounded-[20px] border-l-4 border-l-brand-accent-1 p-4">
                        <h4 className="text-sm font-semibold">💡 Insights para ti</h4>
                        <div className="mt-3 space-y-2">
                          {activeResult.insights.map((tipItem) => (
                            <div key={tipItem} className="rounded-lg border border-glass-border bg-glass px-3 py-2 text-sm">
                              {tipItem}
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className="glass-card rounded-[20px] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Ajustar Porção</h4>
                          <span className="rounded-full border border-brand-accent-1/40 bg-brand-accent-1/15 px-2.5 py-1 text-xs font-medium">
                            {portionMultiplier}x — Porção normal
                          </span>
                        </div>

                        <Slider
                          min={0.5}
                          max={2}
                          step={0.5}
                          value={[portionMultiplier]}
                          onValueChange={([value]) => setPortionMultiplier(value)}
                        />

                        <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                          <span>0.5x</span>
                          <span>1x</span>
                          <span>1.5x</span>
                          <span>2x</span>
                        </div>
                      </article>

                      <div className="frosted-nav fixed bottom-20 left-1/2 z-30 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-[18px] p-3 sm:max-w-md">
                        <div className="space-y-2">
                          <Button className="h-11 w-full" onClick={confirmAddToDiary} disabled={isSavingMeal}>
                            <Check className="h-4 w-4" />
                            {isSavingMeal ? "A guardar..." : "Adicionar ao Diário"}
                          </Button>
                          <Button variant="outline" className="h-10 w-full" onClick={resetMealFlow}>
                            Analisar Outro Prato
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {view === "progresso" && (
            <>
              <div className="glass-card rounded-xl p-4">
                <h2 className="text-lg font-semibold">Evolução do peso</h2>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightHistory}>
                      <CartesianGrid stroke="var(--color-glass-border)" strokeDasharray="3 3" />
                      <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="var(--color-brand-accent-2)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-sm text-brand-accent-2">Perdeste 2kg! 🎉</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <article className="glass-card rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Dias seguidos</p>
                  <p className="text-xl font-bold">7 🔥</p>
                </article>
                <article className="glass-card rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Semana</p>
                  <p className="text-xl font-bold">{consumedCalories * 3} kcal</p>
                </article>
                <article className="glass-card rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Média diária</p>
                  <p className="text-xl font-bold">{Math.round(consumedCalories || 1340)} kcal</p>
                </article>
              </div>

              <div className="glass-card mt-4 rounded-xl p-4">
                <h3 className="text-sm font-semibold">Resumo semanal</h3>
                <div className="mt-3 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyBars}>
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                      <Tooltip />
                      <Bar dataKey="calories" fill="var(--color-brand-accent-1)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  "Primeira semana completa 🌟",
                  "Perdeu 1kg ✨",
                  "7 dias consecutivos 🔥",
                  "Bebeu água hoje 💧",
                ].map((badge) => (
                  <article
                    key={badge}
                    className="animate-pulse rounded-xl border border-brand-accent-1/40 bg-brand-accent-1/15 p-3 text-sm font-medium"
                  >
                    {badge}
                  </article>
                ))}
              </div>
            </>
          )}

          {view === "plano" && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Plano semanal (1400 kcal)</h2>
              <div className="space-y-3">
                {weeklyPlan.map((item) => (
                  <details key={item.day} className="glass-card rounded-xl p-4">
                    <summary className="cursor-pointer font-medium">{item.day}</summary>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {item.meals.map((meal) => (
                        <li key={meal}>{meal}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                {tips.map((tip) => (
                  <article key={tip} className="glass-card rounded-xl p-3 text-sm">
                    {tip}
                  </article>
                ))}
              </div>
            </>
          )}

          {view === "perfil" && (
            <>
              <div className="glass-card rounded-xl p-5 text-center">
                <div className="mx-auto h-20 w-20 rounded-full border-2 border-brand-accent-2 bg-glass" />
                <h2 className="mt-3 text-xl font-semibold">{profile.name || "Utilizadora"}</h2>
                <p className="text-sm text-muted-foreground">
                  {profile.weight}kg → {profile.targetWeight}kg • {profile.city}
                </p>
              </div>

              <div className="glass-card mt-4 rounded-xl p-4">
                <h3 className="text-sm font-semibold">Definições</h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificações</span>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Unidades (kg/cm)</span>
                    <Switch checked={metric} onCheckedChange={setMetric} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <Button variant="secondary">Exportar Progresso</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    setEntries([]);
                    setRecentAnalyses(initialRecentAnalyses);
                    setView("splash");
                  }}
                >
                  Logout
                </Button>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">LUMEfit v1.0 • Feito para ti</p>
            </>
          )}
        </section>
      )}

      {view !== "splash" && view !== "setup" && (
        <nav className="frosted-nav fixed bottom-3 left-1/2 z-20 flex w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-between rounded-xl px-2 py-2 sm:max-w-md">
          {[
            { key: "home", label: "Home", icon: Home },
            { key: "refeicoes", label: "Refeições", icon: UtensilsCrossed },
            { key: "progresso", label: "Progresso", icon: Flame },
            { key: "plano", label: "Plano", icon: Bell },
            { key: "perfil", label: "Perfil", icon: CircleUserRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => setView(item.key as ViewKey)}
                className={`flex min-w-[64px] flex-col items-center rounded-lg px-2 py-1 text-[11px] transition-all ${
                  active ? "bg-brand-accent-3/30 text-brand-accent-2" : "text-muted-foreground"
                }`}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {mealStage === "analyzing" && previewImage ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/55 p-4 backdrop-blur-xl">
          <div className="glass-card w-full max-w-sm rounded-[24px] p-5 text-center">
            <div className="relative mx-auto h-56 overflow-hidden rounded-2xl border border-brand-accent-1/35">
              <img src={previewImage} alt="Análise em progresso" className="h-full w-full object-cover" />
              <div className="scan-line" />
              <div className="radar-ring" />
              <div className="focus-corners" />
            </div>

            <p key={analysisMessageIndex} className="mt-4 text-sm text-primary animate-fade-in">
              {ANALYSIS_MESSAGES[analysisMessageIndex]}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-accent-3/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-accent-1 to-brand-accent-2 transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {showToast ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl border border-brand-accent-1/35 bg-glass px-4 py-3 text-sm font-medium shadow-[0_8px_24px_oklch(0.64_0.12_152_/_22%)] sm:max-w-sm">
          {toastMessage}
        </div>
      ) : null}

      {showConfetti ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiOffsets.map((left, index) => (
            <span
              key={left}
              className="confetti-particle"
              style={{
                left,
                animationDelay: `${index * 0.06}s`,
              }}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}
