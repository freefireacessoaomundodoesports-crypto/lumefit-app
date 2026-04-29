export type MealType = "pequeno-almoco" | "almoco" | "jantar" | "lanches";

export type FoodItem = {
  id: string;
  name: string;
  portion: string;
  calories: number;
  category: string;
};

export type MockMealResult = {
  id: string;
  mealName: string;
  cuisineTag: string;
  confidence: number;
  estimatedKcal: number;
  protein: number;
  carbs: number;
  fat: number;
  dailyGoalPercent: number;
  sodiumMg: number;
  fiberG: number;
  sugarsG: number;
  vitaminAPct: number;
  vitaminCPct: number;
  ironPct: number;
  calciumPct: number;
  imageSeed: string;
  ingredients: Array<{ name: string; calories: number; note: string }>;
  insights: string[];
};

export const cities = ["Maputo", "Beira", "Nampula", "Quelimane", "Tete", "Outro"];

export const weeklyGoals = [
  "Perder 0.5kg/semana",
  "Perder 1kg/semana",
  "Manter o peso",
  "Ganhar 0.5kg/semana",
  "Ganhar 1kg/semana",
];

export const activityLevels = [
  "Fico muito em casa",
  "Caminho um pouco",
  "Sou moderadamente ativa",
] as const;

export const mealLabels: Record<MealType, string> = {
  "pequeno-almoco": "🌅 Pequeno-Almoço",
  almoco: "☀️ Almoço",
  jantar: "🌙 Jantar",
  lanches: "🍎 Lanches",
};

export const foodDatabase: FoodItem[] = [
  { id: "xima", name: "Xima", portion: "prato médio", calories: 280, category: "Cereais & Farináceos" },
  { id: "arroz-branco", name: "Arroz branco cozido", portion: "1 chávena", calories: 206, category: "Cereais & Farináceos" },
  { id: "arroz-integral", name: "Arroz integral cozido", portion: "1 chávena", calories: 216, category: "Cereais & Farináceos" },
  { id: "pao", name: "Pão de trigo", portion: "1 fatia", calories: 79, category: "Cereais & Farináceos" },
  { id: "chima-milho", name: "Chima de milho", portion: "prato médio", calories: 260, category: "Cereais & Farináceos" },
  { id: "feijao-nhemba", name: "Feijão nhemba cozido", portion: "1 chávena", calories: 230, category: "Leguminosas" },
  { id: "feijao-manteiga", name: "Feijão manteiga cozido", portion: "1 chávena", calories: 212, category: "Leguminosas" },
  { id: "ervilhas", name: "Ervilhas cozidas", portion: "1 chávena", calories: 134, category: "Leguminosas" },
  { id: "lentilhas", name: "Lentilhas cozidas", portion: "1 chávena", calories: 230, category: "Leguminosas" },
  { id: "matapa", name: "Matapa", portion: "prato médio com amendoim", calories: 320, category: "Vegetais & Folhas" },
  { id: "couve", name: "Couve refogada", portion: "1 porção", calories: 45, category: "Vegetais & Folhas" },
  { id: "mapewa", name: "Mapewa/folhas de mandioca", portion: "1 porção", calories: 90, category: "Vegetais & Folhas" },
  { id: "abobora", name: "Abóbora cozida", portion: "1 chávena", calories: 49, category: "Vegetais & Folhas" },
  { id: "tomate", name: "Tomate", portion: "1 médio", calories: 22, category: "Vegetais & Folhas" },
  { id: "cebola", name: "Cebola", portion: "1 média", calories: 44, category: "Vegetais & Folhas" },
  { id: "frango-grelhado", name: "Frango grelhado sem pele", portion: "1 perna", calories: 180, category: "Proteínas" },
  { id: "frango-cozido", name: "Frango cozido com pele", portion: "1 perna", calories: 245, category: "Proteínas" },
  { id: "peixe-seco", name: "Peixe seco", portion: "1 porção média", calories: 150, category: "Proteínas" },
  { id: "peixe-fresco", name: "Peixe fresco grelhado", portion: "1 posta", calories: 140, category: "Proteínas" },
  { id: "camarao", name: "Camarão grelhado", portion: "100g", calories: 99, category: "Proteínas" },
  { id: "carne-vaca", name: "Carne de vaca grelhada", portion: "100g", calories: 250, category: "Proteínas" },
  { id: "ovo-cozido", name: "Ovo cozido", portion: "1 unidade", calories: 78, category: "Proteínas" },
  { id: "ovo-frito", name: "Ovo frito", portion: "1 unidade", calories: 90, category: "Proteínas" },
  { id: "manga", name: "Manga", portion: "1 média", calories: 135, category: "Frutos Locais" },
  { id: "banana", name: "Banana", portion: "1 média", calories: 105, category: "Frutos Locais" },
  { id: "papaia", name: "Papaia", portion: "1 fatia média", calories: 55, category: "Frutos Locais" },
  { id: "coco", name: "Coco fresco", portion: "1 pedaço médio", calories: 159, category: "Frutos Locais" },
  { id: "amendoim", name: "Amendoim", portion: "1 punhado - 30g", calories: 170, category: "Frutos Locais" },
  { id: "caju", name: "Cajú", portion: "10 unidades", calories: 157, category: "Frutos Locais" },
  { id: "oleo", name: "Óleo de palma/cozinha", portion: "1 colher sopa", calories: 120, category: "Outros" },
  { id: "leite-coco", name: "Leite de coco", portion: "1 chávena", calories: 445, category: "Outros" },
  { id: "acucar", name: "Açúcar", portion: "1 colher chá", calories: 16, category: "Outros" },
  { id: "cha-preto", name: "Chá preto sem açúcar", portion: "1 chávena", calories: 2, category: "Outros" },
  { id: "refrigerante", name: "Refrigerante", portion: "1 lata", calories: 140, category: "Outros" },
  { id: "agua", name: "Água", portion: "1 copo", calories: 0, category: "Outros" },
];

