import React, { useState } from 'react';
import { Client, Printer, PrintOrder, FilamentStock, Expense, ShoppingItem } from '../types';
import { DollarSign, AlertTriangle, TrendingUp, Cpu, ShoppingBag, Plus, Sparkles, FileText, RefreshCw, Camera } from 'lucide-react';
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
  ])).sort().reverse(); // Decending order

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
  // "pedidos abertos" (all orders whose status is not DELIVERED)
  const parsedOpenOrdersCount = safeOrders.filter(o => o.status !== 'DELIVERED').length;

  // "pedidos entregues" (status === DELIVERED, filtered by month)
  const parsedDeliveredOrdersCount = filteredOrders.filter(o => o.status === 'DELIVERED').length;

  // "pedidos a entregar" (typically status === READY, awaiting delivery/pickup)
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
      
      {/* HIGH PRIORITY: ÚLTIMAS ATUALIZAÇÕES RESUMIDAS PANEL (TOP OF DASHBOARD) */}
      <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-4 rounded-xl space-y-3 shadow-md" id="top_action_updates_panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--brand-border)] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-1.5 bg-[var(--brand-primary)]/10 rounded-lg">
              <FileText className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--brand-text)]">
                Últimas Atualizações Resumidas
              </h3>
              <p className="text-[10px] text-[var(--brand-muted)]">Indicadores operacionais consolidados e sincronizados em tempo real no ateliê</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[8.5px] uppercase tracking-wider font-extrabold text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 px-2.5 py-1 rounded border border-[var(--brand-accent)]/20 font-mono">
              Ateliê Live Active
            </span>
            <button
              onClick={handleRecalculate}
              className="px-3 py-1 bg-[var(--brand-primary)] hover:opacity-95 text-black font-extrabold rounded-lg text-[10px] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              id="btn_refresh_status_resumo"
            >
              <RefreshCw className="h-3 w-3 text-black" />
              Sincronizar Painel
            </button>
          </div>
        </div>

        {recentFeedback && (
          <p className="text-[9px] text-center font-bold text-[var(--brand-primary)] animate-pulse">{recentFeedback}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" id="dashboard-top-resumo-slots">
          <div className="bg-black/25 p-2.5 px-3 border border-[var(--brand-border)] rounded-xl flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-[var(--brand-muted)]">📦 Produção Fila:</span>
            <strong className="text-[var(--brand-text)] font-mono text-xs">{orders.filter(o => o.status === 'QUEUE' || o.status === 'PRINTING').length} ordens</strong>
          </div>
          <div className="bg-black/25 p-2.5 px-3 border border-[var(--brand-border)] rounded-xl flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-[var(--brand-muted)]">⚡ Extrusoras:</span>
            <strong className="text-[var(--brand-primary)] font-mono text-xs">{printers.filter(p => p.status === 'PRINTING').length} ativas</strong>
          </div>
          <div className="bg-black/25 p-2.5 px-3 border border-[var(--brand-border)] rounded-xl flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-[var(--brand-muted)]">🧵 Alertas Bobina:</span>
            <strong className="text-[var(--brand-accent)] font-mono text-xs">{safeFilaments.filter(f => f.stockGrams < f.minStockGrams).length} cores</strong>
          </div>
          <div className="bg-black/25 p-2.5 px-3 border border-[var(--brand-border)] rounded-xl flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-[var(--brand-muted)]">💰 Faturado Hoje:</span>
            <strong className="text-white font-mono text-xs">
              R$ {safeOrders.filter(o => o.status === 'READY' || o.status === 'DELIVERED').reduce((sum, o) => sum + o.priceCharged, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Global Stock Warning Banner is now loaded dynamically on top of everything inside App.tsx */}

      {/* SEÇÃO FINANCEIRA & DESEMPENHO UNIFICADA DE ALTA DENSIDADE (COMPREENSIVA & PROFISSIONAL) */}
      <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-4 rounded-xl shadow-sm space-y-4" id="compact-finance-dashboard">
        
        {/* Seletor de Meses para Análise */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--brand-border)] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[var(--brand-text)] uppercase tracking-wider">Período de Análise Financeira</h3>
            <p className="text-[10px] text-[var(--brand-muted)]">Selecione o mês desejado para auditar faturamentos, despesas e ROI</p>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`px-3 py-1 text-[9.5px] font-bold rounded-lg border transition duration-150 shrink-0 cursor-pointer ${
                selectedMonth === 'ALL'
                  ? 'bg-[var(--brand-primary)] text-black border-[var(--brand-primary)]'
                  : 'bg-black/30 text-[var(--brand-muted)] border-[var(--brand-border)] hover:border-[var(--brand-primary)]/40 font-mono'
              }`}
            >
              Geral (Totalizado)
            </button>
            {availableMonths.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setSelectedMonth(mKey)}
                className={`px-3 py-1 text-[9.5px] font-bold rounded-lg border transition duration-150 shrink-0 cursor-pointer ${
                  selectedMonth === mKey
                    ? 'bg-[var(--brand-primary)] text-black border-[var(--brand-primary)]'
                    : mKey === currentMonthKey
                    ? 'bg-black/40 text-[var(--brand-primary)] border-emerald-500/30 font-extrabold'
                    : 'bg-black/30 text-[var(--brand-muted)] border-[var(--brand-border)] hover:border-[var(--brand-primary)]/20'
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Card 1: Faturamento */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">Faturamento</span>
                  <span className="text-[13px] font-black text-[var(--brand-text)] font-mono">
                    R$ {monthRevenue.toFixed(0)}
                  </span>
                </div>
                <div className="p-1 bg-[var(--brand-primary)]/10 rounded text-[var(--brand-primary)]">
                  <DollarSign className="h-3 w-3" />
                </div>
              </div>

              {/* Card 2: Despesas */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">Despesas</span>
                  <span className="text-[13px] font-black text-red-400 font-mono">
                    R$ {monthExpense.toFixed(0)}
                  </span>
                </div>
                <div className="p-1 bg-red-500/10 rounded text-red-400">
                  <ShoppingBag className="h-3 w-3" />
                </div>
              </div>

              {/* Card 3: Margem Líquida */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">Margem Líq.</span>
                  <span className="text-[13px] font-black text-cyan-400 font-mono">
                    {monthProfitMargin > 0 ? `${monthProfitMargin.toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="p-1 bg-cyan-500/10 rounded text-cyan-400">
                  <TrendingUp className="h-3 w-3" />
                </div>
              </div>

              {/* Card 4: ROI (Highlight color based on profit/loss) */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">ROI</span>
                  <span className={`text-[13px] font-black font-mono ${monthRoi >= 0 ? 'text-emerald-400' : 'text-red-450'}`}>
                    {monthRoi >= 0 ? '+' : ''}{monthRoi.toFixed(1)}%
                  </span>
                </div>
                <div className={`p-1 rounded ${monthRoi >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  <TrendingUp className="h-3 w-3" />
                </div>
              </div>

              {/* Card 5: Pedidos Abertos */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">Pedidos Abertos</span>
                  <span className="text-[13px] font-black text-amber-400 font-mono">
                    {parsedOpenOrdersCount} un
                  </span>
                </div>
                <div className="p-1 bg-amber-500/10 rounded text-amber-400">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>

              {/* Card 6: Pedidos a Entregar */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">A Entregar (Prontos)</span>
                  <span className="text-[13px] font-black text-pink-400 font-mono">
                    {parsedReadyToDeliverCount} un
                  </span>
                </div>
                <div className="p-1 bg-pink-500/10 rounded text-pink-400">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>

              {/* Card 7: Pedidos Entregues */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">Delivered ({formatMonthLabel(selectedMonth)})</span>
                  <span className="text-[13px] font-black text-emerald-400 font-mono">
                    {parsedDeliveredOrdersCount} un
                  </span>
                </div>
                <div className="p-1 bg-emerald-500/10 rounded text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>

              {/* Card 8: Valor a Comprar (derived from active shopping Items) */}
              <div className="p-2.5 bg-black/25 border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-1.5" title="Valor dos insumos unchecked da Lista de Compras">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[var(--brand-muted)] font-bold uppercase block leading-tight">A Comprar (Lista)</span>
                  <span className="text-[13px] font-black text-orange-400 font-mono">
                    R$ {valorAComprar.toFixed(0)}
                  </span>
                </div>
                <div className="p-1 bg-orange-500/10 rounded text-orange-400">
                  <ShoppingBag className="h-3 w-3" />
                </div>
              </div>

            </div>
          </div>

          {/* Histórico Mini-Chart right: highly compact widget */}
          <div className="w-full xl:w-[320px] shrink-0 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-[var(--brand-border)] pt-4 xl:pt-0 xl:pl-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[var(--brand-text)] uppercase tracking-wider">Histórico Recente</span>
              <span className="text-[8px] font-mono text-[var(--brand-muted)]">R$ Max {maxOrderVal.toFixed(0)}</span>
            </div>

            <div className="relative h-14 w-full flex items-end justify-between px-1" id="charts-svg-container-mini">
              {filteredOrders.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[var(--brand-muted)] italic">
                  Sem vendas no mês selecionado
                </div>
              ) : (
                <div className="flex justify-around items-end w-full h-full">
                  {filteredOrders.slice(-12).map((o, idx) => {
                    const heightPercent = maxOrderVal > 0 ? (o.priceCharged / maxOrderVal) * 90 : 10;
                    return (
                      <div key={idx} className="flex flex-col items-center group relative flex-1 mx-0.5 bg-transparent">
                        <div className="absolute bottom-full mb-1 bg-[var(--brand-bg)] border border-[var(--brand-border)] px-1.5 py-0.5 rounded text-[8px] text-[var(--brand-text)] opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap z-10 pointer-events-none">
                          R$ {o.priceCharged.toFixed(0)} - {o.itemName}
                        </div>
                        <div 
                          className="w-full bg-[var(--brand-primary)] hover:opacity-85 rounded-t transition-all duration-200"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[9px] text-[var(--brand-muted)] mt-1.5 leading-none select-none">
              <span>Média por item: R$ {filteredOrders.length > 0 ? (monthRevenue / filteredOrders.length).toFixed(0) : '0'}</span>
              <button 
                onClick={() => onSelectTab(1)}
                className="text-[var(--brand-primary)] hover:underline font-extrabold cursor-pointer"
              >
                Fila de Vendas →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO DE COBRANÇAS, CRÉDITOS E CONSIGNADOS (GESTAO FINANCEIRA ATIVA - ATUALIZAÇÃO 3.2.3.5) */}
      <div className="bg-[#111613] border border-[#232B27] rounded-xl p-4 space-y-4 shadow-md" id="finance-collections-billing-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232B27]/60 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              📊 Meios de Pagamento & Cobranças Ativas (v3.2.3.5)
            </h3>
            <p className="text-[10px] text-[#8BA58D]">Faturamento segmentado por carteira e controle de recebíveis em aberto</p>
          </div>
          <div className="text-[9.5px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/25 leading-none shrink-0" id="current_overdue_total_pill">
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

            // Dinheiro
            const cashOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'DINHEIRO');
            const cashTotal = cashOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Cartão
            const cardOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'CARTÃO');
            const cardTotal = cardOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Consignado
            const consignmentOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'CONSIGNADO');
            const consignmentTotal = consignmentOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            // Outros / PIX
            const otherOrders = listOrdersWithDefaults.filter(o => o.paymentMethod === 'OUTROS');
            const otherTotal = otherOrders.reduce((sum, o) => sum + o.priceCharged, 0);

            const allTotals = cashTotal + cardTotal + consignmentTotal + otherTotal || 1;

            return (
              <>
                {/* Dinheiro Card */}
                <div className="p-3 bg-[#0C100E] border border-[#1A251E] rounded-xl flex flex-col justify-between space-y-1.5 transition hover:border-[#8BA58D]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8BA58D] font-black uppercase tracking-wider">📂 DINHEIRO</span>
                    <span className="text-[9px] text-[#8BA58D] font-mono">({cashOrders.length} un)</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-black text-white font-mono font-bold">R$ {cashTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-[#151D19] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${Math.round((cashTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] text-[#8BA58D]/70 font-sans block">{Math.round((cashTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* Cartão Card */}
                <div className="p-3 bg-[#0C100E] border border-[#1A251E] rounded-xl flex flex-col justify-between space-y-1.5 transition hover:border-[#8BA58D]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8BA58D] font-black uppercase tracking-wider font-sans">💳 CARTÃO (Déb/Créd)</span>
                    <span className="text-[9px] text-[#8BA58D] font-mono">({cardOrders.length} un)</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-black text-white font-mono font-bold">R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-[#151D19] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full" style={{ width: `${Math.round((cardTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] text-[#8BA58D]/70 font-sans block">{Math.round((cardTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* Consignado Card */}
                <div className="p-3 bg-[#0C100E] border border-[#1A251E] rounded-xl flex flex-col justify-between space-y-1.5 transition hover:border-[#8BA58D]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8BA58D] font-black uppercase tracking-wider font-sans">🤝 CONSIGNADOS</span>
                    <span className="text-[9px] text-[#8BA58D] font-mono">({consignmentOrders.length} un)</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-black text-white font-mono font-bold">R$ {consignmentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-[#151D19] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: `${Math.round((consignmentTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] text-[#8BA58D]/70 font-sans block">{Math.round((consignmentTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>

                {/* PIX / Outros Card */}
                <div className="p-3 bg-[#0C100E] border border-[#1A251E] rounded-xl flex flex-col justify-between space-y-1.5 transition hover:border-[#8BA58D]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8BA58D] font-black uppercase tracking-wider font-sans">🌐 PIX / TRANSFERÊNCIA</span>
                    <span className="text-[9px] text-[#8BA58D] font-mono">({otherOrders.length} un)</span>
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-black text-white font-mono font-bold">R$ {otherTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                    <div className="w-full bg-[#151D19] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.round((otherTotal / allTotals) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] text-[#8BA58D]/70 font-sans block">{Math.round((otherTotal / allTotals) * 100)}% das vendas totais</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* 2. Lista Inteligente de Devedores e Lançamento de Cobranças */}
        <div className="bg-[#0A0D0B] border border-[#232B27]/40 p-3 rounded-xl space-y-2.5">
          <h4 className="text-[11px] font-bold text-[#95BBA2] uppercase tracking-wide flex items-center gap-1.5">
            ⏳ PAINEL DE CONTAS EM ABERTO / COBRANÇA DIRETA (WHATSAPP)
          </h4>
          
          {(() => {
            const unpaidOrdersArr = safeOrders.filter(o => {
              const payStat = o.paymentStatus || 'PENDENTE';
              return payStat !== 'PAGO';
            });

            if (unpaidOrdersArr.length === 0) {
              return (
                <div className="text-center py-5 text-zinc-500 text-xs italic">
                  🎉 Excelente! Todas as ordens e pedidos estão devidamente pagos nas contas do ateliê!
                </div>
              );
            }

            return (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-[#0C120F] border border-[#1E2822]/65 rounded-xl hover:border-[#8BA58D]/30 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{order.clientName}</span>
                          <span className="text-[8px] px-1.5 py-0.25 bg-[#231212] border border-red-500/20 text-red-400 font-extrabold rounded uppercase">
                            ⏳ NÃO PAGO
                          </span>
                          <span className="text-[8px] px-1.5 py-0.25 bg-black text-[#8BA58D] font-mono border border-zinc-800 rounded">
                            {methodText}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8BA58D]">
                          Peça: <strong className="text-white font-medium">{item}</strong> • Qtd: <strong className="text-white font-medium">{order.quantity || 1}</strong> • Data: <span className="font-mono">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </p>
                        {formattedPhone !== 'Sem Telefone' && (
                          <div className="text-[9.5px] text-[#95BBA2] flex items-center gap-1">
                            <span>📞 {formattedPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#232B27]/40 min-w-[200px]">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-[#8BA58D] block font-semibold leading-none">VALOR TOTAL:</span>
                          <span className="text-sm font-mono font-black text-amber-300">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Easy Mark as Paid button */}
                          {onUpdateOrder && (
                            <button
                              onClick={() => {
                                if (confirm(`Confirmar recebimento do pagamento de R$ ${valor.toFixed(2)} do cliente ${order.clientName}?`)) {
                                  onUpdateOrder(order.id, { paymentStatus: 'PAGO' });
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[9px] font-extrabold rounded-lg transition-all cursor-pointer shadow-md"
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
                            className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900 border border-red-500/30 hover:border-red-500 text-red-400 text-[9px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1"
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
      <div className="p-4 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl space-y-3.5 shadow-sm" id="dashboard-daily-calendar-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--brand-border)] pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-[var(--brand-text)] uppercase tracking-wider flex items-center gap-1.5">
              📅 Calendário Diário de Vendas
            </h3>
            <p className="text-[10px] text-[var(--brand-muted)]">Faturamento diário registrado no período de {formatMonthLabel(calendarActiveMonth)}</p>
          </div>
          <div className="text-[9.5px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 shadow-sm leading-none shrink-0">
            Faturamento: R$ {monthRevenue.toFixed(2)}
          </div>
        </div>

        <div className="w-full">
          {/* Calendar Header with week days */}
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-[var(--brand-muted)] font-black uppercase tracking-wider pb-1">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty space placeholders for days of week offset */}
            {Array(firstDayIndex).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-11 bg-black/10 rounded-lg border border-transparent opacity-20" />
            ))}

            {/* Target month days */}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const salesVal = getDaySales(day);
              const isToday = currentDate.getDate() === day && currentDate.getMonth() === calMonth && currentDate.getFullYear() === calYear;

              return (
                <div 
                  key={`day-${day}`} 
                  className={`h-11 p-1 rounded-lg border transition-all flex flex-col justify-between ${
                    salesVal > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.055)] hover:bg-emerald-500/20' 
                      : isToday
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-text)]'
                      : 'bg-black/20 border-[var(--brand-border)] hover:border-[var(--brand-primary)]/20'
                  }`}
                  title={`Dia ${day}: R$ ${salesVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de vendas`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[9.5px] font-black ${isToday ? 'text-[var(--brand-primary)]' : 'text-[var(--brand-muted)]'}`}>
                      {day}
                    </span>
                    {salesVal > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  {salesVal > 0 ? (
                    <span className="text-[7.5px] font-black text-emerald-400 font-mono text-right truncate">
                      {salesVal.toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-[7px] font-mono text-[var(--brand-muted)]/20 text-right">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row setup: Active machines (Monitor de Máquinas) & Diretrizes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="machines-directives-block">
        
        {/* Active Extruders Widget */}
        <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-4 rounded-xl flex flex-col justify-between space-y-3" id="active-machines-panel">
          <div>
            <h3 className="text-xs font-bold text-[var(--brand-text)] flex items-center gap-2 uppercase tracking-wide">
              <span className="w-2 h-2 bg-[var(--brand-accent)] rounded-full animate-pulse" />
              Monitor de Máquinas ({activePrinters.length} Ativas)
            </h3>
            <p className="text-[10px] text-[var(--brand-muted)]">Fila ativa das extrusoras conectadas</p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[140px]" id="printers-progress-list">
            {printers.map((printer) => {
              const allocatedOrder = orders.find(o => o.assignedPrinterId === printer.id && o.status === 'PRINTING');

              return (
                <div key={printer.id} className="p-2 bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-1 w-2/3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold text-[var(--brand-text)]">{printer.name}</span>
                      <span className={`text-[7.5px] px-1 py-0.25 rounded uppercase font-black ${
                        printer.status === 'PRINTING' 
                          ? 'bg-[var(--brand-accent)] text-black border border-[var(--brand-accent)] font-extrabold' 
                          : printer.status === 'MAINTENANCE'
                          ? 'bg-red-500/15 text-red-400 border border-red-550/20'
                          : 'bg-[var(--brand-muted)]/10 text-[var(--brand-muted)]'
                      }`}>
                        {printer.status === 'PRINTING' ? 'Em Produção' : printer.status === 'MAINTENANCE' ? 'Maint' : 'Ociosa'}
                      </span>
                    </div>

                    {allocatedOrder ? (
                      <div className="space-y-1">
                        <p className="text-[9.5px] text-[var(--brand-muted)] truncate">{allocatedOrder.itemName}</p>
                        <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-[var(--brand-accent)] h-1 rounded-full transition-all duration-500" 
                            style={{ width: `${allocatedOrder.printingProgress * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-[var(--brand-muted)]">
                          <span>{Math.round(allocatedOrder.printingProgress * 100)}%</span>
                          <span>Falta ~{((1 - allocatedOrder.printingProgress) * allocatedOrder.printTimeHours).toFixed(1)}h</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[9px] text-[var(--brand-muted)] italic">Filamento livre / Ociosa</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[8px] font-mono text-[var(--brand-muted)] bg-[var(--brand-bg)] px-1.5 py-0.5 rounded">
                      {printer.ipAddress}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCameraPrinter(printer)}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 rounded-md flex items-center gap-1.5 text-[8.5px] font-bold transition cursor-pointer shadow-sm select-none"
                    >
                      <Camera className="h-3 w-3 text-amber-500" />
                      CÂMERA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => onSelectTab(1)}
            className="w-full py-1.5 bg-[var(--brand-primary)]/15 hover:bg-[var(--brand-primary)]/25 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] font-extrabold text-[10.5px] rounded-lg transition shrink-0 cursor-pointer text-center"
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

        {/* Actionable Directives */}
        <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-4 rounded-xl flex flex-col justify-between space-y-3" id="actionable-directives">
          <div>
            <h3 className="text-xs font-bold text-[var(--brand-text)] flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-[var(--brand-accent)] animate-pulse" />
              Diretrizes & Plano de Ação Inteligente
            </h3>
            <p className="text-[10px] text-[var(--brand-muted)]">Dicas de produtividade e sensores do fatiador</p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[140px]" id="directives-list">
            <div className="p-2 bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[var(--brand-text)] block leading-tight">Reposição Crítica</span>
                <p className="text-[9.5px] text-[var(--brand-muted)] leading-normal">
                  Bobinas <strong className="text-[var(--brand-accent)] font-semibold">PLA Ouro Silk</strong> abaixo de 1000g.
                </p>
              </div>
            </div>

            <div className="p-2 bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg flex items-start gap-2">
              <Cpu className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[var(--brand-text)] block leading-tight">Gargalo de Produção</span>
                <p className="text-[9.5px] text-[var(--brand-muted)] leading-normal">
                  Fila de impressão acumula {safeOrders.filter(o => o.status === 'QUEUE').length} ordens pendentes.
                </p>
              </div>
            </div>

            <div className="p-2 bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg flex items-start gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[var(--brand-text)] block leading-tight">Caixa Líquido</span>
                <p className="text-[9.5px] text-[var(--brand-muted)] leading-normal">
                  Disponível para faturar e enviar: <strong className="text-[var(--brand-primary)]">R$ {safeOrders.filter(o => o.status === 'READY').reduce((acc, o) => acc + o.priceCharged, 0).toFixed(0)}</strong>.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onSelectTab(2)}
            className="w-full py-1.5 bg-[var(--brand-accent)]/15 hover:bg-[var(--brand-accent)]/25 border border-[var(--brand-accent)]/20 text-[var(--brand-accent)] font-extrabold text-[10.5px] rounded-lg transition shrink-0 cursor-pointer text-center"
          >
            Ajustar Custos & Bobinas Físicas
          </button>
        </div>

      </div>
    </div>
  );
};
