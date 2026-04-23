import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Download,
  Droplets,
  Flame,
  Home,
  ImagePlus,
  Menu,
  MessageCircle,
  Music2,
  Send,
  Share2,
  Sofa,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Footprints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  activityLevels,
  cities,
  mealLabels,
  mockMealResults,
  quotes,
  tips,
  weeklyGoals,
  type MealType,
  type MockMealResult,
} from "@/lib/lumefit-data";
import shareLogo from "@/assets/share-logo.png";
import shareFitnessStyle from "@/assets/share-fitness-style.jfif";

export const Route = createFileRoute("/")({
  component: LumeFitApp,
});

type ViewKey = "splash" | "setup" | "home" | "refeicoes" | "progresso" | "treinos" | "perfil";
type MealFlowStage = "camera" | "preview" | "analyzing" | "result";
type SetupActivityLevel = "sedentario" | "moderado" | "intenso";
type AppLanguage = "pt" | "en";
type AppTheme = "light" | "dark";

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
  hydrationGoalMl: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
};

type PersistedState = {
  profile?: Profile;
  entries?: MealEntry[];
  recentAnalyses?: RecentMealAnalysis[];
  waterIntakeMl?: number;
  onboardingDone?: boolean;
  completedTrainingPhases?: Record<"primeiro-mes" | "segundo-mes" | "terceiro-mes", boolean>;
  firstUseAt?: string;
  previousWeight?: number;
  lastSeenAt?: string;
  appLanguage?: AppLanguage;
  appTheme?: AppTheme;
};

type WeightLogEntry = {
  date: string;
  weight: number;
};

type UnifiedAppState = {
  onboarding_complete: boolean;
  last_active_date: string;
  profile: {
    name: string;
    age: number;
    city: string;
    weight: number;
    height: number;
    target_weight: number;
    goal: string;
    activity_level: string;
    daily_calorie_goal: number;
    date_joined: string;
  };
  today: {
    calories_consumed: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    meals: MealEntry[];
  };
  recent_analyses: RecentMealAnalysis[];
  weight_log: WeightLogEntry[];
  achievements: string[];
  completed_training_phases?: Record<"primeiro-mes" | "segundo-mes" | "terceiro-mes", boolean>;
  previous_weight?: number;
  last_seen_at?: string;
  app_language?: AppLanguage;
  app_theme?: AppTheme;
};

type GeneratedPlan = {
  calorieGoal: number;
  hydrationGoalMl: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  summary: string;
};

type MealEntry = {
  id: string;
  meal: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  timestamp: string;
  photo?: string;
};

type RecentMealAnalysis = {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: MockMealResult["ingredients"];
  insights: MockMealResult["insights"];
  nutrition_details: {
    sodiumMg: number;
    fiberG: number;
    sugarsG: number;
    vitaminAPct: number;
    vitaminCPct: number;
    ironPct: number;
    calciumPct: number;
    confidence: number;
    cuisineTag: string;
    dailyGoalPercent: number;
  };
  timestamp: string;
  image: string | null;
};

const STORAGE_KEY = "lumefit_v1";
const LEGACY_STORAGE_KEY = "lumefit_state_v1";
const LEGACY_ONBOARDING_COMPLETE_KEY = "onboarding_complete";
const LEGACY_ONBOARDING_PROFILE_KEY = "onboarding_profile";
const LEGACY_LAST_ACTIVE_DATE_KEY = "last_active_date";
const LEGACY_RECENT_MEAL_ANALYSES_KEY = "recent_meal_analyses";
const LEGACY_PROFILE_KEY = "perfil_de_integracao";
const MAX_RECENT_MEALS = 5;
const MAX_RECENT_IMAGE_LENGTH = 150000;

const trainingPhases = [
  {
    key: "primeiro-mes",
    title: "PRIMEIRO MÊS",
    instruction: "Repita uma vez o vídeo e treine de segunda, quarta, sexta, sábado",
  },
  {
    key: "segundo-mes",
    title: "SEGUNDO MÊS",
    instruction: "Repita 3 vezes o vídeo e treine de segunda, quarta, sexta, sábado",
  },
  {
    key: "terceiro-mes",
    title: "TERCEIRO MÊS",
    instruction: "Repita 4 vezes o vídeo e treine de segunda, quarta, sexta, sábado",
  },
] as const;

const ANALYSIS_MESSAGES: Record<AppLanguage, string[]> = {
  pt: [
    "🔍 A identificar os alimentos...",
    "🌿 A reconhecer ingredientes locais...",
    "⚖️ A estimar as porções...",
    "🔥 A calcular as calorias...",
    "💪 A analisar macronutrientes...",
    "✨ A preparar o relatório...",
  ],
  en: [
    "🔍 Identifying foods...",
    "🌿 Recognizing ingredients...",
    "⚖️ Estimating portions...",
    "🔥 Calculating calories...",
    "💪 Analyzing macros...",
    "✨ Preparing your report...",
  ],
};

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

const localizedMealLabels: Record<AppLanguage, Record<MealType, string>> = {
  pt: mealLabels,
  en: {
    "pequeno-almoco": "🌅 Breakfast",
    almoco: "☀️ Lunch",
    jantar: "🌙 Dinner",
    lanches: "🍎 Snacks",
  },
};

const localizedWeekdays: Record<AppLanguage, string[]> = {
  pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const localizedQuotes: Record<AppLanguage, string[]> = {
  pt: quotes,
  en: [
    "Every meal is a new chance to take care of yourself.",
    "Small steps today, big results tomorrow.",
    "You can do this — consistency is your superpower.",
    "Lighter, stronger, more confident.",
  ],
};

const localizedTips: Record<AppLanguage, string[]> = {
  pt: tips,
  en: [
    "Cook with less oil — use 1 spoon instead of 3.",
    "Drink 8 glasses of water daily 💧",
    "Eat slowly — your brain needs 20 min to feel full.",
    "Matapa is nutritious — watch peanut portion size.",
  ],
};

const uiText = {
  pt: {
    appName: "LUMEfit",
    menuShare: "Compartilhar",
    menuSettings: "Configurações",
    menuOpenAria: "Abrir menu",
    settingsTitle: "Configurações",
    settingsTheme: "Tema",
    settingsThemeLight: "Modo claro",
    settingsThemeDark: "Modo escuro",
    settingsLanguage: "Idioma",
    languagePortuguese: "Português",
    languageEnglish: "Inglês",
    close: "Fechar",
    greeting: "Bom dia",
    champion: "Campeã",
    shareGenerated: "Gerar imagem para partilha",
    shareGenerating: "A gerar imagem...",
    shareProgress: "Compartilhar progresso",
    shareHint:
      "A imagem vai incluir teu nome, metas, consumo de hoje, macros, hidratação e identidade visual LUMEfit.",
    toastImageGenerated: "Imagem gerada com sucesso ✨",
    toastImageFailed: "Não foi possível gerar a imagem agora.",
    notificationTitle: "Lembrete LUMEfit",
    notificationBody: "Guerreira, não se esqueça que tens um sonho para alcançar ✨",
    understood: "Entendi",
    navHome: "Home",
    navMeals: "Refeições",
    navProgress: "Progresso",
    navWorkouts: "Treinos",
    navProfile: "Perfil",
    onboardingCityLabel: "Cidade",
    onboardingCityPlaceholder: "Escreve a tua cidade",
    onboardingNameLabel: "Nome",
    onboardingNamePlaceholder: "Escreve o teu nome",
    onboardingCurrentWeightLabel: "Peso atual (kg)",
    onboardingTargetWeightLabel: "Peso desejado (kg)",
    onboardingHeightLabel: "Altura (cm)",
  },
  en: {
    appName: "LUMEfit",
    menuShare: "Share",
    menuSettings: "Settings",
    menuOpenAria: "Open menu",
    settingsTitle: "Settings",
    settingsTheme: "Theme",
    settingsThemeLight: "Light mode",
    settingsThemeDark: "Dark mode",
    settingsLanguage: "Language",
    languagePortuguese: "Portuguese",
    languageEnglish: "English",
    close: "Close",
    greeting: "Good morning",
    champion: "Champion",
    shareGenerated: "Generate image to share",
    shareGenerating: "Generating image...",
    shareProgress: "Share progress",
    shareHint:
      "The image includes your name, goals, today intake, macros, hydration, and LUMEfit identity.",
    toastImageGenerated: "Image generated successfully ✨",
    toastImageFailed: "Could not generate the image right now.",
    notificationTitle: "LUMEfit reminder",
    notificationBody: "Warrior, don't forget you have a dream to achieve ✨",
    understood: "Got it",
    navHome: "Home",
    navMeals: "Meals",
    navProgress: "Progress",
    navWorkouts: "Workouts",
    navProfile: "Profile",
    onboardingCityLabel: "City",
    onboardingCityPlaceholder: "Enter your city",
    onboardingNameLabel: "Name",
    onboardingNamePlaceholder: "Enter your name",
    onboardingCurrentWeightLabel: "Current weight (kg)",
    onboardingTargetWeightLabel: "Target weight (kg)",
    onboardingHeightLabel: "Height (cm)",
  },
} as const;

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

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getEntriesStorageKey(dateKey: string) {
  return `entries_${dateKey}`;
}

function isEntriesStorageKey(key: string) {
  return /^entries_\d{4}-\d{2}-\d{2}$/.test(key);
}

function toProfileFromUnified(state: UnifiedAppState["profile"]): Profile {
  const calorieGoal = Math.max(1200, state.daily_calorie_goal || 1400);
  const activityLevel = state.activity_level || activityLevels[1];
  const weight = Number(state.weight) || 78;
  return {
    name: state.name || "",
    age: Number(state.age) || 30,
    city: state.city || "",
    weight,
    height: Number(state.height) || 163,
    targetWeight: Number(state.target_weight) || 68,
    weeklyGoal: state.goal || weeklyGoals[1],
    activityLevel,
    calorieGoal,
    hydrationGoalMl: calcHydrationGoal(weight, activityLevel),
    macroGoals: calcMacroGoals(calorieGoal),
  };
}

function toUnifiedProfile(profile: Profile, dateJoined: string): UnifiedAppState["profile"] {
  return {
    name: profile.name,
    age: profile.age,
    city: profile.city,
    weight: profile.weight,
    height: profile.height,
    target_weight: profile.targetWeight,
    goal: profile.weeklyGoal,
    activity_level: profile.activityLevel,
    daily_calorie_goal: profile.calorieGoal,
    date_joined: dateJoined,
  };
}

function summarizeToday(meals: MealEntry[], water: number) {
  return {
    calories_consumed: meals.reduce((sum, item) => sum + item.calories, 0),
    protein: meals.reduce((sum, item) => sum + (item.protein || 0), 0),
    carbs: meals.reduce((sum, item) => sum + (item.carbs || 0), 0),
    fat: meals.reduce((sum, item) => sum + (item.fat || 0), 0),
    water,
    meals,
  };
}

async function compressImageForStorage(imageSource: string) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const instance = new Image();
    instance.onload = () => resolve(instance);
    instance.onerror = () => reject(new Error("image_load_failed"));
    instance.src = imageSource;
  });

  const canvas = document.createElement("canvas");
  const maxSize = 400;
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.max(1, Math.round(img.width * ratio));
  canvas.height = Math.max(1, Math.round(img.height * ratio));

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.5);
}

