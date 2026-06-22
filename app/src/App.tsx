import { useState, useEffect } from 'react';
import { getApiUrl } from './utils/api';
import { safeStorage } from './utils/storage';
import { Client, Printer, PrintOrder, FilamentStock, SupplyStock, Expense, ShoppingItem, ExternalPlatformOrder, CatalogItem } from './types';
import { 
  initialClients, 
  initialPrinters, 
  initialOrders, 
  initialFilamentStock, 
  initialExpenses, 
  initialShoppingItems 
} from './utils/initialData';
import { DashboardTab } from './components/DashboardTab';
import { ProductionTab } from './components/ProductionTab';
import { ClientsTab } from './components/ClientsTab';
import { IntegrationTab } from './components/IntegrationTab';
import { CostsTab } from './components/CostsTab';
import { SettingsTab } from './components/SettingsTab';
import { SoldTab } from './components/SoldTab';
import { OkLojaAssistant } from './components/OkLojaAssistant';
import { ShowcaseView } from './components/ShowcaseView';
import { 
  Wrench, 
  RefreshCw, 
  Home, 
  Activity, 
  Users, 
  GitPullRequest, 
  DollarSign, 
  Layers, 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Clock,
  Settings,
  Smartphone,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';

// STUNNING 3D CUBE & PRINTER EXTENSION GEOMETRIC LOGO
export function Atelier3DLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="50%" stopColor="#0066ff" />
          <stop offset="100%" stopColor="#0033aa" />
        </linearGradient>

        <filter id="glowEffect" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* The stylized "G" 3D printer frame */}
      <path d="M 160 300 
               L 160 170 
               C 160 100, 240 80, 290 80 
               C 330 80, 360 100, 360 120 
               L 320 145 
               C 300 135, 270 130, 250 130 
               C 210 130, 210 170, 210 170 
               L 210 300 
               C 210 320, 230 340, 250 340 
               L 320 340 
               L 320 250 
               L 270 250 
               L 270 210 
               L 360 210 
               L 360 350 
               C 360 380, 320 380, 290 380 
               C 250 380, 160 380, 160 300 Z" 
            fill="url(#gFrameGrad)" 
            stroke="#475569" 
            strokeWidth="2" />

      {/* 3D Printer Nozzle / Gantry head */}
      <rect x="238" y="165" width="36" height="24" rx="4" fill="#64748b" />
      <rect x="246" y="189" width="20" height="10" fill="#334155" />
      <path d="M 251 199 L 261 199 L 256 208 Z" fill="#e2e8f0" />
      <line x1="248" y1="192" x2="264" y2="192" stroke="#4db8ff" strokeWidth="2.5" filter="url(#glowEffect)" />

      {/* Active printed 3D letters block under nozzle */}
      {/* "3" Letter Solid geometry */}
      <path d="M 215 265 
               C 235 265, 240 250, 240 240 
               C 240 230, 230 225, 220 225 
               L 215 225 L 215 210 
               L 225 210 
               C 235 210, 243 200, 243 190 
               C 243 180, 235 175, 215 175 
               L 190 175 L 190 195 
               L 210 195 
               C 218 195, 218 200, 215 200 
               L 195 200 L 195 220 
               L 215 220 
               C 218 220, 218 225, 212 225 
               L 190 225 L 190 245 
               L 210 245 L 215 265 Z" 
            fill="#00e5ff" 
            filter="url(#glowEffect)" />

      {/* "D" Letter Solid geometry */}
      <path d="M 270 175 
               L 270 245 
               L 295 245 
               C 315 245, 325 230, 325 210 
               C 325 190, 315 175, 295 175 
               H 270 Z 
               M 290 195 
               C 298 195, 298 225, 290 225 
               H 282 L 282 195 
               H 290 Z" 
            fill="#0099ff" 
            filter="url(#glowEffect)" />

      {/* Laser Print Level Indicator line under the nozzle */}
      <line x1="180" y1="205" x2="332" y2="205" stroke="#00ffff" strokeDasharray="4 2" strokeWidth="1.5" opacity="0.8" filter="url(#glowEffect)" />

      {/* Metal printing build plate matching the 3D layout */}
      <polygon points="120,380 392,380 352,420 160,420" fill="#334155" stroke="#475569" strokeWidth="3" />
      <polygon points="124,382 388,382 350,418 162,418" fill="#1e293b" />

      {/* Glowing filament spool silhouette on the side back */}
      <circle cx="150" cy="140" r="35" stroke="#00d2ff" strokeWidth="8" opacity="0.25" filter="url(#glowEffect)" />
      <circle cx="150" cy="140" r="15" stroke="#475569" strokeWidth="3" opacity="0.3" />
    </svg>
  );
}