export const quotes = [
  "Cada refeição é uma nova oportunidade para cuidar de ti.",
  "Pequenos passos hoje, grandes resultados amanhã.",
  "Tu consegues — consistência é o teu superpoder.",
  "Mais leve, mais forte, mais confiante.",
];

export const weeklyPlan = [
  {
    day: "Segunda",
    meals: [
      "Pequeno-almoço: Chá + 1 ovo cozido + 1 fatia de pão (157 kcal)",
      "Almoço: Xima pequena + frango grelhado + couve (505 kcal)",
      "Jantar: Arroz + peixe grelhado + tomate (420 kcal)",
      "Lanches: 1 banana + amendoim (275 kcal)",
    ],
  },
  {
    day: "Terça",
    meals: [
      "Pequeno-almoço: Papaia + 2 ovos cozidos (211 kcal)",
      "Almoço: Arroz integral + feijão nhemba + couve (476 kcal)",
      "Jantar: Xima pequena + camarão grelhado (379 kcal)",
      "Lanches: Manga pequena + cajú (292 kcal)",
    ],
  },
  {
    day: "Quarta",
    meals: [
      "Pequeno-almoço: Chá + pão + banana (186 kcal)",
      "Almoço: Chima de milho + peixe seco + tomate (432 kcal)",
      "Jantar: Arroz branco + feijão manteiga + couve (463 kcal)",
      "Lanches: Papaia + amendoim (225 kcal)",
    ],
  },
  {
    day: "Quinta",
    meals: [
      "Pequeno-almoço: Papaia + 1 ovo cozido (133 kcal)",
      "Almoço: Xima pequena + carne de vaca grelhada + cebola (544 kcal)",
      "Jantar: Arroz integral + peixe fresco + abóbora (405 kcal)",
      "Lanches: Manga + chá sem açúcar (137 kcal)",
    ],
  },
  {
    day: "Sexta",
    meals: [
      "Pequeno-almoço: Banana + 2 ovos cozidos (261 kcal)",
      "Almoço: Arroz branco + frango grelhado + tomate (428 kcal)",
      "Jantar: Matapa moderada + camarão grelhado (419 kcal)",
      "Lanches: Cajú + chá preto (159 kcal)",
    ],
  },
  {
    day: "Sábado",
    meals: [
      "Pequeno-almoço: Chá + pão + ovo cozido (159 kcal)",
      "Almoço: Xima + peixe fresco + couve (465 kcal)",
      "Jantar: Arroz integral + lentilhas + tomate (468 kcal)",
      "Lanches: Banana + papaia (160 kcal)",
    ],
  },
  {
    day: "Domingo",
    meals: [
      "Pequeno-almoço: Papaia + pão + chá (136 kcal)",
      "Almoço: Arroz branco + frango cozido + couve (496 kcal)",
      "Jantar: Xima pequena + peixe seco + abóbora (479 kcal)",
      "Lanches: Manga + cajú (292 kcal)",
    ],
  },
];

