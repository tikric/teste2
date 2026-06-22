import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintOrder, Printer, FilamentStock } from '../types';
import { 
  Plus, 
  Trash2, 
  Check, 
  RotateCw, 
  Clock, 
  AlertCircle, 
  Printer as PrinterIcon, 
  Tag, 
  X, 
  ChevronRight,
  ClipboardList,
  PlayCircle,
  Camera,
  Video
} from 'lucide-react';
import { initialCatalogItems } from '../utils/initialData';
import { PrinterCameraModal } from './PrinterCameraModal';

// Helper labels translation mapping
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'WAITING': return "Ag. Arquivo";
    case 'QUEUE': return "NaFila / Pagar";
    case 'PRINTING': return "Imprimindo";
    case 'POST_PROCESS': return "Pós-Processo";
    case 'READY': return "Pronto";
    case 'DELIVERED': return "Entregue";
    default: return status;
  }
};

const getNextStatusActionLabel = (status: string): string => {
  switch (status) {
    case 'WAITING': return "Estudo/Fila";
    case 'QUEUE': return "Iniciar Impressão";
    case 'PRINTING': return "Ir p/ Acabamento";
    case 'POST_PROCESS': return "Marcar Pronto";
    case 'READY': return "Marcar Entregue";
    default: return "";
  }
};

const getNextStatusValue = (status: string): string | null => {
  switch (status) {
    case 'WAITING': return "QUEUE";
    case 'QUEUE': return "PRINTING";
    case 'PRINTING': return "POST_PROCESS";
    case 'POST_PROCESS': return "READY";
    case 'READY': return "DELIVERED";
    default: return null;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'WAITING': return '#90A4AE';
    case 'QUEUE': return 'var(--brand-accent)';
    case 'PRINTING': return 'var(--brand-primary)';
    case 'POST_PROCESS': return 'var(--brand-accent)';
    case 'READY': return '#3b82f6'; // Azul vibrante para pronto / empacotado
    case 'DELIVERED': return '#10b981'; // Verde para entregue / finalizado
    default: return 'var(--brand-muted)';
  }
};

