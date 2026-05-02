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
  ArrowLeft,
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
  ChevronRight,
  Plus,
  Minus,
  Trophy,
  X,
  Settings,
  ChevronLeft,
  Smartphone,
  LogIn,
  UserPlus,
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
const shareLogo = "/lume-logo.png";
const shareFitnessStyle = "/lume-logo.png";

export const Route = createFileRoute("/")({
  component: LumeFitApp,
});

import { AdminPanel, type AdminUser } from "@/components/admin/AdminPanel";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type ViewKey = "home" | "refeicoes" | "progresso" | "perfil" | "setup" | "auth" | "waiting_approval" | "blocked" | "expired" | "pending_plan";
type MealFlowStage = "camera" | "preview" | "analyzing" | "result" | "clarification";
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
  role?: 'admin' | 'user';
  status?: 'ativo' | 'pendente' | 'bloqueado' | 'setup';
};

type PersistedState = {
  profile?: Profile;
  entries?: MealEntry[];
  recentAnalyses?: RecentMealAnalysis[];
  waterIntakeMl?: number;
  onboardingDone?: boolean;
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
    email?: string;
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
  motivationalTip?: string;
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
    almoco: "â˜€️ Lunch",
    jantar: "ðŸŒ™ Dinner",
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
    "You can do this â€” consistency is your superpower.",
    "Lighter, stronger, more confident.",
  ],
};