const initialRecentAnalyses: RecentMealAnalysis[] = [];

const PressableButton = memo(function PressableButton(
  props: ComponentPropsWithoutRef<"button">,
) {
  return <button {...props} className={`perf-pressable ${props.className || ""}`.trim()} />;
});

type RecentAnalysisItemProps = {
  item: RecentMealAnalysis;
  onOpen: (item: RecentMealAnalysis) => void;
};

const RecentAnalysisItem = memo(function RecentAnalysisItem({ item, onOpen }: RecentAnalysisItemProps) {
  const handleOpen = useCallback(() => {
    onOpen(item);
  }, [item, onOpen]);

  return (
    <PressableButton type="button" onClick={handleOpen} className="w-[82px] shrink-0 text-left recent-meal-item">
      {item.image ? (
        <img
          src={item.image}
          alt={item.meal_name}
          className="h-[72px] w-[72px] rounded-full border border-brand-accent-1/30 object-cover shadow-[0_6px_20px_oklch(0.64_0.12_152_/_20%)]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-brand-accent-1/30 bg-brand-accent-1/20 text-3xl shadow-[0_6px_20px_oklch(0.64_0.12_152_/_20%)]">
          🍽️
        </div>
      )}
      <p className="mt-1 truncate text-[11px] font-medium">{item.meal_name}</p>
    </PressableButton>
  );
});

function calcGoal(weight: number, height: number, age: number, activity: string, weeklyGoal: string) {
  const bmr = 10 * weight + 6.25 * height - 5 * age - 120;
  const activityFactor =
    activity === "Fico muito em casa" ? 1.2 : activity === "Caminho um pouco" ? 1.35 : 1.5;
  const deficit = weeklyGoal.includes("1.5") ? 500 : weeklyGoal.includes("1kg") ? 350 : 220;
  return Math.max(1200, Math.round(bmr * activityFactor - deficit));
}

function calcHydrationGoal(weight: number, activity: string) {
  const base = weight * 33;
  const extra = activity === "Sou moderadamente ativa" ? 350 : activity === "Caminho um pouco" ? 200 : 100;
  return Math.max(1600, Math.round((base + extra) / 50) * 50);
}

function calcMacroGoals(calorieGoal: number) {
  return {
    protein: Math.round((calorieGoal * 0.3) / 4),
    carbs: Math.round((calorieGoal * 0.45) / 4),
    fat: Math.round((calorieGoal * 0.25) / 9),
  };
}

function generatePlan(profile: Profile): GeneratedPlan {
  const calorieGoal = Math.max(
    1200,
    profile.calorieGoal || calcGoal(profile.weight, profile.height, profile.age, profile.activityLevel, profile.weeklyGoal),
  );
  const hydrationGoalMl = calcHydrationGoal(profile.weight, profile.activityLevel);
  const macroGoals = calcMacroGoals(calorieGoal);

  return {
    calorieGoal,
    hydrationGoalMl,
    macroGoals,
    summary: `Plano diário estimado para ${profile.name || "ti"}: foco em défice calórico moderado, hidratação consistente e distribuição equilibrada de macros.`,
  };
}