const getDelayCategory = (createdAt: number, status: string) => {
  if (status === 'DELIVERED' || status === 'READY') {
    return { level: 'GREEN', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'No Prazo' };
  }
  const elapsedHrs = (Date.now() - createdAt) / (1000 * 3600);
  if (elapsedHrs >= 24) {
    return { level: 'CRITICAL', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500', textClass: 'text-red-400', label: 'CRÍTICO (+24h) 🚨' };
  }
  if (elapsedHrs >= 15) {
    return { level: 'ORANGE', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500', textClass: 'text-orange-400', label: 'ATENÇÃO (15h) ⚠️' };
  }
  if (elapsedHrs >= 8) {
    return { level: 'YELLOW', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500', textClass: 'text-yellow-400', label: 'ATENÇÃO (8h) ⏳' };
  }
  return { level: 'GREEN', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', textClass: 'text-emerald-400', label: 'Verde (Normal)' };
};

const getProgressPercentage = (status: string, printingProgress: number = 0): number => {
  switch (status) {
    case 'WAITING': return 15;
    case 'QUEUE': return 35;
    case 'PRINTING': return Math.min(80, Math.max(40, 40 + Math.round(printingProgress * 40)));
    case 'POST_PROCESS': return 85;
    case 'READY': return 100;
    default: return 0;
  }
};

interface ProductionTabProps {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  clients: Array<{ id: number; name: string }>;
  onAddOrder: (order: Partial<PrintOrder>) => void;
  onUpdateOrder: (id: number, updated: Partial<PrintOrder>) => void;
  onDeleteOrder: (id: number) => void;
  onSimulateTick: () => void;
  onUpdateFilament?: (id: number, updated: Partial<FilamentStock>) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  orders,
  printers,
  filamentStocks,
  clients,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onSimulateTick,
  onUpdateFilament,
  onUpdatePrinter
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCameraPrinter, setSelectedCameraPrinter] = useState<Printer | null>(null);
  
  const getPrinterImage = (model: string = '', customUrl?: string) => {
    if (customUrl && customUrl.trim()) return customUrl.trim();
    const m = model.toLowerCase();
    if (m.includes('bambu') || m.includes('p1') || m.includes('x1') || m.includes('a1')) {
      return 'https://images.unsplash.com/photo-1701073837941-f76a5bf98505?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('k1') || m.includes('creality') || m.includes('ender') || m.includes('v3') || m.includes('sermoon')) {
      return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('prusa') || m.includes('mk3') || m.includes('mk4') || m.includes('mini')) {
      return 'https://images.unsplash.com/photo-1544993130-9df2492f2549?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('resina') || m.includes('resin') || m.includes('sla') || m.includes('elegoo') || m.includes('photon') || m.includes('halot')) {
      return 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('artillery') || m.includes('genius') || m.includes('sidewinder')) {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=400&q=80';
  };

  const [catalogItems, setCatalogItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_catalog_production');
      return saved ? JSON.parse(saved) : initialCatalogItems;
    } catch (e) {
      console.warn("Failed to parse local catalog items, using default", e);
      return initialCatalogItems;
    }
  });

  useEffect(() => {
    localStorage.setItem('bambuzau_local_catalog_production', JSON.stringify(catalogItems));
  }, [catalogItems]);

  // Check for delayed orders
  const [notifiedDelayedIds, setNotifiedDelayedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_notified_delayed_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bambuzau_notified_delayed_ids', JSON.stringify(notifiedDelayedIds));
  }, [notifiedDelayedIds]);

  useEffect(() => {
    // Request notification permission if not yet requested
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const activeDelayed = orders.filter(o => {
      if (o.status === 'DELIVERED' || o.status === 'READY') return false;
      const fourHoursMs = 4 * 60 * 60 * 1000;
      return (Date.now() - o.createdAt) > fourHoursMs;
    });

    let updated = false;
    const newIds = [...notifiedDelayedIds];

    activeDelayed.forEach(order => {
      if (!newIds.includes(order.id)) {
        newIds.push(order.id);
        updated = true;

        // 1. Web Browser Native Push Notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🚨 Gestão 3D: Pedido Atrasado!", {
              body: `O pedido "${order.itemName}" (Cliente: ${order.clientName}) ultrapassou o tempo limite de 4 horas!`,
              tag: `delayed-order-${order.id}`
            });
          } catch (e) {
            console.warn("Could not fire standard Notification", e);
          }
        }

        // 2. Play audible warning tone using Web Audio API Synthesizer
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start();

            // Distinct siren alarm beep sound
            let toggles = 0;
            const interval = setInterval(() => {
              if (toggles >= 4) {
                clearInterval(interval);
                osc.stop();
                ctx.close();
              } else {
                osc.frequency.setValueAtTime(toggles % 2 === 0 ? 880 : 550, ctx.currentTime);
                toggles++;
              }
            }, 180);
          }
        } catch (audioErr) {
          console.warn("Audible alarm blocked or unsupported", audioErr);
        }
      }
    });

    if (updated) {
      setNotifiedDelayedIds(newIds);
    }
  }, [orders, notifiedDelayedIds]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PrintOrder | null>(null);
  const [quickPrintOrder, setQuickPrintOrder] = useState<PrintOrder | null>(null);

  // Form Fields State
  const [formClientId, setFormClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [formItemName, setFormItemName] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formFilamentType, setFormFilamentType] = useState<string>('PLA');
  const [formFilamentColor, setFormFilamentColor] = useState<string>('');
  const [formWeightGrams, setFormWeightGrams] = useState<number>(100);
  const [formPrintTime, setFormPrintTime] = useState<number>(3);
  const [formPriceCharged, setFormPriceCharged] = useState<number>(50);
  const [formPlatform, setFormPlatform] = useState<string>('MANUAL');
  const [formStatus, setFormStatus] = useState<string>('QUEUE');
  const [formPrinterId, setFormPrinterId] = useState<string>('');
  const [deadlineDays, setDeadlineDays] = useState<number>(2);
  const [formCreatedAt, setFormCreatedAt] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CONSIGNADO' | 'CARTÃO' | 'DINHEIRO' | 'OUTROS'>('DINHEIRO');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'PAGO' | 'PENDENTE'>('PENDENTE');

  const availableColors = filamentStocks
    .filter(f => f.type === formFilamentType)
    .map(f => f.color);

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(formFilamentColor)) {
      setFormFilamentColor(availableColors[0]);
    }
  }, [formFilamentType]);

  const handleOpenAddDialog = () => {
    setEditingOrder(null);
    setFormClientId(clients.length > 0 ? clients[0].id.toString() : '');
    setCustomClientName('');
    setFormItemName('');
    setFormQuantity(1);
    setFormFilamentType('PLA');
    const cols = filamentStocks.filter(f => f.type === 'PLA');
    setFormFilamentColor(cols.length > 0 ? cols[0].color : '');
    setFormWeightGrams(100);
    setFormPrintTime(3.0);
    setFormPriceCharged(50.0);
    setFormPlatform('MANUAL');
    setFormStatus('QUEUE');
    setFormPrinterId('');
    setDeadlineDays(2);
    setFormPaymentMethod('DINHEIRO');
    setFormPaymentStatus('PENDENTE');
    
    // Set current local time for input datetime-local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setFormCreatedAt(localISOTime);
    
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (order: PrintOrder) => {
    setEditingOrder(order);
    setFormClientId(order.clientId ? order.clientId.toString() : 'CUSTOM');
    setCustomClientName(order.clientId ? '' : order.clientName);
    setFormItemName(order.itemName);
    setFormQuantity(order.quantity || 1);
    setFormFilamentType(order.filamentType);
    setFormFilamentColor(order.filamentColor);
    setFormWeightGrams(order.weightGrams);
    setFormPrintTime(order.printTimeHours);
    setFormPriceCharged(order.priceCharged);
    setFormPlatform(order.platformSource);
    setFormStatus(order.status);
    setFormPrinterId(order.assignedPrinterId ? order.assignedPrinterId.toString() : '');
    const daysLeft = Math.max(1, Math.round((order.deadline - Date.now()) / (24 * 3600 * 1000)));
    setDeadlineDays(daysLeft);
    setFormPaymentMethod(order.paymentMethod || 'DINHEIRO');
    setFormPaymentStatus(order.paymentStatus || 'PENDENTE');
    
    // Set creation time for input datetime-local
    const tzoffset = (new Date(order.createdAt)).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(order.createdAt - tzoffset)).toISOString().slice(0, 16);
    setFormCreatedAt(localISOTime);

    setIsDialogOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let clientIdFinal: number | null = null;
    let clientNameFinal = customClientName;

    if (formClientId !== 'CUSTOM') {
      const selectedClient = clients.find(c => c.id === parseInt(formClientId));
      if (selectedClient) {
        clientIdFinal = selectedClient.id;
        clientNameFinal = selectedClient.name;
      }
    }

    if (!clientNameFinal.trim()) {
      alert('Por favor especifique o nome do cliente.');
      return;
    }

    const customCreatedAt = formCreatedAt ? new Date(formCreatedAt).getTime() : Date.now();

    const payload: Partial<PrintOrder> = {
      clientId: clientIdFinal,
      clientName: clientNameFinal,
      itemName: formItemName.trim(),
      quantity: formQuantity,
      filamentType: formFilamentType,
      filamentColor: formFilamentColor,
      weightGrams: formWeightGrams,
      printTimeHours: formPrintTime,
      priceCharged: formPriceCharged,
      platformSource: formPlatform as any,
      status: formStatus as any,
      assignedPrinterId: formStatus === 'PRINTING' && formPrinterId ? parseInt(formPrinterId) : null,
      printerName: formStatus === 'PRINTING' && formPrinterId ? printers.find(p => p.id === parseInt(formPrinterId))?.name : '',
      printingProgress: formStatus === 'PRINTING' ? (editingOrder?.printingProgress || 0.1) : (formStatus === 'WAITING' || formStatus === 'QUEUE' ? 0.0 : 1.0),
      deadline: customCreatedAt + deadlineDays * 24 * 3600 * 1000,
      paymentMethod: formPaymentMethod,
      paymentStatus: formPaymentStatus
    };

    if (editingOrder) {
      onUpdateOrder(editingOrder.id, {
        ...payload,
        createdAt: customCreatedAt
      });
    } else {
      onAddOrder({
        ...payload,
        createdAt: customCreatedAt,
        printingProgress: formStatus === 'PRINTING' ? 0.1 : 0.0
      });
    }
    setIsDialogOpen(false);
  };

  const handleFastStatusAdvance = (order: PrintOrder, nextStatus: string) => {
    if (nextStatus === 'PRINTING') {
      const idlePrinters = printers.filter(p => p.status === 'IDLE');
      if (idlePrinters.length > 0) {
        const defaultPrinter = idlePrinters[0];
        onUpdateOrder(order.id, {
          status: 'PRINTING',
          assignedPrinterId: defaultPrinter.id,
          printerName: defaultPrinter.name,
          printingProgress: 0.05
        });
      } else {
        setQuickPrintOrder(order);
      }
    } else {
      onUpdateOrder(order.id, {
        status: nextStatus as any,
        printingProgress: nextStatus === 'POST_PROCESS' || nextStatus === 'READY' || nextStatus === 'DELIVERED' ? 1.0 : 0.0
      });
    }
  };

  const handleSelectPrinterQuick = (printerId: number) => {
    if (!quickPrintOrder) return;
    const printerObj = printers.find(p => p.id === printerId);
    onUpdateOrder(quickPrintOrder.id, {
      status: 'PRINTING',
      assignedPrinterId: printerId,
      printerName: printerObj ? printerObj.name : 'Impressora',
      printingProgress: 0.05
    });
    setQuickPrintOrder(null);
  };

  const handleIncreaseFilament = (stockId: number, currentGrams: number) => {
    if (onUpdateFilament) {
      onUpdateFilament(stockId, { stockGrams: currentGrams + 1000 });
    }
  };

  const handleProduceDeficitItem = (item: any) => {
    onAddOrder({
      clientName: 'Estoque Interno',
      itemName: `${item.name} (Reposição)`,
      quantity: 1,
      filamentType: item.filamentType,
      filamentColor: 'Preto Carbono',
      weightGrams: item.weightGrams,
      printTimeHours: item.printTimeHours,
      priceCharged: item.defaultPrice,
      platformSource: 'MANUAL',
      status: 'QUEUE',
      printingProgress: 0.0,
      createdAt: Date.now(),
      deadline: Date.now() + 2 * 24 * 3600 * 1000
    });

    setCatalogItems((prev: any[]) => prev.map((c: any) => 
      c.id === item.id ? { ...c, stockCount: c.stockCount + 1 } : c
    ));
  };

  const totalOrdersCount = orders.filter(o => o.status !== 'DELIVERED').length;
  const printingCount = orders.filter(o => o.status === 'PRINTING').length;
  const totalRevenue = orders.filter(o => o.status !== 'DELIVERED').reduce((sum, o) => sum + o.priceCharged, 0);
  const readyAndDeliveredCount = orders.filter(o => o.status === 'READY').length;

  const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
  const lowCatalogItems = catalogItems.filter((c: any) => c.stockCount < c.minStockCount);

  const filterOptions = [
    { key: 'TODOS', label: 'Todos Ativos' },
    { key: 'WAITING', label: 'Aguard. Arq' },
    { key: 'QUEUE', label: 'NaFila' },
    { key: 'PRINTING', label: 'Imprimindo' },
    { key: 'POST_PROCESS', label: 'Pós-Proc' },
    { key: 'READY', label: 'Pronto / Emb' }
  ];

  const filteredOrders = orders.filter(order => {
    // Excluir os entregues da aba de fura de produção, pois agora vão para a aba de vendidos
    if (order.status === 'DELIVERED') return false;

    if (selectedFilter !== 'TODOS' && order.status !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return order.itemName.toLowerCase().includes(q) || 
             order.clientName.toLowerCase().includes(q) ||
             (order.printerName || '').toLowerCase().includes(q) ||
             order.filamentType.toLowerCase().includes(q) ||
             order.filamentColor.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    // Sempre ordenar por tempo de atraso (mais antigo / maior tempo de atraso primeiro)
    return a.createdAt - b.createdAt;
  });

  const totalOrders = orders.filter(o => o.status !== 'DELIVERED').length;

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  return (
    <div className="space-y-6" id="production-dashboard-container">
      
      {/* ONLINE PRINTER CONNECTIONS */}
      <div className="bg-[#151917] border border-[#232B27] p-4 rounded-xl space-y-3 shadow" id="online-printers-tracker">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232B27] pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#95BBA2] flex items-center gap-1.5" id="active-printers-heading">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Impressoras Ativas ({printers.filter(p => p.status === 'PRINTING').length} em uso)
            </h3>
          </div>
        </div>

        {printers.length === 0 ? (
          <div className="text-center py-6 bg-[#0C0E0D] border border-[#232B27] rounded-xl">
            <p className="text-xs text-zinc-400 font-bold">Nenhuma impressora 3D cadastrada ainda.</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Cadastre suas impressoras e IPs na aba "Clientes & Impressoras" para sincronização.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {printers.map((printer) => {
              const expressesActivity = printer.status === 'PRINTING' || (printer.isOnline && (printer.printProgress || 0) > 0);
              const imageUrl = getPrinterImage(printer.model, printer.customUrl);
              const progressPercentage = printer.printProgress || (printer.status === 'PRINTING' ? 68 : 0);
              const activeLabel = printer.currentJob || "Ativo";

               return (
                <div 
                  key={printer.id} 
                  onClick={() => setSelectedCameraPrinter(printer)}
                  className={`group relative aspect-square rounded-xl overflow-hidden select-none transition-all duration-300 border-2 cursor-pointer ${
                    expressesActivity 
                      ? 'border-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:border-amber-400' 
                      : 'border-red-600 hover:border-amber-400'
                  }`}
                  id={`production_printer_card_${printer.id}`}
                  title="Clique para acessar a câmera ao vivo"
                >
                  <img 
                    src={imageUrl} 
                    alt={printer.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Subtle pulsing camera link hover circle overlay */}
                  <div className="absolute inset-x-0 top-0 pt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <span className="flex items-center gap-1.5 bg-black/85 text-[8px] font-bold text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 shadow-lg">
                      <Camera className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                      VER CÂMERA
                    </span>
                  </div>

                  {/* Compact overlay showing current monitoring status */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[8px] sm:text-[9.5px] font-black text-[#F1F4EE] truncate leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {printer.name}
                    </span>
                    
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`w-1 h-1 rounded-full ${expressesActivity ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                        <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-300 truncate font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {expressesActivity ? activeLabel : 'Inativo'}
                        </span>
                      </div>
                      {expressesActivity && (
                        <span className="text-[7.5px] sm:text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-1 rounded border border-emerald-500/25 shrink-0">
                          {progressPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating live feed camera overlay */}
        {selectedCameraPrinter && (
          <PrinterCameraModal
            printer={selectedCameraPrinter}
            onClose={() => setSelectedCameraPrinter(null)}
            onUpdatePrinter={(id, updated) => {
              onUpdatePrinter(id, updated);
              // Keeps local modal visual state in sync
              setSelectedCameraPrinter(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
            }}
          />
        )}
      </div>

      {/* Compact status row grouping Total Pedidos & Faturamento for space saving */}
      <div className="grid grid-cols-2 gap-4 bg-[#151917] p-3.5 rounded-xl border border-[#232B27] select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#95BBA2]/10 rounded-lg text-[#95BBA2]">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] text-[#8BA58D] uppercase font-bold tracking-wider leading-none">Total Pedidos</p>
            <p className="text-base font-bold text-[#F1F4EE] mt-0.5 truncate">{totalOrdersCount} <span className="text-[9.5px] text-[#8BA58D] font-normal font-sans">({printingCount} ativo)</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-[#232B27] pl-3">
          <div className="p-2 bg-[#5E8B61]/10 rounded-lg text-[#5E8B61]">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] text-[#8BA58D] uppercase font-bold tracking-wider leading-none">Faturamento</p>
            <p className="text-base font-bold text-[#F1F4EE] mt-0.5 truncate">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Alerts for critical stocks */}
      {(lowFilaments.length > 0 || lowCatalogItems.length > 0) && (
        <div className="bg-[#2E1719] rounded-xl border border-[#EF5350]/30 p-4 space-y-3 shadow-xl transition-all">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744] inline-block animate-ping" />
            <span className="text-xs font-black text-[#FF8A80] uppercase tracking-wider">
              COMPRAS RECOMENDADAS (ESTOQUE CRÍTICO)
            </span>
          </div>

          {lowFilaments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/90">
                Filamentos abaixo do mínimo de segurança:
              </h4>
              <div className="space-y-1.5 pl-2 border-l border-[#FF1744]/25">
                {lowFilaments.map(fil => (
                  <div key={fil.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
                    <span className="text-xs text-[#F1F4EE]">
                      • <strong className="text-[#E5B242]">{fil.type}</strong> {fil.color} ({Math.round(fil.stockGrams)}g / min. {Math.round(fil.minStockGrams)}g)
                    </span>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleIncreaseFilament(fil.id, fil.stockGrams)}
                        className="px-2 py-0.5 bg-[#5E8B61]/15 hover:bg-[#5E8B61]/35 text-[#95BBA2] text-[10px] font-extrabold rounded border border-[#5E8B61]/30 transition flex items-center justify-center cursor-pointer"
                      >
                        +1 Rolo (1kg)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowCatalogItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-semibold text-white/90">
                Peças acabadas do catálogo com falta de reposição:
              </h4>
              <div className="space-y-1.5 pl-2 border-l border-[#EF5350]/25">
                {lowCatalogItems.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between gap-4 py-0.5">
                    <span className="text-xs text-[#F1F4EE]">
                      • {cat.name} ({cat.stockCount} de {cat.minStockCount} itens)
                    </span>
                    <button
                      onClick={() => handleProduceDeficitItem(cat)}
                      className="px-2.5 py-1 bg-[#E5B242]/15 hover:bg-[#E5B242]/30 text-[#E5B242] text-[9px] font-extrabold rounded border border-[#E5B242]/30 transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      +1 Produzir 🛠️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Beautiful, professional, integrated manufacturing progress bar */}
      <div className="bg-[#151917] rounded-xl border border-[#232B27] p-4 space-y-3.5 shadow-md relative overflow-hidden select-none">
        <div className="flex items-center justify-between text-xs font-bold text-[#F1F4EE]">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[#95BBA2]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            Acompanhamento de Execução Global
          </span>
          <span className="font-mono text-sm text-[var(--brand-primary)] animate-pulse">
            {(() => {
              const activeProductionOrders = orders.filter(o => o.status !== 'DELIVERED');
              const totalActive = activeProductionOrders.length;
              if (totalActive === 0) return 0;
              const sumProgress = activeProductionOrders.reduce((acc, o) => acc + getProgressPercentage(o.status, o.printingProgress), 0);
              return Math.round(sumProgress / totalActive);
            })()}%
          </span>
        </div>

        <div className="w-full h-3 bg-[#0C0E0D] border border-[#232B27] rounded-full overflow-hidden p-[2.5px]">
          <div 
            style={{ 
              width: `${(() => {
                const activeProductionOrders = orders.filter(o => o.status !== 'DELIVERED');
                const totalActive = activeProductionOrders.length;
                if (totalActive === 0) return 0;
                const sumProgress = activeProductionOrders.reduce((acc, o) => acc + getProgressPercentage(o.status, o.printingProgress), 0);
                return Math.round(sumProgress / totalActive);
              })()}%` 
            }}
            className="h-full bg-gradient-to-r from-[#5E8B61] via-[#95BBA2] to-[#bbf7d0] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(149,187,162,0.35)]"
          />
        </div>

        {/* Dense responsive state chips that automatically wrap to fit any screen perfectly */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
          {['WAITING', 'QUEUE', 'PRINTING', 'POST_PROCESS', 'READY'].map((st) => {
            const count = orders.filter(o => o.status === st).length;
            return (
              <div key={st} className="flex items-center gap-1 bg-black/25 px-2 py-1 rounded-lg border border-[#232B27]/40">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: getStatusColor(st) }} />
                <span className="text-[#8BA58D]">
                  {getStatusLabel(st)}: <strong className="text-[#F1F4EE]">{count}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and search row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-base font-bold text-[#F1F4EE]">Filtrar Produção</h3>
          
          <input
            type="text"
            placeholder="Buscar por peça, cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1 bg-[#151917] border border-[#232B27] text-xs text-[#F1F4EE] placeholder-[#8BA58D]/60 rounded-lg focus:outline-none focus:border-[#95BBA2] transition-colors"
          />
        </div>

        <div className="overflow-x-auto scrollbar-none flex items-center gap-2 pb-2">
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.key;
            const count = opt.key === 'TODOS' ? orders.length : orders.filter(o => o.status === opt.key).length;
            const color = getStatusColor(opt.key);
            
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedFilter(opt.key)}
                style={{
                  backgroundColor: isSelected ? `${color}20` : '#151917',
                  borderColor: isSelected ? color : '#232B27',
                  color: isSelected ? color : '#8BA58D'
                }}
                className="px-3 py-1.5 rounded-full border text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <span>{opt.label}</span>
                <span className="px-1 py-0.25 bg-black/25 text-[9px] rounded font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List matching the state */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#151917] border border-[#232B27] rounded-xl p-12 text-center text-[#8BA58D]">
            <AlertCircle className="w-12 h-12 text-[#8BA58D]/40 mx-auto mb-3" />
            <h4 className="text-sm font-bold">Sem pedidos nesta categoria.</h4>
            <p className="text-xs mt-1 text-[#8BA58D]/80">Cadastre um novo item ou ajuste filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4 mr-0" id="production-orders-grid">
            {filteredOrders.map((order) => {
              const borderC = getStatusColor(order.status);
              const isDeadlinePassed = order.deadline && Date.now() > order.deadline;
              const delayCat = getDelayCategory(order.createdAt, order.status);
              const isLate = (order.status !== 'DELIVERED' && order.status !== 'READY') && (
                delayCat.level === 'CRITICAL' || isDeadlinePassed
              );
              
              // Define border animation state based on client requirements (Critical > 24h is Red Pulse, Orange >= 15h, Yellow >= 8h)
              const borderClass = (order.status === 'DELIVERED' || order.status === 'READY')
                ? 'border-[#232B27]/90 hover:border-[#8BA58D]/40'
                : isLate
                ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50 animate-[pulse_1.5s_infinite]'
                : delayCat.level === 'ORANGE'
                ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : delayCat.level === 'YELLOW'
                ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                : 'border-[#232B27]/90 hover:border-emerald-500/30';
              
              return (
                <motion.div
                  key={order.id}
                  layoutId={`order_card_${order.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#151917] border rounded-2xl p-3.5 md:p-5 space-y-3 md:space-y-4 shadow transition unique-card ${borderClass}`}
                >
                  {/* Glowing Indicator Bar (Flashes status color or warning highlights) */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden" id={`order-bar-indicator-${order.id}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isLate 
                          ? 'bg-red-500 animate-[pulse_0.8s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.8)]' 
                          : delayCat.level === 'ORANGE'
                          ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]'
                          : delayCat.level === 'YELLOW'
                          ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                          : ''
                      }`}
                      style={{ backgroundColor: (delayCat.level === 'GREEN' || isDeadlinePassed) ? borderC : undefined }}
                    />
                  </div>

                  {(delayCat.level !== 'GREEN' || isDeadlinePassed) && (() => {
                    const delayTimeMs = isDeadlinePassed
                      ? (Date.now() - order.deadline)
                      : (Date.now() - order.createdAt);
                    const delayHrs = Math.floor(delayTimeMs / (1000 * 3600));
                    const delayMins = Math.floor((delayTimeMs % (1000 * 3600)) / (1000 * 60));
                    const delayStr = delayHrs > 0 ? `${delayHrs}h ${delayMins}min` : `${delayMins}min`;

                    let bgAlert = 'bg-red-500/10 border-red-500/35 text-red-400';
                    let labelText = `🚨 CRÍTICO: PEDIDO ATRASADO EM ${delayStr} 🚨`;

                    if (!isDeadlinePassed) {
                      if (delayCat.level === 'ORANGE') {
                        bgAlert = 'bg-orange-500/10 border-orange-500/35 text-orange-450 text-orange-400';
                        labelText = `⚠️ ATENÇÃO: PEDIDO HÁ ${delayStr} NA FILA ⚠️`;
                      } else if (delayCat.level === 'YELLOW') {
                        bgAlert = 'bg-yellow-500/10 border-yellow-500/35 text-yellow-450 text-yellow-500';
                        labelText = `⏳ ATENÇÃO: PEDIDO HÁ ${delayStr} NA FILA ⏳`;
                      }
                    }

                    return (
                      <div className={`${bgAlert} border px-2.5 py-1.5 rounded-xl text-center select-none ${isLate ? 'animate-[pulse_1s_infinite]' : ''}`}>
                        <p className="text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                          {labelText}
                        </p>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[65%]">
                      {order.platformSource === 'MANUAL' ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border border-emerald-500/30 px-2 py-0.5 rounded text-[8.5px] font-black uppercase text-center text-emerald-400 shrink-0 select-none">
                          <span className="text-[10px]">🧑‍💼</span>
                          <span>FÍSICO</span>
                        </div>
                      ) : (
                        <div 
                          style={{
                            backgroundColor: order.platformSource === 'MERCADO_LIVRE' ? '#FFF159' : 
                                            order.platformSource === 'SHOPEE' ? '#EE4D2D' : 
                                            order.platformSource === 'AMAZON' ? '#FF9900' : '#00ADF0',
                            color: order.platformSource === 'MERCADO_LIVRE' ? '#000000' : '#FFFFFF'
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-black uppercase text-center shrink-0 select-none"
                        >
                          <span className="text-[10px]">
                            {order.platformSource === 'MERCADO_LIVRE' ? '🤝' : 
                             order.platformSource === 'SHOPEE' ? '🛍️' : 
                             order.platformSource === 'AMAZON' ? '📦' : '🌐'}
                          </span>
                          <span>{order.platformSource.replace('_', ' ')}</span>
                        </div>
                      )}
                      
                      <h4 className="text-xs md:text-sm font-black text-[#F1F4EE] leading-tight truncate">
                        {order.itemName}
                      </h4>
                    </div>

                    <span
                      style={{
                        backgroundColor: `${borderC}15`,
                        borderColor: `${borderC}60`,
                        color: borderC
                      }}
                      className="px-2 py-0.5 rounded-full border text-[9px] md:text-[10px] font-bold text-center shrink-0 tracking-wide"
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Financial & Payment badging section */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0C0E0D]/50 border border-[#232B27]/40 rounded-xl relative">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider leading-none border uppercase ${
                      order.paymentMethod === 'CONSIGNADO'
                        ? 'bg-purple-950/40 border-purple-500/30 text-purple-400'
                        : order.paymentMethod === 'CARTÃO'
                        ? 'bg-blue-950/40 border-blue-500/30 text-blue-400'
                        : order.paymentMethod === 'DINHEIRO'
                        ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                    }`}>
                      🤝 {order.paymentMethod || 'DINHEIRO'}
                    </span>

                    <button
                      onClick={() => {
                        const nextStatus = order.paymentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
                        onUpdateOrder(order.id, { paymentStatus: nextStatus as any });
                      }}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider leading-none border transition-all cursor-pointer flex items-center gap-1 ${
                        order.paymentStatus === 'PAGO'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:bg-amber-900/40 animate-[pulse_2s_infinite]'
                      }`}
                      title="Clique para alternar PAGO / PENDENTE"
                    >
                      <span>{order.paymentStatus === 'PAGO' ? '✅ PAGO' : '⏳ PENDENTE'}</span>
                    </button>

                    {order.paymentStatus !== 'PAGO' && (
                      <button
                        onClick={() => {
                          const valor = order.priceCharged.toFixed(2);
                          const peca = order.itemName;
                          const textReminder = `*Olá, ${order.clientName}!* 👋\n\nPassando para enviar o lembrete de pagamento referente à peça *${peca}* no valor de *R$ ${valor}*.\n\nGostaria de fechar o pagamento por PIX, Dinheiro ou Cartão? Ficamos no aguardo de sua confirmação para prosseguir de imediato. Muito obrigado! 🤝\n\n_Ateliê Gestão 3D_`;
                          let clientPhoneClean = '';
                          if (order.clientId) {
                            const c = clients.find(cl => cl.id === order.clientId);
                            if (c && c.phone) {
                              clientPhoneClean = c.phone.replace(/\D/g, '');
                            }
                          }
                          const waUrl = clientPhoneClean 
                            ? `https://api.whatsapp.com/send?phone=${clientPhoneClean}&text=${encodeURIComponent(textReminder)}`
                            : `https://api.whatsapp.com/send?text=${encodeURIComponent(textReminder)}`;
                          
                          window.open(waUrl, '_blank');
                        }}
                        className="px-2 py-0.5 bg-red-950/45 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500 text-red-400 rounded text-[8.5px] font-sans font-black flex items-center gap-1 transition cursor-pointer"
                        title="Cobrar este cliente no WhatsApp"
                      >
                        📲 COBRAR
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2.5 text-[11px] md:text-xs border-b border-[#232B27]/40 pb-2.5">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[#F1F4EE]/90 truncate">
                        Cliente: <span className="font-extrabold text-white">{order.clientName}</span>
                      </p>
                      <p className="text-[#8BA58D] text-[10.5px]">
                        Fio: <span className="text-[#95BBA2] font-semibold">{order.filamentType} {order.filamentColor}</span> • {order.weightGrams}g
                      </p>
                      <div className="flex flex-col gap-1.5 pt-1.5 w-full">
                        {(() => {
                          const elapsedMs = Date.now() - order.createdAt;
                          const elapsedMinsTotal = Math.floor(elapsedMs / (60 * 1000));
                          const elapsedHrs = Math.floor(elapsedMinsTotal / 60);
                          const elapsedMins = elapsedMinsTotal % 60;
                          const elapsedStr = elapsedHrs > 0 ? `Há ${elapsedHrs}h e ${elapsedMins}m` : `Há ${elapsedMins}m`;

                          const isDeadlinePassedObj = order.deadline && Date.now() > order.deadline;
                          const elapsedHrsVal = (Date.now() - order.createdAt) / (1000 * 3600);
                          const isWarningOrCritical = (order.status !== 'DELIVERED' && order.status !== 'READY') && (
                            elapsedHrsVal >= 8 || isDeadlinePassedObj
                          );

                          let delayStr = "";
                          if (isWarningOrCritical) {
                            const delayTimeMs = isDeadlinePassedObj
                              ? (Date.now() - order.deadline)
                              : (Date.now() - order.createdAt);
                            const delayHrsVal = Math.floor(delayTimeMs / (1000 * 3600));
                            const delayMinsVal = Math.floor((delayTimeMs % (1000 * 3600)) / (1000 * 60));
                            delayStr = delayHrsVal > 0 ? `${delayHrsVal}h ${delayMinsVal}min` : `${delayMinsVal}min`;
                          }

                          // Barra de Tempo do Ateliê: progress limits set dynamically (24 hours standard limit, or custom selected deadline)
                          const createdTime = order.createdAt;
                          const limitTime = order.deadline || (createdTime + 24 * 60 * 60 * 1000);
                          const totalDuration = limitTime - createdTime;
                          const currentElapsed = Date.now() - createdTime;
                          const progressPercent = Math.min(100, Math.max(0, (currentElapsed / totalDuration) * 100));

                          let trackerLabel = '⏱️ Verde (Normal)';
                          let trackerColorClass = 'text-emerald-450 text-emerald-450 text-emerald-450 text-emerald-400';
                          let progressColorStyle = 'bg-gradient-to-r from-emerald-500 to-[#95BBA2]';
                          let progressBorderClass = 'border-[#232B27]';

                          if (order.status !== 'DELIVERED' && order.status !== 'READY') {
                            if (isDeadlinePassedObj || elapsedHrsVal >= 24) {
                              trackerLabel = '🚨 CRÍTICO / ATRASADO (>24h)';
                              trackerColorClass = 'text-red-400 font-extrabold animate-pulse';
                              progressColorStyle = 'bg-gradient-to-r from-red-600 to-red-500 animate-[pulse_0.4s_infinite]';
                              progressBorderClass = 'border-red-500 animate-[pulse_0.8s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]';
                            } else if (elapsedHrsVal >= 15) {
                              trackerLabel = '⚠️ ATENÇÃO (>=15h)';
                              trackerColorClass = 'text-orange-400 font-bold';
                              progressColorStyle = 'bg-gradient-to-r from-orange-500 to-amber-500';
                              progressBorderClass = 'border-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
                            } else if (elapsedHrsVal >= 8) {
                              trackerLabel = '⏳ ATENÇÃO (>=8h)';
                              trackerColorClass = 'text-yellow-400 font-bold';
                              progressColorStyle = 'bg-gradient-to-r from-yellow-400 to-amber-400';
                              progressBorderClass = 'border-yellow-500/80 shadow-[0_0_6px_rgba(234,179,8,0.2)]';
                            }
                          }

                          return (
                            <div className="text-[10px] uppercase flex flex-col gap-2 bg-black/45 p-3 rounded-xl border border-[#232B27] shadow-inner font-mono w-full">
                              <span className="flex items-center gap-1.5 shrink-0 text-white font-bold">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                Hora do Pedido: <strong className="text-amber-300 font-extrabold">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(order.createdAt).toLocaleDateString('pt-BR')})
                              </span>

                              {/* Barra de Tempo do Ateliê */}
                              <div className="space-y-1 mt-0.5">
                                <div className="flex justify-between items-center text-[8.5px] font-sans font-bold text-zinc-400 leading-none">
                                  <span className={trackerColorClass}>
                                    {trackerLabel}
                                  </span>
                                  <span className="text-zinc-350">{Math.round(progressPercent)}%</span>
                                </div>
                                <div className={`w-full h-2.5 bg-[#141916] rounded-full overflow-hidden border p-0.5 transition-all duration-300 ${progressBorderClass}`}>
                                  <div 
                                    style={{ width: `${progressPercent}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${progressColorStyle}`}
                                  />
                                </div>
                              </div>

                              <span className="text-zinc-400 font-semibold text-[9.5px]">
                                Tempo na Fila: {elapsedStr}
                              </span>
                              {isWarningOrCritical && (
                                <span className={`${trackerColorClass} font-black flex items-center gap-1 text-[9.5px] uppercase`}>
                                  ⚠️ Tempo Transcorrido: <strong className="font-extrabold font-mono">{delayStr}</strong>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        {order.status === 'QUEUE' && (
                          <span className="text-[8.5px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded animate-pulse text-center w-full block">
                            ⚠️ Prioridade na Fila
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 border-[#232B27]/20 pt-1.5 sm:pt-0">
                      <span className="text-[#95BBA2] text-xs md:text-sm font-black tracking-wide">
                        R$ {order.priceCharged.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[#8BA58D] text-[10.5px] font-semibold">
                        {order.printTimeHours}h de impr.
                      </span>
                    </div>
                  </div>

                  {/* Unified Progress Bar showing progress in % as requested */}
                  {(() => {
                    const pct = getProgressPercentage(order.status, order.printingProgress);
                    return (
                      <div className="bg-[#0C0E0D]/40 p-2.5 rounded-xl border border-[#232B27]/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8BA58D] font-black uppercase tracking-wider text-[8.5px] flex items-center gap-1 flex-row">
                            <span 
                              className={`w-1.5 h-1.5 rounded-full inline-block ${
                                order.status === 'PRINTING' ? 'bg-emerald-400 animate-ping' : ''
                              }`} 
                              style={{ backgroundColor: order.status !== 'PRINTING' ? borderC : undefined }}
                            />
                            Etapa: {getStatusLabel(order.status)}
                          </span>
                          <span 
                            style={{ color: order.status === 'READY' ? '#60a5fa' : borderC }} 
                            className="font-mono font-black text-[10.5px]"
                          >
                            {pct}%
                          </span>
                        </div>
                        
                        <div className="w-full h-2 bg-[#1C211E]/85 rounded-full overflow-hidden p-0.5 border border-[#232B27]">
                          <div 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: borderC 
                            }}
                            className={`h-full transition-all duration-300 rounded-full ${
                              order.status === 'PRINTING' ? 'animate-pulse bg-gradient-to-r from-[#95BBA2] to-[#bbf7d0]' : ''
                            }`}
                          />
                        </div>

                        {order.status === 'PRINTING' && order.printerName && (
                          <div className="text-[9.5px] text-[#8BA58D] flex items-center justify-between font-mono pt-0.5 leading-none">
                            <span>Máquina: <strong className="text-white">{order.printerName}</strong></span>
                            <span>Fatiando: {Math.round(order.printingProgress * 100)}%</span>
                          </div>
                        )}
                        {order.status === 'READY' && (
                          <p className="text-[9.5px] text-blue-300 font-extrabold tracking-tight animate-pulse flex items-center gap-1 pt-0.5 leading-none">
                            📦 Empacotado &amp; Pronto p/ Entrega
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between gap-4 pt-1.5 text-xs">
                    <div className="flex items-center gap-3.5 text-[#8BA58D] text-[11px]">
                      <button 
                        onClick={() => handleOpenEditDialog(order)} 
                        className="hover:text-white font-bold cursor-pointer transition animate-none"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Tem certeza de que deseja apagar o pedido de "${order.itemName}"?`)) {
                            onDeleteOrder(order.id);
                          }
                        }} 
                        className="text-red-400 hover:text-red-300 font-bold cursor-pointer transition"
                      >
                        Excluir
                      </button>
                    </div>

                    <div>
                      {getNextStatusValue(order.status) ? (
                        <button
                          onClick={() => handleFastStatusAdvance(order, getNextStatusValue(order.status)!)}
                          style={{
                            backgroundColor: `${borderC}15`,
                            color: borderC,
                            borderColor: `${borderC}40`
                          }}
                          className="px-2.5 py-1 rounded-lg border text-[10.5px] font-black flex items-center gap-1 hover:brightness-110 active:scale-95 transition cursor-pointer"
                        >
                          <span>{getNextStatusActionLabel(order.status)}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[#5E8B61] font-bold text-[10.5px]">
                          <Check className="w-3.5 h-3.5 text-[#5D8168] dark:text-emerald-400" />
                          <span className="text-[#8BA58D]">Fila Concluída</span>
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual allocation modal dialogue popup */}
      <AnimatePresence>
        {quickPrintOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151917] border border-[#232B27] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#F1F4EE] flex items-center gap-1.5 text-[#E5B242]">
                  <PrinterIcon className="w-4 h-4 text-[#E5B242]" />
                  Alocar Impressora
                </h4>
                <button onClick={() => setQuickPrintOrder(null)} className="text-[#8BA58D] hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#8BA58D]">
                Abaixo estão as máquinas disponíveis. Selecione qual impressora receberá o pedido de <strong>{quickPrintOrder.itemName}</strong>:
              </p>

              <div className="space-y-2">
                {printers.map(p => {
                  const isBusy = p.status === 'PRINTING';
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPrinterQuick(p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                        isBusy 
                          ? 'bg-black/10 border-[#EF5350]/20 text-[#8BA58D] cursor-not-allowed opacity-60' 
                          : 'bg-black/25 border-[#232B27] text-[#F1F4EE] hover:border-[#95BBA2] hover:bg-[#95BBA2]/5'
                      }`}
                      disabled={isBusy}
                    >
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-[#8BA58D]">{p.model}</div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isBusy ? 'bg-[#EF5350]/15 text-[#EF5350]' : 'bg-[#5E8B61]/15 text-[#95BBA2]'}`}>
                        {isBusy ? 'Ocupada' : 'Livre'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  onUpdateOrder(quickPrintOrder.id, { status: 'PRINTING', printingProgress: 0.05 });
                  setQuickPrintOrder(null);
                }}
                className="w-full py-2 bg-transparent border border-dashed border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-[#F1F4EE] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Prosseguir sem Alocação Ativa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floated single execution actions */}
      <button
        onClick={handleOpenAddDialog}
        className="fixed bottom-24 right-5 z-40 bg-[#E5B242] text-[#0C0E0D] p-4.5 rounded-full shadow-2xl hover:bg-[#F5C75A] transition flex items-center justify-center cursor-pointer"
        title="Cadastrar Novo Pedido"
        id="btn-add-order-fab"
      >
        <Plus className="w-6 h-6 stroke-[3px]" />
      </button>

      {/* Main Full Add/Edit form Dialog view screen */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151917] border border-[#232B27] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-xs text-[#F1F4EE]"
            >
              <form onSubmit={handleSaveForm}>
                <div className="px-6 py-4 border-b border-[#232B27] flex items-center justify-between bg-[#0C0E0D]">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#E5B242]" />
                    <h3 className="text-base font-black">
                      {editingOrder ? 'Editar Pedido 3D' : 'Novo Pedido de Impressão'}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="text-[#8BA58D] hover:text-white p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto scrollbar-thin">
                  <div className="space-y-1">
                    <label className="block text-[#8BA58D] font-extrabold">Cliente Relacionado</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={formClientId}
                        onChange={(e) => setFormClientId(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] focus:outline-none"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                        <option value="CUSTOM">+ Novo Comprador Manual</option>
                      </select>

                      {formClientId === 'CUSTOM' && (
                        <input
                          type="text"
                          placeholder="Nome do cliente"
                          value={customClientName}
                          onChange={(e) => setCustomClientName(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white placeholder-[#8BA58D]/40 focus:border-[#95BBA2]"
                        />
                      )}
                    </div>
                  </div>

                  {/* ⏰ CUSTOM CREATION HOUR SELECTOR */}
                  <div className="space-y-1">
                    <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#E5B242]" /> Data e Hora de Abertura do Pedido
                    </label>
                    <input
                      type="datetime-local"
                      value={formCreatedAt}
                      onChange={(e) => setFormCreatedAt(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-[#F1F4EE] select-text focus:outline-none focus:border-[#95BBA2] font-mono text-xs"
                      required
                    />
                    <p className="text-[10px] text-[#8BA58D]/70">Altere o horário acima se o pedido foi realizado no passado. O sistema recalculará o tempo de atraso com base nele.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#8BA58D] font-extrabold flex items-center justify-between">
                      <span>Classe do Modelo / Descrição (Do Catálogo)</span>
                    </label>
                    <select
                      value={formItemName}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        setFormItemName(selectedVal);
                        const matchedItem = (catalogItems as any[]).find((c) => c.name === selectedVal);
                        if (matchedItem) {
                          setFormFilamentType(matchedItem.filamentType);
                          setFormFilamentColor(matchedItem.filamentColorsUsed || 'Preto');
                          setFormWeightGrams(matchedItem.weightGrams);
                          setFormPrintTime(matchedItem.printTimeHours);
                          setFormPriceCharged(matchedItem.defaultPrice);
                        }
                      }}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] text-xs font-mono select-text focus:outline-none"
                      required
                    >
                      <option value="">-- Selecione do catálogo de produtos --</option>
                      {(catalogItems as any[]).map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name} ({item.productCode || 'PROD'})
                        </option>
                      ))}
                      {formItemName && !(catalogItems as any[]).some(item => item.name === formItemName) && (
                        <option value={formItemName}>{formItemName} (Do Banco de Dados)</option>
                      )}
                    </select>
                    {(catalogItems as any[]).length === 0 && (
                      <p className="text-[10px] text-amber-500 font-mono">
                        ⚠️ Nenhum produto no catálogo. Cadastre primeiro na aba "Banco de Dados & Catálogo"!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Prazo (Dias p/ entrega)</label>
                      <input
                        type="number"
                        min="1"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Polímero (Material)</label>
                      <select
                        value={formFilamentType}
                        onChange={(e) => setFormFilamentType(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="PLA">PLA</option>
                        <option value="PETG">PETG</option>
                        <option value="ABS">ABS</option>
                        <option value="TPU">TPU</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Cor Escolhida</label>
                      {availableColors.length > 0 ? (
                        <select
                          value={formFilamentColor}
                          onChange={(e) => setFormFilamentColor(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        >
                          {availableColors.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Especificar cor"
                          value={formFilamentColor}
                          onChange={(e) => setFormFilamentColor(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Peso Peça (g)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formWeightGrams}
                        onChange={(e) => setFormWeightGrams(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Tempo (h)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formPrintTime}
                        onChange={(e) => setFormPrintTime(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Preço (R$)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formPriceCharged}
                        onChange={(e) => setFormPriceCharged(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Origem da Venda</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="MANUAL">MANUAL (Balcão)</option>
                        <option value="MERCADO_LIVRE">MERCADO LIVRE</option>
                        <option value="SHOPEE">SHOPEE</option>
                        <option value="NUVEMSHOP">NUVEMSHOP</option>
                        <option value="AMAZON">AMAZON</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Status Atual</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="WAITING">Ag. Arquivo</option>
                        <option value="QUEUE">NaFila / Pagar</option>
                        <option value="PRINTING">Imprimindo</option>
                        <option value="POST_PROCESS">Pós-Processo / Acabamento</option>
                        <option value="READY">Pronto p/ Entrega</option>
                        <option value="DELIVERED">Entregue / Concluído</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#0C0E0D]/60 p-3 rounded-lg border border-[#232B27]/60">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1 text-[11px]">
                        <span>💳 Forma de Pgto.</span>
                      </label>
                      <select
                        value={formPaymentMethod}
                        onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white text-xs"
                      >
                        <option value="DINHEIRO">📂 DINHEIRO</option>
                        <option value="CARTÃO">💳 CARTÃO (Déb/Créd)</option>
                        <option value="CONSIGNADO">🤝 CONSIGNADO</option>
                        <option value="OUTROS">🌐 OUTROS / PIX</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold flex items-center gap-1 text-[11px]">
                        <span>💵 Status Finan.</span>
                      </label>
                      <select
                        value={formPaymentStatus}
                        onChange={(e) => setFormPaymentStatus(e.target.value as any)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white text-xs font-bold"
                      >
                        <option value="PENDENTE">⏳ PENDENTE / COBRAR</option>
                        <option value="PAGO">✅ PAGO</option>
                      </select>
                    </div>
                  </div>

                  {formStatus === 'PRINTING' && (
                    <div className="bg-black/25 p-3 rounded-lg border border-[#232B27] space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Alocar Impressora</label>
                      <select
                        value={formPrinterId}
                        onChange={(e) => setFormPrinterId(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white"
                        required
                      >
                        <option value="">-- Selecione uma Impressora --</option>
                        {printers.map(p => (
                          <option key={p.id} value={p.id.toString()}>{p.name} ({p.status === 'PRINTING' ? 'Ocupada' : 'Idle'})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-[#0C0E0D] border-t border-[#232B27] flex items-center justify-end gap-3 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 border border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#E5B242] text-[#0C0E0D] text-xs font-extrabold rounded-lg hover:bg-[#F5C75A] transition shadow-md cursor-pointer"
                  >
                    Salvar Pedido 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
