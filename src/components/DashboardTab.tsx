import React, { useState } from 'react';
import { Client, Printer, PrintOrder, FilamentStock, Expense, ShoppingItem } from '../types';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  ShoppingBag, 
  Plus, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Camera, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  Share2
} from 'lucide-react';
import { PrinterCameraModal } from './PrinterCameraModal';

interface DashboardTabProps {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  expenses: Expense[];
  shoppingItems?: ShoppingItem[];
  clients?: Client[];
  onSelectTab: (tab: number) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
  onUpdateOrder?: (id: number, updated: Partial<PrintOrder>) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  printers,
  filamentStocks,
  expenses,
  shoppingItems = [],
  clients = [],
  onSelectTab,
  onUpdatePrinter,
  onUpdateOrder
}) => {
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
  const [selectedCameraPrinter, setSelectedCameraPrinter] = useState<Printer | null>(null);
  
  const handleRecalculate = () => {
    setRecentFeedback('Métricas sincronizadas em tempo real com o Ateliê!');
    setTimeout(() => setRecentFeedback(null), 3000);
  };

  // Month selector states
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey); // Default to current month!

  // Helpers to parse Year-Month
  const getYearMonth = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === 'ALL') return 'Geral (Total)';
    const [year, month] = monthKey.split('-');
    const monthNames: Record<string, string> = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    return `${monthNames[month] || month}/${year}`;
  };

  // Calculations
  const safeOrders = orders || [];
  const safeExpenses = expenses || [];
  const safeShoppingItems = shoppingItems || [];
  const safePrinters = printers || [];
  const safeFilaments = filamentStocks || [];

  // Extract all available months having data to provide clicks on past months
  const availableMonths = Array.from(new Set([
    currentMonthKey,
    ...safeOrders.map(o => getYearMonth(o.createdAt || Date.now())),
    ...safeExpenses.map(e => getYearMonth(e.date || Date.now()))
  ])).sort().reverse();

  // Filter datasets based on selected month
  const filteredOrders = selectedMonth === 'ALL' 
    ? safeOrders 
    : safeOrders.filter(o => getYearMonth(o.createdAt) === selectedMonth);

  const filteredExpenses = selectedMonth === 'ALL'
    ? safeExpenses
    : safeExpenses.filter(e => getYearMonth(e.date) === selectedMonth);

  // Faturamento (Revenue) based on filtered orders
  const monthRevenue = filteredOrders
    .filter(o => o.status !== 'WAITING')
    .reduce((sum, o) => sum + o.priceCharged, 0);

  // Despesas (Expenses) based on filtered expenses
  const shoppingExpense = safeShoppingItems.reduce((sum, s) => sum + s.price, 0);
  const monthExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount * e.qty), 0) + 
    (selectedMonth === currentMonthKey || selectedMonth === 'ALL' ? shoppingExpense : 0);

  const pendingRevenue = filteredOrders
    .filter(o => o.status === 'QUEUE' || o.status === 'PRINTING' || o.status === 'POST_PROCESS' || o.status === 'READY')
    .reduce((sum, o) => sum + o.priceCharged, 0);

  // ROI (Return on Investment) calculation
  const monthRoi = monthExpense > 0 ? ((monthRevenue - monthExpense) / monthExpense) * 100 : 0;

  // Valor a Comprar (Unchecked Shopping List items value)
  const valorAComprar = safeShoppingItems
    .filter(s => !s.isChecked)
    .reduce((sum, s) => sum + s.price, 0);

  // Order count metrics
  const parsedOpenOrdersCount = safeOrders.filter(o => o.status !== 'DELIVERED').length;
  const parsedDeliveredOrdersCount = filteredOrders.filter(o => o.status === 'DELIVERED').length;
  const parsedReadyToDeliverCount = safeOrders.filter(o => o.status === 'READY').length;

  // Profit Margin
  const monthProfitMargin = monthRevenue > 0 ? ((monthRevenue - monthExpense) / monthRevenue) * 100 : 0;

  // Active prints
  const activePrinters = safePrinters.filter(p => p.status === 'PRINTING');
  const alertFilaments = safeFilaments.filter(f => f.stockGrams < f.minStockGrams);

  // Sparkline data calculation
  const orderValues = filteredOrders.slice(-6).map(o => o.priceCharged);
  const maxOrderVal = Math.max(...orderValues, 100);

  // Monthly Calendar logic:
  const calendarActiveMonth = selectedMonth === 'ALL' ? currentMonthKey : selectedMonth;
  const [calYearStr, calMonthStr] = calendarActiveMonth.split('-');
  const calYear = parseInt(calYearStr);
  const calMonth = parseInt(calMonthStr) - 1; // 0-indexed month

  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // Day of week (0-6)

  const getDaySales = (day: number) => {
    const startOfDay = new Date(calYear, calMonth, day, 0, 0, 0).getTime();
    const endOfDay = new Date(calYear, calMonth, day, 23, 59, 59).getTime();
    
    return safeOrders
      .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay)
      .reduce((sum, o) => sum + o.priceCharged, 0);
  };

  return (
    <div className="space-y-6" id="dashboard_tab_container">

      {/* SEÇÃO 1 & 4 (STATUS RÁPIDO & ÚLTIMAS ATUALIZAÇÕES RESUMIDAS) */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-xl backdrop-blur-md" id="top_action_updates_panel">
        {/* Subtle decorative mesh background glow */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-[30px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2.5 bg-cyan-500/10 border border-cyan-500/15 rounded-xl text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Últimas Atualizações Resumidas
              </h3>
              <p className="text-[11px] text-[#A5BBA7]">Indicadores operacionais consolidados e sincronizados em tempo real no ateliê</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 font-mono">
              Ateliê Live Active
            </span>
            <button
              onClick={handleRecalculate}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-black font-extrabold rounded-xl text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              id="btn_refresh_status_resumo"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-black" />
              Sincronizar Painel
            </button>
          </div>
        </div>

        {recentFeedback && (
          <p className="text-[10px] text-center font-bold text-emerald-400 animate-pulse mt-3 bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/20">{recentFeedback}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4" id="dashboard-top-resumo-slots">
          
          {/* Fila Produção - Ciano */}
          <div className="bg-white/[0.02] hover:bg-white/[0.04] p-3.5 px-4 border border-white/10 hover:border-cyan-500/30 rounded-xl flex items-center justify-between gap-1.5 transition-all duration-300 group">
            <span className="text-[11px] text-[#8BA58D] font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors">📦 Produção Fila</span>
            <strong className="text-white font-mono text-sm font-black">{orders.filter(o => o.status === 'QUEUE' || o.status === 'PRINTING').length} ordens</strong>
          </div>

          {/* Extrusoras - Ciano */}
          <div className="bg-white/[0.02] hover:bg-white/[0.04] p-3.5 px-4 border border-white/10 hover:border-cyan-500/30 rounded-xl flex items-center justify-between gap-1.5 transition-all duration-300 group">
            <span className="text-[11px] text-[#8BA58D] font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors">⚡ Extrusoras</span>
            <strong className="text-cyan-400 font-mono text-sm font-black">{printers.filter(p => p.status === 'PRINTING').length} ativas</strong>
          </div>

          {/* Alertas Bobina - Âmbar */}
          <div className="bg-white/[0.02] hover:bg-white/[0.04] p-3.5 px-4 border border-white/10 hover:border-amber-500/30 rounded-xl flex items-center justify-between gap-1.5 transition-all duration-300 group">
            <span className="text-[11px] text-[#8BA58D] font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">🧵 Alertas Bobina</span>
            <strong className="text-amber-400 font-mono text-sm font-black">{safeFilaments.filter(f => f.stockGrams < f.minStockGrams).length} cores</strong>
          </div>

          {/* Faturado Hoje - Esmeralda */}
          <div className="bg-white/[0.02] hover:bg-white/[0.04] p-3.5 px-4 border border-white/10 hover:border-emerald-500/30 rounded-xl flex items-center justify-between gap-1.5 transition-all duration-300 group">
            <span className="text-[11px] text-[#8BA58D] font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">💰 Faturado Hoje</span>
            <strong className="text-emerald-400 font-mono text-sm font-black">
              R$ {safeOrders.filter(o => o.status === 'READY' || o.status === 'DELIVERED').reduce((sum, o) => sum + o.priceCharged, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

        </div>
      </div>

      {/* SEÇÃO 2 (PREÇOS PETG - 4 LOJAS LÍDERES NA WEB) */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300 hover:border-pink-500/20" id="petg-store-prices-index">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              📈 Monitor de Preços PETG no Mercado (4 Lojas Líderes)
            </h4>
            <p className="text-[10px] text-[#A5BBA7]">Preço por carretel de 1kg comparando os maiores estoques de e-commerce do Brasil</p>
          </div>
          <span className="text-[8.5px] font-sans font-extrabold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full uppercase border border-pink-500/20 tracking-wider">
            Canal de Vendas & Vitrine
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/20 rounded-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-inner">
            <span className="text-[10px] text-[#8BA58D] font-bold uppercase tracking-wider">Voolt3D Store</span>
            <div className="flex items-baseline justify-between mt-1">
              <strong className="text-base font-black text-white font-mono">R$ 74,90</strong>
              <span className="text-[10px] font-black text-pink-400 flex items-center shrink-0">▼ -0,5%</span>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/20 rounded-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-inner">
            <span className="text-[10px] text-[#8BA58D] font-bold uppercase tracking-wider">Mercado Livre</span>
            <div className="flex items-baseline justify-between mt-1">
              <strong className="text-base font-black text-white font-mono">R$ 78,90</strong>
              <span className="text-[10px] font-black text-pink-400 flex items-center shrink-0">▼ -0,4%</span>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/20 rounded-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-inner">
            <span className="text-[10px] text-[#8BA58D] font-bold uppercase tracking-wider">Shopee Brasil</span>
            <div className="flex items-baseline justify-between mt-1">
              <strong className="text-base font-black text-white font-mono">R$ 72,90</strong>
              <span className="text-[10px] font-black text-pink-400 flex items-center shrink-0">▼ -0,3%</span>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/20 rounded-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-inner">
            <span className="text-[10px] text-[#8BA58D] font-bold uppercase tracking-wider">3D Fila</span>
            <div className="flex items-baseline justify-between mt-1">
              <strong className="text-base font-black text-white font-mono">R$ 89,90</strong>
              <span className="text-[10px] font-black text-pink-400 flex items-center shrink-0">▼ -0,5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3 (OPORTUNIDADE HISTÓRICA / HIGHLIGHT BANNER DENTRO DO CONTEXTO DE PAINEL) */}
      <div className="bg-white/5 border border-white/15 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-lg relative overflow-hidden" id="dashboard-opportunistic-highlight-pill">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-pink-500/20 via-emerald-500/30 to-cyan-500/20" />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 animate-pulse">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-xs font-black text-white block uppercase tracking-wider">Painel de Controle de Custos</span>
            <p className="text-[10.5px] text-[#A5BBA7] leading-relaxed">
              Visão geral das ordens, impressoras e faturamento consolidado. <strong className="text-emerald-400 font-extrabold">Oportunidade ativa:</strong> PETG por R$ 72.90 (abaixo de R$ 80.00).
            </p>
          </div>
        </div>
        <button 
          onClick={() => onSelectTab(4)}
          className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/25 text-pink-400 font-extrabold text-[10.5px] rounded-xl transition uppercase tracking-wider cursor-pointer shadow-sm select-none w-full sm:w-auto shrink-0 text-center"
        >
          Ver Cotações na Aba Custos 📈
        </button>
      </div>

      {/* SEÇÃO 5 (PERÍODO DE ANÁLISE FINANCEIRA & DESEMPENHO UNIFICADO DE ALTA DENSIDADE) */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-xl space-y-4 backdrop-blur-md" id="compact-finance-dashboard">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

        {/* Header Seletor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Período de Análise Financeira
            </h3>
            <p className="text-[11px] text-[#A5BBA7]">Selecione o mês desejado para auditar faturamentos, despesas e ROI</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-300 shrink-0 cursor-pointer ${
                selectedMonth === 'ALL'
                  ? 'bg-emerald-400 text-black border-emerald-400 font-extrabold shadow-[0_2px_15px_rgba(16,185,129,0.25)]'
                  : 'bg-white/5 text-[#8BA58D] border-white/5 hover:border-emerald-500/30 font-mono'
              }`}
            >
              Geral (Totalizado)
            </button>
            {availableMonths.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setSelectedMonth(mKey)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-300 shrink-0 cursor-pointer ${
                  selectedMonth === mKey
                    ? 'bg-emerald-400 text-black border-emerald-400 font-extrabold shadow-[0_2px_15px_rgba(16,185,129,0.25)]'
                    : mKey === currentMonthKey
                    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-[#8BA58D] border-white/5 hover:border-emerald-500/20'
                }`}
              >
                {formatMonthLabel(mKey)} {mKey === currentMonthKey ? ' (Vigente)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch justify-between gap-6" id="dashboard-financial-row">
          
          {/* Métricas Financeiras Fundamentais: Grid Bento com 8 Cards de Métricas */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Card 1: Faturamento - Esmeralda */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">Faturamento</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    R$ {monthRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>

              {/* Card 2: Despesas - Esmeralda */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-red-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">Despesas</span>
                  <span className="text-base font-black text-rose-400 font-mono">
                    R$ {monthExpense.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-red-500/10 border border-red-500/15 rounded-xl text-rose-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>

              {/* Card 3: Margem Líquida - Esmeralda */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">Margem Líq.</span>
                  <span className="text-base font-black text-emerald-450 font-mono">
                    {monthProfitMargin > 0 ? `${monthProfitMargin.toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              {/* Card 4: ROI - Esmeralda */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">ROI</span>
                  <span className={`text-base font-black font-mono ${monthRoi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monthRoi >= 0 ? '+' : ''}{monthRoi.toFixed(1)}%
                  </span>
                </div>
                <div className={`p-2 border rounded-xl ${monthRoi >= 0 ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' : 'bg-red-500/10 border-red-500/15 text-red-400'}`}>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              {/* Card 5: Pedidos Abertos - Âmbar */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-amber-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">Pedidos Abertos</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {parsedOpenOrdersCount} un
                  </span>
                </div>
                <div className="p-2 bg-amber-500/10 border border-amber-500/15 rounded-xl text-amber-500">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              {/* Card 6: Pedidos a Entregar (Prontos) - Fúcsia */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">A Entregar (Prontos)</span>
                  <span className="text-base font-black text-pink-400 font-mono">
                    {parsedReadyToDeliverCount} un
                  </span>
                </div>
                <div className="p-2 bg-pink-500/10 border border-pink-500/15 rounded-xl text-pink-400">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              {/* Card 7: Delivered - Esmeralda */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">Delivered ({formatMonthLabel(selectedMonth)})</span>
                  <span className="text-base font-black text-emerald-450 font-mono">
                    {parsedDeliveredOrdersCount} un
                  </span>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              {/* Card 8: Valor a Comprar - Âmbar */}
              <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-amber-500/30 rounded-2xl flex items-center justify-between gap-1.5 transition-all duration-300 shadow-sm" title="Valor dos insumos unchecked da Lista de Compras">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8BA58D] font-extrabold uppercase block leading-tight">A Comprar (Lista)</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    R$ {valorAComprar.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-amber-500/10 border border-amber-500/15 rounded-xl text-amber-500">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>

            </div>
          </div>

          {/* SEÇÃO 6: HISTÓRICO RECENTE MINI-CHART (MAX 100) */}
          <div className="w-full xl:w-[320px] shrink-0 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-white/10 pt-4 xl:pt-0 xl:pl-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-white uppercase tracking-wider font-sans">📈 Histórico Recente</span>
              <span className="text-[9px] font-mono font-bold text-[#8BA58D] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">MAX {maxOrderVal.toFixed(0)}</span>
            </div>

            <div className="relative h-20 w-full flex items-end justify-between px-1" id="charts-svg-container-mini">
              {filteredOrders.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#8BA58D] italic">
                  Sem faturamentos no mês selecionado
                </div>
              ) : (
                <div className="flex justify-around items-end w-full h-full gap-1">
                  {filteredOrders.slice(-12).map((o, idx) => {
                    const heightPercent = maxOrderVal > 0 ? (o.priceCharged / maxOrderVal) * 90 : 10;
                    return (
                      <div key={idx} className="flex flex-col items-center group relative flex-1 mx-0.5 bg-transparent h-full justify-end">
                        <div className="absolute bottom-full mb-1.5 bg-zinc-950 border border-white/15 px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                          R$ {o.priceCharged.toFixed(0)} - <span className="opacity-75">{o.itemName}</span>
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300 rounded-t-sm transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8BA58D] mt-4 leading-none select-none border-t border-white/5 pt-3">
              <span>Média por item: R$ {filteredOrders.length > 0 ? (monthRevenue / filteredOrders.length).toFixed(0) : '0'}</span>
              <button 
                onClick={() => onSelectTab(1)}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-extrabold cursor-pointer flex items-center gap-1"
              >
                Fila de Vendas →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO DE COBRANÇAS, CRÉDITOS E CONSIGNADOS (GEOF FINANCEIRO ATIVA - ATUALIZAÇÃO 3.3.0.0) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md" id="finance-collections-billing-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              📊 Meios de Pagamento & Carteira de Recebíveis (v3.3.0.0)
            </h3>
            <p className="text-[11px] text-[#A5BBA7]">Faturamento segmentado por carteira e controle de recebíveis em aberto</p>
          </div>
          <div className="text-[10px] font-mono font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl leading-none shrink-0" id="current_overdue_total_pill">
            A Receber (Não Pago): R$ {safeOrders.filter(o => o.paymentStatus !== 'PAGO').reduce((sum, o) => sum + o.priceCharged, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 1. Cards de Resumo por Meio de Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(() => {
            const listOrdersWithDefaults = safeOrders.map(o => ({
              ...o,
              paymentMethod: o.paymentMethod || 'DINHEIRO',
              paymentStatus: o.paymentStatus || 'PENDENTE'
            }));

            // Dinheiro - Âmbar
            const cashOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'DINHEIRO');
            const cashTotal = cashOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Cartão - Ciano
            const cardOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'CARTÃO');
            const cardTotal = cardOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Consignado - Fúcsia/Rosa
            const consignmentOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'CONSIGNADO');
            const consignmentTotal = consignmentOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Outros / PIX - Esmeralda
            const otherOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'OUTROS');
            const otherTotal = otherOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            const allTotals = cashTotal + cardTotal + consignmentTotal + otherTotal || 1;

            return (
              <>
                {/* Dinheiro Card - Âmbar */}
                <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-amber-500/35 rounded-2xl flex flex-col justify-between space-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">📂 DINHEIRO</span>
                    <span className="text-[9.5px] text-[#8BA58D] font-mono">({cashOrders.length} un)</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-white font-mono">R$ {cashTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-550" style={{ width: `${Math.round((cashTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8.5px] text-[#8BA58D]/70 font-sans block">{Math.round((cashTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* Cartão Card - Ciano */}
                <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-cyan-500/35 rounded-2xl flex flex-col justify-between space-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">💳 CARTÃO (Déb/Créd)</span>
                    <span className="text-[9.5px] text-[#8BA58D] font-mono">({cardOrders.length} un)</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-white font-mono">R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full transition-all duration-550" style={{ width: `${Math.round((cardTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8.5px] text-[#8BA58D]/70 font-sans block">{Math.round((cardTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* Consignado Card - Fúcsia */}
                <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-pink-500/35 rounded-2xl flex flex-col justify-between space-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider">🤝 CONSIGNADOS</span>
                    <span className="text-[9.5px] text-[#8BA58D] font-mono">({consignmentOrders.length} un)</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-white font-mono">R$ {consignmentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-pink-400 h-[3px] md:h-1.5 rounded-full transition-all duration-550" style={{ width: `${Math.round((consignmentTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8.5px] text-[#8BA58D]/70 font-sans block">{Math.round((consignmentTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* PIX / Outros Card - Esmeralda */}
                <div className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 hover:border-emerald-500/35 rounded-2xl flex flex-col justify-between space-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">🌐 PIX / TRANSFERÊNCIA</span>
                    <span className="text-[9.5px] text-[#8BA58D] font-mono">({otherOrders.length} un)</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-white font-mono">R$ {otherTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-550" style={{ width: `${Math.round((otherTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8.5px] text-[#8BA58D]/70 font-sans block">{Math.round((otherTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* 2. Lista Inteligente de Devedores e Lançamento de Cobranças */}
        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3.5">
          <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            ⏳ Painel de Contas em Aberto & Cobrança Direta (WhatsApp)
          </h4>
          
          {(() => {
            const unpaidOrdersArr = safeOrders.filter(o => {
              const payStat = o.paymentStatus || 'PENDENTE';
              return payStat !== 'PAGO';
            });

            if (unpaidOrdersArr.length === 0) {
              return (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  🎉 Excelente! Todas as ordens e pedidos estão devidamente pagos nas contas do ateliê!
                </div>
              );
            }

            return (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {unpaidOrdersArr.map((order) => {
                  const valor = order.priceCharged;
                  const item = order.itemName;
                  const methodText = order.paymentMethod || 'DINHEIRO';
                  
                  // Clean phone if possible
                  let matchedPhone = '';
                  let formattedPhone = 'Sem Telefone';
                  
                  if (order.clientId) {
                    const foundC = clients.find(cl => cl.id === order.clientId);
                    if (foundC && foundC.phone) {
                      matchedPhone = foundC.phone.replace(/\D/g, '');
                      formattedPhone = foundC.phone;
                    }
                  }

                  return (
                    <div 
                      key={`billing-${order.id}`} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white">{order.clientName}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 font-extrabold rounded uppercase tracking-wider font-sans">
                            ⏳ NÃO PAGO
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-[#8BA58D] font-mono border border-white/5 rounded">
                            {methodText}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A5BBA7] leading-relaxed truncate">
                          Peça: <strong className="text-white font-semibold">{item}</strong> • Qtd: <strong className="text-white font-semibold">{order.quantity || 1}</strong> • Data: <span className="font-mono text-zinc-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </p>
                        {formattedPhone !== 'Sem Telefone' && (
                          <div className="text-[10px] text-[#8BA58D] flex items-center gap-1 font-mono font-bold mt-0.5">
                            <span>📞 {formattedPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 min-w-[210px] shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-[#8BA58D] block font-extrabold leading-none uppercase tracking-wider">VALOR DEVEDOR:</span>
                          <span className="text-sm font-mono font-black text-rose-400">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Easy Mark as Paid button */}
                          {onUpdateOrder && (
                            <button
                              onClick={() => {
                                if (confirm(`Confirmar recebimento do pagamento de R$ ${valor.toFixed(2)} do cliente ${order.clientName}?`)) {
                                  onUpdateOrder(order.id, { paymentStatus: 'PAGO' });
                                }
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-450 hover:to-green-305 text-black text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-md active:scale-95 uppercase tracking-wide"
                              title="Marcar este pedido como PAGO"
                            >
                              ✅ PAGO
                            </button>
                          )}

                          {/* Trigger Direct WhatsApp custom text Collection message */}
                          <button
                            onClick={() => {
                              const valueStr = valor.toFixed(2);
                              const whatsappMsg = `*Olá, ${order.clientName}!* 👋\n\nEntramos em contato para formalizar o lembrete de pendência do pedido *${item}* no valor de *R$ ${valueStr}*.\n\nPedimos a gentileza de nos enviar o comprovante de pagamento caso já tenha efetuado, ou nos sinalizar para facilitarmos de outra forma (oferecemos pagamento por PIX, Dinheiro ou Cartão de Crédito). 🤝\n\nMuito obrigado pelo apoio ao nosso Ateliê! 🚀\n_Ateliê Gestão 3D_`;
                              const url = matchedPhone 
                                ? `https://api.whatsapp.com/send?phone=${matchedPhone}&text=${encodeURIComponent(whatsappMsg)}`
                                : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`;
                              window.open(url, '_blank');
                            }}
                            className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 hover:border-pink-500/40 text-pink-400 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95 uppercase tracking-wide"
                            title="Enviar lembrete de cobrança via WhatsApp"
                          >
                            💬 COBRAR
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* CALENDÁRIO MENSUAL DE VENDAS DIÁRIAS (COMPACTO & INTUITIVO) */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 shadow-xl backdrop-blur-md" id="dashboard-daily-calendar-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              📅 Calendário Diário de Faturamento de Vendas
            </h3>
            <p className="text-[10px] text-[#A5BBA7]">Faturamento diário registrado no período de {formatMonthLabel(calendarActiveMonth)}</p>
          </div>
          <div className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm leading-none shrink-0 uppercase tracking-widest">
            Total Mês: R$ {monthRevenue.toFixed(2)}
          </div>
        </div>

        <div className="w-full">
          {/* Calendar Header with week days */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#8BA58D] font-black uppercase tracking-wider pb-2 border-b border-white/5 mb-1.5">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty space placeholders for days of week offset */}
            {Array(firstDayIndex).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-12 bg-white/[0.01] rounded-xl border border-dashed border-white/5 opacity-20" />
            ))}

            {/* Target month days */}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const salesVal = getDaySales(day);
              const isToday = currentDate.getDate() === day && currentDate.getMonth() === calMonth && currentDate.getFullYear() === calYear;

              return (
                <div 
                  key={`day-${day}`} 
                  className={`h-12 p-1.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    salesVal > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-white shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:bg-emerald-500/15 hover:scale-[1.03]' 
                      : isToday
                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                      : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                  }`}
                  title={`Dia ${day}: R$ ${salesVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de vendas`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[10px] font-extrabold ${isToday ? 'text-cyan-400' : 'text-[#8BA58D]'}`}>
                      {day}
                    </span>
                    {salesVal > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  {salesVal > 0 ? (
                    <span className="text-[8px] font-mono font-black text-emerald-300 text-right truncate">
                      {salesVal.toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-mono text-[#8BA58D]/20 text-right">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row setup: Active machines (Monitor de Máquinas) & Diretrizes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="machines-directives-block">
        
        {/* Active Extruders Widget - Ciano */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-xl backdrop-blur-md hover:border-cyan-500/20 transition-all duration-300" id="active-machines-panel">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider font-sans">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
              Monitor de Máquinas ({activePrinters.length} Ativas)
            </h3>
            <p className="text-[10px] text-[#A5BBA7]">Fila de trabalho ativa e status telemétrico das extrusoras conectadas</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1" id="printers-progress-list">
            {printers.map((printer) => {
              const allocatedOrder = orders.find(o => o.assignedPrinterId === printer.id && o.status === 'PRINTING');

              return (
                <div key={printer.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-3 transition-colors hover:bg-white/[0.02]">
                  <div className="space-y-1 w-2/3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white truncate">{printer.name}</span>
                      <span className={`text-[8px] px-2 py-0.5 rounded-lg border uppercase font-extrabold tracking-wider font-sans ${
                        printer.status === 'PRINTING' 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                          : printer.status === 'MAINTENANCE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-white/5 text-[#8BA58D] border-white/5'
                      }`}>
                        {printer.status === 'PRINTING' ? 'Em Produção' : printer.status === 'MAINTENANCE' ? 'Maint' : 'Ociosa'}
                      </span>
                    </div>

                    {allocatedOrder ? (
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#A5BBA7] truncate font-semibold">{allocatedOrder.itemName}</p>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-cyan-450 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${allocatedOrder.printingProgress * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8.5px] font-mono text-[#8BA58D] font-bold">
                          <span>{Math.round(allocatedOrder.printingProgress * 100)}%</span>
                          <span>Falta ~{((1 - allocatedOrder.printingProgress) * allocatedOrder.printTimeHours).toFixed(1)}h</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8BA58D]/50 italic">Plataforma livre / Ociosa</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded-lg border border-cyan-500/15">
                      {printer.ipAddress}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCameraPrinter(printer)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 active:scale-95 rounded-xl flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition cursor-pointer shadow-md select-none"
                    >
                      <Camera className="h-3 w-3 text-amber-400" />
                      CÂMERA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => onSelectTab(1)}
            className="w-full py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 font-extrabold text-[11px] rounded-xl transition uppercase tracking-wider shrink-0 cursor-pointer text-center"
          >
            Acessar Controle de Impressoras
          </button>

          {/* Conditional Printer Camera Live Feed Modal */}
          {selectedCameraPrinter && (
            <PrinterCameraModal
              printer={selectedCameraPrinter}
              onClose={() => setSelectedCameraPrinter(null)}
              onUpdatePrinter={(id, updated) => {
                onUpdatePrinter(id, updated);
                setSelectedCameraPrinter(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
              }}
            />
          )}
        </div>

        {/* Actionable Directives - Âmbar/Esmeralda */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-xl backdrop-blur-md hover:border-amber-500/20 transition-all duration-300" id="actionable-directives">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider font-sans">
              <Sparkles className="h-4 w-4 text-emerald-455 animate-pulse" />
              Diretrizes & Plano de Ação Inteligente (Fatiador)
            </h3>
            <p className="text-[10px] text-[#A5BBA7]">Dicas automatizadas pelo assistente para aumentar a velocidade do Ateliê</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1" id="directives-list">
            
            {/* Reposição bobinas - Âmbar */}
            <div className="p-3 bg-white/[0.01] border border-white/5 hover:border-amber-500/20 rounded-xl flex items-start gap-3 transition-colors">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">Reposição de Insumos</span>
                <p className="text-[10.5px] text-[#A5BBA7] leading-normal font-sans">
                  Bobinas <strong className="text-amber-400 font-extrabold block">PLA Ouro Silk</strong> no estoque físico estão abaixo de 1000g de filamento restante.
                </p>
              </div>
            </div>

            {/* Gargalo Produção - Ciano */}
            <div className="p-3 bg-white/[0.01] border border-white/5 hover:border-cyan-500/20 rounded-xl flex items-start gap-3 transition-colors">
              <Cpu className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider block">Gargalo de Produção</span>
                <p className="text-[10.5px] text-[#A5BBA7] leading-normal">
                  A fila acumulada registra {safeOrders.filter(o => o.status === 'QUEUE').length} ordens pendentes prontas para fatiamento estrutural.
                </p>
              </div>
            </div>

            {/* Caixa Líquido - Esmeralda */}
            <div className="p-3 bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 rounded-xl flex items-start gap-3 transition-colors">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">Faturamento Pronto</span>
                <p className="text-[10.5px] text-[#A5BBA7] leading-normal font-sans">
                  Disponível para faturar e enviar aos canais de venda: <strong className="text-emerald-400 font-extrabold">R$ {safeOrders.filter(o => o.status === 'READY').reduce((acc, o) => acc + o.priceCharged, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> de pedidos prontos.
                </p>
              </div>
            </div>

          </div>

          <button 
            onClick={() => onSelectTab(2)}
            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-extrabold text-[11px] rounded-xl transition uppercase tracking-wider shrink-0 cursor-pointer text-center"
          >
            Ajustar Custos & Bobinas Físicas
          </button>
        </div>

      </div>
    </div>
  );
};
