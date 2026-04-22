
1. Definir a estrutura da app LUMEfit (mobile-first) com 7 ecrãs principais e navegação inferior fixa:
- Splash/Onboarding
- Configuração de Perfil (3 passos)
- Home (Dashboard)
- Refeições (inclui “Adicionar Refeição”)
- Progresso
- Plano Semanal
- Perfil

2. Implementar um sistema visual Glassmorphism completo e consistente em toda a app:
- Fundo animado com gradiente escuro (#0f0c29 → #302b63 → #24243e)
- Cartões de vidro translúcidos com blur forte, borda suave e brilho interno em hover
- Tipografia Poppins (hierarquia clara de títulos e texto secundário)
- Paleta de acentos laranja/dourado/rosa aplicada a estados ativos, badges e CTAs
- Motion language unificada (fade + slide, micro-scale em botões, entrada escalonada de cards)

3. Construir o Splash/Onboarding premium:
- Logo “LUMEfit” com ícone de chama brilhante ✦
- Tagline em PT-MZ: “O teu caminho para uma vida mais leve”
- Botões “Começar Agora” e “Já tenho conta”
- Orbes flutuantes desfocadas e transição suave para setup

4. Entregar o fluxo de Configuração de Perfil em 3 passos, com UX guiada:
- Passo 1: nome, idade, cidade (Maputo, Beira, Nampula, Quelimane, Tete, outro)
- Passo 2: peso atual, altura, peso-alvo (slider + input numérico), silhueta animada
- Passo 3: objetivo semanal + nível de atividade
- Cálculo e destaque do objetivo calórico diário em badge com glow
- Guardar progresso no dispositivo para retomar sem perder dados

5. Construir o Dashboard principal focado em clareza diária:
- Saudação personalizada (“Bom dia, [Nome]! 🌟”), data atual e citação motivacional rotativa
- Anel calórico animado no centro com transição de cor (verde → laranja → vermelho)
- Texto “Restam X calorias hoje”
- Linha de macros (Proteínas, Carboidratos, Gorduras) com barras animadas
- Grade 2x2 de refeições (Pequeno-Almoço, Almoço, Jantar, Lanches), cada card expansível com itens e botão “+ Adicionar”
- Bottom nav de 5 ícones com estado ativo luminoso

6. Implementar o ecrã de Adicionar Refeição com base alimentar moçambicana pré-carregada:
- Barra de pesquisa em vidro (“Pesquisar alimento... ex: Xima, Matapa”)
- Lista completa por categorias conforme fornecida (cereais, leguminosas, vegetais, proteínas, frutos locais, outros)
- Seleção de alimento abre modal de vidro com ajuste de porção (0.5x / 1x / 1.5x / 2x)
- Pré-visualização de calorias antes de confirmar
- Botão “Adicionar à refeição” com destaque visual
- Secção “Recentes” para acelerar registos frequentes

7. Entregar o ecrã de Progresso com visual analítico motivador:
- Gráfico de peso temporal com linha suave e preenchimento gradiente
- Marcadores de marcos (“Perdeste 2kg! 🎉”)
- Linha de estatísticas (dias consecutivos, calorias semanais, média diária)
- Gráfico de barras semanal (verde/laranja/vermelho por desempenho)
- Conquistas desbloqueáveis em cartões com efeito glow/pulse

8. Entregar o ecrã Plano com plano alimentar semanal em português:
- 7 cartões (Seg → Dom), expansíveis com pequeno-almoço/almoço/jantar/lanches
- Refeições alinhadas à base de alimentos moçambicanos
- Completar os 7 dias com variedade equilibrada em torno da meta diária
- Secção de dicas práticas de saúde em cartões glass

9. Entregar o ecrã Perfil completo:
- Avatar com anel luminoso
- Edição de dados pessoais
- Resumo de progresso
- Toggles de definições (Notificações, Unidades kg/cm)
- Botão “Exportar Progresso”
- Secção “Sobre” + versão da app
- Botão Logout (sem backend, apenas limpeza de sessão local)

10. Gestão de estado local e continuidade de uso (MVP sem backend):
- Persistência local de perfil, metas, refeições, progresso, streaks, conquistas e preferências
- Recalcular automaticamente metas/calorias restantes/macros ao registar alimentos
- Seed inicial de dados para a app abrir já funcional e visualmente rica

11. Refinamento final de UX e qualidade:
- Garantir textos 100% em Português (Moçambique)
- Garantir responsividade a partir de 375px e excelente experiência mobile
- Uniformizar animações de transição entre páginas
- Verificar acessibilidade visual (contraste em camadas de vidro) e consistência do design system
- Substituir totalmente o placeholder atual por conteúdo real LUMEfit em todas as rotas
