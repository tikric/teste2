import React, { useState, useEffect } from 'react';
import { FilamentStock, ShoppingItem, MaterialProfile, SupplyStock, CatalogItem, Expense } from '../types';
import { staticFilamentOffers, initialMaterialProfiles, initialCatalogItems } from '../utils/initialData';
import { getApiUrl, checkIsAndroidWebView } from '../utils/api';
import { safeStorage } from '../utils/storage';
import { 
  Disc, 
  ShoppingCart, 
  Calculator, 
  HelpCircle, 
  RefreshCw, 
  Star, 
  Trash2, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  CheckCircle, 
  Share2, 
  FileText, 
  Download, 
  Calendar,
  Box,
  TrendingUp,
  Tag,
  DollarSign,
  FileCode,
  Search,
  Edit3
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const getHexColorByName = (colorName: string): { bg: string; text: string; border: string } => {
  const lower = (colorName || '').toLowerCase().trim();
  if (lower.includes('transpar') || lower.includes('cristal') || lower.includes('clear') || lower.includes('natural') || lower.includes('sem cor') || lower.includes('transl')) {
    return { bg: 'transparent', text: '#FFFFFF', border: '#95BBA2' };
  }
  if (lower.includes('pret') || lower.includes('black') || lower.includes('grafite') || lower.includes('carvão')) {
    return { bg: '#101010', text: '#FFFFFF', border: '#333333' };
  }
  if (lower.includes('branc') || lower.includes('whit') || lower.includes('gesso') || lower.includes('neve')) {
    return { bg: '#FFFFFF', text: '#0C0E0D', border: '#D1D5DB' };
  }
  if (lower.includes('cinz') || lower.includes('gray') || lower.includes('grey') || lower.includes('plata') || lower.includes('silver') || lower.includes('prata')) {
    return { bg: '#6B7280', text: '#FFFFFF', border: '#4B5563' };
  }
  if (lower.includes('vermelh') || lower.includes('red') || lower.includes('rubi')) {
    return { bg: '#EF4444', text: '#FFFFFF', border: '#DC2626' };
  }
  if (lower.includes('azul') || lower.includes('blue') || lower.includes('indigo') || lower.includes('celeste') || lower.includes('cobalto')) {
    return { bg: '#3B82F6', text: '#FFFFFF', border: '#2563EB' };
  }
  if (lower.includes('verd') || lower.includes('green') || lower.includes('limão') || lower.includes('militar') || lower.includes('oliva')) {
    return { bg: '#10B981', text: '#FFFFFF', border: '#059669' };
  }
  if (lower.includes('amarel') || lower.includes('yellow') || lower.includes('ouro') || lower.includes('gold')) {
    return { bg: '#FBBF24', text: '#0C0E0D', border: '#D97706' };
  }
  if (lower.includes('ros') || lower.includes('pink') || lower.includes('magenta') || lower.includes('cereja')) {
    return { bg: '#EC4899', text: '#FFFFFF', border: '#DB2777' };
  }
  if (lower.includes('laranj') || lower.includes('orang') || lower.includes('abóbora')) {
    return { bg: '#F97316', text: '#FFFFFF', border: '#EA580C' };
  }
  if (lower.includes('rox') || lower.includes('purpl') || lower.includes('púrpura') || lower.includes('violeta') || lower.includes('lilás')) {
    return { bg: '#8B5CF6', text: '#FFFFFF', border: '#7C3AED' };
  }
  if (lower.includes('marr') || lower.includes('brown') || lower.includes('chocolate') || lower.includes('terracota')) {
    return { bg: '#78350F', text: '#FFFFFF', border: '#92400E' };
  }
  if (lower.includes('cobre') || lower.includes('copper') || lower.includes('bronze')) {
    return { bg: '#B45309', text: '#FFFFFF', border: '#78350F' };
  }
  if (lower.includes('bege') || lower.includes('beige') || lower.includes('creme') || lower.includes('skin') || lower.includes('pele')) {
    return { bg: '#F5F5DC', text: '#111111', border: '#D2B48C' };
  }
  if (lower.includes('turquesa') || lower.includes('tiffany') || lower.includes('cyan') || lower.includes('ciano')) {
    return { bg: '#06B6D4', text: '#FFFFFF', border: '#0891B2' };
  }
  
  // Dynamic HSL
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return { bg: `hsl(${h}, 60%, 45%)`, text: '#FFFFFF', border: `hsl(${h}, 60%, 30%)` };
};

interface CostsTabProps {
  filamentStocks: FilamentStock[];
  shoppingItems: ShoppingItem[];
  expenses: Expense[];
  onAddFilament: (filament: Omit<FilamentStock, 'id'>) => void;
  onUpdateFilament: (id: number, updated: Partial<FilamentStock>) => void;
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  onToggleShoppingItem: (id: number) => void;
  onDeleteShoppingItem: (id: number) => void;
  onDeleteFilament: (id: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: number) => void;
  onUpdateExpense: (id: number, updated: Partial<Expense>) => void;
  suppliesStocks: SupplyStock[];
  setSuppliesStocks: React.Dispatch<React.SetStateAction<SupplyStock[]>>;
  lastAuditDate: number;
  setLastAuditDate: (date: number) => void;
}

export const CostsTab: React.FC<CostsTabProps> = ({
  filamentStocks,
  shoppingItems,
  expenses,
  onAddFilament,
  onUpdateFilament,
  onAddShoppingItem,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onDeleteFilament,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  suppliesStocks,
  setSuppliesStocks,
  lastAuditDate,
  setLastAuditDate
}) => {
  // Navigation inside internal tab
  const [activeSubTab, setActiveSubTab] = useState<'CALC' | 'CATALOG' | 'STOCK' | 'SHOP' | 'QUOTE' | 'AI'>(() => {
    const override = localStorage.getItem('bambuzau_costs_subtab_override');
    if (override) {
      localStorage.removeItem('bambuzau_costs_subtab_override');
      return override as any;
    }
    return 'STOCK';
  });

  // Force scroll-to-top when subtab changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeSubTab]);

  // Success/Info feedback messages
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const [checklistTrigger, setChecklistTrigger] = useState(0);

  const triggerFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage({ text: '', type: null });
    }, 4000);
  };

  // Filament form
  const [fType, setFType] = useState('PLA');
  const [fColor, setFColor] = useState('');
  const [fStockGrams, setFStockGrams] = useState(1000);
  const [fMinStock, setFMinStock] = useState(1000);
  const [fPrice, setFPrice] = useState(120);
  const [showAddFilamentForm, setShowAddFilamentForm] = useState(false);

  // Consumables (Supplies) Form
  const [sName, setSName] = useState('');
  const [sCount, setSCount] = useState(10);
  const [sMinCount, setSMinCount] = useState(5);
  const [sUnitCost, setSUnitCost] = useState(2.50);
  const [showAddSupplyForm, setShowAddSupplyForm] = useState(false);

  // Fallbacks client-side to guarantee at least 5 items
  const getClientFallbackOffers = (type: string) => {
    const cleanType = String(type || '').toUpperCase();
    if (cleanType.includes('PLA')) {
      return [
        { storeName: 'Voolt3D Store', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg', price: 79.90, rating: 4.9, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+pla' },
        { storeName: 'Mercado Livre', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg Oficial', price: 84.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-pla-voolt3d' },
        { storeName: 'Amazon Brasil', productName: 'Filamento PLA Creality High Speed 1.75mm 1kg', price: 92.50, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+pla+creality' },
        { storeName: '3D Fila', productName: 'Filamento PLA Premium 3DFila 1.75mm 1kg', price: 89.90, rating: 4.8, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-pla-3d/' },
        { storeName: 'Shopee Brasil', productName: 'Filamento PLA Eco-Friendly Sunlu Impressora 3D 1kg', price: 75.00, rating: 4.6, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20pla' }
      ];
    } else if (cleanType.includes('PETG')) {
      return [
        { storeName: 'Voolt3D Store', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg', price: 74.90, rating: 4.7, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+petg' },
        { storeName: 'Mercado Livre', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg Oficial', price: 78.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-petg-voolt3d' },
        { storeName: 'Shopee Brasil', productName: 'Filamento PETG eSun 1.75mm Alta Resistência 1kg', price: 72.90, rating: 4.8, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20petg' },
        { storeName: '3D Fila', productName: 'Filamento PETG Premium 3D Fila 1.75mm 1kg', price: 89.90, rating: 4.9, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-petg-3d/' },
        { storeName: 'Amazon Brasil', productName: 'Filamento PETG Creality CR-PETG 1.75mm 1kg', price: 85.00, rating: 4.6, buyUrl: 'https://www.amazon.com.br/s?k=filamento+petg+1kg' }
      ];
    } else {
      return [
        { storeName: 'Voolt3D Store', productName: 'Filamento TPU Flexível Voolt3D 1.75mm 1kg', price: 109.90, rating: 4.8, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+tpu' },
        { storeName: 'Mercado Livre', productName: 'Filamento TPU Flex Voolt3D 1.75mm 1kg Oficial', price: 114.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-tpu-voolt3d' },
        { storeName: '3D Lab', productName: 'Filamento TPU Flexível Premium 3D Lab 1kg', price: 115.05, rating: 4.9, buyUrl: 'https://3dlab.com.br/categoria-produto/filamento/tpu/' },
        { storeName: 'Shopee Brasil', productName: 'Filamento TPU Flexível 1.75mm Impressão 3D 1kg', price: 104.90, rating: 4.5, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20tpu' },
        { storeName: 'Amazon Brasil', productName: 'Filamento TPU Creality Flexível 1.75mm 1kg', price: 129.00, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+tpu+1kg' }
      ];
    }
  };

  const ensureFiveOffers = (groups: any[]): any[] => {
    if (!Array.isArray(groups)) return [];
    return groups.filter(Boolean).map(g => {
      const type = g.type || 'PLA';
      const offers = Array.isArray(g.offers) ? [...g.offers] : [];
      if (offers.length < 5) {
        const fb = getClientFallbackOffers(type);
        for (const fallbackOffer of fb) {
          if (offers.length >= 5) break;
          // Precision match: only treat as duplicate if both same store name AND same start of product description
          const exists = offers.some((o: any) => 
            String(o?.storeName || "").toLowerCase() === String(fallbackOffer.storeName).toLowerCase() &&
            String(o?.productName || "").toLowerCase().slice(0, 35) === String(fallbackOffer.productName).toLowerCase().slice(0, 35)
          );
          if (!exists) {
            offers.push(fallbackOffer);
          }
        }
        if (offers.length < 5) {
          for (const fallbackOffer of fb) {
            if (offers.length >= 5) break;
            offers.push(fallbackOffer);
          }
        }
      }
      return {
        ...g,
        offers
      };
    });
  };

  // Dynamic Live Google Shopping Quotations state
  const [quotationGroupsRaw, setQuotationGroupsRaw] = useState<Array<{
    type: string;
    offers: Array<{
      storeName: string;
      productName: string;
      price: number;
      rating: number;
      buyUrl: string;
    }>;
    searchQuery: string;
  }>>(() => {
    const cached = localStorage.getItem('bambuzau_cached_quotes');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return [
      { 
        type: 'PLA', 
        offers: [
          { storeName: 'Voolt3D Store', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg', price: 79.90, rating: 4.9, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+pla' },
          { storeName: 'Mercado Livre', productName: 'Filamento PLA Premium Voolt3D 1.75mm 1kg Oficial', price: 84.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-pla-voolt3d' },
          { storeName: 'Amazon Brasil', productName: 'Filamento PLA Creality High Speed 1.75mm 1kg', price: 92.50, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+pla+creality' },
          { storeName: '3D Fila', productName: 'Filamento PLA Premium 3DFila 1.75mm 1kg', price: 89.90, rating: 4.8, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-pla-3d/' },
          { storeName: 'Shopee Brasil', productName: 'Filamento PLA Eco-Friendly Sunlu Impressora 3D 1kg', price: 75.00, rating: 4.6, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20pla' }
        ],
        searchQuery: 'filamento+pla+1kg'
      },
      { 
        type: 'PETG', 
        offers: [
          { storeName: 'Voolt3D Store', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg', price: 74.90, rating: 4.7, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+petg' },
          { storeName: 'Mercado Livre', productName: 'Filamento PETG Premium Voolt3D 1.75mm 1kg Oficial', price: 78.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-petg-voolt3d' },
          { storeName: 'Shopee Brasil', productName: 'Filamento PETG eSun 1.75mm Alta Resistência 1kg', price: 72.90, rating: 4.8, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20petg' },
          { storeName: '3D Fila', productName: 'Filamento PETG Premium 3D Fila 1.75mm 1kg', price: 89.90, rating: 4.9, buyUrl: 'https://3dfila.com.br/categoria-produto/filamentos-3d/filamento-petg-3d/' },
          { storeName: 'Amazon Brasil', productName: 'Filamento PETG Creality CR-PETG 1.75mm 1kg', price: 85.00, rating: 4.6, buyUrl: 'https://www.amazon.com.br/s?k=filamento+petg+1kg' }
        ],
        searchQuery: 'filamento+petg+1kg'
      },
      { 
        type: 'TPU', 
        offers: [
          { storeName: 'Voolt3D Store', productName: 'Filamento TPU Flexível Voolt3D 1.75mm 1kg', price: 109.90, rating: 4.8, buyUrl: 'https://voolt3d.com.br/busca?q=filamento+tpu' },
          { storeName: 'Mercado Livre', productName: 'Filamento TPU Flex Voolt3D 1.75mm 1kg Oficial', price: 114.90, rating: 4.8, buyUrl: 'https://lista.mercadolivre.com.br/filamento-tpu-voolt3d' },
          { storeName: '3D Lab', productName: 'Filamento TPU Flexível Premium 3D Lab 1kg', price: 115.05, rating: 4.9, buyUrl: 'https://3dlab.com.br/categoria-produto/filamento/tpu/' },
          { storeName: 'Shopee Brasil', productName: 'Filamento TPU Flexível 1.75mm Impressão 3D 1kg', price: 104.90, rating: 4.5, buyUrl: 'https://shopee.com.br/search?keyword=filamento%20tpu' },
          { storeName: 'Amazon Brasil', productName: 'Filamento TPU Creality Flexível 1.75mm 1kg', price: 129.00, rating: 4.7, buyUrl: 'https://www.amazon.com.br/s?k=filamento+tpu+1kg' }
        ],
        searchQuery: 'filamento+tpu+flexivel+1kg'
      }
    ];
  });

  const quotationGroups = ensureFiveOffers(quotationGroupsRaw);

  const setQuotationGroups = (updater: any) => {
    if (typeof updater === 'function') {
      setQuotationGroupsRaw(prev => {
        const next = updater(prev);
        return ensureFiveOffers(next);
      });
    } else {
      setQuotationGroupsRaw(ensureFiveOffers(updater));
    }
  };

  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [lastQuotesUpdate, setLastQuotesUpdate] = useState<string>(() => {
    return safeStorage.getItem('bambuzau_last_quotes_update', '');
  });

  const fetchLiveQuotes = async (silent = false, userQuery = '') => {
    if (!silent) setLoadingQuotes(true);
    try {
      const customSerpKey = safeStorage.getItem('bambuzau_custom_serp_key', '');
      let url = `/api/quotations`;
      const params = new URLSearchParams();
      if (customSerpKey) {
        params.append('api_key', customSerpKey.trim());
      }
      if (userQuery && userQuery.trim()) {
        params.append('q', userQuery.trim());
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const customTavilyKey = safeStorage.getItem('bambuzau_custom_tavily_key', '');
      const customJinaKey = safeStorage.getItem('bambuzau_custom_jina_key', '');
      const customGroqKey = safeStorage.getItem('bambuzau_custom_groq_key', '');
      const customGeminiKey = safeStorage.getItem('bambuzau_custom_gemini_key', '');

      const res = await fetch(getApiUrl(`${url}${queryString}`), {
        headers: {
          'X-Custom-Serpapi-Key': customSerpKey.trim(),
          'X-Custom-Tavily-Key': customTavilyKey.trim(),
          'X-Custom-Jina-Key': customJinaKey.trim(),
          'X-Custom-Groq-Key': customGroqKey.trim(),
          'X-Custom-Gemini-Key': customGeminiKey.trim(),
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          if (userQuery && userQuery.trim()) {
            // Prepend custom search results to groups
            setQuotationGroups(prev => {
              const base = prev.filter(g => g.type !== 'Custom' && g.type !== 'Busca' && !g.type.startsWith('Busca:'));
              return [...data.map((g: any) => ({ ...g, type: `Busca: "${userQuery}"` })), ...base];
            });
            triggerFeedback('Resultado da pesquisa atualizado com sucesso! 🔍', 'success');
          } else {
            setQuotationGroups(data);
            localStorage.setItem('bambuzau_cached_quotes', JSON.stringify(data));
          }
          const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = new Date().toLocaleDateString('pt-BR');
          const fullStr = `${dateStr} às ${timeStr}`;
          setLastQuotesUpdate(fullStr);
          localStorage.setItem('bambuzau_last_quotes_update', fullStr);
          
          if (!silent && !userQuery) {
            // Check if any of the fetched items contains a real-time error
            const apiError = data.find((item: any) => item.error)?.error;
            if (apiError) {
              triggerFeedback(`Erro ao consultar cotações reais: ${apiError}. Exibindo dados de referência locais.`, 'info');
            } else {
              triggerFeedback('Cotações de filamentos atualizadas com sucesso em tempo real! 🚀', 'success');
            }
          }
        }
      } else {
        let serverErrorMsg = 'Erro desconhecido no servidor';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(serverErrorMsg);
      }
    } catch (e: any) {
      console.error('Falha ao obter cotações ao vivo:', e);
      
      // Seed stable references or cached data back in case of network obstacles
      const cached = localStorage.getItem('bambuzau_cached_quotes');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuotationGroups(parsed);
          }
        } catch (_) {}
      }
      
      if (!silent) {
        triggerFeedback('Exibindo cotações de referência estáveis da oficina (modo offline/compatibilidade)! 🚀', 'info');
      }
    } finally {
      setLoadingQuotes(false);
    }
  };

  const syncCachedQuotes = (customDetail?: any) => {
    if (customDetail && Array.isArray(customDetail) && customDetail.length > 0) {
      // Force change in state reference so React instantly updates the DOM
      setQuotationGroups([...customDetail]);
    } else {
      const cached = localStorage.getItem('bambuzau_cached_quotes');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuotationGroups([...parsed]);
          }
        } catch (e) {
          console.warn('[syncCachedQuotes] Error parsing cached quotes:', e);
        }
      }
    }
    const savedTime = localStorage.getItem('bambuzau_last_quotes_update') || '';
    if (savedTime) {
      setLastQuotesUpdate(savedTime);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'QUOTE') {
      // Intentionally run an initial sync on sub-tab enter
      syncCachedQuotes();
      fetchLiveQuotes(true);
    }
  }, [activeSubTab]);

  React.useEffect(() => {
    const handleAutoQuotes = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Extract from live event and force re-render
      if (customEvent && customEvent.detail) {
        syncCachedQuotes(customEvent.detail);
      } else {
        syncCachedQuotes();
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bambuzau_cached_quotes' || e.key === 'bambuzau_last_quotes_update') {
        syncCachedQuotes();
      }
    };
    window.addEventListener('bambuzau_quotes_updated', handleAutoQuotes);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('bambuzau_quotes_updated', handleAutoQuotes);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Shopping list form
  const [shopName, setShopName] = useState('');
  const [shopPrice, setShopPrice] = useState(0);

  // Expenses form states for Work Materials
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseTotalAmount, setExpenseTotalAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState<'FILAMENTO' | 'EQUIPAMENTO' | 'ENERGIA' | 'EMBALAGEM' | 'FERRAMENTAS' | 'HARDWARE' | 'SERVICOS' | 'MARKETING' | 'IMPOSTOS' | 'OUTROS' | 'ACESSORIO_INSUMO'>('EMBALAGEM');
  const [expenseQty, setExpenseQty] = useState(1);
  const [expenseSupplier, setExpenseSupplier] = useState<string>('Amazon');
  const [expenseCustomSupplier, setExpenseCustomSupplier] = useState<string>('');

  // Stock integration state variables
  const [stockFilamentType, setStockFilamentType] = useState('PLA');
  const [stockFilamentColor, setStockFilamentColor] = useState('');
  const [stockFilamentWeight, setStockFilamentWeight] = useState(1000);
  const [stockFilamentMinAlert, setStockFilamentMinAlert] = useState(200);
  const [stockSendToInventory, setStockSendToInventory] = useState(true);
  const [stockSupplyMinAlert, setStockSupplyMinAlert] = useState(1);

  // Editing expense states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseDesc, setEditExpenseDesc] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState(0);
  const [editExpenseTotalAmount, setEditExpenseTotalAmount] = useState(0);
  const [editExpenseCategory, setEditExpenseCategory] = useState<'FILAMENTO' | 'EQUIPAMENTO' | 'ENERGIA' | 'EMBALAGEM' | 'FERRAMENTAS' | 'HARDWARE' | 'SERVICOS' | 'MARKETING' | 'IMPOSTOS' | 'OUTROS' | 'ACESSORIO_INSUMO'>('EMBALAGEM');
  const [editExpenseQty, setEditExpenseQty] = useState(1);
  const [editExpenseSupplier, setEditExpenseSupplier] = useState<string>('Amazon');
  const [editExpenseCustomSupplier, setEditExpenseCustomSupplier] = useState<string>('');
  const [editExpenseMonth, setEditExpenseMonth] = useState<string>('');

  // Editing stock integration state variables
  const [editStockSendToInventory, setEditStockSendToInventory] = useState(false);
  const [editStockFilamentType, setEditStockFilamentType] = useState('PLA');
  const [editStockFilamentColor, setEditStockFilamentColor] = useState('');
  const [editStockFilamentWeight, setEditStockFilamentWeight] = useState(1000);
  const [editStockFilamentMinAlert, setEditStockFilamentMinAlert] = useState(200);
  const [editStockSupplyMinAlert, setEditStockSupplyMinAlert] = useState(1);

  // Product editing and month tracking states (v3.3.0.4)
  const [editingProduct, setEditingProduct] = useState<CatalogItem | null>(null);
  const [expenseMonth, setExpenseMonth] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<string>('ALL');

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(e => {
      if (selectedFilterMonth === 'ALL') return true;
      return e.month === selectedFilterMonth;
    });
  }, [expenses, selectedFilterMonth]);

  const colorGroups = React.useMemo(() => {
    const groups: { [key: string]: { originalName: string; count: number; totalWeightKg: number; bg: string; text: string; border: string } } = {};
    (filamentStocks || []).forEach(f => {
      const norm = (f.color || '').trim().toLowerCase() || 'n/a';
      if (!groups[norm]) {
        const colorStyle = getHexColorByName(f.color);
        groups[norm] = {
          originalName: f.color.trim() || 'N/A',
          count: 0,
          totalWeightKg: 0,
          bg: colorStyle.bg,
          text: colorStyle.text,
          border: colorStyle.border
        };
      }
      groups[norm].count += 1;
      groups[norm].totalWeightKg += (f.stockGrams || 0) / 1000;
    });
    return Object.values(groups).sort((a, b) => b.totalWeightKg - a.totalWeightKg || a.originalName.localeCompare(b.originalName, 'pt-BR'));
  }, [filamentStocks]);

  const typeAverages = React.useMemo(() => {
    const stats: { [key: string]: { type: string; totalSum: number; count: number } } = {};
    (filamentStocks || []).forEach(f => {
      const t = (f.type || '').trim().toUpperCase() || 'PLA';
      if (!stats[t]) {
        stats[t] = { type: t, totalSum: 0, count: 0 };
      }
      if (f.priceRoll > 0) {
        stats[t].totalSum += f.priceRoll;
        stats[t].count += 1;
      }
    });
    return Object.values(stats)
      .map(s => ({
        type: s.type,
        avgPrice: s.count > 0 ? s.totalSum / s.count : 0
      }))
      .filter(s => s.avgPrice > 0)
      .sort((a, b) => a.type.localeCompare(b.type, 'pt-BR'));
  }, [filamentStocks]);

  const formatExpenseMonth = (monthStr?: string) => {
    if (!monthStr) return 'Sem Mês';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[monthNum - 1]}/${year}`;
  };

  const handleEditCatalogProduct = (item: CatalogItem) => {
    setEditingProduct(item);
    setManualProdName(item.name);
    setManualProdCode(item.productCode || '');
    setManualProdMaterial(item.filamentType || 'PLA');
    setManualProdColor(item.filamentColorsUsed || 'Multicor');
    setManualProdWeight(item.weightGrams || 150);
    setManualProdTime(item.printTimeHours || 5.0);
    setManualProdPrice(item.defaultPrice || 50);
    setManualProdStock(item.stockCount || 0);
    setManualProdMinStock(item.minStockCount || 0);
    setManualProdImage(item.imageUrl || '');
    setManualProdFilaments(item.filamentsUsed || []);
    setManualProdSupplies(item.suppliesUsed || []);
    setManualStlFileName(item.stlFileName || '');
    setManualStlFileData(item.stlFileData || '');
    setShowAddProductManualForm(true);

    setTimeout(() => {
      const el = document.getElementById('manual_catalog_product_form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setManualProdName('');
    setManualProdCode('');
    setManualProdMaterial('PLA');
    setManualProdColor('Multicor');
    setManualProdWeight(150);
    setManualProdTime(5.0);
    setManualProdPrice(50);
    setManualProdStock(4);
    setManualProdMinStock(1);
    setManualProdImage('');
    setManualProdFilaments([]);
    setManualProdSupplies([]);
    setManualStlFileName('');
    setManualStlFileData('');
    setShowAddProductManualForm(false);
  };

  // Material Profiles
  const [profiles] = useState<MaterialProfile[]>(initialMaterialProfiles);

  // --- NEW PRODUCT COST CALCULATOR STATE ---
  const [calcProdName, setCalcProdName] = useState('');
  const [calcProdCode, setCalcProdCode] = useState('');
  const [calcWeight, setCalcWeight] = useState(120); // grams
  const [calcLossPercent, setCalcLossPercent] = useState(10); // percentage loss/support
  const [calcTime, setCalcTime] = useState(4.5); // print hours
  const [calcMaterial, setCalcMaterial] = useState('PLA'); // Material type selector
  const [selectedFilamentId, setSelectedFilamentId] = useState<number | ''>(''); // specific stock filament
  const [calcLaborHour, setCalcLaborHour] = useState(15.0); // hand work
  const [calcMargin, setCalcMargin] = useState(50.0); // markup percentage (margin)
  const [calcFixedFee, setCalcFixedFee] = useState(5.00); // fixed sale rate (Meli, Shopee, etc)
  const [calcPercentFee, setCalcPercentFee] = useState(18.0); // percentage rate (Meli, Shopee, etc)
  const [calcAdsExpense, setCalcAdsExpense] = useState(5.00); // advertising / ad spend expense (BRL)
  const [calcStockCount, setCalcStockCount] = useState(5);
  const [calcMinStockCount, setCalcMinStockCount] = useState(2);
  const [calcProdImage, setCalcProdImage] = useState('');

  // Sub-state for extra supplies added to the calculated product
  const [selectedSuppliesForCalc, setSelectedSuppliesForCalc] = useState<{ supplyId: number; qty: number }[]>([]);

  // Catalog items loaded and synchronized with persistent layer
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_catalog_production');
      return saved ? JSON.parse(saved) : initialCatalogItems;
    } catch (e) {
      console.warn("Failed to parse catalog items from localStorage, returning defaults", e);
      return initialCatalogItems;
    }
  });

  // WhatsApp and Showcase digital store creator state
  const [whatsappInput, setWhatsappInput] = useState(() => {
    return localStorage.getItem('bambuzau_catalog_whatsapp') || '';
  });

  const [externalWebsiteUrl, setExternalWebsiteUrl] = useState(() => {
    return localStorage.getItem('bambuzau_external_website_url') || '';
  });

  const [useExternalWebsite, setUseExternalWebsite] = useState(() => {
    const saved = localStorage.getItem('bambuzau_use_external_website');
    // Default to true as the user requested to use only the external site connection
    return saved !== 'false';
  });

  const handleSaveWhatsapp = () => {
    localStorage.setItem('bambuzau_catalog_whatsapp', whatsappInput);
    
    // Also update brandConfig inside localStorage structure so both systems synchronize safely!
    try {
      const savedConfig = localStorage.getItem('bambuzau_brand_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        parsed.catalogWhatsapp = whatsappInput;
        localStorage.setItem('bambuzau_brand_config', JSON.stringify(parsed));
      }
    } catch(e) {
      console.warn("Could not synchronize brandConfig in localStorage", e);
    }
    
    alert('Número de WhatsApp do Ateliê salvo com sucesso! Seus pedidos online serão enviados diretamente para este celular.');
  };

  const generateShareLink = () => {
    if (externalWebsiteUrl.trim()) {
      return externalWebsiteUrl.trim();
    }
    // Fallback directly to the standalone external site we are creating under /site_externo.html
    const baseOrigin = window.location.origin;
    return `${baseOrigin}/site_externo.html`;
  };

  const handleCopyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    alert('Link do seu Site de Vendas copiado com sucesso para a área de transferência! Envie para seus clientes!');
  };

  // Manual Catalog Creation Form
  const [showAddProductManualForm, setShowAddProductManualForm] = useState(false);
  const [manualProdName, setManualProdName] = useState('');
  const [manualProdCode, setManualProdCode] = useState('');
  const [manualProdMaterial, setManualProdMaterial] = useState('PLA');
  const [manualProdColor, setManualProdColor] = useState('Multicor');
  const [manualProdWeight, setManualProdWeight] = useState(150);
  const [manualProdTime, setManualProdTime] = useState(5.0);
  const [manualProdPrice, setManualProdPrice] = useState(50);
  const [manualProdStock, setManualProdStock] = useState(4);
  const [manualProdMinStock, setManualProdMinStock] = useState(1);
  const [manualProdImage, setManualProdImage] = useState('');

  // Granular multimaterial & STL state for Manual creation
  const [manualProdFilaments, setManualProdFilaments] = useState<{ filamentStockId: number, weightGrams: number }[]>([]);
  const [manualProdSupplies, setManualProdSupplies] = useState<{ supplyStockId: number, quantity: number }[]>([]);
  const [manualStlFileName, setManualStlFileName] = useState('');
  const [manualStlFileData, setManualStlFileData] = useState('');

  // React state & handlers to support custom base64 image uploading and stock inventory pictures selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          imageSetter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const stockImagesList = React.useMemo(() => {
    const urls = new Set<string>();
    
    // Extrai e unifica todas as imagens de itens de catálogo ja criados pelo ateliê para poderem reutilizar
    catalogItems.forEach(item => {
      if (item.imageUrl && item.imageUrl.trim()) {
        urls.add(item.imageUrl.trim());
      }
    });

    return Array.from(urls).map((url, index) => ({
      name: `Estoque ${index + 1}`,
      url: url
    }));
  }, [catalogItems]);

  const handleSaveManualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProdName.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    const code = manualProdCode.trim() || `CAD-${Math.floor(100 + Math.random() * 900)}`;

    if (editingProduct) {
      const updatedCode = manualProdCode.trim() || editingProduct.productCode || `CAD-${Math.floor(100 + Math.random() * 900)}`;
      const updatedProg: CatalogItem = {
        ...editingProduct,
        name: manualProdName.trim(),
        description: `Código Único: ${updatedCode}. Produzido manualmente em plástico ${manualProdMaterial} ${manualProdColor}.`,
        weightGrams: Number(manualProdWeight) || 0,
        printTimeHours: Number(manualProdTime) || 0,
        filamentType: manualProdMaterial,
        filamentColorsUsed: manualProdColor,
        defaultPrice: Number(manualProdPrice) || 0,
        stockCount: Number(manualProdStock) || 0,
        minStockCount: Number(manualProdMinStock) || 0,
        productCode: updatedCode,
        imageUrl: manualProdImage,
        filamentsUsed: manualProdFilaments.length > 0 ? manualProdFilaments : undefined,
        suppliesUsed: manualProdSupplies.length > 0 ? manualProdSupplies : undefined,
        stlFileName: manualStlFileName || undefined,
        stlFileData: manualStlFileData || undefined
      };
      setCatalogItems(prev => prev.map(c => c.id === editingProduct.id ? updatedProg : c));
      setEditingProduct(null);
      triggerFeedback(`Produto comercial "${updatedProg.name}" atualizado com sucesso no catálogo!`);
    } else {
      const newProg: CatalogItem = {
        id: catalogItems.length > 0 ? Math.max(...catalogItems.map(c => c.id)) + 1 : 1,
        name: manualProdName.trim(),
        description: `Código Único: ${code}. Produzido manualmente em plástico ${manualProdMaterial} ${manualProdColor}.`,
        weightGrams: Number(manualProdWeight) || 0,
        printTimeHours: Number(manualProdTime) || 0,
        filamentType: manualProdMaterial,
        filamentColorsUsed: manualProdColor,
        defaultPrice: Number(manualProdPrice) || 0,
        stockCount: Number(manualProdStock) || 0,
        minStockCount: Number(manualProdMinStock) || 0,
        productCode: code,
        imageUrl: manualProdImage,
        filamentsUsed: manualProdFilaments.length > 0 ? manualProdFilaments : undefined,
        suppliesUsed: manualProdSupplies.length > 0 ? manualProdSupplies : undefined,
        stlFileName: manualStlFileName || undefined,
        stlFileData: manualStlFileData || undefined
      };
      setCatalogItems(prev => [newProg, ...prev]);
      triggerFeedback(`Produto comercial "${newProg.name}" cadastrado diretamente no catálogo!`);
    }

    setManualProdName('');
    setManualProdCode('');
    setManualProdFilaments([]);
    setManualProdSupplies([]);
    setManualStlFileName('');
    setManualStlFileData('');
    setShowAddProductManualForm(false);
  };

  useEffect(() => {
    localStorage.setItem('bambuzau_local_catalog_production', JSON.stringify(catalogItems));
  }, [catalogItems]);

  // Filament Search Store list
  const [searchQuery, setSearchQuery] = useState('PLA');
  const [searchedOffers, setSearchedOffers] = useState<any[]>(staticFilamentOffers.PLA);

  // AI Assistant chatbot states
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Olá! Sou o Assistente IA de Impressão 3D. Como posso te orientar hoje? Tente me perguntar sobre temperaturas de extrusão, falhas de bico (clogs), warping ou orçamentos de produtos!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Days since last stock audit calculation
  const daysSinceAudit = Math.floor((Date.now() - lastAuditDate) / (1000 * 60 * 60 * 24));
  const isAuditOverdue = daysSinceAudit >= 3;

  // --- ACTIONS ---

  const handleAddFilament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fColor.trim()) {
      alert('Favor preencher a cor');
      return;
    }
    onAddFilament({
      type: fType,
      color: fColor.trim(),
      stockGrams: fStockGrams,
      minStockGrams: fMinStock,
      priceRoll: fPrice
    });
    setFColor('');
    setShowAddFilamentForm(false);
    triggerFeedback('Bobina adicionada ao estoque físico com sucesso!');
  };

  const handleAddSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) return;
    const newSupply: SupplyStock = {
      id: suppliesStocks.length > 0 ? Math.max(...suppliesStocks.map(s => s.id)) + 1 : 1,
      name: sName.trim(),
      stockCount: sCount,
      minStockCount: sMinCount,
      unitCost: sUnitCost
    };
    setSuppliesStocks(prev => [...prev, newSupply]);
    setSName('');
    setShowAddSupplyForm(false);
    triggerFeedback('Insumo cadastrado no estoque com sucesso!');
  };

  const handleUpdateSupplyQty = (id: number, delta: number) => {
    setSuppliesStocks(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, stockCount: Math.max(0, s.stockCount + delta) };
      }
      return s;
    }));
  };

  const handleDeleteSupply = (id: number) => {
    if (confirm('Deseja realmente remover este insumo do estoque?')) {
      setSuppliesStocks(prev => prev.filter(s => s.id !== id));
      triggerFeedback('Insumo removido!', 'info');
    }
  };

  const handleReplenishStock = (id: number, current: number) => {
    const extra = prompt('Quantas gramas gostaria de adicionar à bobina?', '1000');
    if (extra) {
      const added = parseFloat(extra);
      if (!isNaN(added)) {
        onUpdateFilament(id, { stockGrams: current + added });
        triggerFeedback('Estoques atualizados!');
      }
    }
  };

  const handleAddShopping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    onAddShoppingItem({ name: shopName.trim(), price: shopPrice, isChecked: false });
    setShopName('');
    setShopPrice(0);
    triggerFeedback('Item inserido no carrinho de compras!');
  };

  const handleAddExpenseUnitChange = (val: number) => {
    setExpenseAmount(val);
    setExpenseTotalAmount(parseFloat((val * expenseQty).toFixed(6)));
  };

  const handleAddExpenseTotalChange = (val: number) => {
    setExpenseTotalAmount(val);
    if (expenseQty > 0) {
      setExpenseAmount(parseFloat((val / expenseQty).toFixed(6)));
    }
  };

  const handleAddExpenseQtyChange = (qty: number) => {
    const qValue = Math.max(1, qty);
    setExpenseQty(qValue);
    setExpenseTotalAmount(parseFloat((expenseAmount * qValue).toFixed(6)));
  };

  const handleEditExpenseUnitChange = (val: number) => {
    setEditExpenseAmount(val);
    setEditExpenseTotalAmount(parseFloat((val * editExpenseQty).toFixed(6)));
  };

  const handleEditExpenseTotalChange = (val: number) => {
    setEditExpenseTotalAmount(val);
    if (editExpenseQty > 0) {
      setEditExpenseAmount(parseFloat((val / editExpenseQty).toFixed(6)));
    }
  };

  const handleEditExpenseQtyChange = (qty: number) => {
    const qValue = Math.max(1, qty);
    setEditExpenseQty(qValue);
    setEditExpenseTotalAmount(parseFloat((editExpenseAmount * qValue).toFixed(6)));
  };

  const handleAddExpenseLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim()) return;

    const supplierValue = expenseSupplier === 'OUTRO'
      ? (expenseCustomSupplier.trim() || 'Outro')
      : expenseSupplier;

    onAddExpense({
      description: expenseDesc.trim(),
      category: expenseCategory,
      amount: expenseAmount || 0,
      qty: expenseQty || 1,
      date: Date.now(),
      supplier: supplierValue,
      month: expenseMonth
    });

    // Auto-create in Stock/Inventory if applicable and selected
    if (stockSendToInventory) {
      if (expenseCategory === 'FILAMENTO') {
        const finalColor = stockFilamentColor.trim() || 'N/A';
        onAddFilament({
          type: stockFilamentType,
          color: finalColor,
          stockGrams: stockFilamentWeight * (expenseQty || 1),
          minStockGrams: stockFilamentMinAlert,
          priceRoll: expenseAmount || 0
        });
        triggerFeedback('Gasto de Filamento salvo e adicionado automaticamente ao Estoque!');
      } else if (expenseCategory === 'ACESSORIO_INSUMO') {
        const newSupply: SupplyStock = {
          id: suppliesStocks.length > 0 ? Math.max(...suppliesStocks.map(s => s.id)) + 1 : 1,
          name: expenseDesc.trim(),
          stockCount: expenseQty || 1,
          minStockCount: stockSupplyMinAlert,
          unitCost: expenseAmount || 0
        };
        setSuppliesStocks((prev: SupplyStock[]) => [...prev, newSupply]);
        triggerFeedback('Gasto de Insumo salvo e adicionado automaticamente ao Estoque!');
      } else {
        triggerFeedback('Gasto de material para trabalho adicionado!');
      }
    } else {
      triggerFeedback('Gasto de material para trabalho adicionado!');
    }

    setExpenseDesc('');
    setExpenseAmount(0);
    setExpenseTotalAmount(0);
    setExpenseQty(1);
    setExpenseSupplier('Amazon');
    setExpenseCustomSupplier('');
    setStockFilamentColor('');
  };

  const handleStartEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseDesc(expense.description);
    setEditExpenseAmount(expense.amount);
    setEditExpenseTotalAmount(parseFloat((expense.amount * expense.qty).toFixed(6)));
    setEditExpenseCategory(expense.category);
    setEditExpenseQty(expense.qty);
    
    const standardSuppliers = ['Amazon', 'Shopee', 'Mercado Livre', 'AliExpress', 'Temu'];
    if (expense.supplier && standardSuppliers.includes(expense.supplier)) {
      setEditExpenseSupplier(expense.supplier);
      setEditExpenseCustomSupplier('');
    } else {
      setEditExpenseSupplier('OUTRO');
      setEditExpenseCustomSupplier(expense.supplier || '');
    }
    
    setEditExpenseMonth(expense.month || new Date(expense.date).toISOString().substring(0, 7));

    // Reset stock integration on start edit
    setEditStockSendToInventory(false);
    setEditStockFilamentType('PLA');
    setEditStockFilamentColor('');
    setEditStockFilamentWeight(1000);
    setEditStockFilamentMinAlert(200);
    setEditStockSupplyMinAlert(1);
  };

  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    if (!editExpenseDesc.trim()) return;

    const finalSupplier = editExpenseSupplier === 'OUTRO'
      ? (editExpenseCustomSupplier.trim() || 'Outro')
      : editExpenseSupplier;

    onUpdateExpense(editingExpense.id, {
      description: editExpenseDesc.trim(),
      category: editExpenseCategory,
      amount: editExpenseAmount || 0,
      qty: editExpenseQty || 1,
      supplier: finalSupplier,
      month: editExpenseMonth
    });

    // Auto-create in Stock/Inventory if applicable and selected in edit modal
    if (editStockSendToInventory) {
      if (editExpenseCategory === 'FILAMENTO') {
        const finalColor = editStockFilamentColor.trim() || 'N/A';
        onAddFilament({
          type: editStockFilamentType,
          color: finalColor,
          stockGrams: editStockFilamentWeight * (editExpenseQty || 1),
          minStockGrams: editStockFilamentMinAlert,
          priceRoll: editExpenseAmount || 0
        });
        triggerFeedback('Gasto atualizado e enviado automaticamente para o Estoque!');
      } else if (editExpenseCategory === 'ACESSORIO_INSUMO') {
        const newSupply: SupplyStock = {
          id: suppliesStocks.length > 0 ? Math.max(...suppliesStocks.map(s => s.id)) + 1 : 1,
          name: editExpenseDesc.trim(),
          stockCount: editExpenseQty || 1,
          minStockCount: editStockSupplyMinAlert,
          unitCost: editExpenseAmount || 0
        };
        setSuppliesStocks((prev: SupplyStock[]) => [...prev, newSupply]);
        triggerFeedback('Gasto atualizado e insumo adicionado ao Estoque!');
      } else {
        triggerFeedback('Gasto de material atualizado com sucesso!');
      }
    } else {
      triggerFeedback('Gasto de material atualizado com sucesso!');
    }

    setEditingExpense(null);
  };

  const handleExportExpensesPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 15;

      const brandDark = { r: 12, g: 14, b: 13 };
      const brandSage = { r: 99, g: 126, b: 85 };
      const brandGold = { r: 226, g: 177, b: 68 };

      // Border rectangle
      doc.setDrawColor(220, 220, 220);
      doc.rect(10, 10, 190, 277);

      // HEADER
      doc.setFillColor(brandDark.r, brandDark.g, brandDark.b);
      doc.rect(12, 12, 186, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(247, 245, 240);
      doc.text('GESTÃO 3D - RELATÓRIO DE DEPRECIAÇÃO & GASTOS', 16, 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(brandGold.r, brandGold.g, brandGold.b);
      doc.text('SINOPSES DE AUDITORIA E DESPESAS EFETIVADAS DA OFICINA', 16, 33);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}  |  Atualização v3.3.0.4`, 16, 39);

      y = 52;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(brandSage.r, brandSage.g, brandSage.b);
      const selMonth = selectedFilterMonth === 'ALL' ? 'Todos os Meses' : formatExpenseMonth(selectedFilterMonth);
      doc.text(`Lista de Despesas / Custos de Materiais (${selMonth}):`, 15, y);

      y += 8;

      // Draw table headers
      doc.setFillColor(brandSage.r, brandSage.g, brandSage.b);
      doc.rect(15, y, 180, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Descriçao / Gasto', 17, y + 5);
      doc.text('Categoria', 85, y + 5);
      doc.text('Fornecedor', 115, y + 5);
      doc.text('Mês Ref', 145, y + 5);
      doc.text('Total (R$)', 175, y + 5);

      y += 7;

      const rawItems = selectedFilterMonth === 'ALL'
        ? expenses
        : expenses.filter(e => e.month === selectedFilterMonth);

      // Sort: Alphabetically by category first, then alphabetically by description within each category
      const itemsToPrint = [...rawItems].sort((a, b) => {
        const catA = getExpenseCategoryPlainLabel(a.category);
        const catB = getExpenseCategoryPlainLabel(b.category);
        const catComp = catA.localeCompare(catB, 'pt-BR');
        if (catComp !== 0) return catComp;
        return a.description.localeCompare(b.description, 'pt-BR');
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);

      let totalSum = 0;

      itemsToPrint.forEach((item, index) => {
        if (y > 255) {
          doc.addPage();
          doc.rect(10, 10, 190, 277);
          y = 20;
          doc.setFillColor(brandSage.r, brandSage.g, brandSage.b);
          doc.rect(15, y, 180, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('Descriçao / Gasto', 17, y + 5);
          doc.text('Categoria', 85, y + 5);
          doc.text('Fornecedor', 115, y + 5);
          doc.text('Mês Ref', 145, y + 5);
          doc.text('Total (R$)', 175, y + 5);
          y += 7;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(40, 40, 40);
        }

        const cost = item.amount * item.qty;
        totalSum += cost;

        // Line background
        if (index % 2 === 0) {
          doc.setFillColor(245, 247, 245);
          doc.rect(15, y, 180, 7, 'F');
        }

        doc.text(item.description.substring(0, 32), 17, y + 5);
        doc.text(getExpenseCategoryPlainLabel(item.category).substring(0, 18), 85, y + 5);
        doc.text((item.supplier || 'N/D').substring(0, 16), 115, y + 5);
        doc.text(item.month ? formatExpenseMonth(item.month) : formatExpenseMonth(new Date(item.date).toISOString().substring(0, 7)), 145, y + 5);
        doc.text(`R$ ${cost.toFixed(2)}`, 175, y + 5);

        y += 7;
      });

      y += 5;

      // Draw summary total block
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y, 180, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.text('SOMA ACUMULADA DO PERÍODO SELECIONADO:', 18, y + 8);
      doc.text(`R$ ${totalSum.toFixed(2)}`, 162, y + 8);

      const android = (window as any).AndroidInterface;
      if (android && typeof android.saveFile === 'function') {
        const dataUri = doc.output('datauristring');
        android.saveFile(`relatorio_gastos_atelie_3D.pdf`, dataUri, "application/pdf");
      } else {
        doc.save(`relatorio_gastos_atelie_3D.pdf`);
        triggerFeedback('Relatório de gastos em PDF de alta resolução baixado com sucesso!');
      }
    } catch (err: any) {
      alert('Falha ao exportar PDF de gastos/despesas: ' + err.message);
    }
  };

  const handleShareExpensesWhatsApp = () => {
    try {
      const itemsToShare = selectedFilterMonth === 'ALL'
        ? expenses
        : expenses.filter(e => e.month === selectedFilterMonth);

      if (itemsToShare.length === 0) {
        triggerFeedback('Nenhum gasto registrado para o mês selecionado.', 'info');
        return;
      }

      const selMonth = selectedFilterMonth === 'ALL' ? 'Todos os Meses' : formatExpenseMonth(selectedFilterMonth);
      let text = `📊 *RELATÓRIO DE DESPESAS DA OFICINA 3D* 📊\n`;
      text += `📅 _Referência: ${selMonth}_\n`;
      text += `⏱️ _Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}_\n`;
      text += `-----------------------------------------------\n\n`;

      let totalSum = 0;
      itemsToShare.forEach((item, index) => {
        const cost = item.amount * item.qty;
        totalSum += cost;
        const catLabel = getExpenseCategoryLabel(item.category);
        const supplierStr = item.supplier ? ` | Fornecedor: ${item.supplier}` : '';
        const mStr = item.month ? formatExpenseMonth(item.month) : formatExpenseMonth(new Date(item.date).toISOString().substring(0, 7));

        text += `*${index + 1}. ${item.description}*  [${mStr}]\n`;
        text += `   • Categoria: ${catLabel}${supplierStr}\n`;
        text += `   • Quantidade: ${item.qty} un  |  Custo: *R$ ${cost.toFixed(2)}*\n\n`;
      });

      text += `-----------------------------------------------\n`;
      text += `💰 *VALOR TOTAL CONSOLIDADO: R$ ${totalSum.toFixed(2)}*\n\n`;
      text += `⚡ _Enviado via Ateliê de Impressão 3D v3.3.0.4_`;

      const android = (window as any).AndroidInterface;
      if (android && typeof android.copyToClipboard === 'function') {
        android.copyToClipboard(text);
        triggerFeedback('Relatório copiado para celular! Redirecionando...');
      } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text);
        triggerFeedback('Texto do relatório copiado! Redirecionando...');
      }

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (e: any) {
      alert('Erro ao enviar para o WhatsApp: ' + e.message);
    }
  };

  const getExpenseCategoryLabel = (category: string) => {
    switch (category) {
      case 'EMBALAGEM': return '📦 Embalagem & Caixas';
      case 'EQUIPAMENTO': return '⚙️ Impressoras, Peças & Upgrades';
      case 'ENERGIA': return '⚡ Infraestrutura & Energia';
      case 'FERRAMENTAS': return '🛠️ Ferramentas & Acessórios';
      case 'HARDWARE': return '🔩 Hardware & Parafusos';
      case 'SERVICOS': return '💻 Serviços & Softwares';
      case 'MARKETING': return '📣 Anúncios & Marketing';
      case 'IMPOSTOS': return '💸 Impostos & Taxas';
      case 'FILAMENTO': return '🧵 Filamentos';
      case 'ACESSORIO_INSUMO': return '🔧 Insumo / Acessório (Estoque)';
      case 'OUTROS': return '🏷️ Outros / Diversos';
      default: return category;
    }
  };

  const getExpenseCategoryPlainLabel = (category: string) => {
    switch (category) {
      case 'EMBALAGEM': return 'Embalagem & Caixas';
      case 'EQUIPAMENTO': return 'Impressoras, Pecas & Upgrades';
      case 'ENERGIA': return 'Infraestrutura & Energia';
      case 'FERRAMENTAS': return 'Ferramentas & Acessorios';
      case 'HARDWARE': return 'Hardware & Parafusos';
      case 'SERVICOS': return 'Servicos & Softwares';
      case 'MARKETING': return 'Anuncios & Marketing';
      case 'IMPOSTOS': return 'Impostos & Taxas';
      case 'FILAMENTO': return 'Filamentos';
      case 'ACESSORIO_INSUMO': return 'Insumo / Acessorio (Estoque)';
      case 'OUTROS': return 'Outros / Diversos';
      default: return category;
    }
  };

  const formatPriceWithDynamicDecimals = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    if (val === 0) return '0,00';
    const str = val.toString();
    const decimalPart = str.split('.')[1] || '';
    if (decimalPart.length > 2) {
      let formatted = val.toFixed(6);
      while (formatted.endsWith('0') && formatted.split('.')[1].length > 2) {
        formatted = formatted.slice(0, -1);
      }
      return formatted.replace('.', ',');
    }
    return val.toFixed(2).replace('.', ',');
  };

  const handleConfirmAudit = () => {
    setLastAuditDate(Date.now());
    triggerFeedback('Auditoria física de filamentos e insumos homologada com sucesso! Alerta limpo por 3 dias.');
  };

  const handleOfferSearch = (material: string) => {
    setSearchQuery(material);
    const results = (staticFilamentOffers as any)[material] || staticFilamentOffers.PLA;
    setSearchedOffers(results);
  };

  // Toggle supply item checkbox inside the product cost calculator
  const handleToggleSupplyForCalc = (supplyId: number) => {
    setSelectedSuppliesForCalc(prev => {
      const exists = prev.some(item => item.supplyId === supplyId);
      if (exists) {
        return prev.filter(item => item.supplyId !== supplyId);
      } else {
        return [...prev, { supplyId, qty: 1 }];
      }
    });
  };

  const handleUpdateSupplyQtyForCalc = (supplyId: number, qty: number) => {
    setSelectedSuppliesForCalc(prev => prev.map(item => {
      if (item.supplyId === supplyId) {
        return { ...item, qty: Math.max(1, qty) };
      }
      return item;
    }));
  };

  // --- CALCULATION LOGIC FOR THE NEW PRODUCT CALCULATOR ---

  // 1. Matéria Prima (Filamento)
  const selectableFilaments = filamentStocks.filter(f => f.type === calcMaterial);
  const activeFilament = selectableFilaments.find(f => f.id === selectedFilamentId) || selectableFilaments[0];

  useEffect(() => {
    // Auto reset selected filament id when material type changes
    if (selectableFilaments.length > 0) {
      setSelectedFilamentId(selectableFilaments[0].id);
    } else {
      setSelectedFilamentId('');
    }
  }, [calcMaterial]);

  const rawFilamentPriceKg = activeFilament ? activeFilament.priceRoll : 120.0;
  const targetWeightWithLoss = calcWeight * (1 + calcLossPercent / 100);
  const rawMaterialCost = (targetWeightWithLoss / 1000) * rawFilamentPriceKg;

  // 2. Energia Elétrica
  const selectedProfile = profiles.find(p => p.type === calcMaterial) || profiles[0];
  const electricityKwhUsed = (calcTime * selectedProfile.printerPowerW) / 1000;
  const electricityCost = electricityKwhUsed * selectedProfile.electricityCostKwh;

  // 3. Mão de Obra
  const laborCost = calcTime * calcLaborHour;

  // 4. Insumos Extras
  const extraSuppliesCost = selectedSuppliesForCalc.reduce((sum, item) => {
    const origSupply = suppliesStocks.find(s => s.id === item.supplyId);
    if (!origSupply) return sum;
    return sum + (origSupply.unitCost * item.qty);
  }, 0);

  // Custo Direto de Fabricação
  const directMachineCost = rawMaterialCost + electricityCost + laborCost + extraSuppliesCost + calcAdsExpense;

  // Preço de venda comercial estipulando markup sem custos de marketplace
  const markupMultiplier = 1 + (calcMargin / 100);
  const baselineDesiredPrice = directMachineCost * markupMultiplier;

  // Engenharia Precificação Reversa dos Marketplaces
  // Preço Final = (PreçoBase + TaxaFixa) / (1 - TaxaPercent / 100)
  const safePercentRate = Math.min(95, Math.max(0, calcPercentFee)) / 100;
  const finalPriceSuggested = (baselineDesiredPrice + calcFixedFee) / (1 - safePercentRate);
  const commissionPaidToMarketplace = (finalPriceSuggested * safePercentRate) + calcFixedFee;
  const netEarningsProfit = finalPriceSuggested - commissionPaidToMarketplace - directMachineCost;

  const handleSaveToCatalog = () => {
    if (!calcProdName.trim()) {
      alert('Por favor, informe o nome do produto para salvar no catálogo.');
      return;
    }

    const code = calcProdCode.trim() || `CAD-${Math.floor(100 + Math.random() * 900)}`;

    const recipeFilaments = activeFilament 
      ? [{ filamentStockId: activeFilament.id, weightGrams: parseFloat(targetWeightWithLoss.toFixed(1)) }]
      : undefined;

    const newCatalogP: CatalogItem = {
      id: catalogItems.length > 0 ? Math.max(...catalogItems.map(c => c.id)) + 1 : 1,
      name: calcProdName.trim(),
      description: `Código Único: ${code}. Produzido em plástico ${calcMaterial} ${activeFilament ? activeFilament.color : ''}.`,
      weightGrams: parseFloat(targetWeightWithLoss.toFixed(1)),
      printTimeHours: calcTime,
      filamentType: calcMaterial,
      filamentColorsUsed: activeFilament ? activeFilament.color : 'Universal',
      defaultPrice: parseFloat(finalPriceSuggested.toFixed(2)),
      stockCount: calcStockCount,
      minStockCount: calcMinStockCount,
      productCode: code,
      imageUrl: calcProdImage,
      filamentsUsed: recipeFilaments
    };

    setCatalogItems(prev => [newCatalogP, ...prev]);
    setCalcProdName('');
    setCalcProdCode('');
    setActiveSubTab('CATALOG');
    triggerFeedback(`Produto comercial "${newCatalogP.name}" registrado e indexado ao Catálogo de Vendas!`);
  };

  // --- CATALOG EXPORT TO PDF VIA JSPDF ---
  const handleExportCatalogPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 15;

      // Color Theme
      const brandDark = { r: 12, g: 14, b: 13 };
      const brandSage = { r: 99, g: 126, b: 85 };
      const brandGold = { r: 226, g: 177, b: 68 };

      // DRAW BORDER RECTANGLE
      doc.setDrawColor(220, 220, 220);
      doc.rect(10, 10, 190, 277);

      // HEADER
      doc.setFillColor(brandDark.r, brandDark.g, brandDark.b);
      doc.rect(12, 12, 186, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(247, 245, 240);
      doc.text('GESTÃO 3D - ATELIÊ DE IMPRESSÃO', 16, 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(brandGold.r, brandGold.g, brandGold.b);
      doc.text('CATÁLOGO OFICIAL DE PRODUTOS & PREÇOS DE PARCEIROS', 16, 33);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}  |  Vendas Rápidas Integradas via Mobile App`, 16, 39);

      y = 52;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(brandSage.r, brandSage.g, brandSage.b);
      doc.text('Portfólio de Modelos Cadastrados:', 15, y);

      y += 8;

      // Draw table headers
      doc.setFillColor(brandSage.r, brandSage.g, brandSage.b);
      doc.rect(15, y, 180, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Nº', 17, y + 5);
      doc.text('CÓDIGO', 25, y + 5);
      doc.text('PRODUTO / COMPONENTE', 50, y + 5);
      doc.text('MATERIAL', 115, y + 5);
      doc.text('DUR.(h)', 138, y + 5);
      doc.text('QTD DISP.', 153, y + 5);
      doc.text('PREÇO (R$)', 173, y + 5);

      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);

      catalogItems.forEach((item, index) => {
        // Draw row line
        if (index % 2 === 0) {
          doc.setFillColor(245, 247, 245);
          doc.rect(15, y, 180, 7, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, 7, 'F');
        }

        const printTimeNum = Number(item.printTimeHours || 0);
        const priceNum = Number(item.defaultPrice || 0);
        const stockNum = Number(item.stockCount || 0);

        doc.text((index + 1).toString(), 17, y + 5);
        doc.text(item.productCode || 'S/C', 25, y + 5);
        doc.text(item.name.substring(0, 32), 50, y + 5);
        doc.text(`${item.filamentType} ${item.filamentColorsUsed || ''}`.substring(0, 16), 115, y + 5);
        doc.text(printTimeNum.toFixed(1), 138, y + 5);
        doc.text(stockNum.toString(), 153, y + 5);
        doc.text(`R$ ${priceNum.toFixed(2)}`, 173, y + 5);

        y += 7;

        // Page break safety check
        if (y > 260) {
          doc.addPage();
          doc.rect(10, 10, 190, 277);
          y = 20;
        }
      });

      y += 10;

      // SUMMARY FOOTER
      doc.setFillColor(247, 245, 240);
      doc.rect(15, y, 180, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.text('ORÇAMENTOS ESPECIAIS & SERVIÇO DE ENCOMENDAS EXCLUSIVO', 18, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      const footerMsg = 'Todos os modelos acima sao precificados estipulando cobertura completa de impostos e taxas dos canais Shopee, TikTok Shop ou Mercado Livre. Para compras diretas de balcao (WhatsApp), aplique o desconto medio de 18% no valor de tabela. Nosso ateliê agradece a sua parceria comercial.';
      const splitSt = doc.splitTextToSize(footerMsg, 172);
      doc.text(splitSt, 18, y + 11);

      const android = (window as any).AndroidInterface;
      if (android && typeof android.saveFile === 'function') {
        const dataUri = doc.output('datauristring');
        android.saveFile(`catalogo_vendas_atelie_3D.pdf`, dataUri, "application/pdf");
      } else {
        doc.save(`catalogo_vendas_atelie_3D.pdf`);
        triggerFeedback('Catálogo em PDF de alta qualidade baixado com sucesso! Salve e envie para seus clientes.');
      }
    } catch (err: any) {
      alert('Falha ao exportar o PDF: ' + err.message);
    }
  };

  const handleCopyCatalogToClipboard = () => {
    try {
      if (catalogItems.length === 0) {
        triggerFeedback('Nenhum produto cadastrado no catálogo para copiar!', 'info');
        return;
      }
      
      let text = `📋 *CATÁLOGO OFICIAL DE PRODUTOS - PRODUÇÃO 3D*\n`;
      text += `📅 _Atualizado em: ${new Date().toLocaleDateString('pt-BR')}_\n`;
      text += `-----------------------------------------------\n\n`;
      
      catalogItems.forEach((item, index) => {
        const itemPrice = Number(item.defaultPrice || 0);
        text += `*${index + 1}. ${item.name}*\n`;
        text += `   • Código: \`${item.productCode || 'S/C'}\`\n`;
        text += `   • Material: _${item.filamentType}_\n`;
        text += `   • Preço Unitário: *R$ ${itemPrice.toFixed(2)}*\n\n`;
      });
      
      text += `-----------------------------------------------\n`;
      text += `⚡ _Todos os preços acima consideram cobertura padrão de taxas. Para encomendas sob medida ou outras cores, consulte nossa equipe via direct!_`;

      const fallbackCopy = (textToCopy: string) => {
        const android = (window as any).AndroidInterface;
        if (android && typeof android.copyToClipboard === 'function') {
          android.copyToClipboard(textToCopy);
          return Promise.resolve();
        }
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          return navigator.clipboard.writeText(textToCopy);
        }
        return new Promise<void>((resolve, reject) => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.top = '0';
            textarea.style.left = '0';
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (success) resolve();
            else reject(new Error('Erro no execCommand'));
          } catch (err) {
            reject(err);
          }
        });
      };

      fallbackCopy(text)
        .then(() => {
          triggerFeedback('Tabela comercial copiada para a Área de Transferência com absoluto sucesso! Cole no WhatsApp dos clientes.');
        })
        .catch(err => {
          alert('Erro ao copiar tabela: ' + err.message);
        });
    } catch (e: any) {
      alert('Erro inesperado: ' + e.message);
    }
  };

  const handleDeleteCatalogProduct = (id: number) => {
    if (confirm('Deseja realmente deletar este produto do seu catálogo?')) {
      setCatalogItems(prev => prev.filter(c => c.id !== id));
      triggerFeedback('Produto deletado do catálogo.', 'info');
    }
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setAiInput('');
    setAiLoading(true);

    setTimeout(() => {
      let reply = 'Estou analisando seu perfil de fabricação. ';
      const lower = userText.toLowerCase();

      if (lower.includes('temperatura') || lower.includes('graus')) {
        reply = `Temperaturas Ideais recomendadas para seu Ateliê:
- **PLA**: Extrusão de **195°C - 215°C**, mesa a **55°C - 60°C**. Facilidade absoluta de acabamento e menos warping.
- **PETG (Resistente)**: bico de **235°C - 245°C**, mesa a **75°C - 85°C**. Ligue brim e mantenha a refrigeração em 30% para excelente adesão estrutural.
- **ABS**: bico de **240°C - 250°C**, mesa a **100°C - 110°C**. Requer obrigatoriamente câmara fechada.`;
      } else if (lower.includes('warping') || lower.includes('descolar') || lower.includes('mesa')) {
        reply = `Guia definitivo contra **Warping / Trincas** no seu ateliê:
1. **Lave a Chapa PEI Texturizada**: Esfregue com detergente neutro e água quente. O álcool isopropílico remove óleo superficial, mas detergente remove resíduos permanentes.
2. **Utilize adesivos de auxílio**: Cola bastão escolar ou spray de fixação especial (temos no estoque de insumos).
3. **Câmara selada**: Evite correntes de ar na sua impressora fechada ou feche a porta de vidro dela.
4. **Brim de Contorno**: Adicione contorno brim de 8mm no fatiador para segurar cantos de peças extensas.`;
      } else if (lower.includes('orçamento') || lower.includes('preço') || lower.includes('calcular') || lower.includes('taxa')) {
        reply = `Sobre a Precificação do Fatiador Automatizado de Produtos do Ateliê:
- A calculadora atual busca o filamento direto do seu estoque para pegar o custo exato.
- Ela adiciona a perda por suportes e falhas (calculado em %) para você não pagar a perda do seu bolso.
- O cálculo reitera suas taxas fixas (R$) e taxas percentuais (%) cobradas pelos canais Shopee, TikTok Shop ou Mercado Livre para dar o preço comercial perfeito reverso que garante o seu **Lucro Líquido desejado**!`;
      } else {
        reply = `Excelente pergunta! Como engenheiro especialista em manufatura aditiva 3D e impressão rápida 3D de alta performance, recomendo calibrar seu fatiador de acordo com as bobinas físicas reais do ateliê.
Utilize a nossa nova calculadora de formação de preço de produtos para obter lucratividade líquida de pelo menos 50% em cada vaso, action figure ou protótipo, integrando seus insumos adicionais cadastrados no estoque!`;
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setAiLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6" id="costs_tab_container">
      
      {/* GLOBAL ALERTS PORTAL */}
      {alertMessage.text && (
        <div key={alertMessage.text} className={`p-4 rounded-xl border flex items-center gap-2.5 font-medium text-xs shadow-lg animate-fade-in ${
          alertMessage.type === 'success' 
            ? 'bg-[#95BBA2]/15 border-[#95BBA2]/30 text-[#95BBA2]' 
            : alertMessage.type === 'info'
            ? 'bg-blue-500/10 border-blue-500/20 text-[#8BA58D]'
            : 'bg-red-500/15 border-red-500/25 text-[#D35C5C]'
        }`} id="app-toast-alert">
          <CheckCircle className="h-4.5 w-4.5 animate-pulse" />
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* THREE D DAYS STOCK AUDIT BANNER */}
      <div className={`p-4.5 rounded-2xl border transition relative overflow-hidden ${
        isAuditOverdue 
          ? 'bg-red-500/[0.03] border-red-500/30 text-rose-300' 
          : 'bg-[#95BBA2]/5 border-[#95BBA2]/10 text-[#8BA58D]'
      }`} id="audit_period_safety_banner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Calendar className={`h-5 w-5 mt-0.5 shrink-0 ${isAuditOverdue ? 'text-red-400 animate-bounce' : 'text-[#8BA58D]'}`} />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#F1F4EE]">
                {isAuditOverdue ? 'Recontagem de Estoques Pendente!' : 'Auditoria em Dia'}
              </p>
              <p className="text-[11px] opacity-80 leading-relaxed max-w-2xl">
                {isAuditOverdue 
                  ? `Última recontagem realizada há ${daysSinceAudit} dias. Faça a conferência física e confirme clicando no botão ao lado.`
                  : `Estoque físico auditado há ${daysSinceAudit} dias. Dados reais sincronizados!`
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirmAudit}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow border ${
              isAuditOverdue
                ? 'bg-red-500/10 hover:bg-red-500/25 border-red-500/40 text-red-300'
                : 'bg-[#95BBA2]/10 hover:bg-[#95BBA2]/20 border-[#95BBA2]/25 text-[#95BBA2]'
            }`}
            id="btn_confirm_stock_audit"
          >
            Confirmar Auditoria Física Hoje
          </button>
        </div>
      </div>

      {/* CAPSULE TAB CHANGER MENU */}
      <div className="grid grid-cols-3 sm:grid-cols-6 items-center gap-2 p-2 bg-[#0a0d0c] border border-[#26332c] rounded-2xl shadow-xl" id="subtab-capsules">
        <button
          onClick={() => setActiveSubTab('CALC')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'CALC' 
              ? 'bg-[#E5B242] text-[#0C0E0D] border border-[#E5B242] shadow-[0_0_14px_rgba(229,178,66,0.55)] scale-[1.03] ring-1 ring-[#E5B242]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_calc"
        >
          <Calculator className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'CALC' ? 'text-black' : 'text-[#B5DFC0]'}`} />
          <span className="text-[11px] sm:text-xs font-bold">Cálculo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CATALOG')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'CATALOG' 
              ? 'bg-[var(--brand-primary)] text-[#0C0E0D] border border-[var(--brand-primary)] shadow-[0_0_14px_rgba(149,187,162,0.6)] scale-[1.03] ring-1 ring-[var(--brand-primary)]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_catalog"
        >
          <BookOpen className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'CATALOG' ? 'text-black' : 'text-[#B5DFC0]'}`} />
          <span className="text-[11px] sm:text-xs font-bold">Catálogo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('STOCK')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'STOCK' 
              ? 'bg-[var(--brand-primary)] text-[#0C0E0D] border border-[var(--brand-primary)] shadow-[0_0_14px_rgba(149,187,162,0.6)] scale-[1.03] ring-1 ring-[var(--brand-primary)]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_stock"
        >
          <Layers className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'STOCK' ? 'text-black' : 'text-[#B5DFC0]'}`} />
          <span className="text-[11px] sm:text-xs font-bold">Estoque</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SHOP')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'SHOP' 
              ? 'bg-[var(--brand-primary)] text-[#0C0E0D] border border-[var(--brand-primary)] shadow-[0_0_14px_rgba(149,187,162,0.6)] scale-[1.03] ring-1 ring-[var(--brand-primary)]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_shop"
        >
          <DollarSign className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'SHOP' ? 'text-black' : 'text-[#B5DFC0]'}`} />
          <span className="text-[11px] sm:text-xs font-bold font-sans">Gastos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('QUOTE')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'QUOTE' 
              ? 'bg-[#E5B242] text-[#0C0E0D] border border-[#E5B242] shadow-[0_0_14px_rgba(229,178,66,0.55)] scale-[1.03] ring-1 ring-[#E5B242]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_quote"
        >
          <TrendingUp className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'QUOTE' ? 'text-black' : 'text-[#E5D771]'}`} />
          <span className="text-[11px] sm:text-xs font-black">Cotação 📈</span>
        </button>

        <button
          onClick={() => setActiveSubTab('AI')}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'AI' 
              ? 'bg-[var(--brand-primary)] text-[#0C0E0D] border border-[var(--brand-primary)] shadow-[0_0_14px_rgba(149,187,162,0.6)] scale-[1.03] ring-1 ring-[var(--brand-primary)]/50' 
              : 'bg-[#19211D] text-[#DCE8E0] hover:text-white hover:bg-[#222E27] border border-[#2A3B30] hover:border-[#95BBA2]/70 shadow-md'
          }`}
          id="btn_subtab_ai"
        >
          <Sparkles className={`h-3.5 w-3.5 shrink-0 ${activeSubTab === 'AI' ? 'text-black' : 'text-[#B5DFC0]'}`} />
          <span className="text-[11px] sm:text-xs font-bold">Assistente</span>
        </button>
      </div>

      {/* SUB TAB RENDER DIRECTIVES */}

      {/* SUBTAB 1: PRODUCT PRICE PRECISION CALCULATOR */}
      {activeSubTab === 'CALC' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="precificator-active-panel">
          
          {/* Inputs Section */}
          <div className="lg:col-span-7 bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#E5B242]" />
                Variáveis do Produto do seu Fatiador 3D
              </h3>
              <p className="text-xs text-[#8BA58D]">Fórmula profissional baseada em filamento do estoque, perdas e comissão</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Identificação do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Action Figure Stormtrooper"
                  value={calcProdName}
                  onChange={(e) => setCalcProdName(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white"
                  id="calc_prod_name_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Código SKU do Catálogo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: STORM01"
                  value={calcProdCode}
                  onChange={(e) => setCalcProdCode(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white"
                  id="calc_sku_code_input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-[#232B27]/40 pt-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Estoque Inicial (Pronta-Entrega)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 5"
                  value={calcStockCount}
                  onChange={(e) => setCalcStockCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Estoque Mínimo Alvo</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 2"
                  value={calcMinStockCount}
                  onChange={(e) => setCalcMinStockCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-3.5 border-t border-[#232B27]/40 pt-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Foto Real do Produto (Visualização no Catálogo)</label>
                
                {/* File Upload Input */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] bg-[#95BBA2]/15 text-[#95BBA2] hover:bg-[#95BBA2]/30 px-2.5 py-1 rounded-lg border border-[#95BBA2]/25 cursor-pointer font-bold select-none transition">
                    📂 Fazer Upload de Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setCalcProdImage)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9.5px] text-[#8BA58D] font-mono block">Imagens Existentes no Estoque / Referências de Cadastro:</span>
                {stockImagesList.length === 0 ? (
                  <p className="text-[10px] text-[#8BA58D]/60 italic bg-black/10 p-2.5 rounded-xl border border-[#232B27]/40">
                    Nenhuma foto cadastrada no banco de dados ainda. Faça upload de uma foto usando o botão de upload acima!
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {stockImagesList.slice(0, 16).map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setCalcProdImage(preset.url)}
                        className={`p-1 border rounded-lg bg-[#0C0E0D] hover:border-[#95BBA2] transition text-left cursor-pointer flex flex-col items-center justify-center gap-1 ${calcProdImage === preset.url ? 'border-[#E5B242] ring-1 ring-[#E5B242]' : 'border-[#232B27]'}`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <span className="text-[8px] text-[#8BA58D] text-center w-full truncate font-mono">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-[#8BA58D] font-medium block">Imagem Atual Selecionada (Preview / URL):</span>
                <div className="flex gap-2 items-center">
                  {calcProdImage && (
                    <img src={calcProdImage} alt="Preview" referrerPolicy="no-referrer" className="h-8 w-8 rounded-lg object-cover bg-black/40 border border-white/10" />
                  )}
                  <input
                    type="text"
                    placeholder="Cole a URL ou faça upload acima..."
                    value={calcProdImage.length > 300 ? 'Imagem carregada localmente (Base64)' : calcProdImage}
                    onChange={(e) => {
                      if (!e.target.value.includes('Imagem carregada localmente')) {
                        setCalcProdImage(e.target.value);
                      }
                    }}
                    className="flex-1 bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Peso Peça (g)</label>
                <input
                  type="number"
                  min="1"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  id="calc_weight_qty_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Perda/Suporte (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calcLossPercent}
                  onChange={(e) => setCalcLossPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  id="calc_loss_ratio_input"
                />
              </div>

              <div className="space-y-1 pt-1.5 md:pt-0">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Tempo Imp. (h)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={calcTime}
                  onChange={(e) => setCalcTime(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  id="calc_time_ratio_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Filamento Fatiado</label>
                <select
                  value={calcMaterial}
                  onChange={(e) => setCalcMaterial(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2 py-2 text-xs text-white"
                  id="calc_material_type_select"
                >
                  <option value="PLA">PLA</option>
                  <option value="PETG">PETG</option>
                  <option value="ABS">ABS</option>
                  <option value="TPU">TPU</option>
                </select>
              </div>
            </div>

            {/* Select specific filament from stock to fetch its real roll cost */}
            {selectableFilaments.length > 0 && (
              <div className="p-3 bg-[#0C0E0D] border border-[#232B27] rounded-xl space-y-1">
                <label className="block text-[9px] uppercase tracking-wider text-[#8BA58D] font-bold">Associar Carretel Ativo do Estoque (Custo Real do Rolo)</label>
                <select
                  value={selectedFilamentId}
                  onChange={(e) => setSelectedFilamentId(parseInt(e.target.value) || '')}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-lg px-2 py-1.5 text-xs text-[#F1F4EE]"
                  id="calc_linked_filament_select"
                >
                  {selectableFilaments.map(fil => (
                    <option key={fil.id} value={fil.id}>
                      {fil.type} {fil.color} - R$ {fil.priceRoll.toFixed(2)} por rolo de 1kg (Estoque: {fil.stockGrams}g)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Insumos list with checkbox and quantity selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Insumos Extras do Ateliê (Embalagens/Ferragens/Aditivos)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1" id="precificator-supplies-link">
                {suppliesStocks.length === 0 ? (
                  <p className="text-[10px] text-[#8BA58D] italic">Nenhum insumo cadastrado no estoque físico. Cadastre insumos na aba de Estoque!</p>
                ) : (
                  suppliesStocks.map(sup => {
                    const linked = selectedSuppliesForCalc.find(s => s.supplyId === sup.id);
                    return (
                      <div key={sup.id} className="p-2.5 bg-[#0C0E0D] border border-[#232B27] rounded-xl flex items-center justify-between gap-3 text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!linked}
                            onChange={() => handleToggleSupplyForCalc(sup.id)}
                            className="rounded text-[#95BBA2] focus:ring-[#95BBA2] bg-[#151917] border-[#232B27]"
                          />
                          <span className="text-[#F1F4EE] font-medium block truncate w-24" title={sup.name}>{sup.name}</span>
                        </label>

                        {linked ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="1"
                              value={linked.qty}
                              onChange={(e) => handleUpdateSupplyQtyForCalc(sup.id, parseInt(e.target.value) || 1)}
                              className="w-9 bg-[#151917] border border-[#232B27] rounded py-0.5 text-center text-white text-[10.5px]"
                            />
                            <span className="text-[#8BA58D]/70 font-mono text-[9px]">un(s)</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8BA58D] font-mono shrink-0">R$ {sup.unitCost.toFixed(2)}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Commissions, markup and hours wage */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-[#0C0E0D]/40 p-3.5 border border-[#232B27] rounded-2xl">
              <div className="space-y-1">
                <label className="block text-[9px] text-[#8BA58D] uppercase font-bold">Mão de Obra (R$/h)</label>
                <input
                  type="number"
                  value={calcLaborHour}
                  onChange={(e) => setCalcLaborHour(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white"
                  id="calc_labor_hourly_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-[#8BA58D] uppercase font-bold">Lucro (% Desejada)</label>
                <input
                  type="number"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white"
                  id="calc_profit_desired_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-amber-500 uppercase font-bold">Taxa Fixa ($ Mkt)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcFixedFee}
                  onChange={(e) => setCalcFixedFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white"
                  id="calc_fixed_fee_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-amber-500 uppercase font-bold">Taxa % Mkt</label>
                <input
                  type="number"
                  step="1"
                  value={calcPercentFee}
                  onChange={(e) => setCalcPercentFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white"
                  id="calc_percent_fee_input"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-emerald-400 uppercase font-bold">Publicidade/Ads ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcAdsExpense}
                  onChange={(e) => setCalcAdsExpense(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  id="calc_ads_expense_input"
                />
              </div>
            </div>

          </div>

          {/* Precision Calculation outputs */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Main Precision Card */}
            <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp className="h-28 w-28 text-[#95BBA2]" />
              </div>

              <div className="border-b border-[#232B27] pb-3 z-10 relative">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#E5B242] font-black">Detalhamento Técnico de Preços</span>
                <h3 className="text-base font-bold text-[#F1F4EE] leading-tight">Engenharia Comercial de Custos</h3>
              </div>

              <div className="space-y-2.5 text-xs z-10 relative">
                <div className="flex justify-between items-center py-1 border-b border-[#232B27]/40">
                  <span className="text-[#8BA58D]">Matéria Prima ({calcMaterial}):</span>
                  <span className="font-mono text-[#F1F4EE]">{targetWeightWithLoss.toFixed(1)}g = <strong className="text-white">R$ {rawMaterialCost.toFixed(2)}</strong></span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#232B27]/40">
                  <span className="text-[#8BA58D]">Consumo Energia ({electricityKwhUsed.toFixed(2)} kWh):</span>
                  <span className="font-mono text-[#F1F4EE]">R$ {electricityCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#232B27]/40">
                  <span className="text-[#8BA58D]">Mão de Obra Direta ({calcTime} horas):</span>
                  <span className="font-mono text-[#F1F4EE]">R$ {laborCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#232B27]/40">
                  <span className="text-[#8BA58D]">Insumos Acoplados ({selectedSuppliesForCalc.length} itens):</span>
                  <span className="font-mono text-[#F1F4EE]">R$ {extraSuppliesCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#232B27]/40">
                  <span className="text-[#8BA58D]">Publicidade & Tráfego (Ads):</span>
                  <span className="font-mono text-[#F1F4EE]">R$ {calcAdsExpense.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-black/30 rounded-xl">
                  <span className="text-xs text-[#8BA58D] font-bold uppercase tracking-wider">Custo de Fabricação Direto:</span>
                  <span className="font-mono text-xs font-black text-[#F1F4EE]">R$ {directMachineCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#151917]">
                  <span className="text-[#8BA58D] italic">Comissão do Canal Marketplace ({calcPercentFee}% + R$ {calcFixedFee.toFixed(2)}):</span>
                  <span className="font-mono text-red-400">R$ {commissionPaidToMarketplace.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-[#95BBA2] font-semibold">Lucro Líquido Real Esperado:</span>
                  <span className="font-mono text-[#95BBA2] font-extrabold text-[13px]">R$ {netEarningsProfit.toFixed(2)}</span>
                </div>
              </div>

              {/* Big price tags box */}
              <div className="p-4 bg-[#E5B242]/5 border border-[#E5B242]/20 rounded-2xl space-y-2 z-10 relative text-center">
                <span className="text-[9px] uppercase tracking-wider text-[#E5B242] font-black block">Preço de Venda Final Sugerido</span>
                <p className="text-3xl font-black text-white font-mono">
                  R$ {finalPriceSuggested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-[#8BA58D]">
                  Utilize esta tag nos anúncios reais do e-commerce para garantir sua margem líquida inteira de {calcMargin}% mesmo pagando as tarifas!
                </p>
              </div>

              {/* Action and Register Button */}
              <button
                onClick={handleSaveToCatalog}
                className="w-full py-3 bg-[#E5B242] hover:bg-[#F5C75A] text-[#0C0E0D] text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                id="btn_register_product_to_catalog"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                Registrar no Catálogo de Vendas
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 2: CATALOG PORTFOLIO & PDF DOWNLOAD */}
      {activeSubTab === 'CATALOG' && (
        <div className="space-y-4 animate-fade-in" id="portfolio-catalog-panel">

          {/* PAINEL DE CONFIGURAÇÃO E COMPARTILHAMENTO DO SITE DE VENDAS ONLINE */}
          <div className="p-5 bg-gradient-to-b from-[#121614] to-[#0A0D0B] border border-[#232B27] rounded-3xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 h-32 w-32 bg-[#95BBA2]/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232B27]/40 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest text-[#95BBA2] uppercase font-mono px-2.5 py-0.5 bg-[#95BBA2]/10 border border-[#95BBA2]/20 rounded-full inline-block">
                  🌐 INTEGRAÇÃO COM SEU SITE EXTERNO PRÓPRIO
                </span>
                <h4 className="text-sm font-black text-white">Configuração de Pedidos & API do Catálogo</h4>
                <p className="text-xs text-[#8BA58D]">Como o seu site será desenvolvido externamente de forma terceirizada, configure abaixo o número de celular comercial para sincronizar pedidos de cotação.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp setup */}
              <div className="space-y-2 bg-[#151917] p-4 border border-[#232B27]/60 rounded-2xl flex flex-col justify-between">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#8BA58D]">WhatsApp para Recebimento de Cotações</label>
                  <p className="text-[9.5px] text-[#8BA58D] mb-2 leading-tight">DDD + Número de celular (ex: 419988887777). Seu site externo poderá usar este número para envio direto dos pedidos!</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 41991234567"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-[#0A0D0B] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-700 outline-none font-sans"
                  />
                  <button
                    onClick={handleSaveWhatsapp}
                    className="px-3.5 py-1.5 bg-[#9dcdb4] text-black font-black text-xs rounded-xl cursor-pointer hover:bg-white select-none transition shrink-0"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {/* API Integration Instruction */}
              <div className="space-y-2 bg-[#151917] p-4 border border-[#232B27]/60 rounded-2xl flex flex-col justify-between font-sans">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-amber-400">💡 Como Integrar Seu Site Profissional Extra</label>
                  <p className="text-[9.5px] text-[#8BA58D] leading-relaxed">
                    Sua tabela de preços e catálogo de itens cadastrados no app ficam guardados de forma segura e estruturada comercialmente. Seus desenvolvedores externos podem puxar e ler sua lista de itens inteira em formato JSON bastando acessar a aba de <strong>Configurações do App</strong> e clicando em exportar banco de dados.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-[#151917] border border-[#232B27] rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#F1F4EE] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#95BBA2]" />
                Catálogo de Peças & Produtos Registrados
              </h3>
              <p className="text-xs text-[#8BA58D]">Visualize e compartilhe sua tabela comercial indexável de serviços 3D</p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setShowAddProductManualForm(!showAddProductManualForm)}
                className="px-4 py-2 bg-[#95BBA2]/15 hover:bg-[#95BBA2]/30 text-[#95BBA2] text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-[#95BBA2]/25"
                id="btn_open_manual_add_catalog"
              >
                <Plus className="h-4 w-4" />
                Novo Produto Manual
              </button>

              <button
                onClick={handleExportCatalogPDF}
                className="px-4 py-2 bg-[#637E55] hover:bg-[#536B47] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                id="btn_export_catalog_pdf"
              >
                <Download className="h-4 w-4" />
                Baixar Catálogo PDF
              </button>

              <button
                onClick={handleCopyCatalogToClipboard}
                className="px-4 py-2 bg-gradient-to-r from-purple-900/40 to-purple-850/40 hover:from-purple-900/50 hover:to-purple-850/50 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                id="btn_copy_catalog_text"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                Copiar Catálogo p/ WhatsApp
              </button>
            </div>
          </div>

          {showAddProductManualForm && (
            <form onSubmit={handleSaveManualProduct} className="p-5 bg-[#151917] border border-[#232B27] rounded-2xl space-y-4 animate-fade-in" id="manual_catalog_product_form">
              <div className="flex items-center justify-between border-b border-[#232B27]/40 pb-2">
                <h4 className="text-sm font-bold text-[#E5B242] uppercase flex items-center gap-1.5" style={{ color: editingProduct ? '#E5B242' : '#95BBA2' }}>
                  <Edit3 className="h-4 w-4" />
                  {editingProduct ? `Editar Produto: ${editingProduct.name}` : 'Cadastrar Novo Produto Manualmente'}
                </h4>
                <button
                  type="button"
                  onClick={editingProduct ? handleCancelEditProduct : () => setShowAddProductManualForm(false)}
                  className="text-xs text-[#8BA58D] hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Suporte Organizador de Mesa"
                    value={manualProdName}
                    onChange={(e) => setManualProdName(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold font-mono">Duração de Impressão (h)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={manualProdTime}
                    onChange={(e) => setManualProdTime(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold font-mono">Peso Fatiado (g)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualProdWeight}
                    onChange={(e) => setManualProdWeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Material Utilizado</label>
                  <select
                    value={manualProdMaterial}
                    onChange={(e) => setManualProdMaterial(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2 py-2 text-xs text-white"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                    <option value="MULTICOLOR">MULTICOLOR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Cor Utilizada</label>
                  <input
                    type="text"
                    placeholder="Ex: Bronze Metálico"
                    value={manualProdColor}
                    onChange={(e) => setManualProdColor(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Código SKU / Identificação</label>
                  <input
                    type="text"
                    placeholder="Ex: ORG-002"
                    value={manualProdCode}
                    onChange={(e) => setManualProdCode(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold font-mono">Preço de Venda Final (R$)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={manualProdPrice}
                    onChange={(e) => setManualProdPrice(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[#232B27]/20">
                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Estoque Inicial (Pronta Entrega)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={manualProdStock}
                    onChange={(e) => setManualProdStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Estoque de Segurança Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={manualProdMinStock}
                    onChange={(e) => setManualProdMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Image url/presets */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-[10px] text-[#8BA58D] uppercase font-bold">Foto do Produto (Visualização no Catálogo)</label>
                  
                  {/* File Upload Input */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] bg-[#95BBA2]/15 text-[#95BBA2] hover:bg-[#95BBA2]/30 px-2.5 py-1 rounded-lg border border-[#95BBA2]/25 cursor-pointer font-bold select-none transition">
                      📂 Fazer Upload de Imagem
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setManualProdImage)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] text-[#8BA58D] font-mono block">Imagens Existentes no Estoque / Referências de Cadastro:</span>
                  {stockImagesList.length === 0 ? (
                    <p className="text-[10px] text-[#8BA58D]/60 italic bg-black/10 p-2.5 rounded-xl border border-[#232B27]/40">
                      Nenhuma foto cadastrada no banco de dados ainda. Faça upload de uma foto usando o botão de upload acima!
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {stockImagesList.slice(0, 16).map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setManualProdImage(preset.url)}
                          className={`p-1 border rounded-lg bg-[#0C0E0D] hover:border-[#95BBA2] transition text-left cursor-pointer flex flex-col items-center justify-center gap-1 ${manualProdImage === preset.url ? 'border-[#E5B242] ring-1 ring-[#E5B242]' : 'border-[#232B27]'}`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <span className="text-[8px] text-[#8BA58D] text-center w-full truncate font-mono">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#8BA58D] font-medium block">Imagem Atual Selecionada (Preview / URL):</span>
                  <div className="flex gap-2 items-center">
                    {manualProdImage && (
                      <img src={manualProdImage} alt="Preview" referrerPolicy="no-referrer" className="h-8 w-8 rounded-lg object-cover bg-black/40 border border-white/10" />
                    )}
                    <input
                      type="text"
                      placeholder="Cole a URL ou faça upload acima..."
                      value={manualProdImage.length > 300 ? 'Imagem carregada localmente (Base64)' : manualProdImage}
                      onChange={(e) => {
                        if (!e.target.value.includes('Imagem carregada localmente')) {
                          setManualProdImage(e.target.value);
                        }
                      }}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* ADVANCED MULTIMATERIAL RECIPE, HARDWARE AND STL CONFIG (Atualização v3.2.2.8) */}
              <div className="p-4 bg-black/40 border border-[#232B27] rounded-2xl space-y-4">
                <span className="text-[10px] font-mono font-bold tracking-wider text-teal-400 block uppercase">
                  ⚙️ Ficha Técnica do Produto (Multimaterial, Insumos e Arquivo STL)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filaments Section */}
                  <div className="space-y-3 bg-[#151917]/20 p-3 rounded-xl border border-[#232B27]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        🧵 Bobinas de Filamento Gastos
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Multimaterial</span>
                    </div>

                    {/* Inline Form to Add a Filament */}
                    <div className="flex gap-1.5 items-end">
                      <div className="flex-1 space-y-0.5">
                        <label className="text-[9px] text-[#8BA58D]">Selecionar Bobina</label>
                        <select
                          id="filament_add_recipe_select"
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                        >
                          <option value="">-- Selecione --</option>
                          {filamentStocks.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.type} {f.color} ({f.stockGrams}g rest.)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-16 space-y-0.5">
                        <label className="text-[9px] text-[#8BA58D]">Gramas</label>
                        <input
                          type="number"
                          id="filament_add_recipe_weight"
                          placeholder="e.g. 50"
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2 py-1 text-[11px] text-white font-mono outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById('filament_add_recipe_select') as HTMLSelectElement;
                          const weightEl = document.getElementById('filament_add_recipe_weight') as HTMLInputElement;
                          const fid = parseInt(selectEl?.value || '');
                          const grams = parseInt(weightEl?.value || '');
                          if (!fid || !grams || grams <= 0) {
                            alert('Selecione uma bobina válida e informe a quantidade de gramas.');
                            return;
                          }
                          const alreadyAdded = manualProdFilaments.some(f => f.filamentStockId === fid);
                          if (alreadyAdded) {
                            alert('Este filamento já foi inserido na receita deste produto.');
                            return;
                          }
                          setManualProdFilaments(prev => [...prev, { filamentStockId: fid, weightGrams: grams }]);
                          if (weightEl) weightEl.value = '';
                          if (selectEl) selectEl.value = '';
                        }}
                        className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-black font-bold text-[10px] rounded-lg transition"
                      >
                        Add
                      </button>
                    </div>

                    {/* Array visual preview list */}
                    <div className="space-y-1 pt-1">
                      {manualProdFilaments.length === 0 ? (
                        <span className="text-[10px] text-[#8BA58D] italic block text-center py-2">
                          Nenhum filamento na receita (usará o material padrão acima).
                        </span>
                      ) : (
                        manualProdFilaments.map(item => {
                          const actualFil = filamentStocks.find(f => f.id === item.filamentStockId);
                          const cStyle = actualFil ? getHexColorByName(actualFil.color) : null;
                          return (
                            <div key={item.filamentStockId} className="flex justify-between items-center text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-[#232B27]">
                              <span className="text-white truncate flex items-center gap-1.5">
                                {cStyle && (
                                  <span 
                                    className="w-2 h-2 rounded-full inline-block shrink-0" 
                                    style={{ 
                                      backgroundColor: cStyle.bg, 
                                      border: cStyle.bg === 'transparent' ? `1.2px solid ${cStyle.border}` : `1px solid ${cStyle.border}`
                                    }} 
                                  />
                                )}
                                {actualFil ? `${actualFil.type} ${actualFil.color}` : 'Filamento Desconhecido'}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-emerald-400 font-bold">{item.weightGrams}g</span>
                                <button
                                  type="button"
                                  onClick={() => setManualProdFilaments(prev => prev.filter(f => f.filamentStockId !== item.filamentStockId))}
                                  className="text-red-400 hover:text-red-500 font-bold px-1 cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Supplies/Hardware Section */}
                  <div className="space-y-3 bg-[#151917]/20 p-3 rounded-xl border border-[#232B27]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        ⚙️ Insumos & Hardware Usados
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Embalagens, Bicos, Parafusos</span>
                    </div>

                    {/* Inline Form to Add a Supply */}
                    <div className="flex gap-1.5 items-end">
                      <div className="flex-1 space-y-0.5">
                        <label className="text-[9px] text-[#8BA58D]">Selecionar Item</label>
                        <select
                          id="supply_add_recipe_select"
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                        >
                          <option value="">-- Selecione --</option>
                          {suppliesStocks.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} (R$ {s.unitCost.toFixed(2)}/un)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-14 space-y-0.5">
                        <label className="text-[9px] text-[#8BA58D]">Qtd</label>
                        <input
                          type="number"
                          id="supply_add_recipe_qty"
                          placeholder="e.g. 1"
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2 py-1 text-[11px] text-white font-mono outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById('supply_add_recipe_select') as HTMLSelectElement;
                          const qtyEl = document.getElementById('supply_add_recipe_qty') as HTMLInputElement;
                          const sid = parseInt(selectEl?.value || '');
                          const qty = parseInt(qtyEl?.value || '');
                          if (!sid || !qty || qty <= 0) {
                            alert('Selecione um insumo e informe uma quantidade válida.');
                            return;
                          }
                          const alreadyAdded = manualProdSupplies.some(s => s.supplyStockId === sid);
                          if (alreadyAdded) {
                            alert('Este insumo já foi adicionado.');
                            return;
                          }
                          setManualProdSupplies(prev => [...prev, { supplyStockId: sid, quantity: qty }]);
                          if (qtyEl) qtyEl.value = '';
                          if (selectEl) selectEl.value = '';
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded-lg transition"
                      >
                        Add
                      </button>
                    </div>

                    {/* Array visual preview list */}
                    <div className="space-y-1 pt-1">
                      {manualProdSupplies.length === 0 ? (
                        <span className="text-[10px] text-[#8BA58D] italic block text-center py-2">
                          Nenhum insumo ou hardware agregado a esta peça.
                        </span>
                      ) : (
                        manualProdSupplies.map(item => {
                          const actualSup = suppliesStocks.find(s => s.id === item.supplyStockId);
                          return (
                            <div key={item.supplyStockId} className="flex justify-between items-center text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-[#232B27]">
                              <span className="text-white truncate">
                                📦 {actualSup ? actualSup.name : 'Insumo Desconhecido'}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-amber-400 font-bold">{item.quantity} un</span>
                                <button
                                  type="button"
                                  onClick={() => setManualProdSupplies(prev => prev.filter(s => s.supplyStockId !== item.supplyStockId))}
                                  className="text-red-400 hover:text-red-500 font-bold px-1 cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* STL FILE UPLOADER COMPONENT (Drag and Drop / Traditional Picker) */}
                <div className="p-4 bg-gradient-to-r from-purple-950/20 to-[#0C0E0D] border border-[#232B27] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                      📐 Arquivo STL 3D do Modelo
                    </span>
                    <span className="text-[9px] font-mono tracking-widest text-[#8BA58D] uppercase">Slicing Preview Prep</span>
                  </div>

                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition select-none ${manualStlFileName ? 'border-purple-500/50 bg-purple-500/5' : 'border-[#232B27] hover:border-purple-500/30 hover:bg-purple-950/5'}`}
                      id="stl-drag-and-drop-container"
                    >
                      <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center px-4">
                        <FileCode className={`h-7 w-7 mb-1.5 ${manualStlFileName ? 'text-purple-400 animate-bounce' : 'text-[#8BA58D]'}`} />
                        {manualStlFileName ? (
                          <>
                            <p className="text-xs text-white font-bold truncate max-w-sm">{manualStlFileName}</p>
                            <p className="text-[9px] text-[#8BA58D] font-mono mt-0.5">({manualStlFileData || 'Pronto para impressão'})</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-white">Arraste ou clique para carregar o arquivo .STL</p>
                            <p className="text-[10px] text-[#8BA58D]">Formatos industriais 3D suportados</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".stl"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 25 * 1024 * 1024) {
                              alert('Seu arquivo STL excede o limite recomendado de 25MB.');
                            }
                            setManualStlFileName(file.name);
                            setManualStlFileData(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEditProduct}
                    className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-red-500/20"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#95BBA2] hover:bg-[#B6D8B4] text-[#0C0E0D] font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {editingProduct ? 'Salvar Edição ✓' : 'Confirmar Cadastro no Catálogo ✓'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="catalog-products-cards-grid">
            {catalogItems.length === 0 ? (
              <div className="p-12 text-center text-[#8BA58D] col-span-full border border-dashed border-[#232B27] bg-[#151917]/20 rounded-2xl">
                <BookOpen className="h-12 w-12 text-[#8BA58D]/30 mx-auto mb-3" />
                <p className="text-xs font-bold">Nenhum produto cadastrado no catálogo.</p>
                <p className="text-[11px] mt-1 text-[#8BA58D]/70">Utilize a Calculadora de Preço de Produtos ao lado para fatiar, precificar e salvar itens aqui!</p>
              </div>
            ) : (
              catalogItems.map((item) => (
                <div key={item.id} className="p-4 bg-[#151917] border border-[#232B27] rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Product picture */}
                    <div className="h-28 w-full bg-[#0C0E0D] border border-[#232B27]/40 rounded-xl overflow-hidden relative flex items-center justify-center">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=300&auto=format&fit=crop&q=60'}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition duration-350 hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[9px] font-mono font-black tracking-widest text-[#E5B242] bg-[#E5B242]/10 px-2 py-0.5 rounded border border-[#E5B242]/20">
                        {item.productCode || 'PROD'}
                      </span>
                      {item.filamentType !== 'HARDWARE' && (
                        <span className="text-[9px] font-bold text-[#95BBA2]">
                          POLÍMERO: {item.filamentType}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#F1F4EE] truncate">{item.name}</h4>
                    <p className="text-[11px] text-[#8BA58D] leading-relaxed line-clamp-2">
                      {item.description || 'Nenhuma descrição declarada.'}
                    </p>

                    <div className="grid grid-cols-3 gap-1 bg-[#0C0E0D]/40 p-2 border border-[#232B27]/40 rounded-xl text-center text-[10.5px]">
                      <div className="flex flex-col justify-center">
                        <span className="text-[8px] text-[#8BA58D] uppercase font-bold block">Peso</span>
                        <span className="font-mono text-white font-medium">{item.weightGrams}g</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[8px] text-[#8BA58D] uppercase font-bold block">Tempo</span>
                        <span className="font-mono text-white font-medium">{item.printTimeHours}h</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] text-[#8BA58D] uppercase font-bold block">Pronta Entr.</span>
                        <div className="flex items-center gap-1 mt-0.5 justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogItems(prev => prev.map(c => c.id === item.id ? { ...c, stockCount: Math.max(0, c.stockCount - 1) } : c))
                            }}
                            className="w-4 h-4 bg-[#0C0E0D] border border-[#232B27] rounded text-[#8BA58D] flex items-center justify-center text-[10px] font-bold hover:border-red-400/50 hover:text-red-400 transition cursor-pointer"
                            title="Remover 1 unidade"
                          >
                            -
                          </button>
                          <span className="font-mono text-white font-bold px-0.5">{item.stockCount}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogItems(prev => prev.map(c => c.id === item.id ? { ...c, stockCount: c.stockCount + 1 } : c))
                            }}
                            className="w-4 h-4 bg-[#0C0E0D] border border-[#232B27] rounded text-[#8BA58D] flex items-center justify-center text-[10px] font-bold hover:border-[#95BBA2]/50 hover:text-[#95BBA2] transition cursor-pointer"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Multimaterial & STL view badges */}
                    {(item.filamentsUsed || item.suppliesUsed || item.stlFileName) && (
                      <div className="bg-[#0C0E0D]/60 p-2 rounded-xl space-y-1.5 border border-[#232B27]/30">
                        {item.filamentsUsed && item.filamentsUsed.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[8px] text-[#8BA58D] uppercase font-bold block">Filamentos Receita:</span>
                            <div className="flex flex-wrap gap-1 text-[9px]">
                              {item.filamentsUsed.map((f, idx) => {
                                const st = filamentStocks.find(x => x.id === f.filamentStockId);
                                const cStyle = st ? getHexColorByName(st.color) : null;
                                return (
                                  <span key={idx} className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20 font-mono flex items-center gap-1.5 inline-flex">
                                    {cStyle && (
                                      <span 
                                        className="w-2 h-2 rounded-full inline-block shrink-0" 
                                        style={{ 
                                          backgroundColor: cStyle.bg, 
                                          border: cStyle.bg === 'transparent' ? `1.2px solid ${cStyle.border}` : `1px solid ${cStyle.border}`
                                        }} 
                                      />
                                    )}
                                    {st ? `${st.type} ${st.color}` : 'Filamento'} ({f.weightGrams}g)
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {item.suppliesUsed && item.suppliesUsed.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[8px] text-[#8BA58D] uppercase font-bold block">Insumos/Hardware:</span>
                            <div className="flex flex-wrap gap-1 text-[9px]">
                              {item.suppliesUsed.map((s, idx) => {
                                const sup = suppliesStocks.find(x => x.id === s.supplyStockId);
                                return (
                                  <span key={idx} className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
                                    📦 {sup ? sup.name : 'Insumo'} ({s.quantity}x)
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {item.stlFileName && (
                          <div className="pt-1 flex items-center justify-between border-t border-[#232B27]/20">
                            <span className="text-[9px] text-purple-300 font-bold flex items-center gap-1 truncate max-w-[150px]" title={item.stlFileName}>
                              📐 {item.stlFileName}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Arquivo CAD de impressão 3D "${item.stlFileName}" pronto para download! (${item.stlFileData || 'Binário'})`);
                              }}
                              className="text-[8px] bg-purple-500 hover:bg-purple-400 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider transition cursor-pointer"
                            >
                              Baixar .STL
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#232B27]/40 pt-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-black text-[#95BBA2] font-mono">
                      R$ {item.defaultPrice.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCatalogProduct(item)}
                        className="text-amber-400 hover:text-amber-500 hover:bg-amber-500/10 p-1.5 rounded-lg transition"
                        title="Editar Produto"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCatalogProduct(item.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                        title="Deletar Produto do Catálogo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* SUBTAB 3: DOUBLE SECTORS - RAW FILAMENTS AND CONSUMABLE SUPPLIES */}
      {activeSubTab === 'STOCK' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" id="stocks-physical-layout">
          
          {/* Filamentos Stocks */}
          <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232B27] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5">
                  <Disc className="h-4 w-4 text-[#95BBA2]" />
                  Estoque de Carretéis de Filamento
                </h3>
                <p className="text-xs text-[#8BA58D]">Acompanhe suas bobinas ativas</p>
              </div>

              <button
                onClick={() => setShowAddFilamentForm(!showAddFilamentForm)}
                className="px-4 py-2 bg-[#95BBA2] hover:bg-[#b0d8bd] text-[#0C0E0D] font-black text-xs rounded-xl transition-all duration-200 flex items-center gap-1 shadow-[0_0_12px_rgba(149,187,162,0.4)] hover:scale-102 cursor-pointer active:scale-98"
                id="btn-trigger-filament-form"
              >
                <Plus className="h-4 w-4 text-[#0C0E0D] font-extrabold" />
                Novo Carretel
              </button>
            </div>

            {/* Painel de Carretéis e Cores com Valor Médio por Tipo (v3.3.0.4) */}
            <div className="p-3.5 bg-black/50 border border-[#232B27] rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-[#95BBA2] uppercase tracking-wider block">📊 Painel de Carretéis & Cores</span>
              </div>

              {/* Seção de Cores com o número de unidades dentro da bolinha */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#8BA58D] uppercase tracking-wider block">Cores em Estoque (Kilogramas)</span>
                {colorGroups.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic">Nenhuma cor identificada no estoque.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {colorGroups.map((group, idx) => (
                      <div key={idx} className="flex flex-col items-center space-y-1 bg-[#0C0E0D]/60 p-1.5 px-2 rounded-xl border border-[#232B27]/50 min-w-[55px]">
                        {/* Bolinha com a cor e o peso em kg no centro */}
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md"
                          style={{ 
                            backgroundColor: group.bg, 
                            color: group.text, 
                            border: `2px solid ${group.border}`
                          }}
                          title={`${group.originalName}: ${group.totalWeightKg.toFixed(2)} kg em estoque (${group.count} carretel/carretéis)`}
                        >
                          {group.totalWeightKg % 1 === 0 ? group.totalWeightKg.toFixed(0) : group.totalWeightKg.toFixed(1)}
                        </div>
                        {/* Nome da cor resumido */}
                        <span className="text-[8px] font-mono font-black text-zinc-300 text-center truncate max-w-[56px]" title={group.originalName}>
                          {group.originalName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção do Valor Médio por Tipo */}
              <div className="space-y-1.5 pt-1.5 border-t border-[#232B27]/40">
                <span className="text-[9px] font-black text-[#8BA58D] uppercase tracking-wider block">Rolo Médio de 1kg por Tipo de Material</span>
                {typeAverages.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic">Cadastre gastos ou carretéis com preço para ver a média.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {typeAverages.map((avg, idx) => (
                      <div key={idx} className="p-2 bg-[#0C0E0D]/80 border border-emerald-500/10 rounded-lg flex flex-col">
                        <span className="text-[9px] font-mono text-zinc-400 font-bold">{avg.type}</span>
                        <span className="text-[10.5px] font-mono font-black text-emerald-400 leading-tight">
                          R$ {avg.avgPrice.toFixed(2)} <span className="text-[8px] text-[#8BA58D] font-normal">/kg</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showAddFilamentForm && (
              <form onSubmit={handleAddFilament} className="p-3.5 bg-[#0C0E0D] border border-[#232B27] rounded-xl space-y-3">
                <h4 className="text-[10px] font-bold text-[#E5B242] uppercase">Cadastrar Novo Carretel Físico</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Material</label>
                    <select
                      value={fType}
                      onChange={(e) => setFType(e.target.value)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white"
                    >
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Gasto R$ Bobina (1kg)</label>
                    <input
                      type="number"
                      value={fPrice}
                      onChange={(e) => setFPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] text-[#8BA58D]">Cor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Verde Oliva Silk"
                    value={fColor}
                    onChange={(e) => setFColor(e.target.value)}
                    className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Peso Atual (g)</label>
                    <input
                      type="number"
                      value={fStockGrams}
                      onChange={(e) => setFStockGrams(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Mínimo Alerta (g)</label>
                    <input
                      type="number"
                      value={fMinStock}
                      onChange={(e) => setFMinStock(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#95BBA2] hover:bg-[#B6D8B4] text-[#0C0E0D] text-xs font-black rounded-lg transition"
                >
                  Confirmar Cadastro
                </button>
              </form>
            )}

            <div className="space-y-3" id="filament-rolls-listing">
              {[...filamentStocks].sort((a, b) => {
                const lowA = a.stockGrams < a.minStockGrams;
                const lowB = b.stockGrams < b.minStockGrams;
                if (lowA && !lowB) return -1;
                if (!lowA && lowB) return 1;
                return 0;
              }).map(fil => {
                const low = fil.stockGrams < fil.minStockGrams;
                return (
                  <div key={fil.id} className={`p-3 bg-[#0C0E0D] border rounded-xl flex items-center justify-between gap-4 transition-all duration-300 ${
                    low ? 'border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' : 'border-[#232B27]'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const cStyle = getHexColorByName(fil.color);
                          return (
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block" 
                              style={{ 
                                backgroundColor: cStyle.bg, 
                                border: cStyle.bg === 'transparent' ? `1.5px solid ${cStyle.border}` : `1px solid ${cStyle.border}`
                              }} 
                            />
                          );
                        })()}
                        <span className="text-xs font-bold text-white">{fil.type} {fil.color}</span>
                        {low && <span className="text-[7.5px] font-mono uppercase bg-red-400/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse font-black">Estoque Baixo 🚨</span>}
                      </div>

                      <div className="text-[10px] text-[#8BA58D] font-mono">
                        Gramas Restantes: <strong className={low ? 'text-red-400 font-bold' : 'text-white'}>{fil.stockGrams}g</strong> (Mín. {fil.minStockGrams}g)
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReplenishStock(fil.id, fil.stockGrams)}
                        className="px-2.5 py-1.5 bg-[#2a352f] hover:bg-[#3b4c42] text-[#F1F4EE] hover:text-white text-[10px] font-black rounded-lg border border-[#3e4f45] transition cursor-pointer"
                      >
                        Recarregar 🔄
                      </button>
                      <button
                        onClick={() => {
                          onAddShoppingItem({ name: `Rolo Filamento 1kg: ${fil.type} ${fil.color}`, price: fil.priceRoll, isChecked: false });
                          triggerFeedback('Adicionado rolo de filamento ao carrinho!');
                        }}
                        className="p-1.5 text-[#95BBA2] hover:bg-[#95BBA2]/10 rounded-lg"
                        title="Adicionar ao Carrinho"
                      >
                        <ShoppingCart className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFilament(fil.id)}
                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0"
                        title="Excluir do Estoque"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consumable Supplies Stocks */}
          <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232B27] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-[#E5B242]" />
                  Estoque de Insumos & Hardware
                </h3>
                <p className="text-xs text-[#8BA58D]">Acompanhe caixas, componentes e bicos de reposição</p>
              </div>

              <button
                onClick={() => setShowAddSupplyForm(!showAddSupplyForm)}
                className="px-4 py-2 bg-[#E5B242] hover:bg-[#ffd97d] text-[#0C0E0D] font-black text-xs rounded-xl transition-all duration-200 flex items-center gap-1 shadow-[0_0_12px_rgba(229,178,66,0.4)] hover:scale-102 cursor-pointer active:scale-98"
                id="btn-trigger-supply-form"
              >
                <Plus className="h-4 w-4 text-[#0C0E0D] font-extrabold" />
                Novo Insumo
              </button>
            </div>

            {showAddSupplyForm && (
              <form onSubmit={handleAddSupply} className="p-3.5 bg-[#0C0E0D] border border-[#232B27] rounded-xl space-y-3">
                <h4 className="text-[10px] font-bold text-[#E5B242] uppercase">Cadastrar Novo Insumo Comercial</h4>

                <div className="space-y-0.5">
                  <label className="text-[9px] text-[#8BA58D]">Nome do Insumo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Caixa Kraft Correios 16x11x6"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Qtd Estoque</label>
                    <input
                      type="number"
                      value={sCount}
                      onChange={(e) => setSCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Qtd Mínima</label>
                    <input
                      type="number"
                      value={sMinCount}
                      onChange={(e) => setSMinCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D]">Custo Unit. (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sUnitCost}
                      onChange={(e) => setSUnitCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#151917] border border-[#232B27] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#E5B242] hover:bg-yellow-500 text-[#0C0E0D] text-xs font-black rounded-lg transition"
                >
                  Salvar Insumo
                </button>
              </form>
            )}

            <div className="space-y-3" id="supplies-listing">
              {[...suppliesStocks].sort((a, b) => {
                const lowA = a.stockCount < a.minStockCount;
                const lowB = b.stockCount < b.minStockCount;
                if (lowA && !lowB) return -1;
                if (!lowA && lowB) return 1;
                return 0;
              }).map(sup => {
                const low = sup.stockCount < sup.minStockCount;
                return (
                  <div key={sup.id} className={`p-3 bg-[#0C0E0D] border rounded-xl flex items-center justify-between gap-4 transition-all duration-300 ${
                    low ? 'border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' : 'border-[#232B27]'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Box className="h-3.5 w-3.5 text-[#E5B242]" />
                        <span className="text-xs font-bold text-white leading-tight">{sup.name}</span>
                        {low && <span className="text-[7.5px] font-mono uppercase bg-red-400/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse font-black">Estoque Baixo 🚨</span>}
                      </div>

                      <div className="text-[10px] text-[#8BA58D] font-mono">
                        Qtd Disponível: <strong className={low ? 'text-red-400 font-bold' : 'text-white'}>{sup.stockCount} un</strong> (Custo Unit.: R$ {sup.unitCost.toFixed(2)})
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateSupplyQty(sup.id, -1)}
                        className="px-2 py-0.5 bg-[#151917] border border-[#232B27] hover:border-red-400 text-white rounded font-bold text-[11px]"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUpdateSupplyQty(sup.id, 1)}
                        className="px-2 py-0.5 bg-[#151917] border border-[#232B27] hover:border-[#95BBA2] text-white rounded font-bold text-[11px]"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleDeleteSupply(sup.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 4: SHOPPING ITEMS LIST */}
      {activeSubTab === 'SHOP' && (
        <div className="space-y-6 animate-fade-in" id="shopping-tab-panel">
          
          {/* Header of Separation */}
          <div className="p-4 bg-gradient-to-r from-teal-950/20 to-black/40 border border-[#232B27] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 rounded-md">
                  Atualização v3.2.2.8
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#E5B242] font-semibold uppercase px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  Sincronização Ativa 🔄
                </span>
              </div>
              <h3 className="text-sm font-black text-[#F1F4EE] mt-1">Separação de Custos Efetivados vs. Carrinho de Compras</h3>
              <p className="text-xs text-[#8BA58D]">Adicione gastos de materiais usados no trabalho e orçamente a sua lista & carrinho a comprar. Ambos retroalimentam o Dashboard automaticamente.</p>
            </div>
            
            <div className="p-3 bg-black/40 border border-[#232B27] rounded-xl font-mono text-center shrink-0">
              <span className="text-[8.5px] uppercase text-[#8BA58D] block">Despesas Dashboard Total</span>
              <strong className="text-sm text-red-400">
                R$ {(expenses.reduce((sum, e) => sum + (e.amount * e.qty), 0) + shoppingItems.reduce((sum, s) => sum + s.price, 0)).toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMN 1: GASTOS COM MATERIAIS PARA O TRABALHO */}
            <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4">
              <div className="border-b border-[#232B27]/60 pb-3">
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-emerald-400" />
                  1. Gastos com Materiais para Trabalho
                </h4>
                <p className="text-[11px] text-[#8BA58D] leading-tight mt-0.5">Dinheiro efetivamente pago para compra imediata de bobinas, bicos, peças ou energia</p>
              </div>

              {/* Add paid expense Form */}
              <form onSubmit={handleAddExpenseLocal} className="space-y-3 bg-black/30 p-3.5 border border-[#232B27]/80 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase block tracking-wide">Lançar Novo Gasto no Caixa</span>
                
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Refil 1kg PLA Branco GTMax"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D] block">Custo Unitário R$</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 0.0015"
                      value={expenseAmount || ''}
                      onChange={(e) => handleAddExpenseUnitChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] text-amber-400 font-bold block">Custo Total R$</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 120"
                      value={expenseTotalAmount || ''}
                      onChange={(e) => handleAddExpenseTotalChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0C0E0D]/90 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] text-[#8BA58D] block">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={expenseQty}
                    onChange={(e) => handleAddExpenseQtyChange(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5 animate-fade-in">
                    <label className="text-[9px] text-[#8BA58D] block">Categoria do Gasto</label>
                    <select
                      value={expenseCategory}
                      onChange={(e: any) => setExpenseCategory(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono font-medium"
                    >
                      <option value="EMBALAGEM">📦 Embalagens & Caixas</option>
                      <option value="EQUIPAMENTO">⚙️ Impressoras, Peças & Upgrades</option>
                      <option value="ENERGIA">⚡ Infraestrutura & Energia</option>
                      <option value="FERRAMENTAS">🛠️ Ferramentas & Acessórios</option>
                      <option value="HARDWARE">🔩 Ferragens & Fixadores</option>
                      <option value="SERVICOS">💻 Serviços & Softwares</option>
                      <option value="MARKETING">📣 Anúncios & Tráfego</option>
                      <option value="IMPOSTOS">💸 Impostos & Taxas</option>
                      <option value="FILAMENTO">🧵 Filamentos (Estoque)</option>
                      <option value="ACESSORIO_INSUMO">🔧 Insumos & Acessórios (Estoque)</option>
                      <option value="OUTROS">🏷️ Outros Gerais</option>
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] text-[#8BA58D] block">Fornecedor / Origem</label>
                    <select
                      value={expenseSupplier}
                      onChange={(e) => {
                        setExpenseSupplier(e.target.value);
                        if (e.target.value !== 'OUTRO') {
                          setExpenseCustomSupplier('');
                        }
                      }}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono font-medium"
                    >
                      <option value="Amazon">Amazon</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Mercado Livre">Mercado Livre</option>
                      <option value="AliExpress">AliExpress</option>
                      <option value="Temu">Temu</option>
                      <option value="OUTRO">Outro Fornecedor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] text-[#8BA58D] block">Mês do Gasto (Competência/Referência)</label>
                  <input
                    type="month"
                    required
                    value={expenseMonth}
                    onChange={(e) => setExpenseMonth(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono font-medium"
                  />
                </div>

                {expenseSupplier === 'OUTRO' && (
                  <div className="space-y-0.5 animate-fade-in">
                    <label className="text-[9px] text-[#8BA58D] block">Nome do Outro Fornecedor</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 3D Lab, Voolt3D, etc."
                      value={expenseCustomSupplier}
                      onChange={(e) => setExpenseCustomSupplier(e.target.value)}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                )}

                {/* CONFIGURAÇÃO EXCLUSIVA DE ESTOQUE INTEGRADO COM GASTOS */}
                {(expenseCategory === 'FILAMENTO' || expenseCategory === 'ACESSORIO_INSUMO') && (
                  <div className="p-3 bg-[#1d2621]/45 border border-[#2c3d31] rounded-xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1 font-mono">
                        📥 Integração com Estoque Físico
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stockSendToInventory}
                          onChange={(e) => setStockSendToInventory(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-black"></div>
                        <span className="ml-1.5 text-[8.5px] font-mono text-[#8BA58D]">Ativar</span>
                      </label>
                    </div>

                    {stockSendToInventory && (
                      <div className="space-y-2.5 animate-fade-in border-t border-[#232B27]/60 pt-2">
                        {expenseCategory === 'FILAMENTO' ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <label className="text-[8px] text-[#8BA58D] block">Tipo de Filamento</label>
                                <select
                                  value={stockFilamentType}
                                  onChange={(e) => setStockFilamentType(e.target.value)}
                                  className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                                >
                                  <option value="PLA">PLA</option>
                                  <option value="PETG">PETG</option>
                                  <option value="ABS">ABS</option>
                                  <option value="TPU">TPU</option>
                                  <option value="SILK">SILK</option>
                                  <option value="METÁLICO">METÁLICO</option>
                                  <option value="Outro">Outro</option>
                                </select>
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] text-[#8BA58D] block">Cor do Filamento</label>
                                <input
                                  type="text"
                                  required={expenseCategory === 'FILAMENTO'}
                                  placeholder="Ex: Preto Matte"
                                  value={stockFilamentColor}
                                  onChange={(e) => setStockFilamentColor(e.target.value)}
                                  className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <label className="text-[8px] text-[#8BA58D] block">Peso por Bobina (g)</label>
                                <input
                                  type="number"
                                  value={stockFilamentWeight}
                                  onChange={(e) => setStockFilamentWeight(parseInt(e.target.value) || 1000)}
                                  className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] text-[#8BA58D] block">Alerta Mínimo (g)</label>
                                <input
                                  type="number"
                                  value={stockFilamentMinAlert}
                                  onChange={(e) => setStockFilamentMinAlert(parseInt(e.target.value) || 200)}
                                  className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                                />
                              </div>
                            </div>
                            <p className="text-[8px] text-amber-400 font-mono leading-normal">
                              📝 Adicionará {expenseQty || 1} bobina(s) de {stockFilamentWeight}g ao estoque.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="space-y-0.5">
                              <label className="text-[8.5px] text-[#8BA58D] block">Estoque Crítico Alerta (Unidades)</label>
                              <input
                                type="number"
                                min="1"
                                value={stockSupplyMinAlert}
                                onChange={(e) => setStockSupplyMinAlert(parseInt(e.target.value) || 1)}
                                className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-xs text-white rounded-lg outline-none font-mono"
                              />
                            </div>
                            <p className="text-[8px] text-amber-400 font-mono leading-normal">
                              📝 Adicionará o insumo "{expenseDesc || 'Sem Nome'}" com {expenseQty || 1} peça(s) no estoque ativo.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[8px] text-[#8BA58D]/70 font-mono leading-normal mt-1">
                  💡 Cadastrar itens aqui como Filamento ou Insumo atualizará seus estoques físicos instantaneamente.
                </p>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Confirmar Pagamento de Custo
                </button>
              </form>

              {/* Relatórios & Filtro de Caixa (v3.3.0.4) */}
              <div className="p-3.5 bg-black/40 border border-[#232B27] rounded-xl space-y-2 flex flex-col">
                <span className="text-[9.5px] font-mono font-black text-[#95BBA2] uppercase tracking-wider block">📊 Relatórios & Filtro por Período</span>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-0.5">
                    <select
                      value={selectedFilterMonth}
                      onChange={(e) => setSelectedFilterMonth(e.target.value)}
                      className="w-full h-[32px] bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2 py-1 text-xs text-white outline-none font-mono font-medium"
                    >
                      <option value="ALL">🗓️ Todos os Meses</option>
                      {Array.from(new Set([expenseMonth, ...expenses.map(e => e.month).filter(Boolean)] as string[]))
                        .sort().reverse().map(m => (
                          <option key={m} value={m}>
                            {formatExpenseMonth(m)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportExpensesPDF}
                    className="h-[32px] px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 hover:border-red-500/45 text-[11px] font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Exportar Relatório PDF"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleShareExpensesWhatsApp}
                    className="h-[32px] px-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/45 text-[11px] font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Compartilhar no WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Zap
                  </button>
                </div>
              </div>

              {/* List of expenses */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredExpenses.length === 0 ? (
                  <div className="p-8 text-center text-[#8BA58D] border border-dashed border-[#232B27]/40 rounded-xl bg-[#151917]/20">
                    <p className="text-xs italic font-mono">Nenhum gasto lançado para este período.</p>
                  </div>
                ) : (
                  [...filteredExpenses].reverse().map(item => (
                    <div key={item.id} className="p-3 bg-[#0C0E0D] border border-[#232B27]/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/20 transition-colors duration-200">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[8.5px] font-mono font-black bg-[#95BBA2]/10 border border-[#95BBA2]/25 px-2 py-0.5 rounded text-[#95BBA2]">
                            {getExpenseCategoryLabel(item.category)}
                          </span>
                          {item.supplier && (
                            <span className="text-[8.5px] font-mono font-black bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded text-amber-300">
                              🛒 {item.supplier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white leading-tight mt-1">{item.description}</div>
                         <div className="text-[9px] text-[#8BA58D] font-mono">
                          {item.qty} x R$ {formatPriceWithDynamicDecimals(item.amount)} — {new Date(item.date).toLocaleDateString('pt-BR')} {item.month ? `[Ref: ${formatExpenseMonth(item.month)}]` : `[Ref: ${formatExpenseMonth(new Date(item.date).toISOString().substring(0, 7))}]`}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-3 border-t border-zinc-800/50 pt-2 sm:border-0 sm:pt-0 w-full sm:w-auto">
                        <span className="text-sm font-black font-mono text-red-400">
                          R$ {formatPriceWithDynamicDecimals(item.amount * item.qty)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditExpense(item)}
                            className="text-amber-400 hover:text-amber-500 p-1.5 rounded hover:bg-amber-500/10 transition cursor-pointer"
                            title="Editar Gasto"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(item.id)}
                            className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-red-500/10 transition cursor-pointer"
                            title="Excluir Gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Expenses Subtotal */}
              <div className="p-4 bg-black/40 border border-emerald-500/20 rounded-xl text-center">
                <span className="text-[8.5px] uppercase tracking-wider text-emerald-400 font-bold block">Total Efetivado no Período Selecionado</span>
                <p className="text-xl font-bold font-mono text-white">
                  R$ {filteredExpenses.reduce((sum, e) => sum + (e.amount * e.qty), 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* COLUMN 2: LISTA A COMPRAR (CARRINHO) */}
            <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4">
              <div className="border-b border-[#232B27]/60 pb-3">
                <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-amber-400" />
                  2. Lista de Compras / Carrinho a Comprar
                </h4>
                <p className="text-[11px] text-[#8BA58D] leading-tight mt-0.5">Orçamentação rápida de bicos de latão, filamentos para repor estoque e insumos</p>
              </div>

              {/* Quick list controller form */}
              <form onSubmit={handleAddShopping} className="flex gap-2" id="shopping-item-page-form">
                <input
                  type="text"
                  required
                  placeholder="Ex: Nozzle Latão 0.6mm Creality"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none flex-1"
                />
                <input
                  type="number"
                  placeholder="R$ Preço"
                  value={shopPrice || ''}
                  onChange={(e) => setShopPrice(parseFloat(e.target.value) || 0)}
                  className="bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none w-24 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0C0E0D] font-extrabold text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Adicionar
                </button>
              </form>

              {/* Shopping items list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {shoppingItems.length === 0 ? (
                  <div className="p-8 text-center text-[#8BA58D] border border-dashed border-[#232B27]/60 rounded-xl space-y-1">
                    <ShoppingCart className="h-10 w-10 text-[#8BA58D]/30 mx-auto" />
                    <p className="text-xs font-bold italic">Seu carrinho de compras está limpo.</p>
                  </div>
                ) : (
                  shoppingItems.map(item => (
                    <div key={item.id} className="p-3 bg-[#0C0E0D] border border-[#232B27]/80 rounded-xl flex items-center justify-between gap-4">
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.isChecked}
                          onChange={() => onToggleShoppingItem(item.id)}
                          className="rounded border-[#232B27] text-amber-500 focus:ring-amber-500 bg-[#151917] h-4 w-4"
                        />
                        <span className={`text-xs ${item.isChecked ? 'line-through text-[#8BA58D] opacity-60' : 'text-white font-medium'}`}>
                          {item.name}
                        </span>
                      </label>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-[#8BA58D]">R$ {item.price.toFixed(2)}</span>
                        <button
                          onClick={() => onDeleteShoppingItem(item.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/5 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Shopping summary card */}
              <div className="p-4 bg-black/40 border border-amber-500/20 rounded-xl text-center space-y-1">
                <span className="text-[8.5px] uppercase tracking-wider text-amber-400 font-bold block">Orçamento de Itens a Adquirir</span>
                <p className="text-xl font-bold font-mono text-white">
                  R$ {shoppingItems.reduce((acc, s) => acc + s.price, 0).toFixed(2)}
                </p>
                <div className="text-[9.5px] text-[#8BA58D] font-mono flex justify-center gap-3">
                  <span>Adquirido: <strong className="text-emerald-400 font-black">R$ {shoppingItems.filter(s => s.isChecked).reduce((sum, s) => sum + s.price, 0).toFixed(2)}</strong></span>
                  <span>Restante: <strong className="text-orange-400 font-black">R$ {shoppingItems.filter(s => !s.isChecked).reduce((sum, s) => sum + s.price, 0).toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 4.5: GOOGLE SHOPPING QUOTATIONS & MATERIAL MINIMUM PRICES */}
      {activeSubTab === 'QUOTE' && (
        <div className="space-y-6 animate-fade-in" id="quotations-view-container">
          {/* Header Description */}
          <div className="p-5 bg-gradient-to-r from-[#17211B] to-[#121A15] border border-[#232B27] rounded-xl sm:rounded-2xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-[0.08] pointer-events-none select-none">
              <TrendingUp className="h-28 w-28 text-[#E2B144]" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 w-full">
              <div className="space-y-1.5 max-w-2xl">
                <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-2.5 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">PREÇOS DA INTERNET EM TEMPO REAL</span>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  Comparador Multi-Marketplaces &amp; Configuração de Alertas 🤖
                </h3>
                <p className="text-xs text-[#8BA58D] leading-relaxed">
                  O Gestão 3D monitora em tempo real os 5 melhores preços da internet conectando-se diretamente ao Google Shopping. Defina seu valor mínimo ideal: se detectarmos preços abaixo dele, um alerta flutuante de oportunidade será exibido no app!
                </p>
                {lastQuotesUpdate && (
                  <p className="text-[10px] text-amber-400 font-mono mt-1">
                    Última consulta ao vivo: <strong className="text-white">{lastQuotesUpdate}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchLiveQuotes(false)}
                disabled={loadingQuotes}
                className={`w-full md:w-auto px-5 py-3.5 md:py-3 cursor-pointer rounded-xl font-black text-xs transition flex items-center justify-center gap-2 select-none border shrink-0 ${
                  loadingQuotes 
                  ? 'bg-[#151917] text-zinc-500 border-[#232B27] cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.2)] active:scale-95'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${loadingQuotes ? 'animate-spin text-zinc-500' : 'text-black'}`} />
                {loadingQuotes ? 'Consultando...' : 'Pesquisar Preços Padronizados 🌀'}
              </button>
            </div>
          </div>

          {/* Interactive Search Box - Fully optimized for both cellphones and desktops */}
          <div className="p-4 sm:p-5 bg-[#151917] border border-[#232B27] rounded-xl sm:rounded-2xl space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#95BBA2] uppercase tracking-wider font-mono block">
                🔍 Busca Personalizada no Google Shopping (Menor Preço)
              </label>
              <p className="text-xs text-[#8BA58D]">
                Digite o termo de qualquer produto ou filamento abaixo. Forçamos a busca inteligente do Google Shopping trazendo os resultados reordenados pelo menor preço real!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={searchQueryInput}
                onChange={(e) => setSearchQueryInput(e.target.value)}
                placeholder="Exemplo: Filamento PLA Premium 1kg, Bico E3D, Resina..."
                className="w-full flex-grow bg-[#0C0E0D] border border-[#232B27] px-4 py-3.5 sm:py-3 rounded-xl text-xs text-white placeholder-zinc-500 hover:border-[#38463F] focus:border-amber-500 outline-none font-sans"
                id="shopping-search-input-field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQueryInput.trim()) {
                    fetchLiveQuotes(false, searchQueryInput.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQueryInput.trim()) {
                    fetchLiveQuotes(false, searchQueryInput.trim());
                  } else {
                    triggerFeedback('Digite um termo para pesquisar!', 'info');
                  }
                }}
                disabled={loadingQuotes}
                className="w-full sm:w-auto px-5 py-4 sm:py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-[#151917] disabled:text-zinc-500 text-black font-extrabold text-xs rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center gap-2 select-none border border-amber-500"
              >
                <Search className="h-4 w-4" />
                {loadingQuotes ? 'Consultando...' : 'Buscar Menor Preço'}
              </button>
            </div>
          </div>

          {/* Pricing Config Form */}
          <div className="p-5 bg-[#151917] border border-[#232B27] rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#232B27]/60 pb-2">
              <DollarSign className="h-4 w-4 text-[#E2B144]" />
              Configurar Alerta de Preço Mínimo (Notificação)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA58D] font-bold">Preço de Alerta PLA (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-bold font-mono">R$</span>
                  <input 
                    type="number"
                    value={localStorage.getItem('bambuzau_alert_price_pla') || '85'}
                    onChange={(e) => {
                      localStorage.setItem('bambuzau_alert_price_pla', e.target.value);
                      triggerFeedback(`Alerta de PLA atualizado para R$ ${e.target.value}!`, 'success');
                      setChecklistTrigger(prev => prev + 1);
                    }}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] pl-9 pr-3 py-2.5 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[9px] text-zinc-500">Mostra alerta se PLA for menor que este preço.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA58D] font-bold">Preço de Alerta PETG (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-bold font-mono">R$</span>
                  <input 
                    type="number"
                    value={localStorage.getItem('bambuzau_alert_price_petg') || '80'}
                    onChange={(e) => {
                      localStorage.setItem('bambuzau_alert_price_petg', e.target.value);
                      triggerFeedback(`Alerta de PETG atualizado para R$ ${e.target.value}!`, 'success');
                      setChecklistTrigger(prev => prev + 1);
                    }}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] pl-9 pr-3 py-2.5 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[9px] text-zinc-500">Mostra alerta se PETG for menor que este preço.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA58D] font-bold">Preço de Alerta TPU (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-bold font-mono">R$</span>
                  <input 
                    type="number"
                    value={localStorage.getItem('bambuzau_alert_price_tpu') || '115'}
                    onChange={(e) => {
                      localStorage.setItem('bambuzau_alert_price_tpu', e.target.value);
                      triggerFeedback(`Alerta de TPU atualizado para R$ ${e.target.value}!`, 'success');
                      setChecklistTrigger(prev => prev + 1);
                    }}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] pl-9 pr-3 py-2.5 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[9px] text-zinc-500">Mostra alerta se TPU for menor que este preço.</p>
              </div>
            </div>
          </div>

          {/* Quotations List container */}
          <div className="space-y-5">
            {quotationGroups.map((materialGroup, gIdx) => {
              const alertLimit = parseFloat(localStorage.getItem(`bambuzau_alert_price_${materialGroup.type.toLowerCase()}`) || (materialGroup.type === 'PLA' ? '85' : materialGroup.type === 'PETG' ? '80' : '115'));
              return (
                <div key={gIdx} className="bg-[#151917] border border-[#232B27] rounded-2xl p-5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#232B27]/40 pb-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-sans">
                        <Tag className="h-4 w-4 text-[#E5B242]" />
                        Melhores Ofertas de {materialGroup.type}
                      </h4>
                      <p className="text-[10.5px] text-[#8BA58D]">Seu limite de oportunidade configurado: <strong className="text-amber-400 font-mono">R$ {alertLimit.toFixed(2)}</strong></p>
                    </div>
                    
                    <a 
                      href={`https://www.google.com/search?tbm=shop&q=${materialGroup.searchQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-[#95BBA2]/10 hover:bg-[#95BBA2]/25 border border-[#95BBA2]/30 text-[#95BBA2] text-[10.5px] font-black rounded-xl transition flex items-center gap-1.5 shadow"
                    >
                      Ver Tudo no Google Shopping 🔍
                    </a>
                  </div>

                  <div className="divide-y divide-[#232B27]/30">
                    {[...materialGroup.offers].sort((a, b) => a.price - b.price).map((offer, oIdx) => {
                      const isHotOpportunity = offer.price < alertLimit;
                      return (
                        <div key={oIdx} className="py-2.5 flex justify-between items-center gap-4 hover:bg-black/10 px-2 rounded-lg transition">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#1C2420] border border-[#2F3D35] text-[#95BBA2] inline-block mb-1">
                              {offer.storeName}
                            </span>
                            <p className="text-xs font-bold text-zinc-100 truncate">{offer.productName}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-black text-amber-400 font-mono leading-none mb-0.5">
                                R$ {offer.price.toFixed(2)}
                              </p>
                              {isHotOpportunity ? (
                                <span className="inline-block text-[8.5px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse uppercase tracking-wider scale-90Origin">
                                  🔥 Oportunidade!
                                </span>
                              ) : (
                                <span className="inline-block text-[8px] font-bold text-zinc-500 uppercase">Preço normal</span>
                              )}
                            </div>

                            <a 
                              href={offer.buyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#95BBA2] hover:bg-[#B6D8B4] text-[#0C0E0D] text-[10px] uppercase tracking-wide font-black rounded-lg transition duration-150 flex items-center gap-1"
                            >
                              Comprar 🛒
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: AI CHAT DIRECTIVE */}
      {activeSubTab === 'AI' && (
        <div className="bg-[#151917] border border-[#232B27] p-5 rounded-2xl space-y-4 animate-fade-in" id="ai-chat-full-panel">
          <div>
            <h3 className="text-base font-bold text-[#F1F4EE] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#E5B242] animate-pulse" />
              Orientação Inteligente de Engenharia 3D (Fatiadores & Custos)
            </h3>
            <p className="text-xs text-[#8BA58D]">Fórmula automática, suporte a filamentos bicos de latão e dúvidas sobre warping</p>
          </div>

          <div className="h-[280px] overflow-y-auto bg-[#0C0E0D] border border-[#232B27] rounded-xl p-4 space-y-3 font-sans text-xs scrollbar" id="chat-messages-container-full">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-xl max-w-[80%] whitespace-pre-line ${
                  msg.role === 'assistant' 
                    ? 'bg-[#151917] text-[#F1F4EE] border border-[#232B27]' 
                    : 'bg-[#95BBA2]/25 text-white ml-auto border border-[#95BBA2]/20'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {aiLoading && (
              <div className="p-3 bg-[#151917] text-[#8BA58D] border border-[#232B27] rounded-xl max-w-[50%] flex items-center gap-2 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-[#95BBA2]" />
                IA processando dados...
              </div>
            )}
          </div>

          <form onSubmit={handleSendAiMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="O que é brim? Como desentupir bico da Creality? Como calcular comissões do Mercado Livre?"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="bg-[#0C0E0D] border border-[#232B27] rounded-xl px-4 py-2.5 text-xs text-[#F1F4EE] outline-none flex-1 focus:border-[#95BBA2]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#95BBA2] hover:bg-[#B6D8B4] text-[#0C0E0D] rounded-xl text-xs font-black transition flex items-center gap-1.5"
            >
              Consultar IA
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE GASTO / DESPESA */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#151917] border border-[#232B27] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="border-b border-[#232B27]/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5 font-sans">
                  <Edit3 className="h-4 w-4" />
                  Editar Gasto Selecionado
                </h3>
                <p className="text-[10px] text-[#8BA58D] font-mono mt-0.5">Modifique os valores do lançamento abaixo</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="text-[#8BA58D] hover:text-white font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#8BA58D] block">Descrição / Item Lançado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Refil 1kg PLA Branco GTMax"
                  value={editExpenseDesc}
                  onChange={(e) => setEditExpenseDesc(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8BA58D] block">Valor R$ (Unitário)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ex: 0.0015"
                    value={editExpenseAmount || ''}
                    onChange={(e) => handleEditExpenseUnitChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-amber-400 font-bold block">Valor R$ (Total)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ex: 120"
                    value={editExpenseTotalAmount || ''}
                    onChange={(e) => handleEditExpenseTotalChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0C0E0D] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8BA58D] block">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={editExpenseQty}
                  onChange={(e) => handleEditExpenseQtyChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8BA58D] block">Categoria do Gasto</label>
                  <select
                    value={editExpenseCategory}
                    onChange={(e: any) => setEditExpenseCategory(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-2 text-xs text-white outline-none font-mono font-medium focus:border-amber-500/50"
                  >
                    <option value="EMBALAGEM">📦 Embalagens & Caixas</option>
                    <option value="EQUIPAMENTO">⚙️ Impressoras, Peças & Upgrades</option>
                    <option value="ENERGIA">⚡ Infraestrutura & Energia</option>
                    <option value="FERRAMENTAS">🛠️ Ferramentas & Acessórios</option>
                    <option value="HARDWARE">🔩 Ferragens & Fixadores</option>
                    <option value="SERVICOS">💻 Serviços & Softwares</option>
                    <option value="MARKETING">📣 Anúncios & Tráfego</option>
                    <option value="IMPOSTOS">💸 Impostos & Taxas</option>
                    <option value="FILAMENTO">🧵 Filamentos (Estoque)</option>
                    <option value="ACESSORIO_INSUMO">🔧 Insumos & Acessórios (Estoque)</option>
                    <option value="OUTROS">🏷️ Outros Gerais</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#8BA58D] block">Fornecedor / Origem</label>
                  <select
                    value={editExpenseSupplier}
                    onChange={(e) => {
                      setEditExpenseSupplier(e.target.value);
                      if (e.target.value !== 'OUTRO') {
                        setEditExpenseCustomSupplier('');
                      }
                    }}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-2.5 py-2 text-xs text-white outline-none font-mono font-medium focus:border-amber-500/50"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Shopee">Shopee</option>
                    <option value="Mercado Livre">Mercado Livre</option>
                    <option value="AliExpress">AliExpress</option>
                    <option value="Temu">Temu</option>
                    <option value="OUTRO">Outro Fornecedor</option>
                  </select>
                </div>
              </div>

              {editExpenseSupplier === 'OUTRO' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] text-[#8BA58D] block">Nome do Outro Fornecedor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 3D Lab, Voolt3D, etc."
                    value={editExpenseCustomSupplier}
                    onChange={(e) => setEditExpenseCustomSupplier(e.target.value)}
                    className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-[#8BA58D] block">Mês do Gasto (Competência/Ref.)</label>
                <input
                  type="month"
                  required
                  value={editExpenseMonth}
                  onChange={(e) => setEditExpenseMonth(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono font-medium focus:border-amber-500/50"
                />
              </div>

              {/* CONFIGURAÇÃO EXCLUSIVA DE ESTOQUE INTEGRADO COM GASTOS NO EDITAR */}
              {(editExpenseCategory === 'FILAMENTO' || editExpenseCategory === 'ACESSORIO_INSUMO') && (
                <div className="p-3 bg-[#1d2621]/45 border border-[#2c3d31] rounded-xl space-y-3 animate-fade-in text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1 font-mono">
                      📥 Gravar / Atualizar Estoque Físico?
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editStockSendToInventory}
                        onChange={(e) => setEditStockSendToInventory(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-black"></div>
                      <span className="ml-1.5 text-[8.5px] font-mono text-[#8BA58D]">Ativar</span>
                    </label>
                  </div>

                  {editStockSendToInventory && (
                    <div className="space-y-2.5 animate-fade-in border-t border-[#232B27]/60 pt-2">
                      {editExpenseCategory === 'FILAMENTO' ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8px] text-[#8BA58D] block">Tipo de Filamento</label>
                              <select
                                value={editStockFilamentType}
                                onChange={(e) => setEditStockFilamentType(e.target.value)}
                                className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                              >
                                <option value="PLA">PLA</option>
                                <option value="PETG">PETG</option>
                                <option value="ABS">ABS</option>
                                <option value="TPU">TPU</option>
                                <option value="SILK">SILK</option>
                                <option value="METÁLICO">METÁLICO</option>
                                <option value="Outro">Outro</option>
                              </select>
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] text-[#8BA58D] block">Cor do Filamento</label>
                              <input
                                type="text"
                                required={editExpenseCategory === 'FILAMENTO'}
                                placeholder="Ex: Preto Matte"
                                value={editStockFilamentColor}
                                onChange={(e) => setEditStockFilamentColor(e.target.value)}
                                className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8px] text-[#8BA58D] block">Peso por Bobina (g)</label>
                              <input
                                type="number"
                                value={editStockFilamentWeight}
                                onChange={(e) => setEditStockFilamentWeight(parseInt(e.target.value) || 1000)}
                                className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] text-[#8BA58D] block">Alerta Mínimo (g)</label>
                              <input
                                type="number"
                                value={editStockFilamentMinAlert}
                                onChange={(e) => setEditStockFilamentMinAlert(parseInt(e.target.value) || 200)}
                                className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-[11px] text-white rounded-lg outline-none font-mono"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-0.5">
                            <label className="text-[8.5px] text-[#8BA58D] block">Estoque Crítico Alerta (Unidades)</label>
                            <input
                              type="number"
                              min="1"
                              value={editStockSupplyMinAlert}
                              onChange={(e) => setEditStockSupplyMinAlert(parseInt(e.target.value) || 1)}
                              className="w-full bg-[#0C0E0D] border border-[#232B27] px-2 py-1 text-xs text-white rounded-lg outline-none font-mono"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