export const mockMealResults: MockMealResult[] = [
  {
    id: "mock-xima-matapa",
    mealName: "Xima com Matapa e Frango",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 98,
    estimatedKcal: 487,
    protein: 28,
    carbs: 58,
    fat: 14,
    dailyGoalPercent: 35,
    sodiumMg: 420,
    fiberG: 4.2,
    sugarsG: 2.1,
    vitaminAPct: 15,
    vitaminCPct: 22,
    ironPct: 18,
    calciumPct: 8,
    imageSeed: "xima-matapa",
    ingredients: [
      { name: "Xima (farinha de milho)", calories: 280, note: "Principal fonte de energia desta refeição." },
      { name: "Matapa (folhas de mandioca)", calories: 85, note: "Contribui com fibra e micronutrientes vegetais." },
      { name: "Amendoim (molho)", calories: 72, note: "Aumenta gordura saudável e proteína vegetal." },
      { name: "Frango grelhado", calories: 50, note: "Pequena porção de proteína magra." },
    ],
    insights: [
      "✅ Boa fonte de proteína vegetal com o amendoim",
      "⚠️ Porção de xima um pouco grande — considera reduzir 20%",
      "💧 Bebe um copo de água após esta refeição",
    ],
  },
  {
    id: "mock-arroz-frango",
    mealName: "Arroz com Frango Grelhado",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 96,
    estimatedKcal: 412,
    protein: 31,
    carbs: 46,
    fat: 10,
    dailyGoalPercent: 29,
    sodiumMg: 360,
    fiberG: 3.8,
    sugarsG: 1.8,
    vitaminAPct: 11,
    vitaminCPct: 19,
    ironPct: 16,
    calciumPct: 7,
    imageSeed: "arroz-frango",
    ingredients: [
      { name: "Arroz branco cozido", calories: 220, note: "Base de carboidrato de absorção rápida." },
      { name: "Frango grelhado", calories: 160, note: "Proteína com boa saciedade." },
      { name: "Tomate e cebola", calories: 32, note: "Adiciona volume e micronutrientes." },
    ],
    insights: [
      "✅ Perfil equilibrado para recuperação pós-treino",
      "🌿 Junta mais couve para aumentar fibra",
      "💧 Mantém hidratação para melhor digestão",
    ],
  },
  {
    id: "mock-feijao-arroz",
    mealName: "Feijão Nhemba com Arroz",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 95,
    estimatedKcal: 390,
    protein: 18,
    carbs: 60,
    fat: 8,
    dailyGoalPercent: 28,
    sodiumMg: 310,
    fiberG: 8.6,
    sugarsG: 2.5,
    vitaminAPct: 9,
    vitaminCPct: 14,
    ironPct: 21,
    calciumPct: 10,
    imageSeed: "feijao-nhemba",
    ingredients: [
      { name: "Feijão nhemba cozido", calories: 210, note: "Rico em fibra e proteína vegetal." },
      { name: "Arroz integral", calories: 155, note: "Carboidrato com melhor saciedade." },
      { name: "Couve refogada", calories: 25, note: "Aumenta micronutrientes da refeição." },
    ],
    insights: [
      "✅ Excelente refeição de fibra para saciedade",
      "⚖️ Boa combinação de proteína vegetal e carboidrato",
      "🍋 Um toque de limão ajuda na absorção de ferro",
    ],
  },
  {
    id: "mock-peixe-xima",
    mealName: "Peixe Frito com Xima",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 94,
    estimatedKcal: 520,
    protein: 34,
    carbs: 52,
    fat: 20,
    dailyGoalPercent: 37,
    sodiumMg: 470,
    fiberG: 3.1,
    sugarsG: 1.4,
    vitaminAPct: 8,
    vitaminCPct: 10,
    ironPct: 19,
    calciumPct: 11,
    imageSeed: "peixe-xima",
    ingredients: [
      { name: "Peixe frito", calories: 250, note: "Alto teor de proteína, com gordura de fritura." },
      { name: "Xima", calories: 250, note: "Fonte principal de energia no prato." },
      { name: "Molho leve", calories: 20, note: "Contribuição calórica pequena." },
    ],
    insights: [
      "✅ Refeição rica em proteína animal",
      "⚠️ Considera peixe grelhado para reduzir gordura",
      "🥗 Adiciona vegetais para equilibrar o prato",
    ],
  },
  {
    id: "mock-matapa",
    mealName: "Matapa Simples",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 97,
    estimatedKcal: 310,
    protein: 12,
    carbs: 24,
    fat: 18,
    dailyGoalPercent: 22,
    sodiumMg: 290,
    fiberG: 5.3,
    sugarsG: 1.2,
    vitaminAPct: 26,
    vitaminCPct: 24,
    ironPct: 17,
    calciumPct: 14,
    imageSeed: "matapa",
    ingredients: [
      { name: "Folhas de mandioca", calories: 70, note: "Ricas em micronutrientes vegetais." },
      { name: "Amendoim", calories: 170, note: "Fornece gordura saudável e energia." },
      { name: "Leite de coco", calories: 70, note: "Traz cremosidade e densidade energética." },
    ],
    insights: [
      "✅ Refeição rica em gorduras boas do amendoim",
      "⚖️ Mantém porção moderada pelo teor energético",
      "💧 Água ajuda a equilibrar a digestão desta refeição",
    ],
  },
  {
    id: "mock-frango-legumes",
    mealName: "Frango com Legumes",
    cuisineTag: "🇲🇿 Cozinha Moçambicana",
    confidence: 95,
    estimatedKcal: 350,
    protein: 33,
    carbs: 22,
    fat: 12,
    dailyGoalPercent: 25,
    sodiumMg: 340,
    fiberG: 6.1,
    sugarsG: 3.2,
    vitaminAPct: 20,
    vitaminCPct: 29,
    ironPct: 14,
    calciumPct: 9,
    imageSeed: "frango-legumes",
    ingredients: [
      { name: "Frango grelhado", calories: 200, note: "Proteína principal da refeição." },
      { name: "Couve e abóbora", calories: 90, note: "Boa combinação de fibra e micronutrientes." },
      { name: "Cebola e tomate", calories: 60, note: "Contribuem sabor e baixo impacto calórico." },
    ],
    insights: [
      "✅ Opção leve com boa densidade nutricional",
      "💪 Excelente refeição para manter massa muscular",
      "🌿 Pode adicionar feijão para mais fibra",
    ],
  },
];

export const tips = [
  "Cozinha com menos óleo — usa 1 colher em vez de 3",
  "Bebe 8 copos de água por dia 💧",
  "Come devagar — o cérebro demora 20 min a sentir saciedade",
  "Matapa é nutritivo — mas atenção à quantidade de amendoim",
];