const localizedTips: Record<AppLanguage, string[]> = {
  pt: tips,
  en: [
    "Cook with less oil â€” use 1 spoon instead of 3.",
    "Drink 8 glasses of water daily 💧",
    "Eat slowly â€” your brain needs 20 min to feel full.",
    "Matapa is nutritious â€” watch peanut portion size.",
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
    greeting: "Olá",
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
    navProfile: "Perfil",
    onboardingCityLabel: "Cidade",
    onboardingCityPlaceholder: "Escreve a tua cidade",
    onboardingNameLabel: "Nome",
    onboardingNamePlaceholder: "Escreve o teu nome",
    onboardingCurrentWeightLabel: "Peso atual (kg)",
    onboardingTargetWeightLabel: "Peso desejado (kg)",
    onboardingHeightLabel: "Altura (cm)",
    todayCalories: "Calorias de hoje",
    goalCalorie: "Meta calórica",
    goalHydration: "Hidratação diária",
    goalWater: "água/dia",
    protein: "Proteína",
    carbs: "Carboidrato",
    fat: "Gordura",
    applyGoals: "Aplicar metas",
    analyzingFood: "Analisar Comida",
    mealHistory: "Histórico de Refeições",
    weightHistory: "Histórico de Peso",
    currentWeight: "Peso atual",
    weightGoal: "Meta de peso",
    addWeight: "Registrar peso",
    achievements: "Conquistas",
    motivation: "Motivação",
    calories: "Calorias",
    grams: "g",
    liters: "L",
    remaining: "restantes",
    water: "Água",
    back: "Voltar",
    save: "Salvar",
    edit: "Editar",
    cancel: "Cancelar",
    addIn: "Adicionar em",
    analyzeMeal: "Analisar Refeição",
    takePhotoHint: "Tira uma foto do teu prato e a IA faz o resto ✨",
    takePhoto: "Tirar Foto",
    loadGallery: "Carregar da Galeria",
    recentAnalyses: "Análises Recentes",
    last5: "Últimas 5",
    previewMeal: "Pré-visualização da refeição",
    analyzeThis: "Analisar este prato",
    chooseAnother: "Escolher outra foto",
    accuracy: "de precisão",
    totalEstimate: "Estimativa total",
    estimatedKcal: "kcal estimadas",
    basedOnPortions: "Baseado nas porções visíveis no prato",
    thisPlateIs: "Este prato =",
    ofDailyGoal: "da tua meta diária",
    proteins: "Proteínas",
    carbohydrates: "Carboidratos",
    fats: "Gorduras",
    ingredientsIdentified: "Ingredientes Identificados",
    nutritionalDetails: "Detalhes Nutricionais",
    sodium: "Sódio",
    fiber: "Fibra",
    sugars: "Açúcares",
    vitaminA: "Vitamina A",
    vitaminC: "Vitamina C",
    iron: "Ferro",
    calcium: "Cálcio",
    dv: "VD",
    insightsForYou: "Insights para ti",
    adjustPortion: "Ajustar Porção",
    normalPortion: "Porção normal",
    viewSaved: "Visualização guardada",
    saving: "A guardar...",
    addToDiary: "Adicionar ao Diário",
    analyzeAnother: "Analisar Outro Prato",
    weekly: "Semanal",
    keepConsistent: "Mantém a consistência para resultados precisos!",
    updateWeight: "Atualizar peso atual",
    weightHint: "Dica: verifica o teu peso a cada mês para manter o plano preciso.",
    changePlan: "Mudar o meu plano",
    shareWeightProgress: "Compartilhar peso anterior e atual",
    logout: "Sair da conta",
    madeForYou: "Feito para ti",
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
    greeting: "Hello",
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
    navProfile: "Profile",
    onboardingCityLabel: "City",
    onboardingCityPlaceholder: "Enter your city",
    onboardingNameLabel: "Name",
    onboardingNamePlaceholder: "Enter your name",
    onboardingCurrentWeightLabel: "Current weight (kg)",
    onboardingTargetWeightLabel: "Target weight (kg)",
    onboardingHeightLabel: "Height (cm)",
    todayCalories: "Today's Calories",
    goalCalorie: "Calorie Goal",
    goalHydration: "Daily Hydration",
    goalWater: "water/day",
    protein: "Protein",
    carbs: "Carbohydrate",
    fat: "Fat",
    applyGoals: "Apply Goals",
    analyzingFood: "Analyze Food",
    mealHistory: "Meal History",
    weightHistory: "Weight History",
    currentWeight: "Current Weight",
    weightGoal: "Weight Goal",
    addWeight: "Log weight",
    achievements: "Achievements",
    motivation: "Motivation",
    calories: "Calories",
    grams: "g",
    liters: "L",
    remaining: "remaining",
    water: "Water",
    back: "Back",
    save: "Save",
    edit: "Edit",
    cancel: "Cancel",
    addIn: "Add in",
    analyzeMeal: "Analyze Meal",
    takePhotoHint: "Take a photo of your plate and AI does the rest ✨",
    takePhoto: "Take Photo",
    loadGallery: "Upload from Gallery",
    recentAnalyses: "Recent Analyses",
    last5: "Last 5",
    previewMeal: "Meal preview",
    analyzeThis: "Analyze this plate",
    chooseAnother: "Choose another photo",
    accuracy: "accuracy",
    totalEstimate: "Total estimate",
    estimatedKcal: "estimated kcal",
    basedOnPortions: "Based on portions visible on the plate",
    thisPlateIs: "This plate =",
    ofDailyGoal: "of your daily goal",
    proteins: "Proteins",
    carbohydrates: "Carbohydrates",
    fats: "Fats",
    ingredientsIdentified: "Ingredients Identified",
    nutritionalDetails: "Nutritional Details",
    sodium: "Sodium",
    fiber: "Fiber",
    sugars: "Sugars",
    vitaminA: "Vitamin A",
    vitaminC: "Vitamin C",
    iron: "Iron",
    calcium: "Calcium",
    dv: "DV",
    insightsForYou: "Insights for you",
    adjustPortion: "Adjust Portion",
    normalPortion: "Normal portion",
    viewSaved: "Saved view",
    saving: "Saving...",
    addToDiary: "Add to Diary",
    analyzeAnother: "Analyze Another Plate",
    weekly: "Weekly",
    keepConsistent: "Keep consistent for accurate results!",
    updateWeight: "Update current weight",
    weightHint: "Tip: check your weight every month to keep the plan accurate.",
    changePlan: "Change my plan",
    shareWeightProgress: "Share previous and current weight",
    logout: "Logout",
    madeForYou: "Made for you",
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

function toUnifiedProfile(profile: Profile, dateJoined: string, email?: string): UnifiedAppState["profile"] {
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
    email
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
  const maxSize = 320; // Reduzido para poupar espaço
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.max(1, Math.round(img.width * ratio));
  canvas.height = Math.max(1, Math.round(img.height * ratio));

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Qualidade reduzida para 0.4 para gerar um "código" (Base64) ultra leve
  return canvas.toDataURL("image/jpeg", 0.4);
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
  const maintenance = bmr * activityFactor;

  let adjustment = 0;
  if (weeklyGoal.includes("Perder")) {
    adjustment = weeklyGoal.includes("1kg") ? -350 : -220;
  } else if (weeklyGoal.includes("Ganhar")) {
    adjustment = weeklyGoal.includes("1kg") ? 350 : 220;
  }

  return Math.max(1200, Math.round(maintenance + adjustment));
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
  const [descricaoPrato, setDescricaoPrato] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessageIndex, setAnalysisMessageIndex] = useState(0);
  const [activeResult, setActiveResult] = useState<MockMealResult | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentMealAnalysis[]>(initialRecentAnalyses);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("recent_meal_analyses") || "[]"
      );
      setRecentAnalyses(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);
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

  const [animatedKcal, setAnimatedKcal] = useState(0);
  const [animatedProtein, setAnimatedProtein] = useState(0);
  const [animatedCarbs, setAnimatedCarbs] = useState(0);
  const [animatedFat, setAnimatedFat] = useState(0);

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showSplash, setShowSplash] = useState(true);
  const [splashAnimFinished, setSplashAnimFinished] = useState(false);
  const [mountSplash, setMountSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashAnimFinished(true);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && splashAnimFinished) {
      const timer = setTimeout(() => setMountSplash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showSplash, splashAnimFinished]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingAnalyses, setPendingAnalyses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authView === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: authEmail,
            name: authEmail.split('@')[0],
            role: 'user',
            status: 'setup'
          });
        }
      }
    } catch (error: any) {
      if (authView === "login" && error.message.includes("Invalid login credentials")) {
        setAuthError("Este email não tem conta, crie conta");
      } else {
        setToastMessage(error.message);
        setShowToast(true);
        setManagedTimeout(() => setShowToast(false), 3000);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const processOfflineQueue = useCallback(() => {
    const queue = JSON.parse(localStorage.getItem("lume_offline_queue") || "[]");
    if (queue.length === 0) return;

    setToastMessage(appLanguage === "en" ? "🌐 Back online! Processing pending meals..." : "🌐 De volta online! A processar refeições pendentes...");
    setShowToast(true);
    setManagedTimeout(() => setShowToast(false), 3000);

    const item = queue[0];
    setPreviewImage(item.image);
    setActiveResult(pickMockResult(item.name));
    setMealStage("result");

    localStorage.removeItem("lume_offline_queue");
    setPendingAnalyses([]);
  }, [appLanguage]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    } else {
      setToastMessage(appLanguage === "en" ? "To install: Tap 'Share' then 'Add to Home Screen' 📲" : "Para instalar: Toca em 'Partilhar' e depois em 'Adicionar ao Ecrã Principal' 📲");
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 5000);
    }
  };

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
  const hasHydratedFromStorageRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasInitializedWeightTrackingRef = useRef(false);
  const latestWeightRef = useRef<number | null>(null);
  const shareFetchAbortRef = useRef<AbortController | null>(null);
  const saveMealAbortRef = useRef<AbortController | null>(null);
  const [isViewingSavedAnalysis, setIsViewingSavedAnalysis] = useState(false);
  const [aiClarificationQuestion, setAiClarificationQuestion] = useState<string | null>(null);
  const [userClarificationResponse, setUserClarificationResponse] = useState("");
  const [previewImageBase64, setPreviewImageBase64] = useState<string | null>(null);
  const planResultRef = useRef<HTMLDivElement | null>(null);

  const writeState = useCallback((next: UnifiedAppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
  }, []);

  const writeStateDebounced = useCallback((next: UnifiedAppState) => {
    const timeoutId = window.setTimeout(() => {
      writeState(next);
    }, 1000);
    timeoutIdsRef.current.push(timeoutId);
  }, [writeState]);

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

  const showComingSoonToast = useCallback(() => {
    setToastMessage("Em breve disponível! ✨");
    setShowToast(true);
    setManagedTimeout(() => setShowToast(false), 1800);
  }, [setManagedTimeout]);

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
    if (!session) return;

    const fetchUserData = async () => {
      const todayKey = getDateKey();

      // 1. Buscar Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        return;
      }

      let currentProfile: Profile = profile;
      let userRole = 'user';
      let userStatus = 'setup';
      let onboardingComplete = false;
      let hasExpired = false;

      if (profileData) {
        currentProfile = {
          name: profileData.name || "",
          age: profileData.age || 30,
          city: profileData.city || "",
          weight: Number(profileData.weight) || 78,
          height: Number(profileData.height) || 163,
          targetWeight: Number(profileData.target_weight) || 68,
          weeklyGoal: profileData.weekly_goal || weeklyGoals[1],
          activityLevel: profileData.activity_level || activityLevels[1],
          calorieGoal: profileData.calorie_goal || 1400,
          hydrationGoalMl: profileData.hydration_goal_ml || 2500,
          macroGoals: calcMacroGoals(profileData.calorie_goal || 1400),
          role: profileData.role || 'user',
          status: profileData.status || 'setup',
        };
        userRole = profileData.role || 'user';
        userStatus = profileData.status || 'setup';
        onboardingComplete = userStatus !== 'setup';

        if (profileData.expiry_date) {
          const expDate = new Date(profileData.expiry_date).getTime();
          if (Date.now() > expDate) {
            hasExpired = true;
          }
        }

        setProfile(currentProfile);
      }

      // 2. Buscar Todas as Refeições (para Streak e Resumo Semanal)
      const { data: allMealsData } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("timestamp", { ascending: false });

      const mappedByDay: Record<string, MealEntry[]> = readAllEntriesByDay();

      if (allMealsData) {
        allMealsData.forEach((m) => {
          const date = m.timestamp.slice(0, 10);
          if (!mappedByDay[date]) mappedByDay[date] = [];
          // Evitar duplicados se já existirem no localStorage
          if (!mappedByDay[date].some((existing) => existing.id === m.id)) {
            mappedByDay[date].push({
              id: m.id,
              meal: m.meal_type as MealType,
              foodName: m.food_name,
              calories: m.calories,
              protein: Number(m.protein),
              carbs: Number(m.carbs),
              fat: Number(m.fat),
              quantity: Number(m.quantity || 1),
              timestamp: m.timestamp,
              photo: m.photo_url,
            });
          }
        });
      }

      setEntriesByDay(mappedByDay);
      setEntries(mappedByDay[todayKey] || []);

      if (profileData?.date_joined) {
        setFirstUseAt(profileData.date_joined);
      } else if (profileData?.created_at) {
        setFirstUseAt(profileData.created_at);
      }

      // 3. Buscar Água de Hoje (e opcionalmente histórico)
      const { data: waterData } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", session.user.id)
        .gte("timestamp", todayKey + "T00:00:00")
        .lte("timestamp", todayKey + "T23:59:59");

      if (waterData) {
        const totalWater = waterData.reduce((acc, curr) => acc + curr.amount_ml, 0);
        setWaterIntakeMl(totalWater);
      }

      // 4. Lógica de Acesso
      if (userRole === 'admin') {
        setView("home");
      } else if (hasExpired) {
        setView("expired");
      } else if (userStatus === 'bloqueado') {
        setView("blocked");
      } else if (userStatus === 'pendente') {
        setView("waiting_approval");
      } else if (userStatus === 'setup') {
        setView("setup");
      } else if (userStatus === 'ativo' && !profileData?.calorie_goal) {
        setView("pending_plan");
      } else {
        setView("home");
      }

      setOnboardingDone(onboardingComplete);
      setShowSplash(false);
    };

    fetchUserData();
  }, [session]);

  // Garantir que Admin nunca fique preso em telas de bloqueio
  useEffect(() => {
    if (profile.role === 'admin' && ["waiting_approval", "blocked", "expired"].includes(view)) {
      setView("home");
    }
  }, [profile.role, view]);

  const handleUpdateWater = async (amount: number) => {
    const next = Math.max(0, waterIntakeMl + amount);
    setWaterIntakeMl(next);

    if (session) {
      if (amount > 0) {
        await supabase.from('water_logs').insert({
          user_id: session.user.id,
          amount_ml: amount,
          timestamp: new Date().toISOString()
        });
      } else {
        const todayKey = getDateKey();
        const { data } = await supabase
          .from('water_logs')
          .select('id')
          .eq('user_id', session.user.id)
          .gte('timestamp', todayKey + 'T00:00:00')
          .order('timestamp', { ascending: false })
          .limit(1);

        if (data && data[0]) {
          await supabase.from('water_logs').delete().eq('id', data[0].id);
        }
      }
    }
  };

  useEffect(() => {
    if (!session || !onboardingDone) return;

    const saveProfile = async () => {
      await supabase.from('profiles').update({
        name: profile.name,
        age: profile.age,
        city: profile.city,
        weight: profile.weight,
        height: profile.height,
        target_weight: profile.targetWeight,
        weekly_goal: profile.weeklyGoal,
        activity_level: profile.activityLevel,
        calorie_goal: profile.calorieGoal,
        hydration_goal_ml: profile.hydrationGoalMl,
      }).eq('id', session.user.id);
    };

    const timer = setTimeout(saveProfile, 2000);
    return () => clearTimeout(timer);
  }, [profile, session, onboardingDone]);

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
      previous_weight: previousWeight,
      last_seen_at: storageSnapshotRef.current?.last_seen_at,
      app_language: appLanguage,
      app_theme: appTheme,
    };
    updateStorageSnapshot(nextState);

    const timeoutId = window.setTimeout(() => {
      writeState(nextState);
    }, 800);
    timeoutIdsRef.current.push(timeoutId);

    return () => window.clearTimeout(timeoutId);
  }, [
    profile,
    entries,
    recentAnalyses,
    waterIntakeMl,
    onboardingDone,
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

  const t = uiText[appLanguage];
  const localizedAnalysisMessages = ANALYSIS_MESSAGES[appLanguage];
  const localizedMeals = localizedMealLabels[appLanguage];
  const localizedShortWeekdays = localizedWeekdays[appLanguage];
  const localizedQuoteList = localizedQuotes[appLanguage];
  const localeTag = appLanguage === "en" ? "en-US" : "pt-MZ";


  useEffect(() => {
    const todayKey = getDateKey();
    setEntriesByDay((prev) => {
      // Só atualiza se houver mudança real para evitar loops
      if (JSON.stringify(prev[todayKey]) === JSON.stringify(entries)) return prev;
      return {
        ...prev,
        [todayKey]: entries,
      };
    });
  }, [entries]);

  useEffect(() => {
    if (!onboardingDone) return;
    if (!hasInitializedWeightTrackingRef.current) {
      hasInitializedWeightTrackingRef.current = true;
      latestWeightRef.current = profile.weight;
      return;
    }

    if (latestWeightRef.current === profile.weight) return;
    latestWeightRef.current = profile.weight;

    const date = getDateKey();
    setWeightLog((prev) => {
      const normalized = Array.isArray(prev) ? prev : [];
      const existing = normalized.find((item) => item.date === date);
      if (existing) {
        return normalized.map((item) => (item.date === date ? { ...item, weight: profile.weight } : item));
      }
      return [...normalized, { date, weight: profile.weight }];
    });
  }, [onboardingDone, profile.weight]);

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutIdsRef.current = [];
      shareFetchAbortRef.current?.abort();
      shareFetchAbortRef.current = null;
      saveMealAbortRef.current?.abort();
      saveMealAbortRef.current = null;
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
      setAnalysisProgress((prev) => Math.min(95, prev + 1.2));
    }, 100);

    const msgTick = setInterval(() => {
      setAnalysisMessageIndex((prev) => (prev + 1) % localizedAnalysisMessages.length);
    }, 1200);

    const runAnalysis = async () => {
      if (!previewImageBase64) return;
      try {
        const { data: aiResult, error } = await supabase.functions.invoke('analyze-meal', {
          body: {
            type: 'analysis',
            image: previewImageBase64,
            user_description: descricaoPrato,
            data: { context: userClarificationResponse }
          }
        });

        if (error) throw error;
        if (aiResult?.error) throw new Error(aiResult.message || "Erro interno na análise da IA.");

        if (aiResult.status === "DUVIDA" && !userClarificationResponse) {
          setAiClarificationQuestion(aiResult.perguntas_clarificacao?.[0] || "Pode detalhar melhor os ingredientes?");
          setMealStage("clarification");
          return;
        }

        // Se chegar aqui e ainda for DUVIDA (ex: usuário pulou mas a IA insistiu),
        // tentamos extrair o que houver na 'analise' ou damos erro amigável se estiver vazio.
        if (aiResult.status === "DUVIDA" && (!aiResult.analise || !aiResult.analise.total_kcal)) {
          throw new Error("A IA não conseguiu identificar o prato mesmo com a sua ajuda. Tente uma foto mais clara.");
        }

        const analise = aiResult.analise || {};
        const matched: MockMealResult = {
          id: `ai-${Date.now()}`,
          mealName: analise.prato_nome || "Prato não identificado",
          cuisineTag: analise.pais_origem || "Local",
          confidence: analise.confianca_score || 95,
          estimatedKcal: parseFloat(String(analise.total_kcal)) || 0,
          protein: parseFloat(String(analise.macros?.proteina)) || 0,
          carbs: parseFloat(String(analise.macros?.carbs)) || 0,
          fat: parseFloat(String(analise.macros?.gordura)) || 0,
          dailyGoalPercent: Math.round((parseFloat(String(analise.total_kcal)) / profile.calorieGoal) * 100) || 0,
          sodiumMg: analise.sodiumMg || 450,
          fiberG: analise.fiberG || 4.5,
          sugarsG: analise.sugarsG || 2.1,
          vitaminAPct: analise.vitaminAPct || 15,
          vitaminCPct: analise.vitaminCPct || 20,
          ironPct: analise.ironPct || 10,
          calciumPct: analise.calciumPct || 8,
          imageSeed: "ai",
          ingredients: (analise.ingredientes_detalhados || []).map((i: any) => ({
            name: i.item,
            calories: parseFloat(String(i.kcal)) || 0,
            note: i.obs
          })),
          insights: aiResult.insights_saude ? [aiResult.insights_saude] : [],
        };

        setAnalysisProgress(100);
        setActiveResult(matched);
        setPortionMultiplier(1);
        setMealStage("result");
        setUserClarificationResponse(""); // Reset for next time
        setAiClarificationQuestion(null);
      } catch (err: any) {
        setToastMessage("Erro na análise: " + err.message);
        setShowToast(true);
        setMealStage("camera");
      }
    };

    runAnalysis();

    return () => {
      clearInterval(progressTick);
      clearInterval(msgTick);
    };
  }, [mealStage, previewImage, userClarificationResponse, profile.calorieGoal, localizedAnalysisMessages.length, setManagedTimeout]);

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
  const calorieColors = useMemo(() => {
    const rawPercent = (consumedCalories / Math.max(profile.calorieGoal, 1)) * 100;
    const isOverLimit = consumedCalories > profile.calorieGoal;

    if (isOverLimit) {
      return {
        stop1: "#ef4444", // Red
        stop2: "#991b1b", // Dark Red
        glow: "rgba(239, 68, 68, 0.5)",
      };
    }

    if (rawPercent >= 100) {
      return {
        stop1: "#22c55e", // Green
        stop2: "#15803d", // Dark Green
        glow: "rgba(34, 197, 94, 0.5)",
      };
    }

    if (rawPercent <= 15) {
      return {
        stop1: "#f97316", // Orange
        stop2: "#ef4444", // Red
        glow: "rgba(249, 115, 22, 0.4)",
      };
    }

    // Interpolação entre 15% e 100%
    const factor = Math.min(1, Math.max(0, (rawPercent - 15) / 85));

    const interpolateColor = (c1: string, c2: string, f: number) => {
      const r1 = parseInt(c1.slice(1, 3), 16);
      const g1 = parseInt(c1.slice(3, 5), 16);
      const b1 = parseInt(c1.slice(5, 7), 16);
      const r2 = parseInt(c2.slice(1, 3), 16);
      const g2 = parseInt(c2.slice(3, 5), 16);
      const b2 = parseInt(c2.slice(5, 7), 16);
      const r = Math.round(r1 + (r2 - r1) * f)
        .toString(16)
        .padStart(2, "0");
      const g = Math.round(g1 + (g2 - g1) * f)
        .toString(16)
        .padStart(2, "0");
      const b = Math.round(b1 + (b2 - b1) * f)
        .toString(16)
        .padStart(2, "0");
      return `#${r}${g}${b}`;
    };

    const stop1 = interpolateColor("#f97316", "#22c55e", factor);
    const stop2 = interpolateColor("#ef4444", "#15803d", factor);

    return {
      stop1,
      stop2,
      glow: `rgba(${parseInt(stop1.slice(1, 3), 16)}, ${parseInt(stop1.slice(3, 5), 16)}, ${parseInt(stop1.slice(5, 7), 16)}, 0.4)`,
    };
  }, [consumedCalories, profile.calorieGoal]);

  const ringGlow = calorieColors.glow;

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

  const onboardingActivityMap = useMemo<Record<
    SetupActivityLevel,
    { title: string; subtitle: string; profileValue: (typeof activityLevels)[number] }
  >>(() => ({
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
  }), []);

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
      last7Days.map((dateKey) => {
        const dayEntries = entriesByDay[dateKey] || [];
        const calories = dayEntries.reduce((sum, item) => sum + item.calories, 0);
        const dateObj = new Date(dateKey + "T12:00:00");
        const dayNum = dateObj.getDay();
        const labelIndex = dayNum === 0 ? 6 : dayNum - 1;
        return { day: localizedShortWeekdays[labelIndex], calories };
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

    if (!navigator.onLine) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const pendingItem = { id: Date.now(), name: file.name, image: base64 };
        const newQueue = [pendingItem, ...pendingAnalyses];
        setPendingAnalyses(newQueue);
        localStorage.setItem("lume_offline_queue", JSON.stringify(newQueue));

        setToastMessage(appLanguage === "en" ? "📥 Offline! Image saved to queue." : "📥 Sem internet! Foto guardada na fila.");
        setShowToast(true);
        setManagedTimeout(() => setShowToast(false), 3000);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    const fileUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = fileUrl;
    setPreviewImage(fileUrl);

    // Converter para base64 para a IA
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsViewingSavedAnalysis(false);
    setMealStage("preview");
    setNutritionOpen(false);
    setExpandedIngredient(null);
  }, []);

  const confirmAddToDiary = useCallback(() => {
    if (!activeResult) return;
    saveMealAbortRef.current?.abort();
    const controller = new AbortController();
    saveMealAbortRef.current = controller;

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
          if (controller.signal.aborted || !isMountedRef.current) return;
          if (compressed && compressed.length < MAX_RECENT_IMAGE_LENGTH) {
            compressedImage = compressed;
          }
        } catch {
          compressedImage = null;
        }
      }

      const baseAnalysis = buildRecentAnalysis(activeResult, kcal, compressedImage);

      // Salvar no Supabase
      if (session) {
        const { error: insertError } = await supabase.from('meals').insert({
          user_id: session.user.id,
          meal_type: selectedMeal,
          food_name: activeResult.mealName,
          calories: kcal,
          protein,
          carbs,
          fat,
          photo_url: compressedImage,
          timestamp: nextEntry.timestamp
        });
        if (insertError) console.error('Erro ao salvar no Supabase:', insertError);
      }

      setRecentAnalyses((prev) => [baseAnalysis, ...prev].slice(0, MAX_RECENT_MEALS));
      try {
        const existing = JSON.parse(
          localStorage.getItem("recent_meal_analyses") || "[]"
        );
        const updated = [baseAnalysis, ...existing].slice(0, 5);
        localStorage.setItem(
          "recent_meal_analyses", 
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error(err);
      }
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
    setDescricaoPrato("");
    setActiveResult(null);
    setPortionMultiplier(1);
    setNutritionOpen(false);
    setExpandedIngredient(null);
    setAnalysisProgress(0);
    setAnalysisMessageIndex(0);
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data: aiResult, error } = await supabase.functions.invoke('lumefit-ai', {
        body: { type: 'onboarding', data: profile }
      });

      if (error) throw error;
      if (aiResult?.error) throw new Error(aiResult.message || "Erro na IA ao gerar plano.");
      if (!aiResult?.calorieGoal || !aiResult?.macroGoals) throw new Error("A IA devolveu um formato inválido. Tente novamente.");
      const nextPlan: GeneratedPlan = {
        summary: aiResult.summary,
        calorieGoal: aiResult.calorieGoal,
        hydrationGoalMl: aiResult.hydrationGoalMl,
        macroGoals: aiResult.macroGoals,
        motivationalTip: aiResult.motivationalTip
      };

      setGeneratedPlan(nextPlan);
      setShowPlanPresentation(true);
      setView("pending_plan");

      setTimeout(() => {
        planResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setToastMessage("Erro ao gerar plano: " + err.message);
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 3000);
    } finally {
      setAuthLoading(false);
    }
  }, [profile, setManagedTimeout]);

  const handleOnboardingSubmit = useCallback(async () => {
    if (!session) return;
    setAuthLoading(true);
    try {
      await supabase.from('profiles').update({
        name: profile.name,
        age: profile.age,
        city: profile.city,
        weight: profile.weight,
        height: profile.height,
        target_weight: profile.targetWeight,
        weekly_goal: profile.weeklyGoal,
        activity_level: onboardingActivityMap[setupActivity].profileValue,
        status: profile.role === 'admin' ? 'ativo' : 'pendente'
      }).eq('id', session.user.id);

      setView(profile.role === 'admin' ? "home" : "waiting_approval");
      setToastMessage("Perfil enviado para aprovação! ✨");
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      setToastMessage("Erro ao enviar perfil: " + error.message);
      setShowToast(true);
      setManagedTimeout(() => setShowToast(false), 3000);
    } finally {
      setAuthLoading(false);
    }
  }, [session, profile, setupActivity, onboardingActivityMap, setManagedTimeout]);

  const shareSummary =
    appLanguage === "en"
      ? `My consistency in LUMEfit 💚\n${profile.name || "User"}\nGoal: ${profile.calorieGoal} kcal â€¢ ${(profile.hydrationGoalMl / 1000).toFixed(1)}L\nToday: ${consumedCalories} kcal and ${(waterIntakeMl / 1000).toFixed(2)}L`
      : `A minha consistência no LUMEfit 💚\n${profile.name || "Utilizadora"}\nMeta: ${profile.calorieGoal} kcal â€¢ ${(profile.hydrationGoalMl / 1000).toFixed(1)}L\nHoje: ${consumedCalories} kcal e ${(waterIntakeMl / 1000).toFixed(2)}L`;
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
            motivationB: `Keep it up, ${imageUserName} â€” your effort is paying off! ✨`,
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
            motivationB: `Continua assim, ${imageUserName} â€” o teu esforço está a dar resultado! ✨`,
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
        drawProgressBar(150, 848, 780, 34, caloriesProgress, calorieColors.stop1);

        const macroRows = [
          {
            label: "Proteína",
            consumed: Math.round(macros.protein),
            goal: profile.macroGoals.protein,
            progress: macroProgress.protein,
            color: "#F97316", // Laranja
          },
          {
            label: "Carboidratos",
            consumed: Math.round(macros.carbs),
            goal: profile.macroGoals.carbs,
            progress: macroProgress.carbs,
            color: "#A855F7", // Roxo
          },
          {
            label: "Gordura",
            consumed: Math.round(macros.fat),
            goal: profile.macroGoals.fat,
            progress: macroProgress.fat,
            color: "#EAB308", // Amarelo
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
    shareFetchAbortRef.current?.abort();
    const controller = new AbortController();
    shareFetchAbortRef.current = controller;
    const response = await fetch(shareImageUrl, { signal: controller.signal });
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
    // Salvar no Supabase e mudar status para pendente
    if (session) {
      void (async () => {
        await supabase.from('profiles').update({
          name: profile.name,
          age: profile.age,
          city: profile.city,
          weight: profile.weight,
          height: profile.height,
          target_weight: profile.targetWeight,
          weekly_goal: profile.weeklyGoal,
          activity_level: onboardingActivityMap[setupActivity].profileValue,
          calorie_goal: generatedPlan.calorieGoal,
          hydration_goal_ml: generatedPlan.hydrationGoalMl,
          macro_goals: generatedPlan.macroGoals,
          status: 'ativo'
        }).eq('id', session.user.id);

        setView("home");
      })();
    } else {
      setView("home");
    }

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

  if (session === undefined) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
          <div className="w-32 h-32 rounded-3xl bg-white p-4 shadow-2xl flex items-center justify-center animate-bounce-slow">
            <img src="/lume-logo.png" alt="LUMEfit" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-brand-accent-2 animate-progress-indefinite" />
            </div>
            <p className="text-[10px] text-brand-accent-2 font-bold uppercase tracking-[0.2em] animate-pulse">
              Iniciando LUMEfit...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {!session ? (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground animate-in fade-in duration-500">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-3xl bg-white p-4 shadow-2xl animate-bounce-slow">
                <img src="/lume-logo.png" alt="LUMEfit" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">LUMEfit</h1>
                <p className="text-muted-foreground font-medium">Consistência que transforma.</p>
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8 shadow-xl border border-white/20">
              <div className="flex p-1 bg-muted/50 rounded-2xl mb-8">
                <button
                  onClick={() => { setAuthView("login"); setAuthError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${authView === "login" ? "bg-white text-brand-accent-2 shadow-sm" : "text-muted-foreground"}`}
                >
                  <LogIn className="w-4 h-4" /> Entrar
                </button>
                <button
                  onClick={() => { setAuthView("register"); setAuthError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${authView === "register" ? "bg-white text-brand-accent-2 shadow-sm" : "text-muted-foreground"}`}
                >
                  <UserPlus className="w-4 h-4" /> Criar Conta
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                    <p className="text-sm font-bold text-red-500">{authError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-muted/30 border-none px-5 focus:ring-2 focus:ring-brand-accent-2 transition-all outline-none font-medium"
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Palavra-passe</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-muted/30 border-none px-5 focus:ring-2 focus:ring-brand-accent-2 transition-all outline-none font-medium"
                    placeholder="A tua palavra-passe"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-14 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-lg shadow-lg shadow-brand-accent-2/20 transition-all active:scale-[0.98]"
                >
                  {authLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    authView === "login" ? "Entrar Agora" : "Começar Jornada"
                  )}
                </Button>
              </form>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Ao entrar, concordas com os nossos termos de serviço.
            </p>
          </div>
        </div>
      ) : (
        <>
          {mountSplash && (
            <div className={`fixed inset-0 z-[100] bg-[#ffffff] flex flex-col items-center justify-center transition-opacity duration-300 ${!showSplash && splashAnimFinished ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex flex-col items-center justify-center" style={{ animation: 'fadeIn 0.6s ease-out forwards', opacity: 0, willChange: 'opacity, transform' }}>
                <img
                  src="/lume-logo.png"
                  alt="LUMEfit Logo"
                  className="w-40 h-40 object-contain drop-shadow-sm"
                />
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="relative w-[120px] h-[3px] bg-[#2d4a38]/10 rounded-md overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#2ecc71] rounded-md"
                      style={{ animation: 'fillBar 1.4s ease-out 0.4s forwards', width: '0%', willChange: 'width' }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: 'rgba(45,74,56,0.5)' }}>
                    A preparar o teu plano...
                  </p>
                </div>
              </div>
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fillBar {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
                @keyframes fadeIn {
                  0% { opacity: 0; }
                  100% { opacity: 1; }
                }
              `}} />
            </div>
          )}

          {(!mountSplash || (!showSplash && splashAnimFinished)) && (
            <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background px-4 pt-16 pb-28">

              {showInstallPrompt && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="w-full max-w-sm glass-card rounded-[32px] p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white p-3 shadow-xl">
                      <img src="/lume-logo.png" alt="LUMEfit" className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">LUMEfit no teu telemóvel</h3>
                      <p className="text-sm text-muted-foreground">
                        Instala o app para uma experiência mais rápida, acesso offline e ecrã inteiro.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        onClick={handleInstallClick}
                        className="h-14 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 text-white font-bold text-lg shadow-lg shadow-brand-accent-2/20"
                      >
                        📲 Instalar App
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowInstallPrompt(false)}
                        className="h-12 rounded-xl text-muted-foreground font-medium"
                      >
                        Continuar na Web
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="fixed left-4 top-4 z-40 flex items-center gap-4">
                {view !== "setup" && (
                  <div className="relative">
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
                      <div className="glass-card absolute left-0 top-12 min-w-[220px] rounded-2xl p-2">
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

                        {profile.role === 'admin' && (
                          <button
                            type="button"
                            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-accent-3/30 text-brand-accent-2 font-bold"
                            onClick={() => {
                              setIsAdminOpen(true);
                              setShowTopMenu(false);
                            }}
                          >
                            <CircleUserRound className="h-4 w-4" />
                            Painel Admin
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

              </div>

              {view === "setup" && (
                <section className={shellClass}>
                  <div className="glass-card rounded-[24px] p-0">
                    <div className="flex items-center justify-between border-b border-glass-border/70 px-4 py-3">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-glass-border bg-glass"
                        onClick={showComingSoonToast}
                      >
                        ✕
                      </button>
                      <span className="h-10 w-10" />
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
                            ● IA ATIVA â€¢ ANALISANDO BIOTIPO
                          </p>
                        </div>
                      </article>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingCurrentWeightLabel}</p>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={profile.weight || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(",", ".");
                              if (val === "" || !isNaN(Number(val))) {
                                setProfile((p) => ({ ...p, weight: val === "" ? 0 : Number(val) }));
                              }
                            }}
                            className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-2xl font-semibold"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingHeightLabel}</p>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={profile.height || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(",", ".");
                              if (val === "" || !isNaN(Number(val))) {
                                setProfile((p) => ({ ...p, height: val === "" ? 0 : Number(val) }));
                              }
                            }}
                            className="h-14 rounded-2xl border-brand-accent-1/25 bg-glass-muted text-center text-2xl font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t.onboardingTargetWeightLabel}</p>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={profile.targetWeight || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(",", ".");
                            if (val === "" || !isNaN(Number(val))) {
                              setProfile((p) => ({ ...p, targetWeight: val === "" ? 0 : Number(val) }));
                            }
                          }}
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
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em]">Teu Objetivo</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Objetivo">
                          {[
                            { label: "Perder Peso", icon: Flame, value: weeklyGoals[1] },
                            { label: "Manter Peso", icon: Check, value: weeklyGoals[2] },
                            { label: "Ganhar Peso", icon: Trophy, value: weeklyGoals[weeklyGoals.length - 1] },
                          ].map((item) => {
                            const Icon = item.icon;
                            const active = profile.weeklyGoal.startsWith(item.label.split(" ")[0]);
                            return (
                              <button
                                type="button"
                                key={item.label}
                                onClick={() => setProfile(p => ({ ...p, weeklyGoal: item.value }))}
                                role="radio"
                                aria-checked={active}
                                className={`glass-card rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 ${active ? "border-brand-accent-2 shadow-[inset_0_0_0_2px_var(--color-brand-accent-2)] bg-brand-accent-1/5" : ""
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <Icon className={`h-6 w-6 ${active ? "text-brand-accent-2" : "text-muted-foreground"}`} />
                                  {active ? (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent-2 text-white">
                                      <Check className="h-4 w-4" />
                                    </span>
                                  ) : (
                                    <span className="h-6 w-6 rounded-full border border-brand-accent-1/35" />
                                  )}
                                </div>
                                <p className={`mt-3 text-2xl font-semibold ${active ? "text-brand-accent-2" : ""}`}>{item.label}</p>
                                <p className="text-sm text-muted-foreground">Focar em {item.label.toLowerCase()}</p>
                              </button>
                            );
                          })}
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
                                onClick={() => {
                                  setSetupActivity(item.key);
                                  setProfile(p => ({ ...p, activityLevel: onboardingActivityMap[item.key].profileValue }));
                                }}
                                role="radio"
                                aria-checked={active}
                                className={`glass-card rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 ${active ? "border-brand-accent-2 shadow-[inset_0_0_0_2px_var(--color-brand-accent-2)] bg-brand-accent-1/5" : ""
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <Icon className={`h-6 w-6 ${active ? "text-brand-accent-2" : "text-muted-foreground"}`} />
                                  {active ? (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent-2 text-white">
                                      <Check className="h-4 w-4" />
                                    </span>
                                  ) : (
                                    <span className="h-6 w-6 rounded-full border border-brand-accent-1/35" />
                                  )}
                                </div>
                                <p className={`mt-3 text-2xl font-semibold ${active ? "text-brand-accent-2" : ""}`}>{onboardingActivityMap[item.key].title}</p>
                                <p className="text-sm text-muted-foreground">{onboardingActivityMap[item.key].subtitle}</p>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSetupActivity("intenso");
                            setProfile(p => ({ ...p, activityLevel: onboardingActivityMap.intenso.profileValue }));
                          }}
                          role="radio"
                          aria-checked={setupActivity === "intenso"}
                          className={`glass-card mt-3 flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 ${setupActivity === "intenso"
                              ? "border-brand-accent-2 shadow-[inset_0_0_0_2px_var(--color-brand-accent-2)] bg-brand-accent-1/5"
                              : ""
                            }`}
                        >
                          <Dumbbell className={`h-6 w-6 ${setupActivity === "intenso" ? "text-brand-accent-2" : "text-muted-foreground"}`} />
                          <div>
                            <p className={`text-2xl font-semibold ${setupActivity === "intenso" ? "text-brand-accent-2" : ""}`}>{onboardingActivityMap.intenso.title}</p>
                            <p className="text-sm text-muted-foreground">{onboardingActivityMap.intenso.subtitle}</p>
                          </div>
                          {setupActivity === "intenso" ? (
                            <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent-2 text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="ml-auto h-6 w-6 rounded-full border border-brand-accent-1/35" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Button
                          onClick={onboardingDone ? handleGeneratePlan : handleOnboardingSubmit}
                          disabled={authLoading}
                          className="h-14 w-full rounded-[24px] text-lg bg-brand-accent-2 font-bold"
                        >
                          {authLoading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>{onboardingDone ? "Calcular Novo Plano com IA ✨" : "Submeter Dados para Aprovação"}</>
                          )}
                        </Button>
                        <p className="px-2 text-center text-sm text-muted-foreground">
                          Após submeter, a equipa LUMEfit irá validar os teus dados para libertar a análise com IA.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {view === "pending_plan" && (
                <section className={shellClass}>
                  <div className="glass-card rounded-[32px] p-8 text-center space-y-6">
                    <div className="mx-auto w-24 h-24 rounded-full bg-brand-accent-1/20 flex items-center justify-center text-4xl animate-bounce-slow">
                      ✨
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold">{onboardingDone ? "IA a trabalhar..." : "Perfil Aprovado!"}</h2>
                      <p className="text-muted-foreground">
                        {onboardingDone
                          ? "A nossa IA está a recalcular o teu plano com base nos novos dados que forneceste."
                          : "A tua conta foi validada. Agora a nossa IA está pronta para criar o teu plano personalizado."}
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-brand-accent-1/10 border border-brand-accent-1/20">
                      <p className="text-sm font-medium">Prepara-te para a transformação! ðŸš€</p>
                    </div>

                    {!showPlanPresentation ? (
                      <Button
                        onClick={handleGeneratePlan}
                        disabled={authLoading}
                        className="w-full h-16 rounded-2xl bg-brand-accent-2 text-xl font-bold shadow-xl shadow-brand-accent-2/20"
                      >
                        {authLoading ? (
                          <>
                            <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            A gerar plano...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-6 w-6" /> Analisar com IA
                          </>
                        )}
                      </Button>
                    ) : generatedPlan && (
                      <div ref={planResultRef} className="animate-in slide-in-from-bottom-10 duration-700">
                        <article className="glass-card rounded-[24px] p-6 text-left border-2 border-brand-accent-2/30">
                          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent-2">O teu novo plano</p>
                          <h3 className="mt-2 text-2xl font-bold">Plano Diário Sugerido</h3>
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{generatedPlan.summary}</p>

                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-muted/30 p-4 border border-glass-border">
                              <p className="text-xs text-muted-foreground">Calorias</p>
                              <p className="text-2xl font-bold text-brand-accent-2">{generatedPlan.calorieGoal} kcal</p>
                            </div>
                            <div className="rounded-2xl bg-muted/30 p-4 border border-glass-border">
                              <p className="text-xs text-muted-foreground">Hidratação</p>
                              <p className="text-2xl font-bold text-brand-accent-1">{(generatedPlan.hydrationGoalMl / 1000).toFixed(1)}L</p>
                            </div>
                          </div>

                          {generatedPlan.motivationalTip && (
                            <div className="mt-6 p-4 rounded-2xl bg-brand-accent-1/5 border-l-4 border-brand-accent-2 italic text-sm">
                              " {generatedPlan.motivationalTip} "
                            </div>
                          )}

                          <Button onClick={applyGeneratedPlan} className="mt-8 h-14 w-full rounded-2xl bg-brand-accent-2 font-bold text-lg shadow-lg shadow-brand-accent-2/20">
                            Iniciar Minha Jornada
                          </Button>
                        </article>
                      </div>
                    )}
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
                            <h3 className="text-sm text-muted-foreground">{t.todayCalories}</h3>
                            <div className="mx-auto mt-4 h-40 w-40">
                              <svg viewBox="0 0 120 120" className="h-full w-full">
                                <defs>
                                  <linearGradient id="calorieRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={calorieColors.stop1} />
                                    <stop offset="100%" stopColor={calorieColors.stop2} />
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
                            <p className="mt-3 text-sm">{t.remaining.charAt(0).toUpperCase() + t.remaining.slice(1)} {remainingCalories} {t.calories.toLowerCase()} {appLanguage === "en" ? "today" : "hoje"}</p>
                          </article>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {[
                              { label: t.proteins, value: macros.protein, key: "protein", color: "bg-macro-protein" },
                              { label: t.carbohydrates, value: macros.carbs, key: "carbs", color: "bg-macro-carbs" },
                              { label: t.fats, value: macros.fat, key: "fat", color: "bg-macro-fat" },
                            ].map((macro) => (
                              <article key={macro.key} className="glass-card rounded-xl p-3">
                                <p className="text-xs text-muted-foreground">{macro.label}</p>
                                <p className="my-2 text-sm font-medium">
                                  {Math.round(macro.value)}g / {profile.macroGoals[macro.key as "protein" | "carbs" | "fat"]}g
                                </p>
                                <Progress
                                  value={macroProgress[macro.key as "protein" | "carbs" | "fat"]}
                                  indicatorClassName={macro.color}
                                />
                              </article>
                            ))}
                          </div>

                          <article className="glass-card mt-4 rounded-[20px] p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-sm font-semibold">{t.water}</h3>
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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateWater(250)}
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent-3/30 text-brand-accent-2 transition-transform active:scale-90"
                                  >
                                    <Plus className="h-6 w-6" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateWater(-50)}
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition-transform active:scale-90"
                                  >
                                    <Minus className="h-6 w-6" />
                                  </button>
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
                                    + {appLanguage === "en" ? "Add" : "Adicionar"}
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
                                  alt={t.previewMeal}
                                  className="h-64 w-full rounded-2xl border border-brand-accent-1/40 object-cover"
                                />
                              </article>

                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground ml-1">O que tem no prato? (opcional)</label>
                                <Input
                                  value={descricaoPrato}
                                  onChange={(e) => setDescricaoPrato(e.target.value)}
                                  placeholder="Ex: xima, cacana, frango grelhado..."
                                  className="h-12 rounded-[16px] bg-glass-muted border-glass-border focus-visible:ring-brand-accent-2"
                                />
                                <div className="no-scrollbar flex overflow-x-auto gap-2 py-1 pb-2 scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
                                  {["🍽️ Xima", "🥬 Matapa", "🐟 Peixe", "🍗 Frango", "🥩 Carne", "🫘 Feijão", "🍚 Arroz", "🥗 Salada", "🌿 Cacana", "🦐 Camarão", "🍌 Banana", "🥜 Amendoim"].map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => setDescricaoPrato((prev) => prev ? `${prev}, ${chip.split(' ')[1]}` : chip.split(' ')[1])}
                                      className="whitespace-nowrap rounded-full bg-glass-muted border border-glass-border px-3 py-1.5 text-sm transition-colors active:bg-brand-accent-2/20 active:border-brand-accent-2/50"
                                      style={{ scrollSnapAlign: 'start' }}
                                    >
                                      {chip}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <Button
                                  className="h-12 w-full rounded-[18px]"
                                  onClick={() => setMealStage("analyzing")}
                                  disabled={!previewImageBase64}
                                >
                                  {!previewImageBase64 ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 mr-2" />
                                  )}
                                  {t.analyzeThis}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-11 w-full rounded-[18px]"
                                  onClick={() => {
                                    setPreviewImage(null);
                                    setMealStage("camera");
                                  }}
                                >
                                  {t.chooseAnother}
                                </Button>
                              </div>
                            </div>
                          )}

                          {mealStage === "clarification" && (
                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
                              <article className="glass-card overflow-hidden rounded-[32px] border-2 border-brand-accent-1/30 shadow-2xl shadow-brand-accent-1/10">
                                <div className="bg-gradient-to-br from-brand-accent-1/10 to-transparent p-6">
                                  <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center text-4xl mb-6 animate-bounce-slow">
                                    🤔
                                  </div>
                                  <h3 className="text-2xl font-bold text-foreground">A IA tem uma dúvida...</h3>
                                  <p className="mt-2 text-sm text-muted-foreground">Para uma análise 100% precisa, preciso de um detalhe:</p>
                                </div>

                                <div className="px-6 pb-6 space-y-6">
                                  <div className="bg-brand-accent-1/5 p-5 rounded-[24px] border-l-4 border-brand-accent-1 relative">
                                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-brand-accent-1/40" />
                                    <p className="text-foreground font-medium italic leading-relaxed">
                                      "{aiClarificationQuestion}"
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent-1/70 ml-1">Tua resposta</label>
                                    <textarea
                                      value={userClarificationResponse}
                                      onChange={(e) => setUserClarificationResponse(e.target.value)}
                                      placeholder="Ex: E um frango grelhado na air fryer com pouco azeite..."
                                      className="w-full h-36 p-5 rounded-[24px] bg-white/50 border border-glass-border focus:ring-4 focus:ring-brand-accent-1/20 focus:border-brand-accent-1 outline-none text-base transition-all shadow-inner resize-none"
                                    />
                                  </div>

                                  <div className="flex gap-3 pt-2">
                                    <Button
                                      variant="outline"
                                      className="flex-1 h-14 rounded-2xl border-glass-border hover:bg-muted/50 text-muted-foreground font-bold"
                                      onClick={() => {
                                        setUserClarificationResponse("Não tenho a certeza, analisa como preferires.");
                                        setMealStage("analyzing");
                                      }}
                                    >
                                      Pular
                                    </Button>
                                    <Button
                                      className="flex-[2] h-14 rounded-2xl bg-brand-accent-2 hover:bg-brand-accent-2/90 font-bold text-lg shadow-xl shadow-brand-accent-2/30 transition-all active:scale-[0.98]"
                                      disabled={!userClarificationResponse.trim()}
                                      onClick={() => {
                                        setMealStage("analyzing");
                                      }}
                                    >
                                      Enviar Resposta
                                    </Button>
                                  </div>
                                </div>
                              </article>
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
                                    {activeResult.confidence}% {t.accuracy} ✓
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
                                <p className="text-xs text-muted-foreground">{t.totalEstimate}</p>
                                <p className="mt-1 text-5xl font-bold text-primary">{Number(Math.round(animatedKcal)) || 0}</p>
                                <p className="text-sm font-medium">{t.estimatedKcal}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {t.basedOnPortions}
                                </p>
                                <div className="mt-4">
                                  <div className="h-3 overflow-hidden rounded-full bg-brand-accent-3/40">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-brand-accent-1 to-brand-accent-2 transition-all duration-700"
                                      style={{ width: `${Math.min(100, activeResult.dailyGoalPercent * portionMultiplier)}%` }}
                                    />
                                  </div>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    {t.thisPlateIs} {Number(Math.round(activeResult.dailyGoalPercent * portionMultiplier)) || 0}% {t.ofDailyGoal}
                                  </p>
                                </div>
                              </article>

                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  {
                                    key: "prot",
                                    label: t.proteins,
                                    value: animatedProtein,
                                    target: activeResult.protein * portionMultiplier,
                                    ring: "var(--color-macro-protein)",
                                    bg: "bg-macro-protein/10 border-macro-protein/30",
                                  },
                                  {
                                    key: "carb",
                                    label: t.carbohydrates,
                                    value: animatedCarbs,
                                    target: activeResult.carbs * portionMultiplier,
                                    ring: "var(--color-macro-carbs)",
                                    bg: "bg-macro-carbs/10 border-macro-carbs/30",
                                  },
                                  {
                                    key: "fat",
                                    label: t.fats,
                                    value: animatedFat,
                                    target: activeResult.fat * portionMultiplier,
                                    ring: "var(--color-macro-fat)",
                                    bg: "bg-macro-fat/10 border-macro-fat/30",
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
                                      <p className="text-base font-bold">{Number(Math.round(macro.value)) || 0}g</p>
                                    </article>
                                  );
                                })}
                              </div>

                              <article className="glass-card rounded-[20px] p-4">
                                <h4 className="text-sm font-semibold">{t.ingredientsIdentified}</h4>
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
                                      `🧂 ${t.sodium}: ${Math.round(activeResult.sodiumMg * portionMultiplier)}mg`,
                                      `🌾 ${t.fiber}: ${(activeResult.fiberG * portionMultiplier).toFixed(1)}g`,
                                      `🍬 ${t.sugars}: ${(activeResult.sugarsG * portionMultiplier).toFixed(1)}g`,
                                      `💊 ${t.vitaminA}: ${Math.round(activeResult.vitaminAPct * portionMultiplier)}% ${t.dv}`,
                                      `💊 ${t.vitaminC}: ${Math.round(activeResult.vitaminCPct * portionMultiplier)}% ${t.dv}`,
                                      `⚡ ${t.iron}: ${Math.round(activeResult.ironPct * portionMultiplier)}% ${t.dv}`,
                                      `🦴 ${t.calcium}: ${Math.round(activeResult.calciumPct * portionMultiplier)}% ${t.dv}`,
                                    ].map((value) => (
                                      <div key={value} className="rounded-lg border border-glass-border bg-glass px-3 py-2">
                                        {value}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </article>

                              <article className="glass-card rounded-[20px] border-l-4 border-l-brand-accent-1 p-4">
                                <h4 className="text-sm font-semibold">💡 {t.insightsForYou}</h4>
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
                                  <h4 className="text-sm font-semibold">{t.adjustPortion}</h4>
                                  <span className="rounded-full border border-brand-accent-1/40 bg-brand-accent-1/15 px-2.5 py-1 text-xs font-medium">
                                    {portionMultiplier}x â€” {t.normalPortion}
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
                                      ? t.viewSaved
                                      : isSavingMeal
                                        ? t.saving
                                        : t.addToDiary}
                                  </Button>
                                  <Button variant="outline" className="h-10 w-full" onClick={resetMealFlow}>
                                    {t.analyzeAnother}
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
                        <h2 className="text-lg font-semibold">{t.weightHistory}</h2>
                        {weightHistory.length === 0 ? (
                          <p className="mt-4 text-sm text-muted-foreground">{appLanguage === "en" ? "No weight logs yet — add your first! 🌿" : "Ainda sem registos de peso — adiciona o teu primeiro! 🌿"}</p>
                        ) : (
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
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <article className="glass-card rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Dias seguidos</p>
                          <p className="text-xl font-bold">{streakDays > 0 ? `${streakDays} 🔥` : "0"}</p>
                        </article>
                        <article className="glass-card rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Semana</p>
                          <p className="text-xl font-bold">{weeklyBars.reduce((sum, day) => sum + day.calories, 0)} kcal</p>
                        </article>
                        <article className="glass-card rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground">Média diária</p>
                          <p className="text-xl font-bold">{weeklyAverage} kcal</p>
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
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground">{day.day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {(unlockedAchievements.length > 0
                          ? unlockedAchievements
                          : ["Ainda sem dados — começa a registar hoje! 🌿"]
                        ).map((badge) => (
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
                          <div className="rounded-xl border border-glass-border bg-glass p-3 col-span-2">
                            <p className="text-xs text-muted-foreground">Validade do Acesso</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold">
                                {profile.role === 'admin' ? "🛡️ Acesso Vitalício (Admin)" :
                                  (() => {
                                    const expiry = (profile as any).expiry_date || (profile as any).expiryDate;
                                    if (!expiry) return "Pendente";
                                    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days > 0 ? `${days} dias restantes` : "Acesso Expirado";
                                  })()
                                }
                              </p>
                              {profile.role !== 'admin' && (
                                <div className="flex h-2 w-16 overflow-hidden rounded-full bg-muted/30">
                                  <div className="h-full bg-brand-accent-2" style={{ width: '100%' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card mt-4 rounded-xl p-4">
                        <h3 className="text-sm font-semibold">{t.updateWeight}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.weightHint}
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
                          {t.changePlan}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShareMode("weight");
                            setShareImageUrl(null);
                            setShowShareSheet(true);
                          }}
                        >
                          {t.shareWeightProgress}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.reload();
                          }}
                        >
                          {t.logout}
                        </Button>
                      </div>
                      {!window.matchMedia("(display-mode: standalone)").matches && (
                        <Button
                          variant="outline"
                          onClick={handleInstallClick}
                          className="w-full h-12 rounded-xl bg-brand-accent-2/5 hover:bg-brand-accent-2/10 text-brand-accent-2 border-brand-accent-2/20 mb-2"
                        >
                          📲 Instalar LUMEfit no Telemóvel
                        </Button>
                      )}
                      <p className="mt-4 text-center text-xs text-muted-foreground">LUMEfit v1.0 â€¢ {t.madeForYou}</p>
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
                    { key: "perfil", label: t.navProfile, icon: CircleUserRound },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = view === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setView(item.key as ViewKey)}
                        className={`flex min-w-[64px] flex-col items-center rounded-lg px-2 py-1 text-[11px] transition-all ${active ? "bg-brand-accent-3/30 text-brand-accent-2" : "text-muted-foreground"
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
              {isAdminOpen && (
                <AdminPanel
                  onClose={() => setIsAdminOpen(false)}
                  setToastMessage={setToastMessage}
                  setShowToast={setShowToast}
                  setManagedTimeout={setManagedTimeout}
                />
              )}
              {view === "waiting_approval" && profile.role !== 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-center">
                  <div className="max-w-xs space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-brand-accent-2/10 text-4xl">
                      ⏳
                      <div className="absolute inset-0 rounded-full border-2 border-brand-accent-2 border-t-transparent animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Aguardando Aprovação</h2>
                      <p className="text-sm text-muted-foreground">
                        O seu perfil está em análise pela equipa LUMEfit. <br />
                        Assim que o seu pagamento for confirmado, terá acesso total ✨
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-glass border border-glass-border">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-accent-2 mb-1">Dica</p>
                      <p className="text-xs text-muted-foreground">Pode fechar o app, nós notificaremos assim que for libertado!</p>
                    </div>

                  </div>
                </div>
              )}

              {view === "blocked" && profile.role !== 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-center">
                  <div className="max-w-xs space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-50 text-5xl">
                      🚫
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold">Acesso Suspenso</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Você foi retirado do acesso do app. <br />
                        Para regularizar a sua conta, entre em contacto com o suporte da LUMEfit no Instagram.
                      </p>
                    </div>
                    <a
                      href="https://instagram.com/lumefit.ao"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
                    >
                      @lumefit no Instagram
                    </a>
                  </div>
                </div>
              )}

              {view === "expired" && profile.role !== 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-center">
                  <div className="max-w-xs space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-orange-50 text-5xl">
                      ⚠️
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold">Plano Expirado</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        O seu tempo de acesso ao app terminou. <br />
                        Renove o plano para o acesso do app!
                      </p>
                    </div>
                    <a
                      href="https://instagram.com/lumefit.ao"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
                    >
                      Renovar no Instagram
                    </a>

                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.reload();
                        }}
                        className="text-xs font-bold text-muted-foreground underline underline-offset-4"
                      >
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}