export function safeGetLocalStorageItem(key: string, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [dismissedPriceAlert, setDismissedPriceAlert] = useState(false);
  const [dismissedStockAlert, setDismissedStockAlert] = useState(false);

  // Check if we are in public showcase view
  const [isShowcase, setIsShowcase] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('showcase') === 'true' || params.get('view') === 'showcase';
    } catch (e) {
      return false;
    }
  });

  const [showcaseWorkspace] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('w') || localStorage.getItem('bambuzau_workspace_code') || 'principal';
    } catch (e) {
      return 'principal';
    }
  });

  const [showcaseFirebase] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encodedF = params.get('f');
      if (encodedF) {
        try {
          return atob(encodedF);
        } catch (e) {
          console.warn("Could not decode custom firebase URL from base64", e);
        }
      }
      return localStorage.getItem('bambuzau_firebase_url') || 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
    } catch (e) {
      return 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
    }
  });

  // States with localStorage persistence safely wrapped in try-catch blocks
  const [brandConfig, setBrandConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('bambuzau_brand_config');
      let parsed = saved ? JSON.parse(saved) : null;
      if (!parsed || !parsed.name || !parsed.theme || !parsed.icon || parsed.name === 'Bambuzau 3D' || parsed.name === 'Ateliê 3D Hub' || parsed.theme === 'dark-organic') {
        parsed = {
          name: 'Gestao 3d',
          theme: 'dark-slate',
          icon: 'spool'
        };
      }
      return parsed;
    } catch (e) {
      console.warn("Failed to parse brandConfig state, returning default value", e);
      return {
        name: 'Gestao 3d',
        theme: 'dark-slate',
        icon: 'spool'
      };
    }
  });

  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const [showSetupModal, setShowSetupModal] = useState(() => {
    try {
      return !localStorage.getItem('atelier_setup_completed');
    } catch (e) {
      return true;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_clients');
      return saved ? JSON.parse(saved) : initialClients;
    } catch (e) {
      console.warn("Failed to parse clients state, returning initial dataset", e);
      return initialClients;
    }
  });

  const [printers, setPrinters] = useState<Printer[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_printers');
      return saved ? JSON.parse(saved) : initialPrinters;
    } catch (e) {
      console.warn("Failed to parse printers state, returning initial dataset", e);
      return initialPrinters;
    }
  });

  const [orders, setOrders] = useState<PrintOrder[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_orders');
      return saved ? JSON.parse(saved) : initialOrders;
    } catch (e) {
      console.warn("Failed to parse orders state, returning initial dataset", e);
      return initialOrders;
    }
  });

  const [filamentStocks, setFilamentStocks] = useState<FilamentStock[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_filament');
      return saved ? JSON.parse(saved) : initialFilamentStock;
    } catch (e) {
      console.warn("Failed to parse filamentStocks state, returning initial dataset", e);
      return initialFilamentStock;
    }
  });

  // Tuya Wi-Fi Devices for Humidifier Telemetry
  const [tuyaDevices, setTuyaDevices] = useState<{
    id: string;
    name: string;
    deviceId: string;
    clientId: string;
    clientSecret: string;
    region: string;
    currentHumidity: number;
    temperature: number;
    lastUpdated: number;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_tuya_devices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse tuya devices, returning initial default", e);
    }
    return [
      { id: '1', name: 'Estufa PLA', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 32.4, temperature: 24.2, lastUpdated: Date.now() },
      { id: '2', name: 'Estufa PETG', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 28.5, temperature: 25.1, lastUpdated: Date.now() },
    ];
  });

  const restoreDefaultEstufas = () => {
    const defaults = [
      { id: '1', name: 'Estufa PLA', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 32.4, temperature: 24.2, lastUpdated: Date.now() },
      { id: '2', name: 'Estufa PETG', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 28.5, temperature: 25.1, lastUpdated: Date.now() },
    ];
    setTuyaDevices(defaults);
    localStorage.setItem('bambuzau_tuya_devices', JSON.stringify(defaults));
    setCurrentTab(5); // Switch to settings tab
    setGlobalToast("✓ Estufas padrão restauradas com sucesso!");
  };

  // Persist Tuya devices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bambuzau_tuya_devices', JSON.stringify(tuyaDevices));
    } catch (e) {
      console.error(e);
    }
  }, [tuyaDevices]);

  // Handle active Tuya API data fetching or simulation drifting (+/- 0.2%)
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;

      const updated = await Promise.all(tuyaDevices.map(async (dev) => {
        // If developer attributes are populated, pull from our custom secure gateway
        if (dev.clientId && dev.clientSecret && dev.deviceId) {
          try {
            const response = await fetch(getApiUrl('/api/tuya/humidity'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: dev.clientId,
                clientSecret: dev.clientSecret,
                deviceId: dev.deviceId,
                region: dev.region
              })
            });
            if (response.ok) {
              const resJson = await response.json();
              if (resJson.success && resJson.humidity !== null) {
                return {
                  ...dev,
                  currentHumidity: resJson.humidity,
                  temperature: resJson.temperature || dev.temperature,
                  lastUpdated: Date.now()
                };
              }
            }
          } catch (err) {
            console.warn(`Failed fetching real live telemetry for Tuya: ${dev.name}`, err);
          }
        }

        // Simulative drift organic fluctuation (+/- 0.3%)
        const drift = (Math.random() - 0.5) * 0.6;
        const targetHum = Math.max(10, Math.min(99, dev.currentHumidity + drift));
        return {
          ...dev,
          currentHumidity: parseFloat(targetHum.toFixed(1)),
          lastUpdated: Date.now()
        };
      }));

      if (isMounted) {
        setTuyaDevices(updated);
      }
    }, 18000); // Drifts/Polls every 18 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tuyaDevices]);

  // Automatic Quotes Search 3x a day (Morning, Afternoon, Night)
  useEffect(() => {
    const getCurrentQuotationsPeriod = (): string => {
      const now = new Date();
      const hours = now.getHours();
      let period = "noite"; // Night default
      if (hours >= 6 && hours < 12) {
        period = "manha";
      } else if (hours >= 12 && hours < 18) {
        period = "tarde";
      }
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      return `${dateStr}_${period}`;
    };

    const runAutoQuoteFetch = async () => {
      const currentPeriod = getCurrentQuotationsPeriod();
      const lastPeriod = safeStorage.getItem('bambuzau_last_quotes_period', '');
      
      if (currentPeriod !== lastPeriod) {
        try {
          const customSerpKey = safeStorage.getItem('bambuzau_custom_serp_key', '');
          const queryParam = customSerpKey ? `?api_key=${encodeURIComponent(customSerpKey.trim())}` : '';
          const res = await fetch(getApiUrl(`/api/quotations${queryParam}`), {
            headers: {
              'X-Custom-Serpapi-Key': customSerpKey.trim()
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data) && data.length > 0) {
              safeStorage.setItem('bambuzau_cached_quotes', JSON.stringify(data));
              safeStorage.setItem('bambuzau_last_quotes_period', currentPeriod);
              const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              safeStorage.setItem('bambuzau_last_quotes_update', `${new Date().toLocaleDateString('pt-BR')} às ${timeStr}`);
              
              // Dispatch local event so CostsTab receives it live
              window.dispatchEvent(new CustomEvent('bambuzau_quotes_updated', { detail: data }));
              console.log(`[Auto-Quotes] Quotations automatically synced for ${currentPeriod}`);
            }
          }
        } catch (err) {
          console.warn("[Auto-Quotes] Silent auto quotation update failed", err);
        }
      }
    };

    // Run initial check after a brief start delay
    const initialTimer = setTimeout(() => {
      runAutoQuoteFetch();
    }, 4500);

    // Keep checking every 15 minutes
    const periodicTimer = setInterval(() => {
      runAutoQuoteFetch();
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
    };
  }, []);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_expenses');
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch (e) {
      console.warn("Failed to parse expenses state, returning initial dataset", e);
      return initialExpenses;
    }
  });

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_shopping');
      return saved ? JSON.parse(saved) : initialShoppingItems;
    } catch (e) {
      console.warn("Failed to parse shoppingItems state, returning initial dataset", e);
      return initialShoppingItems;
    }
  });

  const [importedExternalIds, setImportedExternalIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_imported_external_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to parse importedExternalIds state, returning empty array", e);
      return [];
    }
  });

  const [suppliesStocks, setSuppliesStocks] = useState<SupplyStock[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_supplies');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse suppliesStocks state, returning default empty list", e);
    }
    return [];
  });

  const [lastAuditDate, setLastAuditDate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_last_audit_ts');
      // Default standard: 4 days ago to trigger the audit warnings by default!
      return saved ? parseInt(saved, 10) : Date.now() - 4 * 24 * 60 * 60 * 1000;
    } catch (e) {
      return Date.now() - 4 * 24 * 60 * 60 * 1000;
    }
  });

  // Keep a running time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Force scroll-to-top on window whenever the main tab selection changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentTab]);

  // One-time automatic cleanup of old legacy/mock orders and clients so the user starts with a clean slate
  useEffect(() => {
    const cleaned = localStorage.getItem('bambuzau_wipe_legacy_orders_v6');
    if (!cleaned) {
      localStorage.setItem('bambuzau_wipe_legacy_orders_v6', 'true');
      localStorage.setItem('bambuzau_orders', '[]');
      localStorage.setItem('bambuzau_clients', '[]');
      localStorage.setItem('bambuzau_expenses', '[]');
      localStorage.setItem('bambuzau_shopping', '[]');
      localStorage.setItem('bambuzau_supplies', '[]');
      localStorage.setItem('bambuzau_printers', '[]');
      localStorage.setItem('bambuzau_filament', '[]');
      localStorage.setItem('bambuzau_local_catalog_production', '[]');
      
      setOrders([]);
      setClients([]);
      setExpenses([]);
      setShoppingItems([]);
      setSuppliesStocks([]);
      setPrinters([]);
      setFilamentStocks([]);
    }
  }, []);

  // Save states to localStorage upon changes
  useEffect(() => {
    localStorage.setItem('bambuzau_brand_config', JSON.stringify(brandConfig));
  }, [brandConfig]);

  useEffect(() => {
    localStorage.setItem('bambuzau_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('bambuzau_printers', JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    localStorage.setItem('bambuzau_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bambuzau_filament', JSON.stringify(filamentStocks));
  }, [filamentStocks]);

  useEffect(() => {
    localStorage.setItem('bambuzau_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('bambuzau_shopping', JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    localStorage.setItem('bambuzau_imported_external_ids', JSON.stringify(importedExternalIds));
  }, [importedExternalIds]);

  useEffect(() => {
    localStorage.setItem('bambuzau_supplies', JSON.stringify(suppliesStocks));
  }, [suppliesStocks]);

  useEffect(() => {
    localStorage.setItem('bambuzau_last_audit_ts', lastAuditDate.toString());
  }, [lastAuditDate]);

  const getAppVersion = () => {
    if (typeof window !== 'undefined') {
      // 1. Tenta obter pelo Javascript Interface injetado nativamente
      if ((window as any).AndroidInterface && typeof (window as any).AndroidInterface.getNativeVersion === 'function') {
        try {
          return (window as any).AndroidInterface.getNativeVersion();
        } catch (e) {
          console.error("Erro ao obter versão do AndroidInterface:", e);
        }
      }
      // 2. Fallback para query param
      const params = new URLSearchParams(window.location.search);
      const nativeVersion = params.get('nativeVersion');
      if (nativeVersion) {
        return nativeVersion;
      }
    }
    return "3.2.3.5"; // Versão web padrão
  };

  const [updateBanner, setUpdateBanner] = useState<{ version: string; apkUrl: string; releaseNotes: string; timestamp: number } | null>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        // Habilitado para todos os dispositivos e perfis (gestor e clientes) receberem
        // a notificação flutuante de atualização de APK de forma imediata ao sincronizar!
        const firebaseUrl = localStorage.getItem('bambuzau_firebase_url') || 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
        const workspaceCode = localStorage.getItem('bambuzau_workspace_code') || 'principal';
        if (firebaseUrl && workspaceCode) {
          let formattedUrl = firebaseUrl.trim();
          if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
          }
          if (!formattedUrl.endsWith('/')) {
            formattedUrl += '/';
          }
          const targetUrl = `${formattedUrl}workspaces/${workspaceCode.trim()}/update_info.json?nocache=${Date.now()}`;
          const response = await fetch(targetUrl, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            if (data && data.version) {
              const currentVersionStr = getAppVersion();
              const dismissedVersion = localStorage.getItem('bambuzau_dismissed_version');
              const dismissedTimestampStr = localStorage.getItem('bambuzau_dismissed_timestamp');
              const dismissedTimestamp = dismissedTimestampStr ? parseInt(dismissedTimestampStr, 10) : 0;
              const dismissedTimeStr = localStorage.getItem('bambuzau_dismissed_time');
              const dismissedTime = dismissedTimeStr ? parseInt(dismissedTimeStr, 10) : 0;
              const remoteTimestamp = data.timestamp || 0;
              
              // Se o cliente já dispensou especificamente esta atualização, respeita.
              // A MENOS que a versão remota tenha sido republicada com um timestamp mais recente que o momento em que foi apagada!
              if (dismissedVersion === data.version && remoteTimestamp <= dismissedTime) {
                setUpdateBanner(null);
                return;
              }

              // Função auxiliar para comparar versões semver (ex: "2.8.1" > "2.8") de forma precisa
              const isNewerVersion = (remote: string, current: string): boolean => {
                const parseParts = (v: string) => v.split('.').map(x => parseInt(x, 10) || 0);
                const remoteParts = parseParts(remote);
                const currentParts = parseParts(current);
                
                for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
                  const r = remoteParts[i] || 0;
                  const c = currentParts[i] || 0;
                  if (r > c) return true;
                  if (r < c) return false;
                }
                return false;
              };

              if (isNewerVersion(data.version, currentVersionStr)) {
                setUpdateBanner({
                  version: data.version,
                  apkUrl: data.apkUrl || '',
                  releaseNotes: data.releaseNotes || 'Melhorias de estabilidade e novas funcionalidades',
                  timestamp: data.timestamp || 0
                });
              } else {
                setUpdateBanner(null);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Silent version check failed:", err);
      }
    };

    checkUpdates();
    
    // Escuta mudanças de perfil efetuadas localmente no SettingsTab e eventos customizados locais
    const handleStorageChange = () => {
      checkUpdates();
    };

    const handleSafeAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setGlobalToast(customEvent.detail);
        // Clear after 5 seconds automatically
        setTimeout(() => setGlobalToast(null), 5000);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bambuzau_force_update_check', handleStorageChange);
    window.addEventListener('bambuzau_safe_alert', handleSafeAlert);

    const interval = setInterval(checkUpdates, 600000); // 10 minutes
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bambuzau_force_update_check', handleStorageChange);
      window.removeEventListener('bambuzau_safe_alert', handleSafeAlert);
    };
  }, []);

  const handleImportAllData = (data: {
    clients?: Client[];
    printers?: Printer[];
    orders?: PrintOrder[];
    filamentStocks?: FilamentStock[];
    expenses?: Expense[];
    shoppingItems?: ShoppingItem[];
    tuyaDevices?: any[];
  }) => {
    if (data.clients) setClients(data.clients);
    if (data.printers) setPrinters(data.printers);
    if (data.orders) setOrders(data.orders);
    if (data.filamentStocks) setFilamentStocks(data.filamentStocks);
    if (data.expenses) setExpenses(data.expenses);
    if (data.shoppingItems) setShoppingItems(data.shoppingItems);
    if (data.tuyaDevices && data.tuyaDevices.length > 0) {
      setTuyaDevices(data.tuyaDevices);
    }
  };
  const handleAddClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      ...clientData
    };
    setClients(prev => [...prev, newClient]);
  };

  const handleUpdateClient = (id: number, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteClient = (id: number) => {
    if (confirm('Tem certeza que deseja remover este cliente permanentemente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddPrinter = (printerData: Omit<Printer, 'id'>) => {
    const newPrinter: Printer = {
      id: printers.length > 0 ? Math.max(...printers.map(p => p.id)) + 1 : 1,
      ...printerData
    };
    setPrinters(prev => [...prev, newPrinter]);
  };

  const handleUpdatePrinter = (id: number, updated: Partial<Printer>) => {
    setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const handleDeletePrinter = (id: number) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  const handleAddOrder = (orderData: Partial<PrintOrder>) => {
    const newOrder: PrintOrder = {
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      clientName: orderData.clientName || 'Novo Cliente',
      itemName: orderData.itemName || 'Peça Personalizada',
      quantity: orderData.quantity || 1,
      filamentType: orderData.filamentType || 'PLA',
      filamentColor: orderData.filamentColor || 'Qualquer Cor',
      weightGrams: orderData.weightGrams || 50,
      printTimeHours: orderData.printTimeHours || 2.0,
      priceCharged: orderData.priceCharged || 40.0,
      platformSource: orderData.platformSource || 'MANUAL',
      status: orderData.status || 'QUEUE',
      printingProgress: orderData.printingProgress || 0.0,
      assignedPrinterId: orderData.assignedPrinterId || null,
      printerName: orderData.printerName || '',
      createdAt: orderData.createdAt || Date.now(),
      deadline: orderData.deadline || (Date.now() + 24 * 3600 * 1000),
      paymentMethod: orderData.paymentMethod || 'DINHEIRO',
      paymentStatus: orderData.paymentStatus || 'PENDENTE'
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Deduct stock immediately if created in PRINTING state
    if (newOrder.status === 'PRINTING') {
      deductMaterialsForOrder(newOrder);
    }
  };

  const handleUpdateOrder = (id: number, updated: Partial<PrintOrder>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const nextOrder = { ...o, ...updated };

        // Deduct filament if moving to PRINTING for the first time
        if (updated.status === 'PRINTING' && o.status !== 'PRINTING') {
          deductMaterialsForOrder(nextOrder);
          // Set assigned printer status to PRINTING
          if (nextOrder.assignedPrinterId) {
            handleUpdatePrinter(nextOrder.assignedPrinterId, { status: 'PRINTING' });
          }
        }

        return nextOrder;
      }
      return o;
    }));
  };

  const deductMaterialsForOrder = (order: PrintOrder) => {
    // 1. Load latest catalog
    let catalog: CatalogItem[] = [];
    try {
      catalog = JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]');
    } catch (e) {
      console.warn("Failed to load catalog for stock sync:", e);
    }

    // 2. Try to find a matched item by SKU/code or exact Name in the order info
    const searchTarget = `${order.itemName} ${order.clientName || ''} ${order.platformOrderId || ''}`.toUpperCase();
    
    const matchedItem = catalog.find(ci => {
      const sku = ci.productCode?.trim().toUpperCase();
      if (!sku) return false;
      return searchTarget.includes(sku);
    }) || catalog.find(ci => ci.name.toUpperCase() === order.itemName.toUpperCase());

    const orderQty = order.quantity || 1;

    if (matchedItem) {
      console.log(`[SYS SYNC v3.2.3.5] Catalog item matched for SKU/Name deduction: "${matchedItem.name}"`, matchedItem);
      
      // Multimaterial recipe deduction - Filaments
      if (matchedItem.filamentsUsed && matchedItem.filamentsUsed.length > 0) {
        matchedItem.filamentsUsed.forEach(f => {
          setFilamentStocks(prev => {
            const updated = prev.map(stock => {
              if (stock.id === f.filamentStockId) {
                const totalUsed = f.weightGrams * orderQty;
                return { ...stock, stockGrams: Math.max(0, stock.stockGrams - totalUsed) };
              }
              return stock;
            });

            // Record as expense automatically for monthly dashboards!
            const curFil = updated.find(s => s.id === f.filamentStockId);
            const rollPrice = curFil ? curFil.priceRoll : 110;
            const totalUsed = f.weightGrams * orderQty;
            const materialCost = (totalUsed / 1000) * rollPrice;
            
            const newExpense: Expense = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              description: `Baixa SKU (${matchedItem.productCode}): ${totalUsed}g de ${curFil ? `${curFil.type} ${curFil.color}` : 'Filamento'}`,
              category: 'FILAMENTO',
              amount: parseFloat(materialCost.toFixed(2)),
              qty: 1,
              date: Date.now()
            };
            setExpenses(prevExp => [...prevExp, newExpense]);
            return updated;
          });
        });
      } else {
        // Fallback: standard simple filament deduction
        deductFilament(matchedItem.filamentType, matchedItem.filamentColorsUsed || 'Universal', (matchedItem.weightGrams || 50) * orderQty);
      }

      // Multimaterial recipe deduction - Supplies & Hardware!
      if (matchedItem.suppliesUsed && matchedItem.suppliesUsed.length > 0) {
        matchedItem.suppliesUsed.forEach(s => {
          setSuppliesStocks(prev => {
            const updated = prev.map(sup => {
              if (sup.id === s.supplyStockId) {
                const totalUsed = s.quantity * orderQty;
                return { ...sup, stockCount: Math.max(0, sup.stockCount - totalUsed) };
              }
              return sup;
            });

            // Record expense for supply depletion
            const curSup = updated.find(x => x.id === s.supplyStockId);
            const unitCost = curSup ? curSup.unitCost : 5.0;
            const totalUsed = s.quantity * orderQty;
            const supplyCost = totalUsed * unitCost;

            const newExpense: Expense = {
              id: Date.now() + Math.floor(Math.random() * 1000 + 10000),
              description: `Baixa Hardware SKU (${matchedItem.productCode}): ${totalUsed}x ${curSup ? curSup.name : 'Insumo'}`,
              category: 'OUTROS',
              amount: parseFloat(supplyCost.toFixed(2)),
              qty: 1,
              date: Date.now()
            };
            setExpenses(prevExp => [...prevExp, newExpense]);
            return updated;
          });
        });
      } else if (matchedItem.spentPartId) {
        // Legacy simple hardware deduction
        setSuppliesStocks(prev => prev.map(sup => {
          if (sup.id === matchedItem.spentPartId) {
            const totalUsed = (matchedItem.spentPartQty || 1) * orderQty;
            return { ...sup, stockCount: Math.max(0, sup.stockCount - totalUsed) };
          }
          return sup;
        }));
      }

    } else {
      // Fallback: No catalog matching found. Deduct raw order details.
      deductFilament(order.filamentType, order.filamentColor, order.weightGrams * orderQty);
    }
  };

  const deductFilament = (type: string, color: string, amount: number) => {
    setFilamentStocks(prev => prev.map(f => {
      if (f.type === type && f.color === color) {
        return { ...f, stockGrams: Math.max(0, f.stockGrams - amount) };
      }
      return f;
    }));

    // Record an expense matching raw material depletion
    const matchedFilament = filamentStocks.find(f => f.type === type && f.color === color);
    const unitPriceRoll = matchedFilament ? matchedFilament.priceRoll : 120.0;
    const materialCost = (amount / 1000) * unitPriceRoll;

    const newExpense: Expense = {
      id: Date.now() + Math.random(),
      description: `Consumo Material: ${amount}g de ${type} ${color}`,
      category: 'FILAMENTO',
      amount: parseFloat(materialCost.toFixed(2)),
      qty: 1,
      date: Date.now()
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: Date.now() + Math.random()
    };
    setExpenses(prev => [...prev, newExp]);
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm('Deseja realmente cancelar este trabalho de impressão?')) {
      // Free printer if it was busy
      const order = orders.find(o => o.id === id);
      if (order && order.status === 'PRINTING' && order.assignedPrinterId) {
        handleUpdatePrinter(order.assignedPrinterId, { status: 'IDLE' });
      }
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleSimulateTick = () => {
    setOrders(prevOrders => {
      let isAnyUpdated = false;

      const updated = prevOrders.map(order => {
        if (order.status === 'PRINTING') {
          isAnyUpdated = true;
          const nextProgress = Math.min(1.0, order.printingProgress + 0.15 + Math.random() * 0.05);
          
          if (nextProgress >= 1.0) {
            // Completed! Transition to POS PROCESS and free printer
            if (order.assignedPrinterId) {
              setTimeout(() => {
                handleUpdatePrinter(order.assignedPrinterId!, { status: 'IDLE' });
              }, 10);
            }
            return {
              ...order,
              printingProgress: 1.0,
              status: 'POST_PROCESS'
            };
          }

          return {
            ...order,
            printingProgress: parseFloat(nextProgress.toFixed(2))
          };
        }
        return order;
      });

      if (!isAnyUpdated) {
        alert('Nenhum trabalho de impressão está no estado de processamento "Imprimindo" no momento. Aloca uma peça na aba de Produção!');
      }

      return updated;
    });
  };

  const handleImportExternalOrder = (external: ExternalPlatformOrder) => {
    setImportedExternalIds(prev => {
      if (prev.includes(external.id)) return prev;
      return [...prev, external.id];
    });
    handleAddOrder({
      clientName: external.clientName,
      itemName: external.itemName,
      quantity: 1,
      filamentType: 'PLA',
      filamentColor: 'Ouro Silk',
      weightGrams: external.weightGrams,
      printTimeHours: external.printTimeHours,
      priceCharged: external.priceCharged,
      platformSource: external.platform,
      status: 'QUEUE',
      printingProgress: 0.0
    });
  };

  const handleAddFilamentStock = (fData: Omit<FilamentStock, 'id'>) => {
    const newStock: FilamentStock = {
      id: filamentStocks.length > 0 ? Math.max(...filamentStocks.map(f => f.id)) + 1 : 1,
      ...fData
    };
    setFilamentStocks(prev => [...prev, newStock]);
  };

  const handleUpdateFilamentStock = (id: number, updated: Partial<FilamentStock>) => {
    setFilamentStocks(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  };

  const handleDeleteFilamentStock = (id: number) => {
    if (confirm('Tem certeza de que deseja excluir este filamento de seu estoque permanentemente?')) {
      setFilamentStocks(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleAddShoppingItem = (itemData: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = {
      id: shoppingItems.length > 0 ? Math.max(...shoppingItems.map(s => s.id)) + 1 : 1,
      ...itemData
    };
    setShoppingItems(prev => [...prev, newItem]);
  };

  const handleToggleShoppingItem = (id: number) => {
    setShoppingItems(prev => prev.map(s => s.id === id ? { ...s, isChecked: !s.isChecked } : s));
  };

  const handleDeleteShoppingItem = (id: number) => {
    setShoppingItems(prev => prev.filter(s => s.id !== id));
  };

  // Dynamic color definitions mapped to the themes
  const themeDefinitions = {
    'dark-organic': {
      bgMain: '#0A0D0B',
      bgCard: '#141B18',
      borderColor: '#222A25',
      colorPrimary: '#637E55',
      colorPrimaryLight: '#7BA069',
      colorAccent: '#E2B144',
      colorText: '#F7F5F0',
      colorMuted: '#899E8F',
      textAccent: '#E2B144',
    },
    'light-bambu': {
      bgMain: '#F8F6F0',
      bgCard: '#FFFFFF',
      borderColor: '#E5DFD0',
      colorPrimary: '#4F6744',
      colorPrimaryLight: '#637E55',
      colorAccent: '#C6942C',
      colorText: '#2C3827',
      colorMuted: '#667F60',
      textAccent: '#C6942C',
    },
    'dark-slate': {
      bgMain: '#111417',
      bgCard: '#191D22',
      borderColor: '#282F37',
      colorPrimary: '#4A85D2',
      colorPrimaryLight: '#699CE2',
      colorAccent: '#A2ACB9',
      colorText: '#F3F5F7',
      colorMuted: '#8D939F',
      textAccent: '#4A85D2',
    },
    'gold-royal': {
      bgMain: '#0A0907',
      bgCard: '#151310',
      borderColor: '#25201A',
      colorPrimary: '#D59A30',
      colorPrimaryLight: '#E8B153',
      colorAccent: '#B27C17',
      colorText: '#FFFFFF',
      colorMuted: '#A59784',
      textAccent: '#D59A30',
    },
    'cyber-neon': {
      bgMain: '#090514',
      bgCard: '#130D23',
      borderColor: '#24183E',
      colorPrimary: '#A855F7',
      colorPrimaryLight: '#C084FC',
      colorAccent: '#F43F5E',
      colorText: '#F9F7FD',
      colorMuted: '#8B7FA4',
      textAccent: '#F43F5E',
    },
    'lava-orange': {
      bgMain: '#0E0805',
      bgCard: '#17110D',
      borderColor: '#261B16',
      colorPrimary: '#F97316',
      colorPrimaryLight: '#FB923C',
      colorAccent: '#FACC15',
      colorText: '#FEF8F5',
      colorMuted: '#A89286',
      textAccent: '#F97316',
    },
    'mint-forest': {
      bgMain: '#060B08',
      bgCard: '#0F1612',
      borderColor: '#1B2720',
      colorPrimary: '#14B8A6',
      colorPrimaryLight: '#2DD4BF',
      colorAccent: '#34D399',
      colorText: '#F0F9F6',
      colorMuted: '#809E91',
      textAccent: '#14B8A6',
    },
    'obsidian-crimson': {
      bgMain: '#0D0D0D',
      bgCard: '#161616',
      borderColor: '#262626',
      colorPrimary: '#EF4444',
      colorPrimaryLight: '#F87171',
      colorAccent: '#B91C1C',
      colorText: '#F9F9F9',
      colorMuted: '#A1A1A1',
      textAccent: '#EF4444',
    },
    'cool-ocean': {
      bgMain: '#090F1C',
      bgCard: '#111824',
      borderColor: '#1D283A',
      colorPrimary: '#06B6D4',
      colorPrimaryLight: '#22D3EE',
      colorAccent: '#3B82F6',
      colorText: '#F1F5F9',
      colorMuted: '#8FABBA',
      textAccent: '#06B6D4',
    },
    'royal-amethyst': {
      bgMain: '#090511',
      bgCard: '#120D1D',
      borderColor: '#211833',
      colorPrimary: '#A855F7',
      colorPrimaryLight: '#C084FC',
      colorAccent: '#EC4899',
      colorText: '#FBFAFD',
      colorMuted: '#89829A',
      textAccent: '#A855F7',
    },
    'desert-sand': {
      bgMain: '#FAF9F5',
      bgCard: '#FFFFFF',
      borderColor: '#EFEBE0',
      colorPrimary: '#C2410C',
      colorPrimaryLight: '#EA580C',
      colorAccent: '#F59E0B',
      colorText: '#2A2016',
      colorMuted: '#7F6A54',
      textAccent: '#C2410C',
    },
    'sakura-cherry': {
      bgMain: '#12090C',
      bgCard: '#1C1116',
      borderColor: '#2C1B22',
      colorPrimary: '#EC4899',
      colorPrimaryLight: '#F472B6',
      colorAccent: '#F472B6',
      colorText: '#FDF2F4',
      colorMuted: '#9E868F',
      textAccent: '#EC4899',
    },
  };

  const activeTheme = (brandConfig && brandConfig.theme === 'custom' && brandConfig.customThemeColors)
    ? brandConfig.customThemeColors
    : (themeDefinitions[(brandConfig?.theme || 'dark-slate') as keyof typeof themeDefinitions] || themeDefinitions['dark-slate']);

  // Global pending orders calculator
  const pendingOrdersCount = orders.filter(o => o.status !== 'DELIVERED').length;

  if (isShowcase) {
    return (
      <ShowcaseView
        workspaceCode={showcaseWorkspace}
        firebaseUrl={showcaseFirebase}
        onBackToAdmin={() => setIsShowcase(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* GLOBAL SAFE TOAST NOTIFICATION CARD */}
      {globalToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm p-4 bg-zinc-950 border-2 border-amber-500 rounded-2xl shadow-2xl shadow-black flex items-start gap-3 animate-bounce">
          <div className="p-1 px-[7px] bg-amber-500/15 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="shrink-0">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
            </svg>
          </div>
          <div className="flex-1 text-[11px] font-sans">
            <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] font-mono mb-0.5">Notificação Interna</h4>
            <p className="text-zinc-200 leading-relaxed font-semibold">{globalToast}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setGlobalToast(null)} 
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1 shrink-0"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* GLOBAL BRAND STYLING INJECTOR */}
      <style>{`
        :root {
          --brand-bg: ${activeTheme.bgMain};
          --brand-card: ${activeTheme.bgCard};
          --brand-border: ${activeTheme.borderColor};
          --brand-primary: ${activeTheme.colorPrimary};
          --brand-primary-light: ${activeTheme.colorPrimaryLight};
          --brand-accent: ${activeTheme.colorAccent};
          --brand-text: ${activeTheme.colorText};
          --brand-muted: ${activeTheme.colorMuted};
          --brand-text-accent: ${activeTheme.textAccent};
        }
        
        body {
          background-color: var(--brand-bg) !important;
          color: var(--brand-text) !important;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Universal overrides for hardcoded Tailwind colors to dynamically tint the entire app */
        .text-\\[\\#95BBA2\\] { color: var(--brand-primary) !important; }
        .bg-\\[\\#95BBA2\\] { background-color: var(--brand-primary) !important; }
        .border-\\[\\#95BBA2\\] { border-color: var(--brand-primary) !important; }
        .focus\\:ring-\\[\\#95BBA2\\]\\:focus { --tw-ring-color: var(--brand-primary) !important; }
        .focus\\:border-\\[\\#95BBA2\\]\\:focus { border-color: var(--brand-primary) !important; }
        .hover\\:border-\\[\\#95BBA2\\]\\:hover { border-color: var(--brand-primary) !important; }
        .hover\\:text-\\[\\#95BBA2\\]\\:hover { color: var(--brand-primary) !important; }
        
        /* Render opacity with background-color with dynamic fallback overlays */
        .bg-\\[\\#95BBA2\\]\\/5 { background-color: color-mix(in srgb, var(--brand-primary) 5%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/10 { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/20 { background-color: color-mix(in srgb, var(--brand-primary) 20%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/25 { background-color: color-mix(in srgb, var(--brand-primary) 25%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/30 { background-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        
        .hover\\:bg-\\[\\#95BBA2\\]\\/5\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 5%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/10\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/20\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 20%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/25\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 25%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/30\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        .hover\\:bg-\\[\\#B6D8B4\\]\\:hover { background-color: var(--brand-primary-light) !important; opacity: 0.9 !important; }

        /* Muted sage greens */
        .text-\\[\\#8BA58D\\] { color: var(--brand-muted) !important; }
        .text-\\[\\#8BA58D\\]\\/50 { color: color-mix(in srgb, var(--brand-muted) 50%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/70 { color: color-mix(in srgb, var(--brand-muted) 70%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/80 { color: color-mix(in srgb, var(--brand-muted) 80%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/60 { color: color-mix(in srgb, var(--brand-muted) 60%, transparent) !important; }
        .hover\\:text-\\[\\#8BA58D\\]\\:hover { color: var(--brand-muted) !important; }
        .border-\\[\\#8BA58D\\] { border-color: var(--brand-muted) !important; }
        .border-\\[\\#8BA58D\\]\\/30 { border-color: color-mix(in srgb, var(--brand-muted) 30%, transparent) !important; }
        .border-\\[\\#8BA58D\\]\\/40 { border-color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }
        .border-\\[\\#8BA58D\\]\\/20 { border-color: color-mix(in srgb, var(--brand-muted) 20%, transparent) !important; }
        .placeholder-\\[\\#8BA58D\\]\\/40\\:\\:placeholder { color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }
        .placeholder-\\[\\#8BA58D\\]\\/60\\:\\:placeholder { color: color-mix(in srgb, var(--brand-muted) 60%, transparent) !important; }
        
        /* Dark backgrounds and borders */
        .bg-\\[\\#151917\\] { background-color: var(--brand-card) !important; }
        .bg-\\[\\#151917\\]\\/20 { background-color: color-mix(in srgb, var(--brand-card) 20%, transparent) !important; }
        .bg-\\[\\#151917\\]\\/50 { background-color: color-mix(in srgb, var(--brand-card) 50%, transparent) !important; }
        .border-\\[\\#232B27\\] { border-color: var(--brand-border) !important; }
        .border-\\[\\#232B27\\]\\/40 { border-color: color-mix(in srgb, var(--brand-border) 40%, transparent) !important; }
        .border-\\[\\#232B27\\]\\/20 { border-color: color-mix(in srgb, var(--brand-border) 20%, transparent) !important; }
        .bg-\\[\\#0C0E0D\\] { background-color: var(--brand-bg) !important; }
        .bg-\\[\\#0C0E0D\\]\\/40 { background-color: color-mix(in srgb, var(--brand-bg) 40%, transparent) !important; }
        
        /* PrintFlow green styles */
        .text-\\[\\#5E8B61\\] { color: var(--brand-primary) !important; }
        .bg-\\[\\#5E8B61\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .hover\\:bg-\\[\\#5E8B61\\]\\/35\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 35%, transparent) !important; }
        .border-\\[\\#5E8B61\\]\\/30 { border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        .hover\\:border-\\[\\#8BA58D\\]\\/40\\:hover { border-color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }

        /* Sage Green dynamic mapping overrides (#637E55 & #536B47) */
        .bg-\\[\\#637E55\\] { background-color: var(--brand-primary) !important; }
        .hover\\:bg-\\[\\#536B47\\]\\:hover { background-color: var(--brand-primary-light) !important; }
        .bg-\\[\\#637E55\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .text-\\[\\#637E55\\] { color: var(--brand-primary) !important; }

        /* Text highlights & accent color mapping */
        .text-\\[\\#F1F4EE\\] { color: var(--brand-text) !important; }
        .text-\\[\\#E5B242\\] { color: var(--brand-accent) !important; }
        .bg-\\[\\#E5B242\\] { background-color: var(--brand-accent) !important; }
        .border-\\[\\#E5B242\\] { border-color: var(--brand-accent) !important; }
        .bg-\\[\\#E5B242\\]\\/10 { background-color: color-mix(in srgb, var(--brand-accent) 10%, transparent) !important; }
        .bg-\\[\\#E5B242\\]\\/15 { background-color: color-mix(in srgb, var(--brand-accent) 15%, transparent) !important; }
        
        /* Layout overrides */
        .theme-border { border-color: var(--brand-border) !important; }
        .border-b { border-bottom-color: var(--brand-border) !important; }
        .border-t { border-top-color: var(--brand-border) !important; }
        
        /* Input styling */
        input, select, textarea {
          background-color: ${brandConfig.theme === 'light-bambu' || brandConfig.theme === 'desert-sand' ? '#FFFFFF' : '#090B09'} !important;
          color: var(--brand-text) !important;
          border-color: var(--brand-border) !important;
        }

        /* Buttons fallback style */
        .btn-brand-primary {
          background-color: var(--brand-primary) !important;
          color: ${brandConfig.theme === 'light-bambu' || brandConfig.theme === 'desert-sand' ? '#FFFFFF' : '#000000'} !important;
        }

        @keyframes tab-glow-pulse {
          0%, 100% {
            background-color: var(--brand-accent);
            opacity: 1;
            box-shadow: 0 0 14px var(--brand-accent);
            transform: scale(1.02);
          }
          50% {
            background-color: var(--brand-accent);
            opacity: 0.6;
            box-shadow: 0 0 3px var(--brand-accent);
            transform: scale(0.96);
          }
        }
        .animate-tab-blink {
          animation: tab-glow-pulse 1.3s infinite ease-in-out;
        }
        @keyframes ticker-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-marquee 32s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* GLOBAL HEADER (Premium Floating Island Design with Cybernetic Amber Aura & Golden Neon Underglow) */}
      <header className="relative border-b-2 border-x border-[var(--brand-border)]/90 bg-gradient-to-b from-[var(--brand-card)] via-[var(--brand-card)]/98 to-[var(--brand-card)]/92 sticky top-0 z-50 backdrop-blur-2xl px-6 pt-[calc(env(safe-area-inset-top,32px)+16px)] pb-5 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 shadow-2xl shadow-amber-950/20 md:rounded-b-[2rem] overflow-hidden">
        
        {/* Subtle high-tech blueprint background dots inside the header */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] select-none bg-[radial-gradient(#ffd700_1.2px,transparent_1.2px)] [background-size:12px_12px]" />

        {/* Ambient background accent glow (Cybernetic Golden Neon) */}
        <div className="absolute -top-12 left-1/4 w-96 h-20 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none select-none" />

        {/* Dynamic decorative visual light-bar with highly active amber glow */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-600/20 via-amber-400 via-[var(--brand-accent)] to-amber-600/20 shadow-[0_2px_14px_rgba(245,158,11,0.6)]" />

        <div className="flex items-center gap-4.5 w-full md:w-auto relative z-10">
          {/* Logo / Extruder Symbol with glowing active ring and custom animations */}
          <div className={`p-2 bg-black/60 border-2 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shrink-0 shadow-xl ${
            printers.some(p => p.status === 'PRINTING') 
              ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-[1.06]' 
              : 'border-[var(--brand-primary)]/50'
          }`}>
            {brandConfig.customLogo ? (
              <img src={brandConfig.customLogo} alt="Logo" className="h-11 w-11 object-contain rounded-xl" referrerPolicy="no-referrer" />
            ) : brandConfig.icon === 'bambu' ? (
              <Atelier3DLogo className="h-11 w-11" />
            ) : brandConfig.icon === 'spool' ? (
              <Layers className="h-9 w-9 text-amber-400 animate-spin-slow" />
            ) : (
              <Wrench className="h-9 w-9 text-[var(--brand-primary)]" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--brand-text)] flex items-center gap-2 font-sans select-none drop-shadow-md">
              <span className="bg-gradient-to-r from-white via-amber-200 to-amber-50 bg-clip-text text-transparent">
                {brandConfig.name}
              </span>
              <span className="text-[9px] tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold px-2.5 py-0.5 rounded-full shadow-[0_2px_10px_rgba(245,158,11,0.35)] shrink-0 animate-pulse">
                v{getAppVersion()}
              </span>
            </h1>
            
            {/* Live Dashboard Subtitle, Sensor Readouts & Machinery Stats */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 font-sans">
              <p className="text-[10px] text-[var(--brand-muted)] font-extrabold tracking-wider uppercase opacity-90 flex items-center gap-1 shrink-0 select-none">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_6px_#f59e0b]" />
                Gestão Premium
              </p>
              
              <span className="text-zinc-800 text-[10px] hidden sm:inline select-none">|</span>

              {/* Greenhouse Sensors Monitor (Túnel das Estufas) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase text-sky-400 tracking-wider select-none">Estufas:</span>
                {tuyaDevices.length === 0 ? (
                  <button 
                    onClick={restoreDefaultEstufas}
                    className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-400/35 px-1.5 py-0.5 rounded-md cursor-pointer transition text-[8px] font-sans font-bold text-amber-200 select-none active:scale-95"
                    title="Nenhuma estufa ativa encontrada. Clique para restaurar as padrão."
                  >
                    <span>Restaurar Estufas ↺</span>
                  </button>
                ) : (
                  tuyaDevices.map(dev => (
                    <div 
                      key={dev.id} 
                      onClick={() => setCurrentTab(5)} 
                      className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-450/15 hover:bg-sky-500/15 hover:border-sky-400/35 px-1.5 py-0.5 rounded-md cursor-pointer transition text-[9px] font-mono text-sky-200 select-none active:scale-95"
                      title={`${dev.name} • Umidade Atual: ${dev.currentHumidity}% • Clique para configurar`}
                    >
                      <span className="relative flex h-1 w-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1 w-1 bg-sky-400"></span>
                      </span>
                      <span className="font-sans font-bold text-zinc-400 uppercase text-[7.5px]">{dev.name.replace('Estufa ', '')}:</span>
                      <span className="font-black text-[#86d4fc]">{dev.currentHumidity}%</span>
                    </div>
                  ))
                )}
              </div>

              <span className="text-zinc-800 text-[10px] hidden sm:inline select-none">|</span>

              {/* Machinery Status Badge */}
              <div 
                onClick={() => setCurrentTab(0)}
                className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 hover:bg-emerald-500/15 hover:border-emerald-550/30 px-1.5 py-0.5 rounded-md cursor-pointer transition text-[9px] font-sans active:scale-95 select-none"
                title="Lista de Impressoras Online • Clique para visualizar"
              >
                <span className="relative flex h-1 w-1">
                  <span className={`${printers.some(p => p.status === 'PRINTING') ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-400"></span>
                </span>
                <span className="font-sans font-extrabold text-zinc-400 uppercase text-[7.5px]">Máquinas:</span>
                <span className="text-emerald-350 font-black">{printers.filter(p => p.status === 'PRINTING').length}/{printers.length} ativas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global actions & running indicator */}
        <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto mt-1 md:mt-0 select-none relative z-10">
          {/* Live Clock with heartbeat action */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--brand-muted)] bg-black/50 border border-[var(--brand-border)]/80 px-4.5 py-2.5 rounded-[1.25rem] font-mono shadow-inner shadow-black/40">
            <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-semibold tracking-wider text-amber-100">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>

          {/* Extruder activity stat with database connector styling */}
          {safeGetLocalStorageItem('bambuzau_workspace_code') && (
            <div className="flex items-center gap-2.5 bg-amber-500/15 border border-amber-500/30 px-4.5 py-2.5 rounded-[1.25rem] font-mono text-xs text-zinc-200 shadow-sm shadow-amber-950/10" title={`Mudar banco de dados nas configurações: ${safeGetLocalStorageItem('bambuzau_firebase_url') || 'padrão'}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_var(--brand-accent)]"></span>
              </span>
              <span className="font-bold text-[10px] uppercase opacity-75 text-zinc-400">Workspace:</span>
              <span className="font-black font-sans tracking-wide text-amber-400">{safeGetLocalStorageItem('bambuzau_workspace_code')}</span>
            </div>
          )}
        </div>

        {/* Abstract futuristic grid lines under the header */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      </header>

      {/* 3D FILAMENT STOCK-MARKET LIVE TICKER TAPE */}
      <div 
        onClick={() => setCurrentTab(4)}
        className="w-full bg-[#080b09]/95 border-b border-[#1c2420]/80 h-7 md:h-8 flex items-center overflow-hidden cursor-pointer select-none group relative z-40 shadow-inner"
        title="Painel de Commodities de Filamento • Clique para acessar a Tab de Custos e Cotações"
      >
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-ticker flex items-center gap-10 pl-6">
            {[
              { label: "PLA Premium", price: "R$ 119,90/kg", change: "+1.4%", up: true },
              { label: "PETG Tough", price: "R$ 134,90/kg", change: "-0.5%", up: false },
              { label: "ABS Atômico", price: "R$ 98,50/kg", change: "+0.8%", up: true },
              { label: "Nylon Carbono", price: "R$ 289,00/kg", change: "+4.5%", up: true },
              { label: "TPU Flex Prime", price: "R$ 169,00/kg", change: "0.0%", up: null },
              { label: "ASA Weatherproof", price: "R$ 159,90/kg", change: "+2.1%", up: true },
              { label: "PLA Wood (Madeira)", price: "R$ 189,00/kg", change: "-1.2%", up: false },
              { label: "PLA Silk Metálico", price: "R$ 145,00/kg", change: "+1.8%", up: true }
            ].map((item, index) => (
              <span key={index} className="inline-flex items-center gap-2 text-[10px] sm:text-[10.5px] font-mono tracking-wide font-black shrink-0">
                <span className="text-zinc-400 font-sans">{item.label}</span>
                <span className="text-zinc-200">{item.price}</span>
                <span className={`inline-flex items-center gap-0.5 ${
                  item.up === true 
                    ? 'text-emerald-400' 
                    : item.up === false 
                      ? 'text-red-400' 
                      : 'text-zinc-500'
                }`}>
                  {item.up === true ? '▲' : item.up === false ? '▼' : '◀▶'} {item.change}
                </span>
                <span className="text-zinc-700 font-black font-sans ml-4 select-none">•</span>
              </span>
            ))}
            {/* Duplicate set for infinite loop */}
            {[
              { label: "PLA Premium", price: "R$ 119,90/kg", change: "+1.4%", up: true },
              { label: "PETG Tough", price: "R$ 134,90/kg", change: "-0.5%", up: false },
              { label: "ABS Atômico", price: "R$ 98,50/kg", change: "+0.8%", up: true },
              { label: "Nylon Carbono", price: "R$ 289,00/kg", change: "+4.5%", up: true },
              { label: "TPU Flex Prime", price: "R$ 169,00/kg", change: "0.0%", up: null },
              { label: "ASA Weatherproof", price: "R$ 159,90/kg", change: "+2.1%", up: true },
              { label: "PLA Wood (Madeira)", price: "R$ 189,00/kg", change: "-1.2%", up: false },
              { label: "PLA Silk Metálico", price: "R$ 145,00/kg", change: "+1.8%", up: true }
            ].map((item, index) => (
              <span key={`dup-${index}`} className="inline-flex items-center gap-2 text-[10px] sm:text-[10.5px] font-mono tracking-wide font-black shrink-0">
                <span className="text-zinc-400 font-sans">{item.label}</span>
                <span className="text-zinc-200">{item.price}</span>
                <span className={`inline-flex items-center gap-0.5 ${
                  item.up === true 
                    ? 'text-emerald-400' 
                    : item.up === false 
                      ? 'text-red-400' 
                      : 'text-zinc-500'
                }`}>
                  {item.up === true ? '▲' : item.up === false ? '▼' : '◀▶'} {item.change}
                </span>
                <span className="text-zinc-700 font-black font-sans ml-4 select-none">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* GLOBAL UPDATE NOTIFICATION BANNER */}
      {updateBanner && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 border-b border-amber-700 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl animate-bounce shrink-0">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                🚀 Nova Atualização Disponível! <span className="bg-white text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full font-mono font-semibold">v{updateBanner.version}</span>
              </p>
              <p className="text-xs text-amber-50 leading-relaxed max-w-3xl mt-0.5 font-sans">
                <strong className="text-white">Novidades:</strong> {updateBanner.releaseNotes}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (updateBanner.apkUrl) {
                  // Forçar backup automático de segurança obrigatório antes da atualização de aplicativo!
                  try {
                    const catalogItems = JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]');
                    const snapshot = {
                      timestamp: Date.now(),
                      description: `Backup de segurança obrigatório gerado antes do update para v${updateBanner.version}`,
                      data: {
                        clients: clients || [],
                        printers: printers || [],
                        orders: orders || [],
                        filamentStocks: filamentStocks || [],
                        expenses: expenses || [],
                        shoppingItems: shoppingItems || [],
                        brandConfig: brandConfig,
                        catalogItems: catalogItems
                      }
                    };
                    localStorage.setItem('bambuzau_rollback_snapshot', JSON.stringify(snapshot));
                    console.log("Cópia de segurança para retorno automático gravada com sucesso antes da atualização!");
                  } catch (e) {
                    console.warn("Falha de backup de segurança:", e);
                  }

                  const rawUrl = updateBanner.apkUrl;
                  let directUrl = rawUrl.trim();
                  
                  // Forçar conversão local do link do Google Drive para download totalmente direto
                  // USANDO O ENDEREÇO DE CDN DO USERCONTENT QUE EVITA REDIRECIONAMENTO E TELA DE LOGIN NO ANDROID
                  if (directUrl.includes('drive.google.com/file/d/')) {
                    const match = directUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      directUrl = `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`;
                    }
                  } else if (directUrl.includes('drive.google.com/open?id=') || directUrl.includes('drive.google.com/open?')) {
                    const match = directUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      directUrl = `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`;
                    }
                  } else if (directUrl.includes('dropbox.com')) {
                    let tempUrl = directUrl;
                    // Se o link for do Dropbox, limpa e corrige para o subdominio direto dl.dropboxusercontent.com
                    // que inicia downloads imediatos e limpos de pacotes sem carregar o site do Dropbox.
                    if (tempUrl.includes('www.dropbox.com')) {
                      tempUrl = tempUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
                    } else if (tempUrl.includes('dropbox.com') && !tempUrl.includes('dl.dropboxusercontent.com')) {
                      tempUrl = tempUrl.replace('://dropbox.com', '://dl.dropboxusercontent.com');
                    }
                    
                    if (tempUrl.includes('dl.dl.dropbox')) {
                      tempUrl = tempUrl.replace(/dl\.dl\.dropboxusercontent\.comusercontent\.com/g, 'dl.dropboxusercontent.com');
                    }

                    if (tempUrl.includes('dl=0')) {
                      tempUrl = tempUrl.replace('dl=0', 'dl=1');
                    } else if (!tempUrl.includes('dl=1') && !tempUrl.includes('raw=1')) {
                      tempUrl = tempUrl + (tempUrl.includes('?') ? '&dl=1' : '?dl=1');
                    }
                    directUrl = tempUrl;
                  }

                  // Notificar sobre permissões caso necessário
                  if (rawUrl.includes('drive.google.com')) {
                    console.log('Convertido para link direto de bypass CDN do Drive:', directUrl);
                  }
                  
                  // Inicia o download usando múltiplos triggers para garantir compatibilidade máxima com Android WebViews, iframes e navegadores desktop
                  try {
                    const link = document.createElement('a');
                    link.href = directUrl;
                    link.target = '_blank';
                    link.setAttribute('download', '');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (e) {
                    console.error("Erro no clique de download programático:", e);
                  }

                  // Também navega na página atual do iframe/webview como fallback robusto para interceptadores
                  window.location.href = directUrl;
                } else {
                  alert('A URL de download do instalador (APK) não foi configurada.');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-amber-700 font-extrabold text-xs rounded-xl shadow border border-amber-200 hover:bg-amber-50 transition cursor-pointer text-center"
            >
              Baixar e Atualizar 📥
            </button>
            <button
              onClick={() => {
                if (updateBanner) {
                  localStorage.setItem('bambuzau_dismissed_version', updateBanner.version);
                  localStorage.setItem('bambuzau_dismissed_timestamp', updateBanner.timestamp.toString());
                  localStorage.setItem('bambuzau_dismissed_time', Date.now().toString());
                }
                setUpdateBanner(null);
              }}
              className="px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold rounded-lg transition shrink-0"
            >
              Depois
            </button>
          </div>
        </div>
      )}

      {/* TWO-PANEL CONTENT OR CENTRAL CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-28 space-y-4">
        {/* GLOBAL STOCK WARNING BANNER - PLACED ABOVE EVERYTHING ONLY IN PAINEL */}
        {currentTab === 0 && (() => {
          if (dismissedStockAlert) return null;
          const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
          if (lowFilaments.length > 0) {
            return (
              <div 
                className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/20 text-[#FF6B6B] rounded-xl shadow transition duration-200 animate-fade-in mb-2"
                id="global-stock-warning-banner"
              >
                <div className="flex items-center gap-2.5 min-w-0" id="low-stock-desc-container">
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-zinc-105" style={{ color: '#F1F4EE' }}>
                    <strong className="text-red-400 font-extrabold">Estoque Baixo:</strong> {lowFilaments.length} {lowFilaments.length === 1 ? 'bobina' : 'bobinas'} abaixo do mínimo!
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      localStorage.setItem('bambuzau_costs_subtab_override', 'STOCK');
                      setCurrentTab(4);
                    }}
                    className="px-3 py-1.5 text-[10px] font-black bg-red-500 hover:bg-red-600 text-white rounded-lg transition shrink-0 active:scale-98 animate-pulse"
                  >
                    Estoque 🧵
                  </button>
                  <button 
                    onClick={() => setDismissedStockAlert(true)}
                    className="p-1 px-2 hover:bg-white/10 rounded-lg text-zinc-450 hover:text-white transition text-xs font-bold font-sans"
                    title="Fechar alerta"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* FLOAT CLOSABLE LIVE OPORTUNIDADE DE COMPRAS NOTIFICATION BANNER ONLY IN PAINEL */}
        {currentTab === 0 && (() => {
          if (dismissedPriceAlert) return null;
          
          // Alert config limits
          let alertLimitPla = 85;
          let alertLimitPetg = 80;
          let alertLimitTpu = 115;
          try {
            alertLimitPla = parseFloat(localStorage.getItem('bambuzau_alert_price_pla') || '85');
            alertLimitPetg = parseFloat(localStorage.getItem('bambuzau_alert_price_petg') || '80');
            alertLimitTpu = parseFloat(localStorage.getItem('bambuzau_alert_price_tpu') || '115');
          } catch(e) {}

          // Dynamic detection of lowest price from cached Google Shopping quotes
          let lowestPla = 75.00;
          let lowestPetg = 72.90;
          let lowestTpu = 104.90;

          try {
            const cachedStr = localStorage.getItem('bambuzau_cached_quotes');
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              if (Array.isArray(cached)) {
                cached.forEach((group: any) => {
                  if (group.offers && Array.isArray(group.offers) && group.offers.length > 0) {
                    const prices = group.offers.map((o: any) => o.price).filter((p: number) => p > 0);
                    if (prices.length > 0) {
                      const minimum = Math.min(...prices);
                      if (group.type === 'PLA') lowestPla = minimum;
                      if (group.type === 'PETG') lowestPetg = minimum;
                      if (group.type === 'TPU') lowestTpu = minimum;
                    }
                  }
                });
              }
            }
          } catch (e) {}

          const isPlaAlert = lowestPla < alertLimitPla;
          const isPetgAlert = lowestPetg < alertLimitPetg;
          const isTpuAlert = lowestTpu < alertLimitTpu;

          if (isPlaAlert || isPetgAlert || isTpuAlert) {
            let alertMsg = "";
            if (isPetgAlert) alertMsg = `PETG por R$ ${lowestPetg.toFixed(2)} (abaixo de R$ ${alertLimitPetg.toFixed(2)})`;
            else if (isPlaAlert) alertMsg = `PLA por R$ ${lowestPla.toFixed(2)} (abaixo de R$ ${alertLimitPla.toFixed(2)})`;
            else if (isTpuAlert) alertMsg = `TPU por R$ ${lowestTpu.toFixed(2)} (abaixo de R$ ${alertLimitTpu.toFixed(2)})`;

            return (
              <div 
                className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-[#34D399] rounded-xl shadow transition duration-200 animate-slide-in relative mb-2"
                id="global-price-opportunity-banner"
              >
                <div className="flex items-center gap-2.5 min-w-0" id="opp-desc-container">
                  <span className="text-sm shrink-0 animate-bounce">🔥</span>
                  <span className="text-xs font-bold text-zinc-105" style={{ color: '#F1F4EE' }}>
                    <strong className="text-emerald-400 font-extrabold">Oportunidade:</strong> {alertMsg}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      localStorage.setItem('bambuzau_costs_subtab_override', 'QUOTE');
                      setCurrentTab(4);
                    }}
                    className="px-2.5 py-1.5 bg-[#34D399] hover:bg-emerald-500 text-black text-[10px] font-black rounded-lg transition uppercase tracking-wider"
                  >
                    Ver Cotações 📈
                  </button>
                  <button 
                    onClick={() => setDismissedPriceAlert(true)}
                    className="p-1 px-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition text-xs font-bold font-sans"
                    title="Fechar oportunidade"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {currentTab === 0 && (
          <DashboardTab
            orders={orders}
            printers={printers}
            filamentStocks={filamentStocks}
            expenses={expenses}
            shoppingItems={shoppingItems}
            clients={clients}
            onSelectTab={setCurrentTab}
            onUpdatePrinter={handleUpdatePrinter}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {currentTab === 1 && (
          <ProductionTab
            orders={orders}
            printers={printers}
            filamentStocks={filamentStocks}
            clients={clients}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onSimulateTick={handleSimulateTick}
            onUpdateFilament={handleUpdateFilamentStock}
            onUpdatePrinter={handleUpdatePrinter}
          />
        )}

        {currentTab === 2 && (
          <ClientsTab
            clients={clients}
            printers={printers}
            orders={orders}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onAddPrinter={handleAddPrinter}
            onUpdatePrinter={handleUpdatePrinter}
            onDeletePrinter={handleDeletePrinter}
            onAddOrder={handleAddOrder}
          />
        )}

        {currentTab === 3 && (
          <IntegrationTab
            onImportOrder={handleImportExternalOrder}
            importedExternalIds={importedExternalIds}
          />
        )}

        {currentTab === 4 && (
          <CostsTab
            filamentStocks={filamentStocks}
            shoppingItems={shoppingItems}
            expenses={expenses}
            onAddFilament={handleAddFilamentStock}
            onUpdateFilament={handleUpdateFilamentStock}
            onAddShoppingItem={handleAddShoppingItem}
            onToggleShoppingItem={handleToggleShoppingItem}
            onDeleteShoppingItem={handleDeleteShoppingItem}
            onDeleteFilament={handleDeleteFilamentStock}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            suppliesStocks={suppliesStocks}
            setSuppliesStocks={setSuppliesStocks}
            lastAuditDate={lastAuditDate}
            setLastAuditDate={setLastAuditDate}
          />
        )}

        {currentTab === 5 && (
          <SettingsTab
            clients={clients}
            printers={printers}
            orders={orders}
            filamentStocks={filamentStocks}
            expenses={expenses}
            shoppingItems={shoppingItems}
            onImportAllData={handleImportAllData}
            brandConfig={brandConfig}
            onUpdateBrandConfig={setBrandConfig}
            tuyaDevices={tuyaDevices}
            onUpdateTuyaDevices={setTuyaDevices}
          />
        )}

        {currentTab === 6 && (
          <SoldTab
            orders={orders}
            clients={clients}
          />
        )}
      </main>

      {/* REVOLUTIONARY LOWER NAVIGATION BAR (Android Material 3 capsule feel) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t theme-border bg-[var(--brand-card)] py-2 px-1 z-40 shadow-2xl flex justify-around items-center transition-colors">
        <button
          onClick={() => setCurrentTab(0)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_dashboard"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 0 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <Home className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 0 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Painel</span>
        </button>

        <button
          onClick={() => setCurrentTab(1)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_production"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 1 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <Activity className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 1 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Produção</span>
        </button>

        <button
          onClick={() => setCurrentTab(6)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_sold"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 6 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 6 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Histórico</span>
        </button>

        <button
          onClick={() => setCurrentTab(2)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_clients"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 2 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <Users className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 2 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Clientes</span>
        </button>

        <button
          onClick={() => setCurrentTab(3)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_integration"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 3 
              ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' 
              : pendingOrdersCount > 0 
              ? 'bg-[var(--brand-accent)] text-black font-bold animate-tab-blink' 
              : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <GitPullRequest className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 3 
              ? 'text-[var(--brand-primary)] font-black' 
              : pendingOrdersCount > 0 
              ? 'text-[var(--brand-accent)] font-bold animate-pulse' 
              : 'text-[var(--brand-muted)]'
          }`}>
            Pedidos{pendingOrdersCount > 0 && ` (${pendingOrdersCount})`}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab(4)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_costs"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 4 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <Layers className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 4 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Gestão</span>
        </button>

        <button
          onClick={() => setCurrentTab(5)}
          className="flex flex-col items-center gap-1 text-center group cursor-pointer focus:outline-none"
          id="btn_tab_settings"
        >
          <div className={`px-2 md:px-5 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentTab === 5 ? 'bg-[var(--brand-primary)] text-black font-extrabold shadow-sm scale-102' : 'text-[var(--brand-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
          }`}>
            <Settings className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[10px] tracking-wide transition-colors ${
            currentTab === 5 ? 'text-[var(--brand-primary)] font-black' : 'text-[var(--brand-muted)]'
          }`}>Ajustes</span>
        </button>
      </nav>

      {/* OK LOJA VOICE & SMART AI ASSISTANT (v3.2.3.5 Update) */}
      <OkLojaAssistant 
        orders={orders}
        printers={printers}
        clients={clients}
        filamentStocks={filamentStocks}
        brandName={brandConfig.name}
      />

      {/* ONBOARDING DIALOG / WELCOME WIZARD */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto" id="onboarding_modal_overlay">
          <div className="bg-[#131815] border border-[var(--brand-primary)]/40 p-6 sm:p-8 rounded-3xl max-w-2xl w-full text-[var(--brand-text)] flex flex-col gap-6 shadow-2xl relative" style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
            
            {/* Live pulsing glowing decorative circles */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 px-3 py-1 rounded-full text-xs text-[var(--brand-primary)] font-mono">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              <span>Personalização Ativa</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[var(--brand-accent)] animate-spin" style={{ animationDuration: '6s' }} />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--brand-text)]">
                  Configure o Seu Ateliê 3D 🛠️
                </h2>
              </div>
              <p className="text-xs text-[var(--brand-muted)] leading-relaxed">
                Este aplicativo completo gerencia a sua produção de peças, fila de impressão, estoque de filamentos e cálculo de despesas. 
                Configure o nome da sua marca e sua paleta de cores inicial abaixo. <strong className="text-[var(--brand-text-accent)]">Você poderá mudar livremente qualquer opção depois nos Ajustes!</strong>
              </p>
            </div>

            {/* FORM CONTAINER */}
            <div className="space-y-4">
              
              {/* STORE NAME FIELD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Nome do seu Ateliê / Loja de Impressão 3D
                </label>
                <input
                  type="text"
                  required
                  value={brandConfig.name}
                  onChange={(e) => setBrandConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0C0E0D] border theme-border px-4 py-3 rounded-2xl text-sm font-bold text-[var(--brand-text)] outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition"
                  placeholder="Ex: Impressões Incríveis, 3D Lab, Ateliê do João..."
                  id="onboarding_input_name"
                />
                <p className="text-[10px] text-[var(--brand-muted)] italic">
                  O nome digitado atualizará instantaneamente o título do aplicativo no cabeçalho em tempo real!
                </p>
              </div>

              {/* COLORS/THEMES GRID */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Escolha o Estilo de Cores (Paleta Visual)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'dark-organic', name: 'Natural Sálvia', desc: 'Sálvia Orgânico & Ouro', primary: '#637E55', accent: '#E2B144' },
                    { key: 'light-bambu', name: 'Areia Natural', desc: 'Areia Suave & Cedro', primary: '#4F6744', accent: '#C6942C' },
                    { key: 'dark-slate', name: 'Tech Slate', desc: 'Cobalto & Chumbo', primary: '#4A85D2', accent: '#A2ACB9' },
                    { key: 'gold-royal', name: 'Luxo Imperial', desc: 'Preto & Ouro Real', primary: '#D59A30', accent: '#B27C17' },
                    { key: 'cyber-neon', name: 'Cyberpunk', desc: 'Neon Roxo & Rosa', primary: '#A855F7', accent: '#F43F5E' },
                    { key: 'lava-orange', name: 'Lava Sunset', desc: 'Solar Laranja', primary: '#F97316', accent: '#FACC15' },
                    { key: 'mint-forest', name: 'Mint Green', desc: 'Menta & Petróleo', primary: '#14B8A6', accent: '#34D399' },
                    { key: 'obsidian-crimson', name: 'Forja Escura', desc: 'Matte Preto & Vermelho', primary: '#EF4444', accent: '#B91C1C' },
                    { key: 'cool-ocean', name: 'Cool Ocean', desc: 'Ciano & Azul Mar', primary: '#06B6D4', accent: '#3B82F6' },
                    { key: 'royal-amethyst', name: 'Imperial Violet', desc: 'Ametista & Rosa', primary: '#A855F7', accent: '#EC4899' },
                    { key: 'desert-sand', name: 'Dunas de Areia', desc: 'Terracota Solar', primary: '#C2410C', accent: '#F59E0B' },
                    { key: 'sakura-cherry', name: 'Sakura Blossom', desc: 'Cerejeira & Magma', primary: '#EC4899', accent: '#F472B6' }
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setBrandConfig(prev => ({ ...prev, theme: t.key }))}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-2 justify-between cursor-pointer transition-all ${
                        brandConfig.theme === t.key
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 ring-2 ring-[var(--brand-primary)] shadow-md translate-y-[-1px]'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10.5px] font-extrabold leading-tight text-[var(--brand-text)]">{t.name}</p>
                        <p className="text-[8.5px] text-[var(--brand-muted)] opacity-80">{t.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: t.primary }} />
                        <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: t.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* APP SYMBOL / LOGOTIPO CHOICES */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Logotipo / Arte do Cabeçalho
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'spool', label: 'Carretel de Fio', desc: 'Visual 3D Puro' },
                    { key: 'extruder', label: 'Bico de Extrusão', desc: 'Estilo Industrial' },
                    { key: 'bambu', label: 'Cubo Geometric', desc: 'Ateliê Oficial' }
                  ].map((ic) => (
                    <button
                      key={ic.key}
                      onClick={() => setBrandConfig(prev => ({ ...prev, icon: ic.key as any }))}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 justify-center ${
                        brandConfig.icon === ic.key
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)]'
                          : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--brand-text)]">{ic.label}</span>
                      <span className="text-[9px] text-[var(--brand-muted)]">{ic.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* FOOTER W/ FINALIZE ACTION */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-white/10">
              <span className="text-[10.5px] text-[var(--brand-muted)] text-center sm:text-left">
                📦 Todas as simulações, fila e finanças serão mantidas de forma segura no seu navegador.
              </span>
              
              <button
                onClick={() => {
                  if (!brandConfig.name.trim()) {
                    alert('Por favor digite um nome para seu ateliê.');
                    return;
                  }
                  localStorage.setItem('atelier_setup_completed', 'true');
                  localStorage.setItem('bambuzau_brand_config', JSON.stringify(brandConfig));
                  setShowSetupModal(false);
                }}
                className="w-full sm:w-auto px-8 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] text-white font-extrabold rounded-2xl shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                id="btn_complete_atelier_setup"
              >
                Concluir & Entrar no Painel 🚀
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
