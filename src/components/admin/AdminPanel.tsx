import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export type AdminTab = "visao" | "utilizadores" | "pagamentos" | "sistema";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "ativo" | "pendente" | "bloqueado" | "setup";
  role: "user" | "admin";
  expiryDate?: string;
  daysUsing?: number;
}

export interface AdminPaymentLog {
  id: string;
  userName: string;
  email: string;
  amount: number;
  date: string;
  status: "confirmado" | "pendente";
}

interface AdminPanelProps {
  onClose: () => void;
  setToastMessage: (msg: string) => void;
  setShowToast: (show: boolean) => void;
  setManagedTimeout: (callback: () => void, delay: number) => void;
}

export function AdminPanel({ onClose, setToastMessage, setShowToast, setManagedTimeout }: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<AdminTab>("visao");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminPayments, setAdminPayments] = useState<AdminPaymentLog[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState("Todos");
  const [showUserDetail, setShowUserDetail] = useState<AdminUser | null>(null);
  const [adminConfirm, setAdminConfirm] = useState<{title: string, desc: string, onConfirm: () => void} | null>(null);
  const [customDays, setCustomDays] = useState<string>("");
  
  // Estado para Modal de Confirmação de Pagamento
  const [paymentModalUser, setPaymentModalUser] = useState<AdminUser | null>(null);
  const [paymentModalMonths, setPaymentModalMonths] = useState<number>(1);
  const [paymentModalAmount, setPaymentModalAmount] = useState<string>("350");

  // Estado para filtro de mês no histórico de faturamento
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("todos");
  const [stats, setStats] = useState({
    todayScans: 0,
    totalScans: 0,
    scanErrors: 0,
    activeToday: 0,
    inactive23: 0,
    highStreak: 0,
    growthData: [0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      // Fetch users
      const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (users) {
        setAdminUsers(users.map(u => ({
          id: u.id,
          name: u.name || "Sem nome",
          email: u.email || "",
          phone: u.phone || "",
          status: u.status as any,
          role: u.role as any,
          expiryDate: u.expiry_date,
          daysUsing: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))
        })));

        // Growth data (last 7 days)
        const now = new Date();
        const dailyGrowth = [0, 0, 0, 0, 0, 0, 0];
        users.forEach(u => {
          const created = new Date(u.created_at);
          const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            dailyGrowth[6 - diffDays]++;
          }
        });
        setStats(prev => ({ ...prev, growthData: dailyGrowth }));
      }

      // Fetch real payments revenue
      const { data: pays } = await supabase.from('payments').select('*, profiles(name, email)').order('created_at', { ascending: false });
      if (pays) {
        setAdminPayments(pays.map(p => ({
          id: p.id,
          userName: (p as any).profiles?.name || "Desconhecido",
          email: (p as any).profiles?.email || "",
          amount: Number(p.amount),
          date: p.created_at,
          status: p.status as any
        })));
      }

      // Fetch real scanner usage
      const { data: meals } = await supabase.from('meals').select('timestamp');
      if (meals) {
        const total = meals.length;
        const today = meals.filter(m => {
          const d = new Date(m.timestamp);
          const now = new Date();
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        // Active users (unique users who scanned today)
        const { data: activeTodayUsers } = await supabase.from('meals').select('user_id').gte('timestamp', new Date(new Date().setHours(0,0,0,0)).toISOString());
        const uniqueActiveToday = new Set(activeTodayUsers?.map(u => u.user_id)).size;

        setStats(prev => ({ 
          ...prev, 
          totalScans: total, 
          todayScans: today,
          activeToday: uniqueActiveToday
        }));
      }
    };
    fetchAdminData();
  }, []);

  // --- CÁLCULO FINANCEIRO HÍBRIDO (PASSADO COM 250 MT + FUTURO COM VALORES REAIS) ---
  const monthNames: Record<string, string> = {
    "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
    "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
    "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
  };

  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split("-");
    return `${monthNames[month] || month} ${year}`;
  };

  // Mês atual e Mês passado keys
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Agrupar pagamentos por mês
  const monthlyRevenueMap: Record<string, number> = {};

  // 1. Somar pagamentos reais
  adminPayments.forEach(p => {
    const k = getMonthKey(p.date);
    if (k) {
      monthlyRevenueMap[k] = (monthlyRevenueMap[k] || 0) + p.amount;
    }
  });

  // 2. Para meses onde utilizadores ativos entraram mas não há pagamentos gravados, calcular 250 MT retroativo por utilizador
  adminUsers.forEach(u => {
    if (u.role === "user" && u.status === "ativo") {
      // Se tiver data de expiração ou criação
      const k = u.expiryDate ? getMonthKey(u.expiryDate) : currentMonthKey;
      if (k && !monthlyRevenueMap[k]) {
        // Se o mês não tiver transações registradas em payments, atribui 250 MT por utilizador
        const paymentsInMonth = adminPayments.filter(p => getMonthKey(p.date) === k);
        if (paymentsInMonth.length === 0) {
          monthlyRevenueMap[k] = (monthlyRevenueMap[k] || 0) + 250;
        }
      }
    }
  });

  // Garantir que o mês atual e o mês passado existem no mapa mesmo que zero
  if (monthlyRevenueMap[currentMonthKey] === undefined) monthlyRevenueMap[currentMonthKey] = 0;
  if (monthlyRevenueMap[prevMonthKey] === undefined) monthlyRevenueMap[prevMonthKey] = 0;

  // Garantir que utilizadores ativos tenham receita calculada no mês atual caso não haja pagamentos explícitos
  const currentPaymentsCount = adminPayments.filter(p => getMonthKey(p.date) === currentMonthKey).length;
  if (currentPaymentsCount === 0) {
    const activeUsersCount = adminUsers.filter(u => u.status === "ativo" && u.role === "user").length;
    monthlyRevenueMap[currentMonthKey] = activeUsersCount * 250;
  }

  // Lista de todos os meses ordenados do mais recente para o mais antigo
  const allAvailableMonths = Array.from(new Set([
    currentMonthKey,
    prevMonthKey,
    ...Object.keys(monthlyRevenueMap),
    ...adminPayments.map(p => getMonthKey(p.date)).filter(Boolean)
  ])).sort().reverse();

  // Receita total histórica combinada
  const totalAllTimeRevenue = Object.values(monthlyRevenueMap).reduce((acc, curr) => acc + curr, 0);

  // Métrica de comparatividade Mês Atual vs Mês Passado
  const currentMonthRevenue = monthlyRevenueMap[currentMonthKey] || 0;
  const prevMonthRevenue = monthlyRevenueMap[prevMonthKey] || 0;

  let revenueDiffPercent = 0;
  if (prevMonthRevenue > 0) {
    revenueDiffPercent = Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
  } else if (currentMonthRevenue > 0) {
    revenueDiffPercent = 100;
  }

  // Métricas de entradas de novos utilizadores
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const newUsersToday = adminUsers.filter(u => u.role === "user" && u.daysUsing === 0).length;
  const newUsersWeek = adminUsers.filter(u => u.role === "user" && (u.daysUsing || 0) <= 7).length;
  const newUsersMonth = adminUsers.filter(u => u.role === "user" && (u.daysUsing || 0) <= 30).length;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-background animate-in fade-in slide-in-from-bottom-4 duration-400 flex flex-col">
        <div className="shrink-0 sticky top-0 z-50 bg-glass/80 backdrop-blur-xl border-b border-glass-border px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl"
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Painel Administrativo 
                <span className="bg-brand-accent-2/20 text-brand-accent-2 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">LUMEfit Business</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
          {adminTab === "visao" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">👥</span>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Activos</p>
                  <h3 className="text-2xl font-bold text-brand-accent-2">{adminUsers.filter(u => u.status === "ativo" && u.role === "user").length}</h3>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">💰</span>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Receita Total</p>
                  <h3 className="text-2xl font-bold text-brand-accent-2">MT {totalAllTimeRevenue}</h3>
                </div>
              </div>

              {/* Banner Comparativo de Lucratividade: Mês Atual vs Mês Passado */}
              <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-brand-accent-2/10 via-background to-green-500/10 border border-brand-accent-2/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">Comparativo de Lucro</p>
                      <p className="text-[11px] text-muted-foreground">{formatMonthKey(currentMonthKey)} vs {formatMonthKey(prevMonthKey)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    revenueDiffPercent >= 0 ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {revenueDiffPercent >= 0 ? `📈 +${revenueDiffPercent}%` : `📉 ${revenueDiffPercent}%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-glass-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{formatMonthKey(currentMonthKey)}</p>
                    <p className="text-lg font-bold text-brand-accent-2">MT {currentMonthRevenue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{formatMonthKey(prevMonthKey)}</p>
                    <p className="text-lg font-bold text-muted-foreground">MT {prevMonthRevenue}</p>
                  </div>
                </div>
              </div>

              {/* Painel de Novas Adesões */}
              <div className="glass-card p-4 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span className="text-base">🚀</span> Novas Adesões de Utilizadores
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-glass-muted border border-glass-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Hoje</p>
                    <p className="text-base font-bold text-foreground">{newUsersToday}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-glass-muted border border-glass-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Esta Semana</p>
                    <p className="text-base font-bold text-brand-accent-2">{newUsersWeek}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-glass-muted border border-glass-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Este Mês</p>
                    <p className="text-base font-bold text-green-600">{newUsersMonth}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Retenção e Actividade
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entraram hoje (scans):</span>
                    <span className="font-bold">{stats.activeToday}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilizadores inactivos (estimativa):</span>
                    <span className="font-bold">{adminUsers.filter(u => u.role === "user").length - stats.activeToday}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de Refeições no App:</span>
                    <span className="font-bold">{stats.totalScans}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold">Novos utilizadores — últimos 7 dias</h4>
                <div className="h-32 flex items-end justify-between gap-1 px-2">
                  {stats.growthData.map((val, i) => {
                    const max = Math.max(...stats.growthData, 1);
                    const heightPct = (val / max) * 100;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-brand-accent-2/60 rounded-t-lg transition-all duration-500" 
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    );
                  })}
                </div>
                {Math.max(...stats.growthData) === 0 && <p className="text-center text-xs text-muted-foreground italic">Ainda sem dados de crescimento 🌱</p>}
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-brand-accent-2" />
                  Scanner Usage
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Hoje</p>
                    <p className="font-bold">{stats.todayScans}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                    <p className="font-bold">{stats.totalScans}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Ativos</p>
                    <p className="font-bold text-brand-accent-2">{stats.activeToday}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === "utilizadores" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="relative">
                <Input 
                  placeholder="Pesquisar utilizador..." 
                  className="bg-glass border-glass-border rounded-xl pl-10"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-lg">🔍</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {["Todos", "Activos", "Pendentes", "Bloqueados", "A Expirar", "Expiradas"].map(f => {
                  const active = userFilter === f;
                  return (
                    <button 
                      key={f} 
                      onClick={() => setUserFilter(f)}
                      className={`shrink-0 px-4 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                        active 
                          ? "bg-brand-accent-2 text-white border-brand-accent-2 shadow-lg shadow-brand-accent-2/20" 
                          : "bg-glass border-glass-border text-muted-foreground hover:bg-glass/80"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {(() => {
                  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                  const query = normalize(searchUserQuery);

                  const isExpired = (u: typeof adminUsers[0]) => {
                    if (!u.expiryDate) return false;
                    return new Date(u.expiryDate).getTime() < Date.now();
                  };

                  const filtered = adminUsers.filter(u => {
                    const matchesQuery = normalize(u.name).includes(query) || normalize(u.email).includes(query);
                    if (!matchesQuery) return false;

                    if (userFilter === "Todos") return !isExpired(u); // Expiradas ficam fora do "Todos"
                    if (userFilter === "Activos") return u.status?.toLowerCase() === "ativo" && !isExpired(u);
                    if (userFilter === "Pendentes") return u.status?.toLowerCase() === "pendente" || u.status?.toLowerCase() === "setup";
                    if (userFilter === "Bloqueados") return u.status?.toLowerCase() === "bloqueado";
                    if (userFilter === "A Expirar") {
                      if (!u.expiryDate || isExpired(u)) return false;
                      const diff = new Date(u.expiryDate).getTime() - Date.now();
                      const days = diff / (1000 * 60 * 60 * 24);
                      return days >= 0 && days <= 7;
                    }
                    if (userFilter === "Expiradas") return isExpired(u);
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="glass-card p-10 rounded-2xl text-center space-y-2">
                        <p className="text-sm font-bold">
                          {userFilter === "Expiradas" ? "Nenhuma conta expirada 🎉" : "Nenhum utilizador encontrado 🔍"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {userFilter === "Expiradas" ? "Todos os utilizadores estão com o acesso em dia." : "Tenta outro nome ou email"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {userFilter === "Expiradas" && (
                        <div className="flex items-center gap-2 px-1 py-2">
                          <span className="text-base">🔴</span>
                          <p className="text-sm font-bold text-red-500">{filtered.length} conta{filtered.length !== 1 ? "s" : ""} expirada{filtered.length !== 1 ? "s" : ""}</p>
                          <div className="flex-1 h-px bg-red-200" />
                        </div>
                      )}
                      {filtered.map(user => {
                        const expired = isExpired(user);
                        const daysOverdue = expired && user.expiryDate
                          ? Math.ceil((Date.now() - new Date(user.expiryDate).getTime()) / (1000 * 60 * 60 * 24))
                          : 0;

                        return (
                          <button
                            key={user.id}
                            onClick={() => setShowUserDetail(user)}
                            className={`glass-card w-full p-4 rounded-2xl flex items-center gap-4 text-left active:scale-[0.98] transition-transform ${
                              expired ? "border border-red-300/50 bg-red-50/30" : ""
                            }`}
                          >
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold border ${
                              expired
                                ? "bg-red-100 text-red-600 border-red-300"
                                : "bg-brand-accent-2/20 text-brand-accent-2 border-brand-accent-2/30"
                            }`}>
                              {user.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold truncate">{user.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {expired ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                                    💀 Expirada
                                  </span>
                                ) : (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    user.status === "ativo" ? "bg-green-100 text-green-700" :
                                    (user.status === "pendente" || user.status === "setup") ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {user.status === "ativo" ? "🟢 Activo" :
                                     user.status === "setup" ? "🟡 No Onboarding" :
                                     user.status === "pendente" ? "🟡 Pendente" : "🔴 Bloqueado"}
                                  </span>
                                )}
                                {expired && daysOverdue > 0 ? (
                                  <span className="text-[10px] text-red-500 font-bold">Expirou há {daysOverdue} dia{daysOverdue !== 1 ? "s" : ""}</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">Há {user.daysUsing || 0} dias</span>
                                )}
                              </div>
                            </div>
                            <span className="text-muted-foreground">›</span>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {adminTab === "pagamentos" && (() => {
            const displayRevenue = selectedMonthFilter === "todos"
              ? totalAllTimeRevenue
              : (monthlyRevenueMap[selectedMonthFilter] || 0);

            const filteredPayments = selectedMonthFilter === "todos"
              ? adminPayments
              : adminPayments.filter(p => getMonthKey(p.date) === selectedMonthFilter);

            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Faturado Histórico Total</p>
                    <p className="text-xl font-bold text-brand-accent-2 mt-0.5">MT {totalAllTimeRevenue}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      {selectedMonthFilter === "todos" ? "Total Selecionado" : "Faturado em " + formatMonthKey(selectedMonthFilter)}
                    </p>
                    <p className="text-xl font-bold text-green-600 mt-0.5">MT {displayRevenue}</p>
                  </div>
                </div>

                {/* Banner Comparativo de Lucratividade na aba Financeira */}
                <div className="glass-card p-4 rounded-2xl bg-muted/20 border border-glass-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">📈 Comparativo Mensal de Lucro</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      revenueDiffPercent >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {revenueDiffPercent >= 0 ? `+${revenueDiffPercent}%` : `${revenueDiffPercent}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-muted-foreground">{formatMonthKey(currentMonthKey)}: <strong className="text-foreground">MT {currentMonthRevenue}</strong></span>
                    <span className="text-muted-foreground">{formatMonthKey(prevMonthKey)}: <strong className="text-foreground">MT {prevMonthRevenue}</strong></span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold px-1">Pedidos de Acesso Pendentes</h4>
                  {adminUsers.filter(u => u.status === "pendente").length === 0 ? (
                    <div className="glass-card p-6 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground">Nenhum pedido pendente 🎉</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.filter(u => u.status === "pendente").map(user => (
                        <div key={user.id} className="glass-card p-4 rounded-2xl">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">Pendente</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1 h-10 text-xs bg-brand-accent-2 hover:bg-brand-accent-2/90 font-bold" 
                              onClick={() => {
                                setPaymentModalUser(user);
                                setPaymentModalMonths(1);
                                setPaymentModalAmount("350");
                              }}
                            >
                              ✅ Confirmar Pagamento (350 MT)
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-10 px-3 text-xs text-red-500 border-red-200" 
                              onClick={async () => {
                                const { error } = await supabase
                                  .from('profiles')
                                  .update({ status: 'bloqueado' })
                                  .eq('id', user.id);
                                
                                if (!error) {
                                  setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "bloqueado" } : u));
                                }
                              }}
                            >
                              ❌ Ignorar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                    <h4 className="text-sm font-bold">Histórico de Faturamentos</h4>
                    
                    {/* Filtro de Meses */}
                    <select
                      value={selectedMonthFilter}
                      onChange={(e) => setSelectedMonthFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-glass border border-glass-border text-xs font-bold outline-none focus:ring-2 focus:ring-brand-accent-2"
                    >
                      <option value="todos">🗓 Todos os Meses</option>
                      {allAvailableMonths.map(mKey => (
                        <option key={mKey} value={mKey}>
                          📅 {formatMonthKey(mKey)} (MT {monthlyRevenueMap[mKey] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="glass-card p-6 rounded-2xl text-center italic text-xs text-muted-foreground">
                      Nenhum pagamento registado para este período
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPayments.map(pay => (
                        <div key={pay.id} className="glass-card p-3.5 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground">{pay.userName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(pay.date).toLocaleDateString("pt-MZ")} às {new Date(pay.date).toLocaleTimeString("pt-MZ", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand-accent-2">+ MT {pay.amount}</p>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold uppercase">
                              Confirmado
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {adminTab === "sistema" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="glass-card p-5 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold">Monitor de Erros</h4>
                <p className="text-xs text-muted-foreground italic text-center p-4">Nenhum erro registado 🎉</p>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold">App Performance</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versão do app:</span>
                    <span className="font-bold">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última actualização:</span>
                    <span className="font-bold">{new Date().toLocaleDateString("pt-MZ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Armazenamento:</span>
                    <span className="font-bold">~{Math.round(JSON.stringify(localStorage).length / 1024)} KB</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 h-9 rounded-xl text-xs"
                    onClick={() => {
                      try {
                        const now = Date.now();
                        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                        let clearedCount = 0;
                        
                        const keysToRemove: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && key.startsWith("entries_")) {
                            const dateStr = key.replace("entries_", "");
                            const entryDate = new Date(dateStr).getTime();
                            if (!isNaN(entryDate) && (now - entryDate > thirtyDaysMs)) {
                              keysToRemove.push(key);
                            }
                          }
                        }
                        
                        keysToRemove.forEach(k => localStorage.removeItem(k));
                        clearedCount = keysToRemove.length;
                        
                        setToastMessage(`Cache limpo com sucesso! ✅`);
                      } catch {
                        setToastMessage("Erro ao limpar cache.");
                      }
                      setShowToast(true);
                      setManagedTimeout(() => setShowToast(false), 2500);
                    }}
                  >Limpar Cache</Button>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-3 border border-red-200">
                <h4 className="text-sm font-bold text-red-600">⚠️ Zona de Perigo</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full h-10 rounded-xl text-xs" onClick={() => {
                    const blob = new Blob([JSON.stringify(localStorage, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `lumefit-backup-${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                  }}>Exportar Todos os Dados</Button>
                  <Button 
                    variant="destructive" 
                    className="w-full h-10 rounded-xl text-xs"
                    onClick={() => {
                      setAdminConfirm({
                        title: "Resetar App Completamente?",
                        desc: "Tens a certeza? Esta acção apaga TODOS os dados do app. Esta acção não pode ser desfeita.",
                        onConfirm: () => {
                          localStorage.clear();
                          window.location.reload();
                        }
                      });
                    }}
                  >Resetar App Completamente</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="shrink-0 bg-glass/95 backdrop-blur-2xl border-t border-glass-border px-2 py-3 flex justify-around items-center z-50 relative pb-safe">
          {[
            { id: "visao" as const, label: "Geral", icon: "📊" },
            { id: "utilizadores" as const, label: "Pessoas", icon: "👥" },
            { id: "pagamentos" as const, label: "MT", icon: "💰" },
            { id: "sistema" as const, label: "Sistema", icon: "⚙️" },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${
                adminTab === tab.id ? "text-brand-accent-2 scale-110" : "text-muted-foreground opacity-60"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
              {adminTab === tab.id && <div className="h-1 w-1 rounded-full bg-brand-accent-2 mt-0.5 animate-in zoom-in" />}
            </button>
          ))}
        </nav>

        {showUserDetail && (
          <div className="fixed inset-0 z-[70] flex items-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUserDetail(null)} />
            <div className="relative w-full glass-card rounded-t-[32px] p-6 space-y-6 animate-in slide-in-from-bottom-full duration-400">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-glass-border" onClick={() => setShowUserDetail(null)} />
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-brand-accent-2/20 flex items-center justify-center font-bold text-2xl text-brand-accent-2 border border-brand-accent-2/30">
                  {showUserDetail.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{showUserDetail.name}</h3>
                  <p className="text-sm text-muted-foreground">{showUserDetail.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-glass-muted rounded-2xl border border-glass-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Tipo de Conta</p>
                  <p className="font-bold capitalize">{showUserDetail.role === "admin" ? "🛡️ Administrador" : "👤 Utilizador"}</p>
                </div>
                <div className="p-3 bg-glass-muted rounded-2xl border border-glass-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Status</p>
                  <p className="font-bold capitalize">{showUserDetail.status}</p>
                </div>
              </div>

              {/* Número do WhatsApp com botão de cópia */}
              <div className="p-3.5 bg-glass-muted rounded-2xl border border-glass-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                    💬 WhatsApp
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {showUserDetail.phone ? showUserDetail.phone : "Sem número registado"}
                  </p>
                </div>
                {showUserDetail.phone && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 text-xs gap-1.5 rounded-xl border-brand-accent-2/30 text-brand-accent-2 font-bold hover:bg-brand-accent-2/10"
                      onClick={() => {
                        navigator.clipboard.writeText(showUserDetail.phone || "");
                        setToastMessage("Número copiado! 📋");
                        setShowToast(true);
                        setManagedTimeout(() => setShowToast(false), 2000);
                      }}
                    >
                      📋 Copiar
                    </Button>
                    <a
                      href={`https://wa.me/${(showUserDetail.phone || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 text-xs gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold inline-flex items-center justify-center transition-all"
                    >
                      💬 Abrir
                    </a>
                  </div>
                )}
              </div>

              {showUserDetail.role === "user" && (
                <div className="p-3 bg-glass-muted rounded-2xl border border-glass-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Expiração de Acesso</p>
                  <p className="font-bold">{showUserDetail.expiryDate ? new Date(showUserDetail.expiryDate).toLocaleDateString("pt-MZ") : "Aguardando pagamento"}</p>
                </div>
              )}

              <div className="space-y-3">
                {showUserDetail.role === "user" && (() => {
                  const isExpiredUser = showUserDetail.expiryDate
                    ? new Date(showUserDetail.expiryDate).getTime() < Date.now()
                    : false;
                  const daysOverdue = isExpiredUser && showUserDetail.expiryDate
                    ? Math.ceil((Date.now() - new Date(showUserDetail.expiryDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                  const applyDaysAdjustment = async (deltaDays: number) => {
                    // Base: se expirado ou sem data, parte de hoje. Se ativo, parte da data atual de expiração.
                    const baseMs = showUserDetail.expiryDate && !isExpiredUser
                      ? new Date(showUserDetail.expiryDate).getTime()
                      : Date.now();
                    const newMs = baseMs + deltaDays * 24 * 60 * 60 * 1000;
                    // Não permitir que a data caia no passado
                    const safeMs = Math.max(newMs, Date.now() + 60 * 1000);
                    const newExpiry = new Date(safeMs).toISOString();

                    const updatePayload: Record<string, string> = { expiry_date: newExpiry };
                    if (deltaDays > 0 || isExpiredUser) updatePayload.status = "ativo";

                    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', showUserDetail.id);

                    if (!error) {
                      const newStatus = (updatePayload.status as any) || showUserDetail.status;
                      setAdminUsers(prev => prev.map(u => u.id === showUserDetail.id
                        ? { ...u, status: newStatus, expiryDate: newExpiry }
                        : u
                      ));
                      setShowUserDetail(prev => prev ? { ...prev, status: newStatus, expiryDate: newExpiry } : prev);
                      const action = deltaDays > 0 ? `+${deltaDays} dias aplicados ✅` : `${deltaDays} dias aplicados ✅`;
                      setToastMessage(action);
                      setShowToast(true);
                      setManagedTimeout(() => setShowToast(false), 2500);
                      setCustomDays("");
                    } else {
                      setToastMessage("Erro ao ajustar dias.");
                      setShowToast(true);
                      setManagedTimeout(() => setShowToast(false), 2500);
                    }
                  };

                  return (
                    <>
                      {/* Banner de conta expirada */}
                      {isExpiredUser && (
                        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
                          <span className="text-2xl">💀</span>
                          <div>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Conta Expirada</p>
                            <p className="text-[11px] text-red-500">Expirou há {daysOverdue} dia{daysOverdue !== 1 ? "s" : ""}. Reativa para repor o acesso.</p>
                          </div>
                        </div>
                      )}

                      {/* Painel de Gestão de Dias */}
                      <div className="p-4 rounded-2xl bg-glass-muted border border-glass-border space-y-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">⏱ Ajuste de Dias de Acesso</p>

                        {/* Presets rápidos de adicionar */}
                        <div>
                          <p className="text-[10px] text-green-700 font-bold uppercase mb-1.5">➕ Adicionar Dias</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[7, 15, 30].map(d => (
                              <button
                                key={`add-${d}`}
                                onClick={() => applyDaysAdjustment(d)}
                                className="h-9 rounded-xl bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold transition-all active:scale-95 border border-green-200"
                              >
                                +{d} dias
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Presets rápidos de remover */}
                        <div>
                          <p className="text-[10px] text-red-600 font-bold uppercase mb-1.5">➖ Remover Dias</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[7, 15, 30].map(d => (
                              <button
                                key={`rem-${d}`}
                                onClick={() => applyDaysAdjustment(-d)}
                                className="h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all active:scale-95 border border-red-200"
                              >
                                -{d} dias
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Campo personalizado */}
                        <div className="pt-1 border-t border-glass-border">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">🎯 Personalizado</p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={customDays}
                              onChange={e => setCustomDays(e.target.value)}
                              placeholder="Ex: 45 ou -10"
                              className="flex-1 h-10 rounded-xl bg-background border border-glass-border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-accent-2 transition-all"
                            />
                            <button
                              disabled={!customDays || isNaN(Number(customDays)) || Number(customDays) === 0}
                              onClick={() => {
                                const n = parseInt(customDays, 10);
                                if (!isNaN(n) && n !== 0) applyDaysAdjustment(n);
                              }}
                              className="h-10 px-4 rounded-xl bg-brand-accent-2 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Aplicar
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5">Use número positivo para adicionar e negativo para remover dias.</p>
                        </div>
                      </div>

                      {/* Botão de ativar para contas não ativas e não expiradas */}
                      {!isExpiredUser && showUserDetail.status !== "ativo" && (
                        <Button className="w-full h-12 rounded-xl bg-brand-accent-2" onClick={() => applyDaysAdjustment(30)}>
                          Activar Utilizador (250 MT)
                        </Button>
                      )}

                      {showUserDetail.status !== "bloqueado" && (
                        <Button variant="outline" className="w-full h-12 rounded-xl text-red-500 border-red-200" onClick={async () => {
                          const { error } = await supabase.from('profiles').update({
                            status: "bloqueado"
                          }).eq('id', showUserDetail.id);

                          if (!error) {
                            setAdminUsers(prev => prev.map(u => u.id === showUserDetail.id ? { ...u, status: "bloqueado" } : u));
                            setShowUserDetail(null);
                            setToastMessage("Utilizador bloqueado! 🚫");
                            setShowToast(true);
                            setManagedTimeout(() => setShowToast(false), 2500);
                          }
                        }}>🔴 Bloquear Utilizador</Button>
                      )}
                    </>
                  );
                })()}
                
                {showUserDetail.role === "admin" && (
                  <p className="text-center text-xs text-muted-foreground py-2 italic">
                    Contas administrativas têm acesso vitalício e não geram faturamento.
                  </p>
                )}
                
                <Button variant="ghost" className="w-full h-11 rounded-xl" onClick={() => setShowUserDetail(null)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {adminConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdminConfirm(null)} />
          <div className="relative w-full max-w-sm glass-card rounded-[24px] p-6 text-center animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold">{adminConfirm.title}</h3>
            <p className="text-xs text-muted-foreground mt-2">{adminConfirm.desc}</p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAdminConfirm(null)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl bg-brand-accent-2" onClick={() => { adminConfirm.onConfirm(); setAdminConfirm(null); }}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pagamento e Duração */}
      {paymentModalUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setPaymentModalUser(null)} />
          <div className="relative w-full max-w-sm glass-card bg-background/95 rounded-[32px] p-6 space-y-5 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-accent-2/15 flex items-center justify-center text-2xl mb-2">
                💰
              </div>
              <h3 className="text-lg font-bold text-foreground">Registar Pagamento</h3>
              <p className="text-xs text-muted-foreground">
                Confirmar acesso para <strong className="text-foreground">{paymentModalUser.name}</strong>
              </p>
            </div>

            <div className="space-y-4 text-left">
              {/* Duração em Meses */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duração do Acesso</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPaymentModalMonths(m);
                        setPaymentModalAmount(String(m * 350));
                      }}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                        paymentModalMonths === m
                          ? "bg-brand-accent-2 text-white border-brand-accent-2 shadow-md shadow-brand-accent-2/20"
                          : "bg-muted/30 border-glass-border text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {m} {m === 1 ? "Mês" : "Meses"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Pago (MT) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor Recebido (MT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-brand-accent-2">MT</span>
                  <Input
                    type="number"
                    value={paymentModalAmount}
                    onChange={(e) => setPaymentModalAmount(e.target.value)}
                    className="pl-11 h-12 rounded-xl text-base font-bold bg-muted/30 border-glass-border"
                    placeholder="350"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Valor padrão: 350 MT/mês. Pode editar se houver desconto ou valor especial.
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl text-xs font-bold"
                onClick={() => setPaymentModalUser(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-brand-accent-2 text-white text-xs font-bold shadow-lg shadow-brand-accent-2/20"
                onClick={async () => {
                  const amountNum = parseFloat(paymentModalAmount) || 350;
                  const addedDays = paymentModalMonths * 30;

                  const isExpired = paymentModalUser.expiryDate
                    ? new Date(paymentModalUser.expiryDate).getTime() < Date.now()
                    : true;

                  const baseMs = paymentModalUser.expiryDate && !isExpired
                    ? new Date(paymentModalUser.expiryDate).getTime()
                    : Date.now();

                  const newExpiry = new Date(baseMs + addedDays * 24 * 60 * 60 * 1000).toISOString();

                  // 1. Atualizar perfil no Supabase
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ status: 'ativo', expiry_date: newExpiry })
                    .eq('id', paymentModalUser.id);

                  if (!profileError) {
                    // 2. Registar pagamento na tabela payments
                    const { data: newPay } = await supabase
                      .from('payments')
                      .insert({
                        user_id: paymentModalUser.id,
                        amount: amountNum,
                        status: 'confirmado'
                      })
                      .select('*')
                      .single();

                    setAdminUsers(prev => prev.map(u => u.id === paymentModalUser.id ? { ...u, status: "ativo", expiryDate: newExpiry } : u));
                    
                    if (newPay) {
                      setAdminPayments(prev => [
                        {
                          id: newPay.id,
                          userName: paymentModalUser.name,
                          email: paymentModalUser.email,
                          amount: amountNum,
                          date: newPay.created_at || new Date().toISOString(),
                          status: 'confirmado'
                        },
                        ...prev
                      ]);
                    }

                    setPaymentModalUser(null);
                    setToastMessage(`Acesso ativado por ${paymentModalMonths} mês(es) (+ MT ${amountNum})! ✅`);
                    setShowToast(true);
                    setManagedTimeout(() => setShowToast(false), 3000);
                  } else {
                    setToastMessage("Erro ao ativar utilizador no Supabase.");
                    setShowToast(true);
                    setManagedTimeout(() => setShowToast(false), 3000);
                  }
                }}
              >
                ✅ Confirmar e Ativar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