function getTodayLabel(locale: string) {
  return new Date().toLocaleDateString(locale, {
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
  type TrainingPhaseKey = (typeof trainingPhases)[number]["key"];
  const [view, setView] = useState<ViewKey>("setup");
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [showPlanPresentation, setShowPlanPresentation] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [setupActivity, setSetupActivity] = useState<SetupActivityLevel>("moderado");
  const [selectedMeal, setSelectedMeal] = useState<MealType>("almoco");
  const [expandedMeals, setExpandedMeals] = useState<MealType[]>([]);
  const [waterIntakeMl, setWaterIntakeMl] = useState(0);
  const [firstUseAt, setFirstUseAt] = useState(() => new Date().toISOString());
  const [previousWeight, setPreviousWeight] = useState(78);

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
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareMode, setShareMode] = useState<"general" | "weight">("general");
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("pt");
  const [appTheme, setAppTheme] = useState<AppTheme>("light");
  const [showMotivationNotification, setShowMotivationNotification] = useState(false);
  const [completedTrainingPhases, setCompletedTrainingPhases] = useState<
    Record<TrainingPhaseKey, boolean>
  >({
    "primeiro-mes": false,
    "segundo-mes": false,
    "terceiro-mes": false,
  });

  const [animatedKcal, setAnimatedKcal] = useState(0);
  const [animatedProtein, setAnimatedProtein] = useState(0);
  const [animatedCarbs, setAnimatedCarbs] = useState(0);
  const [animatedFat, setAnimatedFat] = useState(0);

  const [profile, setProfile] = useState<Profile>({
    name: "",
    age: 30,
    city: "",
    weight: 78,
    height: 163,
    targetWeight: 68,
    weeklyGoal: weeklyGoals[1],
    activityLevel: activityLevels[1],
    calorieGoal: 1400,
    hydrationGoalMl: 2500,
    macroGoals: {
      protein: 105,
      carbs: 158,
      fat: 39,
    },
  });

  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [entriesByDay, setEntriesByDay] = useState<Record<string, MealEntry[]>>({});
  const [weightLog, setWeightLog] = useState<WeightLogEntry[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const storageSnapshotRef = useRef<UnifiedAppState | null>(null);
  const shareFetchAbortRef = useRef<AbortController | null>(null);
  const saveMealAbortRef = useRef<AbortController | null>(null);
  const [isViewingSavedAnalysis, setIsViewingSavedAnalysis] = useState(false);

  const showComingSoonToast = useCallback(() => {
    setToastMessage("Em breve disponível! ✨");
    setShowToast(true);
    setManagedTimeout(() => setShowToast(false), 1800);
  }, [setManagedTimeout]);

  const writeState = useCallback((next: UnifiedAppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // silent fail by requirement
    }
  }, []);

  const readStorageState = useCallback((): UnifiedAppState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UnifiedAppState) : null;
    } catch {
      return null;
    }
  }, []);

  const updateStorageSnapshot = useCallback((next: UnifiedAppState) => {
    storageSnapshotRef.current = next;
  }, []);

  const readEntriesForDate = useCallback((dateKey: string): MealEntry[] => {
    try {
      const raw = localStorage.getItem(getEntriesStorageKey(dateKey));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MealEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const writeEntriesForDate = useCallback((dateKey: string, dayEntries: MealEntry[]) => {
    try {
      localStorage.setItem(getEntriesStorageKey(dateKey), JSON.stringify(dayEntries));
    } catch {
      // silent fail by requirement
    }
  }, []);

  const readAllEntriesByDay = useCallback((): Record<string, MealEntry[]> => {
    try {
      const output: Record<string, MealEntry[]> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !isEntriesStorageKey(key)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as MealEntry[];
        output[key.replace("entries_", "")] = Array.isArray(parsed) ? parsed : [];
      }
      return output;
    } catch {
      return {};
    }
  }, []);

  const setManagedTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const buildRecentAnalysis = (result: MockMealResult, kcal: number, image: string | null): RecentMealAnalysis => ({
    id: Date.now().toString(),
    meal_name: result.mealName,
    calories: kcal,
    protein: Math.round(result.protein * portionMultiplier),
    carbs: Math.round(result.carbs * portionMultiplier),
    fat: Math.round(result.fat * portionMultiplier),
    ingredients: result.ingredients,
    insights: result.insights,
    nutrition_details: {
      sodiumMg: Math.round(result.sodiumMg * portionMultiplier),
      fiberG: Number((result.fiberG * portionMultiplier).toFixed(1)),
      sugarsG: Number((result.sugarsG * portionMultiplier).toFixed(1)),
      vitaminAPct: Math.round(result.vitaminAPct * portionMultiplier),
      vitaminCPct: Math.round(result.vitaminCPct * portionMultiplier),
      ironPct: Math.round(result.ironPct * portionMultiplier),
      calciumPct: Math.round(result.calciumPct * portionMultiplier),
      confidence: result.confidence,
      cuisineTag: result.cuisineTag,
      dailyGoalPercent: Math.round(result.dailyGoalPercent * portionMultiplier),
    },
    timestamp: new Date().toISOString(),
    image,
  });

  const resetDailyStates = useCallback(() => {
    setEntries([]);
    setWaterIntakeMl(0);
    setExpandedMeals([]);
    setSelectedMeal("almoco");
    setMealStage("camera");
    setPreviewImage(null);
    setActiveResult(null);
    setPortionMultiplier(1);
    setNutritionOpen(false);
    setExpandedIngredient(null);
    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);
    setAnimatedKcal(0);
    setAnimatedProtein(0);
    setAnimatedCarbs(0);
    setAnimatedFat(0);
    setShowConfetti(false);
    setShowToast(false);
    setToastMessage("");
    setIsViewingSavedAnalysis(false);
  }, []);

  useEffect(() => {
    const todayKey = getDateKey();
    try {
      let unifiedState = readStorageState();

      if (!unifiedState) {
        const legacy = (() => {
          try {
            const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
            return raw ? (JSON.parse(raw) as PersistedState) : {};
          } catch {
            return {} as PersistedState;
          }
        })();

        const legacyProfile = (() => {
          if (legacy.profile) return legacy.profile;
          try {
            const profileRaw = localStorage.getItem(LEGACY_ONBOARDING_PROFILE_KEY) || localStorage.getItem(LEGACY_PROFILE_KEY);
            if (!profileRaw) return null;
            const parsed = JSON.parse(profileRaw) as Partial<Profile> & {
              target_weight?: number;
              goal?: string;
              activity_level?: string;
              daily_calorie_goal?: number;
              date_joined?: string;
            };
            const base: Profile = {
              name: parsed.name || "",
              age: Number(parsed.age) || 30,
              city: parsed.city || "",
              weight: Number(parsed.weight) || 78,
              height: Number(parsed.height) || 163,
              targetWeight: Number(parsed.targetWeight ?? parsed.target_weight) || 68,
              weeklyGoal: (parsed.weeklyGoal ?? parsed.goal) || weeklyGoals[1],
              activityLevel: (parsed.activityLevel ?? parsed.activity_level) || activityLevels[1],
              calorieGoal: Number(parsed.calorieGoal ?? parsed.daily_calorie_goal) || 1400,
              hydrationGoalMl: calcHydrationGoal(Number(parsed.weight) || 78, (parsed.activityLevel ?? parsed.activity_level) || activityLevels[1]),
              macroGoals: calcMacroGoals(Number(parsed.calorieGoal ?? parsed.daily_calorie_goal) || 1400),
            };
            return base;
          } catch {
            return null;
          }
        })();

        const fallbackProfile = legacyProfile || profile;
        const dateJoined = legacy.firstUseAt || new Date().toISOString();
        const allLegacyEntries = Array.isArray(legacy.entries) ? legacy.entries : [];
        const entriesGrouped = allLegacyEntries.reduce<Record<string, MealEntry[]>>((acc, entry) => {
          const day = entry.timestamp.slice(0, 10) || todayKey;
          acc[day] = [...(acc[day] || []), entry];
          return acc;
        }, {});
        Object.entries(entriesGrouped).forEach(([day, dayEntries]) => writeEntriesForDate(day, dayEntries));

        unifiedState = {
          onboarding_complete:
            Boolean(legacy.onboardingDone) ||
            (() => {
              try {
                return localStorage.getItem(LEGACY_ONBOARDING_COMPLETE_KEY) === "true";
              } catch {
                return false;
              }
            })(),
          last_active_date:
            (() => {
              try {
                return localStorage.getItem(LEGACY_LAST_ACTIVE_DATE_KEY) || todayKey;
              } catch {
                return todayKey;
              }
            })(),
          profile: toUnifiedProfile(fallbackProfile, dateJoined),
          today: summarizeToday(entriesGrouped[todayKey] || [], typeof legacy.waterIntakeMl === "number" ? legacy.waterIntakeMl : 0),
          recent_analyses: Array.isArray(legacy.recentAnalyses)
            ? legacy.recentAnalyses.slice(0, MAX_RECENT_MEALS)
            : (() => {
                try {
                  const raw = localStorage.getItem(LEGACY_RECENT_MEAL_ANALYSES_KEY);
                  if (!raw) return [];
                  const parsed = JSON.parse(raw) as RecentMealAnalysis[];
                  return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_MEALS) : [];
                } catch {
                  return [];
                }
              })(),
          weight_log: [],
          achievements: [],
          completed_training_phases: legacy.completedTrainingPhases,
          previous_weight: legacy.previousWeight,
          last_seen_at: legacy.lastSeenAt,
          app_language: legacy.appLanguage,
          app_theme: legacy.appTheme,
        };

        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          localStorage.removeItem(LEGACY_ONBOARDING_COMPLETE_KEY);
          localStorage.removeItem(LEGACY_ONBOARDING_PROFILE_KEY);
          localStorage.removeItem(LEGACY_LAST_ACTIVE_DATE_KEY);
          localStorage.removeItem(LEGACY_RECENT_MEAL_ANALYSES_KEY);
          localStorage.removeItem(LEGACY_PROFILE_KEY);
        } catch {
          // silent fail by requirement
        }
        writeState(unifiedState);
      }

      const isNewDay = unifiedState.last_active_date !== todayKey;
      const todayEntriesFromStorage = isNewDay ? [] : readEntriesForDate(todayKey);
      if (isNewDay) writeEntriesForDate(todayKey, []);

      const normalizedState: UnifiedAppState = {
        ...unifiedState,
        last_active_date: todayKey,
        today: summarizeToday(todayEntriesFromStorage, isNewDay ? 0 : unifiedState.today?.water || 0),
      };

      updateStorageSnapshot(normalizedState);
      setProfile(toProfileFromUnified(normalizedState.profile));
      setEntries(todayEntriesFromStorage);
      setEntriesByDay({ ...readAllEntriesByDay(), [todayKey]: todayEntriesFromStorage });
      setWaterIntakeMl(normalizedState.today.water || 0);
      setOnboardingDone(Boolean(normalizedState.onboarding_complete));
      setFirstUseAt(normalizedState.profile.date_joined || new Date().toISOString());
      if (typeof normalizedState.previous_weight === "number") setPreviousWeight(normalizedState.previous_weight);
      if (normalizedState.completed_training_phases) setCompletedTrainingPhases(normalizedState.completed_training_phases);
      setRecentAnalyses((normalizedState.recent_analyses || []).slice(0, MAX_RECENT_MEALS));
      setWeightLog(Array.isArray(normalizedState.weight_log) ? normalizedState.weight_log : []);
      setAchievements(Array.isArray(normalizedState.achievements) ? normalizedState.achievements : []);
      if (normalizedState.app_language === "pt" || normalizedState.app_language === "en") setAppLanguage(normalizedState.app_language);
      if (normalizedState.app_theme === "light" || normalizedState.app_theme === "dark") setAppTheme(normalizedState.app_theme);

      if (typeof normalizedState.last_seen_at === "string") {
        const elapsed = Date.now() - new Date(normalizedState.last_seen_at).getTime();
        if (elapsed >= 6 * 60 * 60 * 1000) setShowMotivationNotification(true);
      }
      if (isNewDay) resetDailyStates();
      setView(normalizedState.onboarding_complete ? "home" : "setup");
      writeState(normalizedState);
    } catch {
      // silent fail by requirement
    }
  }, [
    profile,
    readAllEntriesByDay,
    readEntriesForDate,
    readStorageState,
    resetDailyStates,
    updateStorageSnapshot,
    writeEntriesForDate,
    writeState,
  ]);

  useEffect(() => {
    const todayKey = getDateKey();
    writeEntriesForDate(todayKey, entries);

    const nextState: UnifiedAppState = {
      onboarding_complete: onboardingDone,
      last_active_date: todayKey,
      profile: toUnifiedProfile(profile, firstUseAt),
      today: summarizeToday(entries, waterIntakeMl),
      recent_analyses: recentAnalyses.slice(0, MAX_RECENT_MEALS),
      weight_log: weightLog,
      achievements,
      completed_training_phases: completedTrainingPhases,
      previous_weight: previousWeight,
      last_seen_at: storageSnapshotRef.current?.last_seen_at,
      app_language: appLanguage,
      app_theme: appTheme,
    };
    updateStorageSnapshot(nextState);
    writeState(nextState);
  }, [
    profile,
    entries,
    recentAnalyses,
    waterIntakeMl,
    onboardingDone,
    completedTrainingPhases,
    firstUseAt,
    previousWeight,
    appLanguage,
    appTheme,
    achievements,
    updateStorageSnapshot,
    weightLog,
    writeEntriesForDate,
    writeState,
  ]);

  useEffect(() => {
    const todayKey = getDateKey();
    setEntriesByDay((prev) => ({
      ...prev,
      [todayKey]: entries,
    }));
  }, [entries]);

  useEffect(() => {
    const saveLastSeenAt = () => {
      const parsed = storageSnapshotRef.current;
      if (!parsed) return;
      writeState({
        ...parsed,
        last_seen_at: new Date().toISOString(),
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveLastSeenAt();
      }
    };

    window.addEventListener("beforeunload", saveLastSeenAt);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", saveLastSeenAt);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutIdsRef.current = [];
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mealStage !== "analyzing") return;

    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);

    const progressTick = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(100, prev + 2.35));
    }, 80);

    const msgTick = setInterval(() => {
      setAnalysisMessageIndex((prev) => (prev + 1) % localizedAnalysisMessages.length);
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

  const t = uiText[appLanguage];
  const localizedAnalysisMessages = ANALYSIS_MESSAGES[appLanguage];
  const localizedMeals = localizedMealLabels[appLanguage];
  const localizedShortWeekdays = localizedWeekdays[appLanguage];
  const localizedQuoteList = localizedQuotes[appLanguage];
  const localeTag = appLanguage === "en" ? "en-US" : "pt-MZ";

  const todayQuote = localizedQuoteList[new Date().getDate() % localizedQuoteList.length];

  const todayKey = getDateKey();
  const todayEntries = useMemo(
    () => entries.filter((item) => item.timestamp.startsWith(todayKey)),
    [entries, todayKey],
  );

  const consumedCalories = useMemo(
    () => todayEntries.reduce((sum, item) => sum + item.calories, 0),
    [todayEntries],
  );
  const remainingCalories = useMemo(
    () => Math.max(profile.calorieGoal - consumedCalories, 0),
    [profile.calorieGoal, consumedCalories],
  );
  const caloriePercent = useMemo(
    () => Math.min((consumedCalories / profile.calorieGoal) * 100, 100),
    [consumedCalories, profile.calorieGoal],
  );
  const ringGlow =
    caloriePercent < 70
      ? "var(--color-brand-success)"
      : caloriePercent < 92
        ? "var(--color-brand-warning)"
        : "var(--color-brand-danger)";

  const macros = useMemo(
    () => ({
      protein: todayEntries.reduce((sum, item) => sum + (item.protein || 0), 0),
      carbs: todayEntries.reduce((sum, item) => sum + (item.carbs || 0), 0),
      fat: todayEntries.reduce((sum, item) => sum + (item.fat || 0), 0),
    }),
    [todayEntries],
  );
  const macroProgress = useMemo(
    () => ({
      protein: Math.min((macros.protein / Math.max(profile.macroGoals.protein, 1)) * 100, 100),
      carbs: Math.min((macros.carbs / Math.max(profile.macroGoals.carbs, 1)) * 100, 100),
      fat: Math.min((macros.fat / Math.max(profile.macroGoals.fat, 1)) * 100, 100),
    }),
    [macros, profile.macroGoals],
  );

  const hydrationPercent = Math.min(100, (waterIntakeMl / Math.max(profile.hydrationGoalMl, 1)) * 100);
  const hydrationGoalLiters = (profile.hydrationGoalMl / 1000).toFixed(1);
  const usageDays = useMemo(() => {
    const start = new Date(firstUseAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [firstUseAt]);

  const onboardingActivityMap: Record<
    SetupActivityLevel,
    { title: string; subtitle: string; profileValue: (typeof activityLevels)[number] }
  > = {
    sedentario: {
      title: "Sedentário",
      subtitle: "Trabalho sentado, pouco movimento.",
      profileValue: "Fico muito em casa",
    },
    moderado: {
      title: "Moderado",
      subtitle: "Caminhadas leves, 2-3x na semana.",
      profileValue: "Caminho um pouco",
    },
    intenso: {
      title: "Intenso / Atleta",
      subtitle: "Treinos pesados diários e rotina ativa.",
      profileValue: "Sou moderadamente ativa",
    },
  };

  const onboardingPreviewProfile: Profile = useMemo(
    () => ({
      ...profile,
      activityLevel: onboardingActivityMap[setupActivity].profileValue,
    }),
    [profile, onboardingActivityMap, setupActivity],
  );
  const onboardingPlanPreview = useMemo(
    () => generatePlan(onboardingPreviewProfile),
    [onboardingPreviewProfile],
  );

  const mealsByType = useMemo(
    () =>
      todayEntries.reduce<Record<MealType, MealEntry[]>>(
        (acc, item) => {
          acc[item.meal].push(item);
          return acc;
        },
        { "pequeno-almoco": [], almoco: [], jantar: [], lanches: [] },
      ),
    [todayEntries],
  );

  const weightHistory = useMemo(
    () =>
      weightLog.map((point) => ({
        week: new Date(point.date).toLocaleDateString(localeTag, { day: "2-digit", month: "2-digit" }),
        weight: point.weight,
      })),
    [localeTag, weightLog],
  );

  const last7Days = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      days.push(getDateKey(date));
    }
    return days;
  }, []);

  const weeklyBars = useMemo(
    () =>
      last7Days.map((dateKey, index) => {
        const dayEntries = entriesByDay[dateKey] || [];
        const calories = dayEntries.reduce((sum, item) => sum + item.calories, 0);
        return { day: localizedShortWeekdays[index], calories };
      }),
    [entriesByDay, last7Days, localizedShortWeekdays],
  );

  const totalLoggedCalories = useMemo(
    () => Object.values(entriesByDay).flat().reduce((sum, item) => sum + item.calories, 0),
    [entriesByDay],
  );

  const weeklyAverage = useMemo(
    () => Math.round(weeklyBars.reduce((sum, day) => sum + day.calories, 0) / Math.max(weeklyBars.length, 1)),
    [weeklyBars],
  );

  const streakDays = useMemo(() => {
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = getDateKey(cursor);
      const hasData = (entriesByDay[key] || []).length > 0;
      if (!hasData) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [entriesByDay]);

  const unlockedAchievements = useMemo(() => {
    const next: string[] = [];
    if (Object.keys(entriesByDay).some((day) => (entriesByDay[day] || []).length > 0)) {
      next.push("Primeiro registo concluído 🌟");
    }
    if (streakDays >= 7) next.push("7 dias consecutivos 🔥");
    if (weeklyBars.some((day) => day.calories > 0)) next.push("Semana ativa 💚");
    if (waterIntakeMl > 0) next.push("Bebeu água hoje 💧");
    return next;
  }, [entriesByDay, streakDays, waterIntakeMl, weeklyBars]);

  const currentTimestamp = new Date().toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", appTheme === "dark");
    document.documentElement.lang = appLanguage === "en" ? "en" : "pt-MZ";
  }, [appLanguage, appTheme]);

  useEffect(() => {
    const isLowEnd =
      (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2) ||
      (typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0) <= 2);
    document.documentElement.classList.toggle("low-end-device", isLowEnd);
    return () => {
      document.documentElement.classList.remove("low-end-device");
    };
  }, []);

  const shellClass =
    "mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-5 text-foreground animate-fade-in sm:max-w-2xl";

  const handleOpenSavedAnalysis = useCallback((item: RecentMealAnalysis) => {
    const matched: MockMealResult = {
      id: `saved-${item.id}`,
      mealName: item.meal_name,
      cuisineTag: item.nutrition_details.cuisineTag,
      confidence: item.nutrition_details.confidence,
      estimatedKcal: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      dailyGoalPercent: item.nutrition_details.dailyGoalPercent,
      sodiumMg: item.nutrition_details.sodiumMg,
      fiberG: item.nutrition_details.fiberG,
      sugarsG: item.nutrition_details.sugarsG,
      vitaminAPct: item.nutrition_details.vitaminAPct,
      vitaminCPct: item.nutrition_details.vitaminCPct,
      ironPct: item.nutrition_details.ironPct,
      calciumPct: item.nutrition_details.calciumPct,
      imageSeed: "saved",
      ingredients: item.ingredients,
      insights: item.insights,
    };
    setPreviewImage(item.image ?? null);
    setActiveResult(matched);
    setMealStage("result");
    setIsViewingSavedAnalysis(true);
    setPortionMultiplier(1);
  }, []);

  const handleImagePick = useCallback((file: File | null) => {
    if (!file) return;
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    const fileUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = fileUrl;
    setPreviewImage(fileUrl);
    setActiveResult(pickMockResult(file.name));
    setIsViewingSavedAnalysis(false);
    setMealStage("preview");
    setNutritionOpen(false);
    setExpandedIngredient(null);
  }, []);

  const confirmAddToDiary = useCallback(() => {
    if (!activeResult) return;
    const kcal = Math.round(activeResult.estimatedKcal * portionMultiplier);
    const protein = Math.round(activeResult.protein * portionMultiplier);
    const carbs = Math.round(activeResult.carbs * portionMultiplier);
    const fat = Math.round(activeResult.fat * portionMultiplier);
    const nextEntry: MealEntry = {
      id: crypto.randomUUID(),
      meal: selectedMeal,
      foodName: activeResult.mealName,
      calories: kcal,
      protein,
      carbs,
      fat,
      quantity: portionMultiplier,
      timestamp: new Date().toISOString(),
      photo: previewImage || undefined,
    };

    setIsSavingMeal(true);
    setEntries((prev) => [nextEntry, ...prev]);
    void (async () => {
      let compressedImage: string | null = null;

      if (previewImage) {
        try {
          const compressed = await compressImageForStorage(previewImage);
          if (compressed && compressed.length < MAX_RECENT_IMAGE_LENGTH) {
            compressedImage = compressed;
          }
        } catch {
          compressedImage = null;
        }
      }

      const baseAnalysis = buildRecentAnalysis(activeResult, kcal, compressedImage);
      let safeList: RecentMealAnalysis[] = [];

      try {
        safeList = [baseAnalysis, ...(Array.isArray(recentAnalyses) ? recentAnalyses : [])].slice(0, MAX_RECENT_MEALS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...(storageSnapshotRef.current || {}), recent_analyses: safeList }));
      } catch (error) {
        const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
        if (isQuota) {
          const withoutImage = buildRecentAnalysis(activeResult, kcal, null);
          try {
            safeList = [withoutImage, ...(Array.isArray(recentAnalyses) ? recentAnalyses : [])].slice(0, MAX_RECENT_MEALS);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...(storageSnapshotRef.current || {}), recent_analyses: safeList }),
            );
          } catch {
            safeList = [withoutImage];
          }
        } else {
          safeList = [buildRecentAnalysis(activeResult, kcal, null)];
        }
      }

      setRecentAnalyses(safeList.slice(0, MAX_RECENT_MEALS));
    })();

    const selectedMealName = localizedMeals[selectedMeal].replace(/^[^ ]+ /, "").toLowerCase();
    setToastMessage(
      appLanguage === "en"
        ? `✅ ${kcal} kcal added to ${selectedMealName}!`
        : `✅ ${kcal} kcal adicionadas ao ${selectedMealName}!`,
    );
    setShowToast(true);
    setShowConfetti(true);

    setManagedTimeout(() => setShowConfetti(false), 1500);
    setManagedTimeout(() => {
      setIsSavingMeal(false);
      setMealStage("camera");
      setIsViewingSavedAnalysis(false);
      setView("home");
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    }, 1600);

    setManagedTimeout(() => setShowToast(false), 2600);
  }, [
    activeResult,
    appLanguage,
    buildRecentAnalysis,
    localizedMeals,
    portionMultiplier,
    previewImage,
    recentAnalyses,
    selectedMeal,
    setManagedTimeout,
  ]);

  const resetMealFlow = useCallback(() => {
    setMealStage("camera");
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewImage(null);
    setActiveResult(null);
    setPortionMultiplier(1);
    setNutritionOpen(false);
    setExpandedIngredient(null);
    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);
  }, []);

  const handleGeneratePlan = useCallback(() => {
    const nextPlan = generatePlan(onboardingPreviewProfile);
    setGeneratedPlan(nextPlan);
    setShowPlanPresentation(true);
  }, [onboardingPreviewProfile]);

  const shareSummary =
    appLanguage === "en"
      ? `My consistency in LUMEfit 💚\n${profile.name || "User"}\nGoal: ${profile.calorieGoal} kcal • ${(profile.hydrationGoalMl / 1000).toFixed(1)}L\nToday: ${consumedCalories} kcal and ${(waterIntakeMl / 1000).toFixed(2)}L`
      : `A minha consistência no LUMEfit 💚\n${profile.name || "Utilizadora"}\nMeta: ${profile.calorieGoal} kcal • ${(profile.hydrationGoalMl / 1000).toFixed(1)}L\nHoje: ${consumedCalories} kcal e ${(waterIntakeMl / 1000).toFixed(2)}L`;
  const weightShareSummary =
    appLanguage === "en"
      ? `My weight evolution in LUMEfit 💚\n${profile.name || "User"}\nPrevious weight: ${previousWeight.toFixed(1)}kg\nCurrent weight: ${profile.weight.toFixed(1)}kg\nTarget weight: ${profile.targetWeight.toFixed(1)}kg`
      : `A minha evolução de peso no LUMEfit 💚\n${profile.name || "Utilizadora"}\nPeso anterior: ${previousWeight.toFixed(1)}kg\nPeso atual: ${profile.weight.toFixed(1)}kg\nPeso desejado: ${profile.targetWeight.toFixed(1)}kg`;
  const activeShareSummary = shareMode === "weight" ? weightShareSummary : shareSummary;

  const handleGenerateShareImage = useCallback(async () => {
    setIsGeneratingShareImage(true);
    try {
      const isWeightMode = shareMode === "weight";
      const imageUserName = profile.name || (appLanguage === "en" ? "Champion" : "Campeã");
      const text =
        appLanguage === "en"
          ? {
              subtitle: "Consistency that transforms",
              hero: `Warrior ${imageUserName}, keep going strong!`,
              progressA: "DAILY",
              progressB: "PROGRESS",
              calories: "Calories",
              weightSubtitle: "Real weight evolution",
              weightHero: `Congrats ${imageUserName}, your progress is real!`,
              weightA: "WEIGHT",
              weightB: "PROGRESS",
              prev: "Previous weight",
              current: "Current weight",
              target: "Target weight",
              weightGoal: "Weight loss goal",
              completed: "completed",
              motivationA: "Every workout and every meal gets you closer to your dream. ✨",
              motivationB: `Keep it up, ${imageUserName} — your effort is paying off! ✨`,
            }
          : {
              subtitle: "Consistência que transforma",
              hero: `Guerreira ${imageUserName}, segue firme no teu foco!`,
              progressA: "PROGRESSO",
              progressB: "DIÁRIO",
              calories: "Calorias",
              weightSubtitle: "Evolução real de peso",
              weightHero: `Parabéns ${imageUserName}, a tua perda de peso é progresso real!`,
              weightA: "PESO",
              weightB: "EM PROGRESSO",
              prev: "Peso anterior",
              current: "Peso atual",
              target: "Peso desejado",
              weightGoal: "Meta de perda de peso",
              completed: "concluído",
              motivationA: "Cada treino e cada refeição aproxima-te do teu sonho. ✨",
              motivationB: `Continua assim, ${imageUserName} — o teu esforço está a dar resultado! ✨`,
            };
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas_context");

      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      const drawProgressBar = (x: number, y: number, width: number, height: number, progress: number, color: string) => {
        drawRoundedRect(x, y, width, height, height / 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
        ctx.fill();

        const fillWidth = Math.max(0, Math.min(width, (progress / 100) * width));
        drawRoundedRect(x, y, fillWidth, height, height / 2);
        ctx.fillStyle = color;
        ctx.fill();
      };

      const drawDumbbell = (centerX: number, centerY: number, angleRad: number) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRad);

        const barGradient = ctx.createLinearGradient(-140, 0, 140, 0);
        barGradient.addColorStop(0, "#c8c8c8");
        barGradient.addColorStop(0.5, "#f3f3f3");
        barGradient.addColorStop(1, "#a9a9a9");
        ctx.fillStyle = barGradient;
        drawRoundedRect(-140, -10, 280, 20, 10);
        ctx.fill();

        [
          { x: -85, r: 30 },
          { x: -52, r: 23 },
          { x: 52, r: 23 },
          { x: 85, r: 30 },
        ].forEach((plate) => {
          const plateGradient = ctx.createRadialGradient(plate.x - 10, -5, 6, plate.x, 0, plate.r);
          plateGradient.addColorStop(0, "#4f4f4f");
          plateGradient.addColorStop(1, "#1f1f1f");
          ctx.fillStyle = plateGradient;
          ctx.beginPath();
          ctx.arc(plate.x, 0, plate.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      };

      if (!isWeightMode) {
        const logoImg = new Image();
        logoImg.src = shareLogo;
        const styleRefImg = new Image();
        styleRefImg.src = shareFitnessStyle;

        await Promise.all([
          new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject(new Error("logo_load_error"));
          }),
          new Promise<void>((resolve, reject) => {
            styleRefImg.onload = () => resolve();
            styleRefImg.onerror = () => reject(new Error("style_ref_load_error"));
          }),
        ]);

        ctx.drawImage(styleRefImg, 0, 0, canvas.width, canvas.height);

        const overlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        overlay.addColorStop(0, "rgba(38, 140, 74, 0.48)");
        overlay.addColorStop(1, "rgba(11, 64, 33, 0.5)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawDumbbell(180, 340, -0.55);
        drawDumbbell(890, 1540, 0.52);

        const cardX = 90;
        const cardY = 250;
        const cardWidth = 900;
        const cardHeight = 1420;
        drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 44);
        ctx.fillStyle = "rgba(249, 247, 240, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 3;
        ctx.stroke();

        const logoX = 180;
        const logoY = 338;
        const logoRadius = 54;
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, logoX - logoRadius, logoY - logoRadius, logoRadius * 2, logoRadius * 2);
        ctx.restore();
        ctx.strokeStyle = "#f2d38d";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#2d7c49";
        ctx.font = "700 54px Poppins, sans-serif";
        ctx.fillText("LUMEfit", 270, 332);
        ctx.fillStyle = "#4f6d57";
        ctx.font = "500 32px Poppins, sans-serif";
        ctx.fillText(text.subtitle, 270, 380);

        ctx.fillStyle = "#163b27";
        ctx.font = "500 36px Poppins, sans-serif";
        ctx.fillText(text.hero, 150, 490);

        ctx.fillStyle = "#1b5537";
        ctx.font = "800 78px Poppins, sans-serif";
        ctx.fillText(text.progressA, 150, 620);
        ctx.font = "800 64px Poppins, sans-serif";
        ctx.fillText(text.progressB, 150, 690);

        const caloriesProgress = Math.min((consumedCalories / Math.max(profile.calorieGoal, 1)) * 100, 100);

        ctx.fillStyle = "#315e46";
        ctx.font = "600 34px Poppins, sans-serif";
        ctx.fillText(text.calories, 150, 780);
        ctx.font = "500 30px Poppins, sans-serif";
        ctx.fillText(`${consumedCalories} / ${profile.calorieGoal} kcal`, 150, 826);
        drawProgressBar(150, 848, 780, 34, caloriesProgress, "#3E9C5E");

        const macroRows = [
          {
            label: "Proteína",
            consumed: Math.round(macros.protein),
            goal: profile.macroGoals.protein,
            progress: macroProgress.protein,
            color: "#F97316",
          },
          {
            label: "Carboidratos",
            consumed: Math.round(macros.carbs),
            goal: profile.macroGoals.carbs,
            progress: macroProgress.carbs,
            color: "#FACC15",
          },
          {
            label: "Gordura",
            consumed: Math.round(macros.fat),
            goal: profile.macroGoals.fat,
            progress: macroProgress.fat,
            color: "#A855F7",
          },
        ];

        macroRows.forEach((macro, index) => {
          const rowY = 980 + index * 170;
          ctx.fillStyle = "#315e46";
          ctx.font = "600 32px Poppins, sans-serif";
          ctx.fillText(macro.label, 150, rowY);
          ctx.font = "500 28px Poppins, sans-serif";
          ctx.fillText(`${macro.consumed}g / ${macro.goal}g`, 150, rowY + 42);
          drawProgressBar(150, rowY + 62, 780, 30, macro.progress, macro.color);
        });

        ctx.fillStyle = "#2f6e4a";
        ctx.font = "500 30px Poppins, sans-serif";
        ctx.fillText(text.motivationA, 150, 1545);

        setShareImageUrl(canvas.toDataURL("image/png"));
        setToastMessage(t.toastImageGenerated);
        setShowToast(true);
        setManagedTimeout(() => setShowToast(false), 1800);
        return;
      }

      const logoImg = new Image();
      logoImg.src = shareLogo;
      const styleRefImg = new Image();
      styleRefImg.src = shareFitnessStyle;

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error("logo_load_error"));
        }),
        new Promise<void>((resolve, reject) => {
          styleRefImg.onload = () => resolve();
          styleRefImg.onerror = () => reject(new Error("style_ref_load_error"));
        }),
      ]);

      ctx.drawImage(styleRefImg, 0, 0, canvas.width, canvas.height);
      const weightOverlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      weightOverlay.addColorStop(0, "rgba(38, 140, 74, 0.52)");
      weightOverlay.addColorStop(1, "rgba(11, 64, 33, 0.54)");
      ctx.fillStyle = weightOverlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawDumbbell(180, 330, -0.5);
      drawDumbbell(880, 1540, 0.48);

      const cardX = 90;
      const cardY = 250;
      const cardWidth = 900;
      const cardHeight = 1420;
      drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 44);
      ctx.fillStyle = "rgba(249, 247, 240, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();

      const logoX = 180;
      const logoY = 338;
      const logoRadius = 54;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, logoX - logoRadius, logoY - logoRadius, logoRadius * 2, logoRadius * 2);
      ctx.restore();
      ctx.strokeStyle = "#f2d38d";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#2d7c49";
      ctx.font = "700 54px Poppins, sans-serif";
      ctx.fillText("LUMEfit", 270, 332);
      ctx.fillStyle = "#4f6d57";
      ctx.font = "500 32px Poppins, sans-serif";
      ctx.fillText(text.weightSubtitle, 270, 380);

      ctx.fillStyle = "#163b27";
      ctx.font = "500 36px Poppins, sans-serif";
      ctx.fillText(text.weightHero, 150, 490);

      ctx.fillStyle = "#1b5537";
      ctx.font = "800 78px Poppins, sans-serif";
      ctx.fillText(text.weightA, 150, 620);
      ctx.font = "800 64px Poppins, sans-serif";
      ctx.fillText(text.weightB, 150, 690);

      const chartX = 150;
      const chartY = 770;
      const chartWidth = 780;
      const chartHeight = 420;
      drawRoundedRect(chartX - 20, chartY - 40, chartWidth + 40, chartHeight + 80, 30);
      ctx.fillStyle = "rgba(255, 255, 255, 0.66)";
      ctx.fill();

      const trendPoints = [
        ...weightHistory.slice(-4).map((point) => point.weight),
        previousWeight,
        profile.weight,
      ];
      const maxWeight = Math.max(...trendPoints, profile.targetWeight) + 1;
      const minWeight = Math.min(...trendPoints, profile.targetWeight) - 1;
      const weightRange = Math.max(maxWeight - minWeight, 1);

      ctx.strokeStyle = "rgba(70, 112, 84, 0.28)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= 4; i += 1) {
        const y = chartY + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartWidth, y);
        ctx.stroke();
      }

      const toY = (weight: number) => chartY + ((maxWeight - weight) / weightRange) * chartHeight;
      const xStep = chartWidth / (trendPoints.length - 1);

      ctx.beginPath();
      trendPoints.forEach((weight, index) => {
        const x = chartX + index * xStep;
        const y = toY(weight);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "#2f7f52";
      ctx.lineWidth = 7;
      ctx.stroke();

      trendPoints.forEach((weight, index) => {
        const x = chartX + index * xStep;
        const y = toY(weight);
        const isPrevious = index === trendPoints.length - 2;
        const isCurrent = index === trendPoints.length - 1;

        ctx.beginPath();
        ctx.arc(x, y, isPrevious || isCurrent ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isPrevious ? "#dc2626" : isCurrent ? "#16a34a" : "#356749";
        ctx.fill();
      });

      ctx.font = "600 30px Poppins, sans-serif";
      ctx.fillStyle = "#dc2626";
      ctx.fillText(`${text.prev}: ${previousWeight.toFixed(1)}kg`, 150, 1285);
      ctx.fillStyle = "#16a34a";
      ctx.fillText(`${text.current}: ${profile.weight.toFixed(1)}kg`, 150, 1345);
      ctx.fillStyle = "#315e46";
      ctx.fillText(`${text.target}: ${profile.targetWeight.toFixed(1)}kg`, 150, 1405);

      const targetDistance = Math.max(previousWeight - profile.targetWeight, 0.1);
      const achieved = Math.max(previousWeight - profile.weight, 0);
      const weightProgress = Math.min((achieved / targetDistance) * 100, 100);

      ctx.fillStyle = "#315e46";
      ctx.font = "600 32px Poppins, sans-serif";
      ctx.fillText(text.weightGoal, 150, 1488);
      ctx.font = "500 28px Poppins, sans-serif";
      ctx.fillText(`${weightProgress.toFixed(0)}% ${text.completed}`, 150, 1532);
      drawProgressBar(150, 1558, 780, 30, weightProgress, "#16a34a");

      ctx.fillStyle = "#2f6e4a";
      ctx.font = "500 30px Poppins, sans-serif";
      ctx.fillText(text.motivationB, 150, 1630);

      setShareImageUrl(canvas.toDataURL("image/png"));
      setToastMessage(t.toastImageGenerated);
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 1800);
    } catch {
      setToastMessage(t.toastImageFailed);
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 2200);
    } finally {
      setIsGeneratingShareImage(false);
    }
  }, [
    activeShareSummary,
    appLanguage,
    consumedCalories,
    macroProgress,
    macros,
    portionMultiplier,
    previousWeight,
    profile,
    setManagedTimeout,
    shareMode,
    t.toastImageFailed,
    t.toastImageGenerated,
    waterIntakeMl,
    weightHistory,
  ]);

  const handleDownloadShareImage = useCallback(() => {
    if (!shareImageUrl) return;
    const link = document.createElement("a");
    link.href = shareImageUrl;
    link.download = `${shareMode === "weight" ? (appLanguage === "en" ? "lumefit-weight" : "lumefit-peso") : appLanguage === "en" ? "lumefit-share" : "lumefit-partilha"}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }, [appLanguage, shareImageUrl, shareMode]);

  const handleNativeShare = useCallback(async () => {
    if (!shareImageUrl || !navigator.share) return;
    const response = await fetch(shareImageUrl);
    const blob = await response.blob();
    const file = new File(
      [blob],
      shareMode === "weight"
        ? appLanguage === "en"
          ? "lumefit-weight.png"
          : "lumefit-peso.png"
        : appLanguage === "en"
          ? "lumefit-progress.png"
          : "lumefit-progresso.png",
      {
      type: "image/png",
      },
    );
    await navigator.share({
      title: t.appName,
      text: activeShareSummary,
      files: [file],
    });
  }, [activeShareSummary, appLanguage, shareImageUrl, shareMode, t.appName]);

  const handleShareChannel = useCallback(async (channel: "whatsapp" | "telegram" | "tiktok") => {
    if (shareImageUrl) {
      try {
        await handleNativeShare();
        return;
      } catch {
        // fallback below
      }
    }

    const encoded = encodeURIComponent(activeShareSummary);
    const urlMap = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      telegram: `https://t.me/share/url?url=https://lumefit.app&text=${encoded}`,
      tiktok: "https://www.tiktok.com/upload",
    };
    window.open(urlMap[channel], "_blank", "noopener,noreferrer");
  }, [activeShareSummary, handleNativeShare, shareImageUrl]);

  const applyGeneratedPlan = useCallback(() => {
    if (!generatedPlan) return;
    const finalizedProfile = {
      ...profile,
      activityLevel: onboardingActivityMap[setupActivity].profileValue,
      calorieGoal: generatedPlan.calorieGoal,
      hydrationGoalMl: generatedPlan.hydrationGoalMl,
      macroGoals: generatedPlan.macroGoals,
    };

    setProfile((prev) => ({
      ...prev,
      activityLevel: onboardingActivityMap[setupActivity].profileValue,
      calorieGoal: generatedPlan.calorieGoal,
      hydrationGoalMl: generatedPlan.hydrationGoalMl,
      macroGoals: generatedPlan.macroGoals,
    }));
    setWaterIntakeMl(0);
    setOnboardingDone(true);
    setShowPlanPresentation(false);
    setToastMessage(appLanguage === "en" ? "✅ Goals applied successfully." : "✅ Metas aplicadas com sucesso.");
    setShowToast(true);
    setView("home");
    setManagedTimeout(() => setShowToast(false), 2400);
  }, [
    appLanguage,
    firstUseAt,
    generatedPlan,
    onboardingActivityMap,
    profile,
    setManagedTimeout,
    setupActivity,
  ]);

  const currentMealTitle = localizedMeals[selectedMeal];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {view !== "setup" && (
        <div className="fixed left-4 top-4 z-40">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-xl bg-glass"
            onClick={() => setShowTopMenu((prev) => !prev)}
            aria-label={t.menuOpenAria}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {showTopMenu ? (
            <div className="glass-card mt-2 min-w-[220px] rounded-2xl p-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-accent-3/30"
                onClick={() => {
                  setShareMode("general");
                  setShareImageUrl(null);
                  setShowShareSheet(true);
                  setShowTopMenu(false);
                }}
              >
                <Share2 className="h-4 w-4" />
                {t.menuShare}
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-accent-3/30"
                onClick={() => {
                  setShowSettingsSheet(true);
                  setShowTopMenu(false);
                }}
              >
                <Sparkles className="h-4 w-4" />
                {t.menuSettings}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {view === "setup" && (
        <section className={shellClass}>
          <div className="glass-card rounded-[24px] p-0">
            <div className="flex items-center justify-between border-b border-glass-border/70 px-4 py-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass"
              >
                ✕
              </button>
              <p className="text-xl font-bold text-brand-accent-2">LumeFit</p>
              <span className="h-10 w-10" />
            </div>

            <div className="space-y-5 p-4">
              <div className="text-center">
                <h1 className="text-5xl font-bold leading-tight text-foreground">
                  Seu corpo, sua <span className="text-brand-accent-2">jornada.</span>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Vamos criar um plano que respeita seu ritmo, sua rotina e sua essência.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingCityLabel}</p>
                <Input
                  type="text"
                  placeholder={t.onboardingCityPlaceholder}
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-xl font-semibold"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingNameLabel}</p>
                <Input
                  type="text"
                  placeholder={t.onboardingNamePlaceholder}
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-xl font-semibold"
                />
              </div>

              <article className="glass-card rounded-[20px] p-3">
                <div className="relative overflow-hidden rounded-[18px] border border-glass-border/80 bg-gradient-to-b from-brand-accent-1/75 to-brand-accent-2/95 p-6 text-center text-primary-foreground">
                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-brand-accent-2/60 shadow-[inset_0_0_0_1px_var(--color-glass-border)]">
                    <div>
                      <p className="text-5xl">💚</p>
                      <p className="mt-2 text-4xl font-semibold">Saúde</p>
                      <p className="text-lg opacity-90">bem-estar</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm tracking-[0.18em] text-primary-foreground/90">
                    ● IA ATIVA • ANALISANDO BIOTIPO
                  </p>
                </div>
              </article>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingCurrentWeightLabel}</p>
                  <Input
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile((p) => ({ ...p, weight: Number(e.target.value) || 0 }))}
                    className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-2xl font-semibold"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingHeightLabel}</p>
                  <Input
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile((p) => ({ ...p, height: Number(e.target.value) || 0 }))}
                    className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-2xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingTargetWeightLabel}</p>
                <Input
                  type="number"
                  value={profile.targetWeight}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      targetWeight: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-2xl font-semibold"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">Sua idade</p>
                <div className="glass-card flex items-center justify-between rounded-2xl px-3 py-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setProfile((p) => ({ ...p, age: Math.max(16, p.age - 1) }))}
                    className="h-12 w-12 rounded-xl"
                  >
                    −
                  </Button>
                  <p className="text-4xl font-bold">{profile.age}</p>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setProfile((p) => ({ ...p, age: Math.min(75, p.age + 1) }))}
                    className="h-12 w-12 rounded-xl"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em]">Nível de atividade</p>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Nível de atividade">
                  {[
                    { key: "sedentario" as const, icon: Sofa },
                    { key: "moderado" as const, icon: Footprints },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = setupActivity === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setSetupActivity(item.key)}
                        role="radio"
                        aria-checked={active}
                        className={`glass-card rounded-2xl p-4 text-left ${
                          active ? "border-brand-accent-2 shadow-[inset_0_0_0_1px_var(--color-brand-accent-2)]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="h-6 w-6 text-brand-accent-2" />
                          {active ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-accent-2 bg-brand-accent-1/20 text-brand-accent-2">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="h-6 w-6 rounded-full border border-brand-accent-1/35" />
                          )}
                        </div>
                        <p className="mt-3 text-2xl font-semibold">{onboardingActivityMap[item.key].title}</p>
                        <p className="text-sm text-muted-foreground">{onboardingActivityMap[item.key].subtitle}</p>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setSetupActivity("intenso")}
                  role="radio"
                  aria-checked={setupActivity === "intenso"}
                  className={`glass-card mt-3 flex w-full items-center gap-3 rounded-2xl p-4 text-left ${
                    setupActivity === "intenso"
                      ? "border-brand-accent-2 shadow-[inset_0_0_0_1px_var(--color-brand-accent-2)]"
                      : ""
                  }`}
                >
                  <Dumbbell className="h-6 w-6 text-brand-accent-2" />
                  <div>
                    <p className="text-2xl font-semibold">{onboardingActivityMap.intenso.title}</p>
                    <p className="text-sm text-muted-foreground">{onboardingActivityMap.intenso.subtitle}</p>
                  </div>
                  {setupActivity === "intenso" ? (
                    <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-accent-2 bg-brand-accent-1/20 text-brand-accent-2">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="ml-auto h-6 w-6 rounded-full border border-brand-accent-1/35" />
                  )}
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <Button onClick={handleGeneratePlan} className="h-14 w-full rounded-[24px] text-lg">
                  <Sparkles className="h-5 w-5" />
                  Gerar meu Plano com IA
                </Button>
                <p className="px-2 text-center text-sm text-muted-foreground">
                  Ao continuar, nossa IA processará seus dados para criar um plano nutricional e de treinos personalizado.
                </p>
              </div>
            </div>

            {showPlanPresentation && generatedPlan ? (
              <div className="border-t border-glass-border/70 bg-glass/70 p-4">
                <article className="glass-card rounded-[20px] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Apresentação do plano</p>
                  <h3 className="mt-2 text-2xl font-bold text-brand-accent-2">Plano diário recomendado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{generatedPlan.summary}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-brand-accent-1/25 bg-glass px-3 py-4">
                      <p className="text-xs text-muted-foreground">Meta calórica</p>
                      <p className="text-3xl font-bold">{generatedPlan.calorieGoal}</p>
                      <p className="text-xs text-muted-foreground">kcal/dia</p>
                    </div>
                    <div className="rounded-2xl border border-brand-accent-1/25 bg-glass px-3 py-4">
                      <p className="text-xs text-muted-foreground">Hidratação diária</p>
                      <p className="text-3xl font-bold">{(generatedPlan.hydrationGoalMl / 1000).toFixed(1)}L</p>
                      <p className="text-xs text-muted-foreground">água/dia</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-glass-border bg-glass px-2 py-3">
                      <p className="text-xs text-muted-foreground">Proteína</p>
                      <p className="text-lg font-bold">{generatedPlan.macroGoals.protein}g</p>
                    </div>
                    <div className="rounded-xl border border-glass-border bg-glass px-2 py-3">
                      <p className="text-xs text-muted-foreground">Carboidrato</p>
                      <p className="text-lg font-bold">{generatedPlan.macroGoals.carbs}g</p>
                    </div>
                    <div className="rounded-xl border border-glass-border bg-glass px-2 py-3">
                      <p className="text-xs text-muted-foreground">Gordura</p>
                      <p className="text-lg font-bold">{generatedPlan.macroGoals.fat}g</p>
                    </div>
                  </div>

                  <Button onClick={applyGeneratedPlan} className="mt-5 h-12 w-full rounded-2xl">
                    Aplicar metas
                  </Button>
                </article>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {view !== "setup" && (
        <section className={shellClass}>
          {(view === "home" || view === "refeicoes") && (
            <>
              <header className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{getTodayLabel(localeTag)}</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {t.greeting}, {profile.name || t.champion}! 🌟
                </h2>
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
                        <p className="my-2 text-sm font-medium">
                          {Math.round(macro.value)}g / {profile.macroGoals[macro.label === "Proteínas" ? "protein" : macro.label === "Carboidratos" ? "carbs" : "fat"]}g
                        </p>
                        <Progress
                          value={
                            macro.label === "Proteínas"
                              ? macroProgress.protein
                              : macro.label === "Carboidratos"
                                ? macroProgress.carbs
                                : macroProgress.fat
                          }
                          indicatorClassName={
                            macro.label === "Proteínas"
                              ? "bg-macro-protein"
                              : macro.label === "Carboidratos"
                                ? "bg-macro-carbs"
                                : "bg-macro-fat"
                          }
                        />
                      </article>
                    ))}
                  </div>

                  <article className="glass-card mt-4 rounded-[20px] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Hidratação de Hoje</h3>
                      <span className="rounded-full border border-brand-accent-1/30 bg-brand-accent-1/15 px-3 py-1 text-xs font-medium">
                        {(waterIntakeMl / 1000).toFixed(2)}L / {hydrationGoalLiters}L
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="water-bottle-shell">
                        <div className="water-bottle-neck" />
                        <div className="water-bottle-body">
                          <div className="water-bottle-fill" style={{ height: `${hydrationPercent}%` }} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Meta diária baseada no teu plano: <strong className="text-foreground">{hydrationGoalLiters} litros</strong>
                        </p>
                        <Progress value={hydrationPercent} indicatorClassName="bg-hydration" />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            className="h-10 rounded-xl"
                            onClick={() => setWaterIntakeMl((prev) => Math.min(profile.hydrationGoalMl, prev + 330))}
                          >
                            <Droplets className="h-4 w-4" />
                            +330ml
                          </Button>
                          <Button
                            variant="outline"
                            className="h-10 rounded-xl"
                            onClick={() => setWaterIntakeMl((prev) => Math.max(0, prev - 50))}
                          >
                            -50ml
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(Object.keys(localizedMeals) as MealType[]).map((meal) => {
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
                            <p className="text-sm font-medium">{localizedMeals[meal]}</p>
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
                        <div className="no-scrollbar scroll-touch card-list-contain recent-meals-strip flex gap-3 overflow-x-auto pb-1">
                          {recentAnalyses.map((item) => (
                            <RecentAnalysisItem key={item.id} item={item} onOpen={handleOpenSavedAnalysis} />
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
                          <span className="text-xs text-muted-foreground">
                            {appLanguage === "en" ? "Today" : "Hoje"}, {currentTimestamp}
                          </span>
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
                          <Button
                            className="h-11 w-full"
                            onClick={confirmAddToDiary}
                            disabled={isSavingMeal || isViewingSavedAnalysis}
                          >
                            <Check className="h-4 w-4" />
                            {isViewingSavedAnalysis
                              ? "Visualização guardada"
                              : isSavingMeal
                                ? "A guardar..."
                                : "Adicionar ao Diário"}
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
                <div className="mt-4 space-y-2">
                  {weightHistory.map((point) => {
                    const min = Math.min(...weightHistory.map((item) => item.weight));
                    const max = Math.max(...weightHistory.map((item) => item.weight));
                    const pct = ((point.weight - min) / Math.max(max - min, 1)) * 100;

                    return (
                      <div key={point.week} className="grid grid-cols-[56px_1fr_56px] items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{point.week}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-brand-accent-1/15">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-accent-1 to-brand-accent-2"
                            style={{ width: `${Math.max(14, pct)}%` }}
                          />
                        </div>
                        <span className="text-right font-semibold text-foreground">{point.weight.toFixed(1)}kg</span>
                      </div>
                    );
                  })}
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
                <div className="mt-3 grid grid-cols-7 items-end gap-2">
                  {weeklyBars.map((day) => {
                    const min = Math.min(...weeklyBars.map((item) => item.calories));
                    const max = Math.max(...weeklyBars.map((item) => item.calories));
                    const pct = ((day.calories - min) / Math.max(max - min, 1)) * 100;

                    return (
                      <div key={day.day} className="flex flex-col items-center gap-2">
                        <div className="flex h-28 w-full items-end rounded-lg bg-brand-accent-1/10 p-1">
                          <div
                            className="w-full rounded-md bg-gradient-to-t from-brand-accent-1 to-brand-accent-2"
                            style={{ height: `${Math.max(22, pct)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{day.day}</span>
                      </div>
                    );
                  })}
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

          {view === "treinos" && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Treinos</h2>

              <article className="glass-card rounded-[20px] p-4">
                <h3 className="text-sm font-semibold">Vídeo de Treino</h3>
                <div className="mt-3 overflow-hidden rounded-[18px] border border-glass-border bg-glass">
                  <div className="relative aspect-video w-full">
                    <iframe
                      title="Treino LUMEfit"
                      src="https://www.youtube.com/embed/RTsNTYN4Jqs?rel=0&modestbranding=1"
                      className="absolute inset-0 h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </article>

              <div className="mt-4 space-y-3">
                {trainingPhases.map((phase) => {
                  const isDone = completedTrainingPhases[phase.key];
                  return (
                    <article
                      key={phase.key}
                      className={`glass-card rounded-[20px] p-4 transition-all ${
                        isDone ? "border-glass-border/70 bg-muted/35 opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {phase.title}
                          </p>
                          <p className="mt-2 text-sm text-foreground">{phase.instruction}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isDone ? "secondary" : "default"}
                          className="shrink-0 rounded-xl"
                          onClick={() =>
                            setCompletedTrainingPhases((prev) => ({
                              ...prev,
                              [phase.key]: !prev[phase.key],
                            }))
                          }
                        >
                          <Check className="h-4 w-4" />
                          {isDone ? "Concluído" : "Certo"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
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
                <h3 className="text-sm font-semibold">Resumo do teu plano</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-glass-border bg-glass p-3">
                    <p className="text-xs text-muted-foreground">Dias de uso</p>
                    <p className="text-2xl font-bold">{usageDays} dias</p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-glass p-3">
                    <p className="text-xs text-muted-foreground">Calorias/dia</p>
                    <p className="text-2xl font-bold">{profile.calorieGoal}</p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-glass p-3">
                    <p className="text-xs text-muted-foreground">Água/dia</p>
                    <p className="text-2xl font-bold">{(profile.hydrationGoalMl / 1000).toFixed(1)}L</p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-glass p-3">
                    <p className="text-xs text-muted-foreground">Peso atual vs desejado</p>
                    <p className="text-lg font-bold">
                      {profile.weight}kg <span className="text-muted-foreground">/ {profile.targetWeight}kg</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card mt-4 rounded-xl p-4">
                <h3 className="text-sm font-semibold">Atualizar peso atual</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dica: verifica o teu peso a cada mês para manter o plano preciso.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    value={profile.weight}
                    onChange={(e) => {
                      const nextWeight = Number(e.target.value) || 0;
                      setPreviousWeight(profile.weight);
                      setProfile((prev) => ({ ...prev, weight: nextWeight }));
                    }}
                    className="h-11 rounded-xl bg-glass-muted"
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedPlan(generatePlan(profile));
                    setShowPlanPresentation(false);
                    setView("setup");
                  }}
                >
                  Mudar o meu plano
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShareMode("weight");
                    setShareImageUrl(null);
                    setShowShareSheet(true);
                  }}
                >
                  Compartilhar peso anterior e atual
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    try {
                      localStorage.removeItem(STORAGE_KEY);
                      Object.keys(localStorage)
                        .filter((key) => isEntriesStorageKey(key))
                        .forEach((key) => localStorage.removeItem(key));
                    } catch {
                      // silent fail
                    }
                    setEntries([]);
                    setRecentAnalyses(initialRecentAnalyses);
                    setWaterIntakeMl(0);
                    setOnboardingDone(true);
                    setShowPlanPresentation(false);
                    setGeneratedPlan(null);
                    setView("home");
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

      {view !== "setup" && (
        <nav className="frosted-nav fixed bottom-3 left-1/2 z-20 flex w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-between rounded-xl px-2 py-2 sm:max-w-md">
            {[
              { key: "home", label: t.navHome, icon: Home },
              { key: "refeicoes", label: t.navMeals, icon: UtensilsCrossed },
              { key: "progresso", label: t.navProgress, icon: Flame },
              { key: "treinos", label: t.navWorkouts, icon: Dumbbell },
              { key: "perfil", label: t.navProfile, icon: CircleUserRound },
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
              {localizedAnalysisMessages[analysisMessageIndex]}
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

      {showMotivationNotification ? (
        <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-brand-accent-1/40 bg-glass p-4 shadow-[0_10px_30px_oklch(0.64_0.12_152_/_25%)] sm:max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-accent-2">{t.notificationTitle}</p>
          <p className="mt-1 text-sm font-medium">{t.notificationBody}</p>
          <Button
            size="sm"
            className="mt-3 w-full rounded-xl"
            onClick={() => setShowMotivationNotification(false)}
          >
            {t.understood}
          </Button>
        </div>
      ) : null}

      {showSettingsSheet ? (
        <div className="fixed inset-0 z-50 flex items-end bg-background/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="glass-card w-full rounded-[24px] p-4 sm:max-w-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.settingsTitle}</h3>
              <button
                type="button"
                onClick={() => setShowSettingsSheet(false)}
                className="rounded-lg border border-glass-border px-2 py-1 text-sm"
              >
                {t.close}
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-glass-border bg-glass p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t.settingsTheme}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant={appTheme === "light" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setAppTheme("light")}
                  >
                    {t.settingsThemeLight}
                  </Button>
                  <Button
                    variant={appTheme === "dark" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setAppTheme("dark")}
                  >
                    {t.settingsThemeDark}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-glass-border bg-glass p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t.settingsLanguage}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant={appLanguage === "pt" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setAppLanguage("pt")}
                  >
                    {t.languagePortuguese}
                  </Button>
                  <Button
                    variant={appLanguage === "en" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setAppLanguage("en")}
                  >
                    {t.languageEnglish}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showShareSheet ? (
        <div className="fixed inset-0 z-50 flex items-end bg-background/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="glass-card w-full rounded-[24px] p-4 sm:max-w-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.shareProgress}</h3>
              <button
                type="button"
                onClick={() => setShowShareSheet(false)}
                className="rounded-lg border border-glass-border px-2 py-1 text-sm"
              >
                {t.close}
              </button>
            </div>

            <Button className="h-11 w-full rounded-xl" onClick={handleGenerateShareImage} disabled={isGeneratingShareImage}>
              <Sparkles className="h-4 w-4" />
              {isGeneratingShareImage ? t.shareGenerating : t.shareGenerated}
            </Button>

            {shareImageUrl ? (
              <>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-glass-border bg-glass">
                  <img src={shareImageUrl} alt="Imagem de partilha LUMEfit" className="h-72 w-full object-cover" loading="lazy" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => handleShareChannel("whatsapp")}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => handleShareChannel("telegram")}>
                    <Send className="h-4 w-4" /> Telegram
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => handleShareChannel("tiktok")}>
                    <Music2 className="h-4 w-4" /> TikTok
                  </Button>
                  <Button variant="secondary" className="rounded-xl" onClick={handleDownloadShareImage}>
                    <Download className="h-4 w-4" /> {appLanguage === "en" ? "Download" : "Baixar"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.shareHint}</p>
            )}
          </div>
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
