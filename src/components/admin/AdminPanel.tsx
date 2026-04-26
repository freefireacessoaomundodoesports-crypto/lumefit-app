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
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Receita</p>
                  <h3 className="text-2xl font-bold text-brand-accent-2">MT {adminPayments.filter(p => p.status === 'confirmado').reduce((sum, p) => sum + p.amount, 0)}</h3>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-orange-400">
                  <span className="text-2xl mb-1">⏳</span>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Pendentes</p>
                  <h3 className="text-2xl font-bold text-orange-500">{adminUsers.filter(u => u.status === "pendente").length}</h3>
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
                {["Todos", "Activos", "Pendentes", "Bloqueados", "A Expirar"].map(f => {
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
                  
                  const filtered = adminUsers.filter(u => {
                    const matchesQuery = normalize(u.name).includes(query) || normalize(u.email).includes(query);
                    if (!matchesQuery) return false;
                    
                    if (userFilter === "Todos") return true;
                    if (userFilter === "Activos") return u.status?.toLowerCase() === "ativo";
                    if (userFilter === "Pendentes") return u.status?.toLowerCase() === "pendente" || u.status?.toLowerCase() === "setup";
                    if (userFilter === "Bloqueados") return u.status?.toLowerCase() === "bloqueado";
                    if (userFilter === "A Expirar") {
                      if (!u.expiryDate) return false;
                      const diff = new Date(u.expiryDate).getTime() - Date.now();
                      const days = diff / (1000 * 60 * 60 * 24);
                      return days >= 0 && days <= 5; // Menos de 5 dias para expirar
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="glass-card p-10 rounded-2xl text-center space-y-2">
                        <p className="text-sm font-bold">Nenhum utilizador encontrado 🔍</p>
                        <p className="text-xs text-muted-foreground">Tenta outro nome ou email</p>
                      </div>
                    );
                  }

                  return filtered.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => setShowUserDetail(user)}
                      className="glass-card w-full p-4 rounded-2xl flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="h-12 w-12 rounded-full bg-brand-accent-2/20 flex items-center justify-center font-bold text-brand-accent-2 border border-brand-accent-2/30">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{user.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            user.status === "ativo" ? "bg-green-100 text-green-700" :
                            (user.status === "pendente" || user.status === "setup") ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {user.status === "ativo" ? "🟢 Activo" : 
                             user.status === "setup" ? "🟡 No Onboarding" :
                             user.status === "pendente" ? "🟡 Pendente" : "🔴 Bloqueado"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Há {user.daysUsing || 0} dias</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground">›</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}

          {adminTab === "pagamentos" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Receita Total</p>
                  <p className="text-sm font-bold text-brand-accent-2">MT {adminPayments.filter(p => p.status === 'confirmado').reduce((sum, p) => sum + p.amount, 0)}</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Faturado</p>
                  <p className="text-sm font-bold text-green-600">{adminUsers.filter(u => u.status === "ativo" && u.role === "user").length}</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Pendentes</p>
                  <p className="text-sm font-bold text-orange-500">{adminUsers.filter(u => u.status === "pendente").length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold px-1">Pedidos de Acesso Pendentes</h4>
                {adminUsers.filter(u => u.status === "pendente").length === 0 ? (
                  <div className="glass-card p-8 rounded-2xl text-center">
                    <p className="text-sm text-muted-foreground">Nenhum pedido pendente 🎉</p>
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
                          <span className="text-[10px] text-muted-foreground">Pedido em: Hoje</span>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 h-9 text-xs bg-brand-accent-2 hover:bg-brand-accent-2/90" onClick={async () => {
                            const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                            const { error } = await supabase
                              .from('profiles')
                              .update({ status: 'ativo', expiry_date: newExpiry })
                              .eq('id', user.id);
                            
                            if (!error) {
                              // Registar pagamento
                              await supabase.from('payments').insert({
                                user_id: user.id,
                                amount: 250,
                                status: 'confirmado'
                              });
                              
                              setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "ativo", expiryDate: newExpiry } : u));
                              setToastMessage("Pagamento confirmado! ✅");
                              setShowToast(true);
                              setManagedTimeout(() => setShowToast(false), 2000);
                            }
                          }}>✅ Confirmar Pagamento</Button>
                          <Button variant="outline" className="h-9 px-3 text-xs text-red-500 border-red-200" onClick={async () => {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ status: 'bloqueado' })
                              .eq('id', user.id);
                            
                            if (!error) {
                              setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "bloqueado" } : u));
                            }
                          }}>❌ Ignorar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold px-1 text-orange-500">A Expirar em Breve (próximos 7 dias)</h4>
                {adminUsers.filter(u => u.status === "ativo" && u.expiryDate).map(user => {
                  const expiryTimestamp = user.expiryDate ? new Date(user.expiryDate).getTime() : 0;
                  const days = Math.ceil((expiryTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
                  if (days > 7 || days < 0) return null;
                  return (
                    <div key={user.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className={`text-[10px] font-bold uppercase ${days <= 3 ? "text-red-500" : "text-orange-500"}`}>
                          Expira em {days} dias
                        </p>
                      </div>
                      <Button size="sm" className="h-8 text-xs bg-brand-accent-2" onClick={async () => {
                         if (!user.expiryDate) return;
                         const currentExpiry = new Date(user.expiryDate).getTime();
                         const newExpiry = new Date(currentExpiry + 30 * 24 * 60 * 60 * 1000).toISOString();
                         
                         const { error } = await supabase.from('profiles').update({
                           status: "ativo",
                           expiry_date: newExpiry
                         }).eq('id', user.id);

                         if (!error) {
                           setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "ativo", expiryDate: newExpiry } : u));
                           setToastMessage("Acesso renovado por 30 dias! ✅");
                           setShowToast(true);
                           setManagedTimeout(() => setShowToast(false), 2000);
                         }
                      }}>Renovar</Button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold px-1">Histórico de Pagamentos</h4>
                {adminPayments.length === 0 ? (
                  <div className="glass-card p-6 rounded-2xl text-center italic text-xs text-muted-foreground">
                    Ainda sem histórico de pagamentos
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adminPayments.map(pay => (
                      <div key={pay.id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">{pay.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(pay.date).toLocaleDateString("pt-MZ")}</p>
                        </div>
                        <p className="text-xs font-bold text-brand-accent-2">+ MT {pay.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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

              {showUserDetail.role === "user" && (
                <div className="p-3 bg-glass-muted rounded-2xl border border-glass-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Expiração de Acesso</p>
                  <p className="font-bold">{showUserDetail.expiryDate ? new Date(showUserDetail.expiryDate).toLocaleDateString("pt-MZ") : "Aguardando pagamento"}</p>
                </div>
              )}

              <div className="space-y-3">
                {showUserDetail.role === "user" && (
                  <>
                    {showUserDetail.status !== "ativo" && (
                      <Button className="w-full h-12 rounded-xl bg-brand-accent-2" onClick={async () => {
                        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        const { error } = await supabase.from('profiles').update({
                          status: "ativo",
                          expiry_date: newExpiry
                        }).eq('id', showUserDetail.id);
                        
                        if (!error) {
                          setAdminUsers(prev => prev.map(u => u.id === showUserDetail.id ? { ...u, status: "ativo", expiryDate: newExpiry } : u));
                          setShowUserDetail(null);
                          setToastMessage("Utilizador activado! ✅");
                          setShowToast(true);
                          setManagedTimeout(() => setShowToast(false), 2500);
                        } else {
                          setToastMessage("Erro ao activar utilizador.");
                          setShowToast(true);
                          setManagedTimeout(() => setShowToast(false), 2500);
                        }
                      }}>Activar Utilizador (250 MT)</Button>
                    )}

                    {showUserDetail.status === "ativo" && (
                      <Button className="w-full h-12 rounded-xl bg-brand-accent-2" onClick={async () => {
                        const currentExp = showUserDetail.expiryDate ? new Date(showUserDetail.expiryDate).getTime() : Date.now();
                        const newExpiry = new Date(currentExp + 30 * 24 * 60 * 60 * 1000).toISOString();
                        
                        const { error } = await supabase.from('profiles').update({
                          expiry_date: newExpiry
                        }).eq('id', showUserDetail.id);

                        if (!error) {
                          setAdminUsers(prev => prev.map(u => u.id === showUserDetail.id ? { ...u, status: "ativo", expiryDate: newExpiry } : u));
                          setShowUserDetail(null);
                          setToastMessage("Acesso renovado! ✅");
                          setShowToast(true);
                          setManagedTimeout(() => setShowToast(false), 2500);
                        }
                      }}>Renovar Acesso (+30 dias)</Button>
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
                )}
                
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
            <h3 className="text-xl font-bold text-foreground mb-2">{adminConfirm.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{adminConfirm.desc}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setAdminConfirm(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-brand-accent-2" onClick={() => {
                adminConfirm.onConfirm();
                setAdminConfirm(null);
              }}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
