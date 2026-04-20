/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBudgetCalculations } from './hooks/useBudgetCalculations';
import { 
  Wallet, 
  PiggyBank, 
  Trash2, 
  Plus, 
  History, 
  Moon, 
  Sun,
  Cat,
  Monitor,
  CheckCircle2,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Receipt,
  Settings,
  ArrowRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  X,
  HelpCircle,
  Download,
  Upload
} from 'lucide-react';
import { Expense, HistoryRecord, ThemeType, ThemeStyles, MonthData, CurrencyType, Language } from './types.ts';

const TRANSLATIONS = {
  RU: {
    appSubtitle: "Управление личным капиталом",
    period: "Период",
    incomeTitle: "Ваш общий доход",
    savingsTitle: "Цель накоплений",
    expensesTitle: "Операционные расходы",
    addExpense: "Добавить",
    noExpenses: "Список пуст",
    expenseNameHeader: "Название",
    expenseAmountHeader: "Сумма",
    expenseNamePlaceholder: "Категория",
    monthlyTotal: "Итог за месяц",
    updatePeriod: "Обновить итоги",
    savePeriod: "Зафиксировать итоги и перейти",
    availableBalance: "Доступный баланс",
    freeMoneySub: "Свободные средства",
    archiveTitle: "Архив периодов",
    historyEmpty: "История пуста, записей пока нет",
    savedToFund: "В копилку:",
    viewAllHistory: "Просмотреть всю историю",
    totalFund: "Общий объем фонда",
    settingsTitle: "Настройки",
    language: "Язык интерфейса",
    currency: "Валюта",
    includeLeftover: "Учёт остатка",
    leftoverTooltip: "Неизрасходованные средства в конце месяца будут автоматически суммироваться с общим фондом накоплений.",
    exportData: "Экспорт данных",
    downloadJson: "Скачать JSON",
    importData: "Импорт данных",
    uploadBtn: "Загрузить",
    themeTitle: "Тема оформления",
    importSuccess: "Данные успешно импортированы!",
    importError: "Ошибка при чтении файла. Убедитесь, что это корректный JSON файл резервной копии.",
    incomeRequired: "Добавьте доход перед сохранением периода.",
    overspent: "Перерасход:",
    fullHistoryTitle: "Вся история"
  },
  EN: {
    appSubtitle: "Personal Wealth Management",
    period: "Period",
    incomeTitle: "Total Income",
    savingsTitle: "Savings Goal",
    expensesTitle: "Operating Expenses",
    addExpense: "Add",
    noExpenses: "List is empty",
    expenseNameHeader: "Name",
    expenseAmountHeader: "Amount",
    expenseNamePlaceholder: "Category",
    monthlyTotal: "Monthly Total",
    updatePeriod: "Update results",
    savePeriod: "Save results and proceed",
    availableBalance: "Available Balance",
    freeMoneySub: "Free funds",
    archiveTitle: "Period Archive",
    historyEmpty: "History is empty, no records yet",
    savedToFund: "Saved:",
    viewAllHistory: "View full history",
    totalFund: "Total Savings Fund",
    settingsTitle: "Settings",
    language: "Interface Language",
    currency: "Currency",
    includeLeftover: "Include Leftover",
    leftoverTooltip: "Unspent funds at the end of the month will be automatically added to the total savings fund.",
    exportData: "Export Data",
    downloadJson: "Download JSON",
    importData: "Import Data",
    uploadBtn: "Upload",
    themeTitle: "Theme",
    importSuccess: "Data imported successfully!",
    importError: "File read error. Ensure this is a valid JSON backup file.",
    incomeRequired: "Please add income before saving the period.",
    overspent: "Overspent:",
    fullHistoryTitle: "Full History"
  }
};

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('budget_language') as Language) || 'RU';
  });
  const t = TRANSLATIONS[language];
  // --- PERIOD MANAGEMENT ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const periodKey = useMemo(() => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`, [currentDate]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- STATE ---
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('budget_theme');
    if (saved === 'light-grey' || saved === 'elegant-dark' || !saved) return 'dark';
    return saved as ThemeType;
  });

  const [currency, setCurrency] = useState<CurrencyType>(() => {
    return (localStorage.getItem('budget_currency') as CurrencyType) || 'RUB';
  });
  
  const [includeLeftover, setIncludeLeftover] = useState<boolean>(() => {
    return localStorage.getItem('budget_include_leftover') !== 'false';
  });
  
  // All monthly data stored in one object
  const [allData, setAllData] = useState<Record<string, MonthData>>(() => {
    try {
      const saved = localStorage.getItem('budget_full_data');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    const nowKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return {
      [nowKey]: {
        income: 0,
        savingsGoal: 0,
        expenses: []
      }
    };
  });

  // Current derivatives
  const currentData = useMemo(() => {
    const d = allData[periodKey];
    return {
      income: d?.income || 0,
      savingsGoal: d?.savingsGoal || 0,
      expenses: d?.expenses || []
    };
  }, [allData, periodKey]);

  const sortedExpenses = useMemo(() => {
    return [...(currentData.expenses || [])].sort((a, b) => b.amount - a.amount);
  }, [currentData.expenses]);

  // computed auto-history (single source of truth derivation)
  const history = useMemo(() => {
    return Object.entries(allData)
      .filter(([_, data]: [string, MonthData]) => (data.income || 0) > 0 || (data.expenses && data.expenses.length > 0))
      .map(([key, data]: [string, MonthData]) => {
        const [year, month] = key.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const dLoc = language === 'RU' ? 'ru-RU' : 'en-US';
        const formattedDate = dateObj.toLocaleDateString(dLoc, { month: 'long', year: 'numeric' });
        
        const totalExp = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
        const leftover = (data.income || 0) - totalExp - (data.savingsGoal || 0);

        return {
          id: key,
          monthKey: key,
          date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
          income: data.income || 0,
          totalExpenses: totalExp,
          saved: data.savingsGoal || 0,
          leftover: leftover
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [allData, language]);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('budget_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('budget_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('budget_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('budget_include_leftover', String(includeLeftover)); }, [includeLeftover]);
  
  // Debounced storage for allData
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('budget_full_data', JSON.stringify(allData));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [allData]);

  // --- DERIVATIVES ---
  const currencySymbol = useMemo(() => ({ RUB: '₽', USD: '$', EUR: '€' })[currency], [currency]);
  
  const { totalExpenses, freeMoney, totalSavedEver } = useBudgetCalculations(currentData, history, includeLeftover);
  
  const isMonthInHistory = useMemo(() => history.some(h => h.monthKey === periodKey), [history, periodKey]);

  // --- HANDLERS ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = useCallback(() => {
    const exportObj = {
      allData,
      currency,
      includeLeftover,
      theme,
      language
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `eoplaner_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [allData, currency, includeLeftover, theme, language]);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.allData) setAllData(importedData.allData);
        // Deprecated 'history' is dynamically mapped now, avoiding setHistory.
        if (importedData.currency) setCurrency(importedData.currency);
        if (importedData.language) setLanguage(importedData.language);
        if (importedData.includeLeftover !== undefined) setIncludeLeftover(importedData.includeLeftover);
        if (importedData.theme) setTheme(importedData.theme);
        alert(t.importSuccess);
        setShowSettings(false);
      } catch (err) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [t]);

  const updateCurrentMonth = useCallback((updates: Partial<MonthData>) => {
    setAllData(prev => ({
      ...prev,
      [periodKey]: {
        ...(prev[periodKey] || { income: 0, savingsGoal: 0, expenses: [] }),
        ...updates
      }
    }));
  }, [periodKey]);

  const handleAddExpense = useCallback(() => {
    const newId = crypto.randomUUID();
    setAllData(prev => {
      const currentExps = prev[periodKey]?.expenses || [];
      return {
        ...prev,
        [periodKey]: {
          ...(prev[periodKey] || { income: 0, savingsGoal: 0 }),
          expenses: [...currentExps, { id: newId, name: '', amount: 0 }]
        }
      };
    });
  }, [periodKey]);

  const handleUpdateExpense = useCallback((id: string | number, field: keyof Expense, value: string | number) => {
    setAllData(prev => {
      const currentExps = prev[periodKey]?.expenses || [];
      return {
        ...prev,
        [periodKey]: {
          ...prev[periodKey],
          expenses: currentExps.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }
      };
    });
  }, [periodKey]);

  const handleSortExpenses = useCallback(() => {
    setAllData(prev => {
      const currentExps = prev[periodKey]?.expenses || [];
      const sorted = [...currentExps].sort((a, b) => b.amount - a.amount);
      return {
        ...prev,
        [periodKey]: { ...prev[periodKey], expenses: sorted }
      };
    });
  }, [periodKey]);

  const handleRemoveExpense = useCallback((id: string | number) => {
    setAllData(prev => {
      const currentExps = prev[periodKey]?.expenses || [];
      return {
        ...prev,
        [periodKey]: { ...prev[periodKey], expenses: currentExps.filter(exp => exp.id !== id) }
      };
    });
  }, [periodKey]);

  const handleChangeMonth = useCallback((delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }, []);

  const handleJumpToMonth = useCallback((year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
    setShowCalendar(false);
  }, []);

  const handleCloseMonth = useCallback(() => {
    const currentIncome = allData[periodKey]?.income || 0;
    const currentExps = allData[periodKey]?.expenses || [];
    
    if (currentIncome === 0) {
      alert(t.incomeRequired);
      return;
    }
    
    if (!isMonthInHistory) {
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!allData[nextKey]) {
        setAllData(prev => ({
          ...prev,
          [nextKey]: {
            income: 0,
            savingsGoal: 0,
            // Carry over expenses configuration but reset amounts and generate new IDs
            expenses: currentExps.map(e => ({ ...e, amount: 0, id: crypto.randomUUID() }))
          }
        }));
      }
      setCurrentDate(nextDate);
    }
  }, [allData, periodKey, isMonthInHistory, currentDate, t.incomeRequired]);

  // --- THEME SYLES ---
  const accent = useMemo(() => {
    if (theme === 'pink') {
      return {
        text: 'text-pink-500',
        bg: 'bg-pink-500',
        bgHover: 'hover:bg-pink-500',
        bgButton: 'bg-pink-600 hover:bg-pink-500',
        border: 'border-pink-500',
        borderFocus: 'focus:border-pink-500',
        bgLight: 'bg-pink-500/10',
        borderLight: 'border-pink-500/20',
        cardGradient: 'from-pink-500 to-rose-900',
        cardTextLight: 'text-pink-100',
        shadowObj: 'shadow-pink-500/10',
        glow1Dark: 'bg-pink-400/20',
        glow1Light: 'bg-pink-100/10',
        glow2Dark: 'bg-pink-300/10',
        glow2Light: 'bg-pink-50/5',
        groupHoverText: 'group-hover:text-pink-500',
        textLight: 'text-pink-400',
        bgHoverLight: 'hover:bg-pink-500/20',
        bgActiveBlock: 'bg-pink-50',
        textActiveBlock: 'text-pink-600',
        borderActiveBlock: 'border-pink-200',
        bgActiveHover: 'hover:bg-pink-100',
        textActiveHover: 'hover:text-pink-700',
        hoverBorderLight: 'hover:border-pink-500/40',
        glowBgHover: 'hover:bg-pink-500/10'
      };
    }
    return {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500',
      bgHover: 'hover:bg-emerald-500',
      bgButton: 'bg-emerald-600 hover:bg-emerald-500',
      border: 'border-emerald-500',
      borderFocus: 'focus:border-emerald-500',
      bgLight: 'bg-emerald-500/10',
      borderLight: 'border-emerald-500/20',
      cardGradient: 'from-emerald-600 to-emerald-950',
      cardTextLight: 'text-emerald-100',
      shadowObj: 'shadow-emerald-500/10',
      glow1Dark: 'bg-emerald-400/20',
      glow1Light: 'bg-emerald-100/10',
      glow2Dark: 'bg-emerald-300/10',
      glow2Light: 'bg-emerald-50/5',
      groupHoverText: 'group-hover:text-emerald-500',
      textLight: 'text-emerald-400',
      bgHoverLight: 'hover:bg-emerald-500/20',
      bgActiveBlock: 'bg-emerald-50',
      textActiveBlock: 'text-emerald-600',
      borderActiveBlock: 'border-emerald-200',
      bgActiveHover: 'hover:bg-emerald-100',
      textActiveHover: 'hover:text-emerald-700',
      hoverBorderLight: 'hover:border-emerald-500/40',
      glowBgHover: 'hover:bg-emerald-500/10'
    };
  }, [theme]);

  const themeStyles = useMemo((): ThemeStyles => {
    switch(theme) {
      case 'dark': 
        return { 
          bg: 'bg-[#121212]', 
          text: 'text-[#e0e0e0]', 
          card: 'bg-[#1e1e1e] border-gray-800 shadow-xl shadow-black/20', 
          input: `bg-[#2c2c2c] border-gray-700 text-white placeholder-gray-500 ${theme === 'pink' ? 'focus:border-pink-500' : 'focus:border-emerald-500'}`, 
          divider: 'border-gray-800',
          muted: 'text-gray-400'
        };
      case 'pink':
        return { 
          bg: 'bg-[#fffafd]', 
          text: 'text-gray-900', 
          card: 'bg-white border-pink-100 shadow-sm', 
          input: 'bg-white border-pink-200 text-black placeholder-gray-400 focus:border-pink-500', 
          divider: 'border-pink-100',
          muted: 'text-gray-500'
        };
      default: // light
        return { 
          bg: 'bg-white', 
          text: 'text-gray-900', 
          card: 'bg-[#fcfcfc] border-gray-200 shadow-sm', 
          input: 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-emerald-500', 
          divider: 'border-gray-200',
          muted: 'text-gray-500'
        };
    }
  }, [theme]);

  const isLight = theme === 'light' || theme === 'pink';
  const primaryColorCls = accent.text;
  const primaryBgCls = accent.bg;
  const primaryBorderCls = accent.border;
  const contrastText = isLight ? 'text-gray-900' : 'text-white';
  const contrastMuted = isLight ? 'text-gray-400' : 'text-white/40';

  const balanceCardNode = (
    <div className={`rounded-3xl p-8 relative overflow-hidden flex flex-col shadow-2xl bg-gradient-to-br ${accent.cardGradient} ${accent.shadowObj} text-white min-h-[220px] justify-center`}>
      <div className="relative z-10 overflow-hidden w-full">
        <h3 className={`text-sm md:text-base uppercase tracking-[0.3em] opacity-80 mb-6 font-black ${accent.cardTextLight}`}>{t.availableBalance}</h3>
        <div className="font-mono font-black leading-none tracking-tighter flex flex-wrap items-end gap-x-3 gap-y-2 w-full overflow-hidden">
          <span className="text-6xl md:text-7xl break-all">{freeMoney.toLocaleString()}</span>
          <span className="text-2xl md:text-3xl opacity-50 font-normal shrink-0 pb-1">{currencySymbol}</span>
        </div>
      </div>
      {/* Background Decoration */}
      <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[80px] ${!isLight ? accent.glow1Dark : accent.glow1Light}`} />
      <div className={`absolute left-0 top-0 w-20 h-20 rounded-full blur-[60px] ${!isLight ? accent.glow2Dark : accent.glow2Light}`} />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeStyles.bg} ${themeStyles.text}`}>
      
      {/* HEADER */}
      <header className={`h-20 border-b ${themeStyles.divider} px-6 md:px-10 flex items-center justify-between`}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            <span className={contrastText}>eo</span><span className={accent.text}>Planer</span>
          </h1>
          <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${contrastMuted}`}>{t.appSubtitle}</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleChangeMonth(-1)}
              className={`p-2 rounded-full border ${themeStyles.divider} hover:bg-white/5 transition-all ${isLight ? 'text-gray-400 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div 
              className="flex items-center gap-3 group cursor-pointer" 
              onClick={() => setShowCalendar(true)}
            >
              <CalendarIcon className={`w-6 h-6 transition-all ${isLight ? `text-gray-300 ${accent.groupHoverText}` : `opacity-40 group-hover:opacity-100 ${accent.groupHoverText}`}`} />
              <div className="flex flex-col">
                <p className={`text-[10px] uppercase text-left font-bold ${contrastMuted}`}>{t.period}</p>
                <p className={`text-sm font-semibold transition-colors whitespace-nowrap ${contrastText} ${accent.groupHoverText}`}>
                  {currentDate.toLocaleDateString(language === 'RU' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleChangeMonth(1)}
              className={`p-2 rounded-full border ${themeStyles.divider} hover:bg-white/5 transition-all ${isLight ? 'text-gray-400 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              onClick={() => setShowSettings(true)}
              className={`w-10 h-10 rounded-full border ${themeStyles.divider} flex items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 transition-colors`}
            >
              <Settings className={`w-4 h-4 ${!isLight ? 'text-white' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* MOBILE BALANCE CARD (Renders first on narrow screens) */}
        <div className="block lg:hidden">
          {balanceCardNode}
        </div>

        {/* LEFT COLUMN */}
        <section className="lg:w-[60%] flex flex-col gap-10">
          
          {/* Income & Goal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-widest opacity-50 font-bold">
                {t.incomeTitle}
              </label>
              <div className="relative group">
                <input 
                  type="number" min="0" 
                  value={currentData.income || ''} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    updateCurrentMonth({ income: isNaN(val) ? 0 : Math.max(0, val) });
                  }}
                  placeholder={`0 ${currencySymbol}`}
                  className={`w-full p-4 pr-10 rounded-xl border font-mono text-lg transition-all outline-none ${themeStyles.input}`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${primaryColorCls}`}>{currencySymbol}</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-widest opacity-50 font-bold">
                {t.savingsTitle}
              </label>
              <div className="relative group">
                <input 
                  type="number" min="0"
                  value={currentData.savingsGoal || ''} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    updateCurrentMonth({ savingsGoal: isNaN(val) ? 0 : Math.max(0, val) });
                  }}
                  placeholder={`0 ${currencySymbol}`}
                  className={`w-full p-4 pr-10 rounded-xl border font-mono text-lg transition-all outline-none ${themeStyles.input}`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${primaryColorCls}`}>{currencySymbol}</span>
              </div>
            </div>
          </div>

          {/* Expenses Card */}
          <div className={`rounded-2xl border flex-1 flex flex-col overflow-hidden ${themeStyles.card}`}>
            <div className={`p-4 border-b ${themeStyles.divider} flex justify-between items-center`}>
              <h2 className="text-xs uppercase tracking-[0.2em] font-black opacity-80">{t.expensesTitle}</h2>
              <button 
                onClick={handleAddExpense}
                className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all flex items-center gap-1 ${accent.bgLight} ${accent.text} ${accent.borderLight}`}
              >
                <Plus className="w-3 h-3" />
                {t.addExpense}
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 h-full min-h-[280px] custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {sortedExpenses.length === 0 ? (
                  <div className="h-full min-h-[280px] flex items-center justify-center text-[10px] uppercase tracking-widest opacity-30">
                    {t.noExpenses}
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead className={`sticky top-0 text-[10px] uppercase text-left z-10 ${
                      theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'
                    }`}>
                      <tr className={`border-b ${themeStyles.divider}`}>
                        <th className="p-4 font-normal opacity-40">{t.expenseNameHeader}</th>
                        <th className="p-4 font-normal text-right opacity-40">{t.expenseAmountHeader}</th>
                        <th className="p-1 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {sortedExpenses.map((exp) => (
                        <motion.tr 
                          key={exp.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-b ${themeStyles.divider} hover:bg-white/5 transition-colors group h-[56px]`}
                        >
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={exp.name} 
                              onChange={e => handleUpdateExpense(exp.id, 'name', e.target.value)}
                              placeholder={t.expenseNamePlaceholder}
                              className={`w-full bg-transparent p-2 outline-none text-sm ${contrastText}`}
                            />
                          </td>
                          <td className="p-2 text-right">
                             <input 
                              type="number" min="0"
                              value={exp.amount || ''} 
                              onChange={e => {
                                const val = Number(e.target.value);
                                handleUpdateExpense(exp.id, 'amount', isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              onBlur={handleSortExpenses}
                              placeholder="0"
                              className={`w-full bg-transparent p-2 outline-none text-right text-sm font-mono ${contrastText}`}
                            />
                          </td>
                          <td className="p-1 pr-4">
                            <button 
                              onClick={() => handleRemoveExpense(exp.id)}
                              className="opacity-0 group-hover:opacity-60 touch-visible hover:!opacity-100 transition-opacity p-2 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </AnimatePresence>
            </div>
            
            <div className={`p-6 border-t ${themeStyles.divider} mt-auto flex justify-between items-center`}>
              <div className="text-xs uppercase opacity-50 tracking-widest">{t.monthlyTotal}</div>
              <div className={`text-2xl font-mono font-bold ${contrastText}`}>{totalExpenses.toLocaleString()} {currencySymbol}</div>
            </div>
          </div>
          
          <button 
            onClick={handleCloseMonth}
            className={`w-full py-5 text-white text-sm font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 ${accent.bgButton} ${accent.shadowObj}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isMonthInHistory ? t.updatePeriod : t.savePeriod}
          </button>
        </section>

        {/* RIGHT COLUMN */}
        <section className="lg:w-[40%] flex flex-col gap-10">
          
          {/* DESKTOP BALANCE CARD */}
          <div className="hidden lg:block">
            {balanceCardNode}
          </div>

          {/* Stats Info */}
          <div className={`p-6 rounded-2xl border ${themeStyles.card} flex flex-col gap-4 text-center overflow-hidden w-full`}>
             <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{t.totalFund}</p>
             <span className={`text-3xl sm:text-4xl font-mono font-black break-all ${primaryColorCls}`}>
               {totalSavedEver.toLocaleString()} {currencySymbol}
             </span>
          </div>

          {/* History / Archive */}
          <div className={`rounded-2xl border flex-1 flex flex-col ${themeStyles.card}`}>
            <div className={`p-4 border-b ${themeStyles.divider}`}>
              <h2 className="text-xs uppercase tracking-[0.2em] font-black opacity-80 flex items-center gap-2">
                <History className={`w-4 h-4 ${accent.text}`} />
                {t.archiveTitle}
              </h2>
            </div>
            
            <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[280px]">
              {history.length === 0 ? (
                <div className="py-20 text-center text-[10px] uppercase tracking-widest opacity-30">
                  {t.historyEmpty}
                </div>
              ) : (
                <AnimatePresence>
                  {history.slice(0, 4).map(record => {
                    const isNegative = record.leftover < 0;
                    const boxColors = isNegative 
                      ? 'bg-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white' 
                      : 'bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black';
                    const hoverBorder = isNegative 
                      ? 'hover:border-red-500/30' 
                      : 'hover:border-emerald-500/30';
                    const percentColor = isNegative ? 'text-red-500' : 'text-emerald-500';
                    const savedText = `${t.savedToFund} ${record.saved.toLocaleString()} ${currencySymbol}`;
                    const positiveLeftoverText = includeLeftover && record.leftover > 0 ? ` + ${record.leftover.toLocaleString()} ${currencySymbol}` : '';

                    return (
                      <motion.div 
                        key={record.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          const [year, month] = record.monthKey.split('-');
                          handleJumpToMonth(parseInt(year, 10), parseInt(month, 10) - 1);
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-all cursor-pointer group ${hoverBorder}`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${boxColors}`}>
                            {isNegative ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`text-xs font-black uppercase tracking-wider ${contrastText}`}>{record.date}</p>
                            <div className="flex flex-col mt-0.5">
                              <p className={`text-[10px] uppercase font-bold ${contrastMuted}`}>
                                {savedText}{positiveLeftoverText}
                              </p>
                              {isNegative && (
                                <p className="text-[10px] uppercase font-bold text-red-500 mt-0.5">
                                  {t.overspent} {Math.abs(record.leftover).toLocaleString()} {currencySymbol}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right text-xs font-mono font-bold ${percentColor}`}>
                          {isNegative ? '' : '+'}{Math.round(((record.saved + (includeLeftover ? record.leftover : 0)) / (record.income || 1)) * 100)}%
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              
              {history.length > 0 && (
                <div className={`mt-auto pt-6 pb-2 text-center border-t border-white/5`}>
                  <span 
                    onClick={() => setShowHistoryModal(true)}
                    className={`text-[10px] uppercase tracking-[0.2em] font-black cursor-pointer hover:underline transition-all ${primaryColorCls}`}
                  >
                    {t.viewAllHistory}
                  </span>
                </div>
              )}
            </div>
          </div>

        </section>
      </main>
      {/* CALENDAR MODAL */}
      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCalendar(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-3xl border p-8 ${themeStyles.card}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-xl font-black uppercase ${contrastText}`}>{language === 'RU' ? 'Выбор периода' : 'Select Period'}</h3>
                <button 
                  onClick={() => setShowCalendar(false)} 
                  className={`p-2 rounded-full transition-colors ${!isLight ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <X className={`w-5 h-5 ${!isLight ? 'text-white/60' : 'text-black/40'}`} />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {(language === 'RU' 
                  ? ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
                  : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                ).map((name, i) => {
                  const isCurrent = currentDate.getMonth() === i;
                  const keyToCheck = `${currentDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                  const record = history.find(h => h.monthKey === keyToCheck);

                  let btnClass = `p-3 rounded-xl text-[10px] font-black uppercase transition-all border `;
                  
                  if (isCurrent) {
                    if (record && record.leftover < 0) {
                      btnClass += 'bg-red-500 text-white border-red-500 shadow-sm';
                    } else {
                      btnClass += 'bg-emerald-500 text-black border-emerald-500 shadow-sm';
                    }
                  } else if (record) {
                    if (record.leftover < 0) {
                      btnClass += !isLight 
                        ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20 hover:text-red-400' 
                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700';
                    } else {
                      btnClass += !isLight 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-400' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700';
                    }
                  } else {
                    btnClass += !isLight 
                      ? `bg-white/5 text-white/50 border-white/5 ${accent.hoverBorderLight} hover:text-white` 
                      : `bg-gray-50 text-gray-400 border-gray-100 ${accent.hoverBorderLight} ${accent.textActiveHover}`;
                  }

                  return (
                    <button 
                      key={i} 
                      onClick={() => handleJumpToMonth(currentDate.getFullYear(), i)}
                      className={btnClass}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              <div className={`flex justify-between items-center mt-10 pt-6 border-t ${themeStyles.divider}`}>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))} 
                  className={`p-2 rounded-lg border transition-all ${themeStyles.divider} ${!isLight ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-50 text-gray-300 hover:text-gray-900'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-2xl font-mono font-black ${contrastText}`}>{currentDate.getFullYear()}</span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))} 
                  className={`p-2 rounded-lg border transition-all ${themeStyles.divider} ${!isLight ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-50 text-gray-300 hover:text-gray-900'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={() => handleJumpToMonth(new Date().getFullYear(), new Date().getMonth())}
                className={`mt-8 w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${accent.borderLight} ${primaryColorCls} ${!isLight ? `bg-white/5 ${accent.glowBgHover}` : `bg-white/40 ${accent.glowBgHover}`}`}
              >
                {language === 'RU' ? 'ВЕРНУТЬСЯ К СЕГОДНЯ' : 'RETURN TO TODAY'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowHistoryModal(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl border p-6 md:p-8 ${themeStyles.card}`}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className={`text-xl font-black uppercase ${contrastText}`}>{t.fullHistoryTitle}</h3>
                <button 
                  onClick={() => setShowHistoryModal(false)} 
                  className={`p-2 rounded-full transition-colors ${!isLight ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <X className={`w-5 h-5 ${!isLight ? 'text-white/60' : 'text-black/40'}`} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                {history.map(record => {
                  const isNegative = record.leftover < 0;
                  const boxColors = isNegative 
                    ? 'bg-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white' 
                    : 'bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black';
                  const hoverBorder = isNegative 
                    ? 'hover:border-red-500/30' 
                    : 'hover:border-emerald-500/30';
                  const percentColor = isNegative ? 'text-red-500' : 'text-emerald-500';
                  const savedText = `${t.savedToFund} ${record.saved.toLocaleString()} ${currencySymbol}`;
                  const positiveLeftoverText = includeLeftover && record.leftover > 0 ? ` + ${record.leftover.toLocaleString()} ${currencySymbol}` : '';

                  return (
                    <motion.div 
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        const [year, month] = record.monthKey.split('-');
                        handleJumpToMonth(parseInt(year, 10), parseInt(month, 10) - 1);
                        setShowHistoryModal(false);
                      }}
                      className={`flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-all cursor-pointer group ${hoverBorder}`}
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black transition-colors ${boxColors}`}>
                          {isNegative ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wider ${contrastText}`}>{record.date}</p>
                          <div className="flex flex-col mt-0.5">
                            <p className={`text-[10px] uppercase font-bold ${contrastMuted}`}>
                              {savedText}{positiveLeftoverText}
                            </p>
                            {isNegative && (
                              <p className="text-[10px] uppercase font-bold text-red-500 mt-0.5">
                                {t.overspent} {Math.abs(record.leftover).toLocaleString()} {currencySymbol}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`text-right text-xs shrink-0 ml-2 font-mono font-bold ${percentColor}`}>
                        {isNegative ? '' : '+'}{Math.round(((record.saved + (includeLeftover ? record.leftover : 0)) / (record.income || 1)) * 100)}%
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowSettings(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-3xl border p-8 ${themeStyles.card}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-xl font-black uppercase ${contrastText}`}>{t.settingsTitle}</h3>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className={`p-2 rounded-full transition-colors ${!isLight ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <X className={`w-5 h-5 ${!isLight ? 'text-white/60' : 'text-black/40'}`} />
                </button>
              </div>
              
              <div className="flex flex-col">
                
                {/* Settings Rows Wrapper */}
                <div className={`flex flex-col divide-y ${!isLight ? 'divide-white/5' : 'divide-gray-100'}`}>
                  
                  {/* Language Selection */}
                  <div className="flex items-center justify-between w-full h-16">
                    <h4 className={`text-[10px] uppercase font-bold tracking-widest ${contrastMuted}`}>{t.language}</h4>
                    <div className={`flex items-center p-1 gap-1 rounded-xl border ${!isLight ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      {(['RU', 'EN'] as Language[]).map((l) => (
                        <button 
                          key={l}
                          onClick={() => setLanguage(l)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${language === l ? `${accent.bg} ${theme === 'dark' ? 'text-black' : 'text-white'} shadow-sm` : `${!isLight ? 'text-white/60 hover:text-white hover:bg-white/5' : `text-gray-400 ${accent.groupHoverText} hover:bg-black/5`}`}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="flex items-center justify-between w-full h-16">
                    <h4 className={`text-[10px] uppercase font-bold tracking-widest ${contrastMuted}`}>{t.currency}</h4>
                    <div className={`flex items-center p-1 gap-1 rounded-xl border ${!isLight ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      {(['RUB', 'USD', 'EUR'] as CurrencyType[]).map((c) => (
                        <button 
                          key={c}
                          onClick={() => setCurrency(c)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${currency === c ? `${accent.bg} ${theme === 'dark' ? 'text-black' : 'text-white'} shadow-sm` : `${!isLight ? 'text-white/60 hover:text-white hover:bg-white/5' : `text-gray-400 ${accent.groupHoverText} hover:bg-black/5`}`}`}
                        >
                          {c === 'RUB' ? 'RUB (₽)' : c === 'USD' ? 'USD ($)' : 'EUR (€)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leftover Toggle */}
                  <div className="flex items-center justify-between w-full h-16">
                    <div className="flex items-center gap-2 relative">
                      <h4 className={`text-[10px] uppercase font-bold tracking-widest ${contrastMuted}`}>{t.includeLeftover}</h4>
                      <div className="group flex items-center justify-center cursor-help">
                        <HelpCircle className={`w-3.5 h-3.5 transition-colors ${!isLight ? 'text-white/20 hover:text-emerald-500' : 'text-gray-300 hover:text-emerald-500'}`} />
                        <div className={`absolute left-0 top-full mt-2 w-48 p-3 rounded-xl border text-[10px] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl ${!isLight ? 'bg-[#1C1C1F] border-white/10 text-white/70' : 'bg-white border-gray-100 text-gray-600'}`}>
                          {t.leftoverTooltip}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIncludeLeftover(!includeLeftover)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${includeLeftover ? accent.bg : (!isLight ? 'bg-white/10 border border-white/5' : 'bg-gray-200 border border-transparent')}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeLeftover ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Export Data */}
                  <div className="flex items-center justify-between w-full h-16">
                    <h4 className={`text-[10px] uppercase font-bold tracking-widest ${contrastMuted}`}>{t.exportData}</h4>
                    <button 
                      onClick={handleExportData}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${!isLight ? 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.downloadJson}
                    </button>
                  </div>

                  {/* Import Data */}
                  <div className="flex items-center justify-between w-full h-16">
                    <h4 className={`text-[10px] uppercase font-bold tracking-widest ${contrastMuted}`}>{t.importData}</h4>
                    <div>
                      <input 
                        type="file" 
                        accept=".json"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleImportFile}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${!isLight ? 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t.uploadBtn}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Theme Selection - Anchored at the bottom */}
                <div className={`flex flex-col items-center pt-6 mt-4 border-t ${!isLight ? 'border-white/5' : 'border-gray-100'}`}>
                  <h4 className={`text-[10px] uppercase font-bold tracking-widest mb-4 text-center ${contrastMuted}`}>{t.themeTitle}</h4>
                  <div className={`flex items-center rounded-full p-1 border ${themeStyles.divider} ${!isLight ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${theme === 'dark' ? `bg-white/10 shadow-sm ${accent.text}` : 'text-gray-500 hover:text-gray-400'}`}
                    >
                      <Moon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Dark</span>
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${theme === 'light' ? `bg-white/10 shadow-sm ${accent.text}` : 'text-gray-500 hover:text-gray-400'}`}
                    >
                      <Sun className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Light</span>
                    </button>
                    <button 
                      onClick={() => setTheme('pink')}
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${theme === 'pink' ? `bg-white/10 shadow-sm ${accent.text}` : 'text-gray-500 hover:text-gray-400'}`}
                    >
                      <Cat className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Kitty</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
