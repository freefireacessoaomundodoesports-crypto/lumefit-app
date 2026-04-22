import { useEffect, useMemo, useState } from "react";
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
import { Bell, CircleUserRound, Flame, Home, Search, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  activityLevels,
  cities,
  foodDatabase,
  mealLabels,
  quotes,
  tips,
  weeklyGoals,
  weeklyPlan,
  type MealType,
} from "@/lib/lumefit-data";

export const Route = createFileRoute("/")({
  component: LumeFitApp,
});

type ViewKey = "splash" | "setup" | "home" | "refeicoes" | "progresso" | "plano" | "perfil";

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
};

const STORAGE_KEY = "lumefit_state_v1";

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

function LumeFitApp() {
  const [view, setView] = useState<ViewKey>("splash");
  const [setupStep, setSetupStep] = useState(1);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("pequeno-almoco");
  const [search, setSearch] = useState("");
  const [pickedFoodId, setPickedFoodId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recentFoods, setRecentFoods] = useState<string[]>([]);
  const [expandedMeals, setExpandedMeals] = useState<MealType[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [metric, setMetric] = useState(true);

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

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        profile: Profile;
        entries: MealEntry[];
        recentFoods: string[];
        notifications: boolean;
        metric: boolean;
      };
      setProfile(parsed.profile);
      setEntries(parsed.entries);
      setRecentFoods(parsed.recentFoods);
      setNotifications(parsed.notifications);
      setMetric(parsed.metric);
      setView("home");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile, entries, recentFoods, notifications, metric }),
    );
  }, [profile, entries, recentFoods, notifications, metric]);

  const todayQuote = quotes[new Date().getDate() % quotes.length];

  const filteredFoods = useMemo(
    () =>
      foodDatabase.filter((food) =>
        `${food.name} ${food.category}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

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

  const weeklyBars = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, index) => {
    const base = profile.calorieGoal - 160 + index * 40;
    return { day: d, calories: base };
  });

  const selectedFood = pickedFoodId ? foodDatabase.find((food) => food.id === pickedFoodId) : null;
  const previewCalories = selectedFood ? Math.round(selectedFood.calories * quantity) : 0;

  const addFoodToMeal = () => {
    if (!selectedFood) return;
    const newEntry: MealEntry = {
      id: crypto.randomUUID(),
      meal: selectedMeal,
      foodName: selectedFood.name,
      calories: previewCalories,
      quantity,
      timestamp: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setRecentFoods((prev) => Array.from(new Set([selectedFood.id, ...prev])).slice(0, 6));
    setPickedFoodId(null);
    setQuantity(1);
  };

  const saveSetup = () => {
    setProfile((prev) => ({
      ...prev,
      calorieGoal: calcGoal(prev.weight, prev.height, prev.age, prev.activityLevel, prev.weeklyGoal),
    }));
    setView("home");
  };

  const shellClass =
    "mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-5 text-foreground animate-fade-in sm:max-w-2xl";

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
                    )} kcal
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
                <Button onClick={saveSetup} className="flex-1 bg-brand-accent-1 hover:bg-brand-accent-2">
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
                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-glass-border)" strokeWidth="8" />
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
                      const total = mealsByType[meal].reduce((sum, item) => sum + item.calories, 0);
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
                                prev.includes(meal) ? prev.filter((item) => item !== meal) : [...prev, meal],
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
                            }}
                          >
                            + Adicionar
                          </Button>
                          {isOpen && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {mealsByType[meal].slice(0, 3).map((entry) => (
                                <li key={entry.id}>{entry.foodName}</li>
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
                  <div className="glass-card mt-4 rounded-xl p-4">
                    <p className="mb-2 text-sm">Adicionar em: {mealLabels[selectedMeal]}</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquisar alimento... ex: Xima, Matapa"
                        className="pl-9"
                      />
                    </div>
                    <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
                      {filteredFoods.map((food) => (
                        <button
                          type="button"
                          key={food.id}
                          onClick={() => setPickedFoodId(food.id)}
                          className="glass-card w-full rounded-lg p-3 text-left"
                        >
                          <p className="text-sm font-medium">{food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {food.portion} • {food.calories} kcal
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {recentFoods.length > 0 && (
                    <div className="glass-card mt-4 rounded-xl p-4">
                      <h3 className="text-sm font-semibold">Recentes</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recentFoods.map((id) => {
                          const food = foodDatabase.find((item) => item.id === id);
                          if (!food) return null;
                          return (
                            <button
                              type="button"
                              key={id}
                              onClick={() => setPickedFoodId(id)}
                              className="rounded-full border border-glass-border bg-glass px-3 py-1 text-xs"
                            >
                              {food.name}
                            </button>
                          );
                        })}
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
                    setRecentFoods([]);
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

      {selectedFood && (
        <div className="fixed inset-0 z-30 flex items-end bg-background/40 p-4 sm:items-center sm:justify-center">
          <div className="glass-card w-full rounded-xl p-4 sm:max-w-sm">
            <h3 className="text-lg font-semibold">{selectedFood.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedFood.portion} • {selectedFood.calories} kcal
            </p>
            <div className="mt-3 flex gap-2">
              {[0.5, 1, 1.5, 2].map((factor) => (
                <Button
                  key={factor}
                  variant={quantity === factor ? "default" : "outline"}
                  onClick={() => setQuantity(factor)}
                  className="flex-1"
                >
                  {factor}x
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm">Total previsto: {previewCalories} kcal</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setPickedFoodId(null)} className="flex-1">
                Fechar
              </Button>
              <Button onClick={addFoodToMeal} className="flex-1 bg-brand-accent-1 hover:bg-brand-accent-2">
                Adicionar à refeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
