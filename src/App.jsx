import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard, ArrowLeftRight, FileText, CreditCard, TrendingUp, TrendingDown,
  Users, Truck, Wallet, Calculator, BarChart3, ClipboardList, Globe2, Coins,
  DatabaseBackup, Settings as SettingsIcon, Info, Menu, Sun, Moon, Search,
  Plus, X, Trash2, Pencil, Download, Upload, AlertTriangle, ChevronRight,
  CircleDot, Building2, ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";

/* ---------------------------------------------------------------
   BalancePoint — Offline Accounting & Business Finance Platform
   Phase 1-2 build: shell, dashboard, transactions, income, expenses,
   accounts, settings, backup/restore. Persisted via window.storage,
   which is polyfilled onto localStorage (see src/storagePolyfill.js)
   so all data lives entirely on this device — fully offline.
--------------------------------------------------------------- */

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, status: "live" },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight, status: "live" },
  { id: "invoices", label: "Invoices", icon: FileText, status: "soon" },
  { id: "payments", label: "Payments", icon: CreditCard, status: "soon" },
  { id: "income", label: "Income", icon: TrendingUp, status: "live" },
  { id: "expenses", label: "Expenses", icon: TrendingDown, status: "live" },
  { id: "customers", label: "Customers", icon: Users, status: "soon" },
  { id: "suppliers", label: "Suppliers", icon: Truck, status: "soon" },
  { id: "accounts", label: "Accounts", icon: Wallet, status: "live" },
  { id: "tax", label: "Tax Center", icon: Calculator, status: "soon" },
  { id: "analytics", label: "Analytics", icon: BarChart3, status: "soon" },
  { id: "reports", label: "Reports", icon: ClipboardList, status: "soon" },
  { id: "country", label: "Country Guide", icon: Globe2, status: "soon" },
  { id: "currencies", label: "Currencies", icon: Coins, status: "soon" },
  { id: "backup", label: "Backup & Restore", icon: DatabaseBackup, status: "live" },
  { id: "settings", label: "Settings", icon: SettingsIcon, status: "live" },
  { id: "about", label: "About BalancePoint", icon: Info, status: "live" },
];

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Transportation", "Office Supplies", "Equipment", "Software", "Professional Services", "Travel", "Maintenance", "Other"];
const INCOME_CATEGORIES = ["Sales", "Services", "Consulting", "Interest", "Other"];
const CURRENCIES = [
  { code: "INR", symbol: "₹" }, { code: "AED", symbol: "د.إ" }, { code: "SAR", symbol: "﷼" },
  { code: "OMR", symbol: "ر.ع." }, { code: "QAR", symbol: "ر.ق" }, { code: "BHD", symbol: ".د.ب" },
  { code: "KWD", symbol: "د.ك" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, { code: "GBP", symbol: "£" },
];
const CHART_COLORS = ["#22D3EE", "#6366F1", "#F472B6", "#FBBF24", "#34D399", "#F87171", "#A78BFA", "#38BDF8"];

const genId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

function demoTransactions() {
  const accts = ["acc-cash", "acc-bank"];
  const now = new Date();
  const list = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const incomeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < incomeCount; i++) {
      list.push({
        id: genId(), type: "income",
        date: new Date(d.getFullYear(), d.getMonth(), 3 + i * 7).toISOString().slice(0, 10),
        category: INCOME_CATEGORIES[Math.floor(Math.random() * INCOME_CATEGORIES.length)],
        description: "Client payment", account: accts[i % 2],
        amount: Math.round((8000 + Math.random() * 32000)), currency: "INR", notes: "",
      });
    }
    const expenseCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < expenseCount; i++) {
      const cat = EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
      list.push({
        id: genId(), type: "expense",
        date: new Date(d.getFullYear(), d.getMonth(), 5 + i * 5).toISOString().slice(0, 10),
        category: cat, description: `${cat} payment`, account: accts[i % 2],
        amount: Math.round((1500 + Math.random() * 9000)), currency: "INR", notes: "",
      });
    }
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

const DEFAULT_ACCOUNTS = [
  { id: "acc-cash", name: "Petty Cash", type: "Cash", currency: "INR", openingBalance: 15000 },
  { id: "acc-bank", name: "Primary Bank Account", type: "Bank", currency: "INR", openingBalance: 120000 },
];
const DEFAULT_SETTINGS = {
  businessName: "My Business", currency: "INR", theme: "dark", demo: false,
};

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch { return fallback; }
}
async function saveKey(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch { /* best effort */ }
}

function fmt(amount, symbol) {
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ------------------------------- UI atoms ------------------------------- */

function Card({ children, className = "", hover = false }) {
  return (
    <div className={`bp-card ${hover ? "bp-card-hover" : ""} ${className}`}>{children}</div>
  );
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`bp-badge bp-badge-${tone}`}>{children}</span>;
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <Card className="bp-empty">
      <Icon size={30} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </Card>
  );
}

function ComingSoon({ label }) {
  return (
    <EmptyState
      icon={Sparkles}
      title={`${label} — Phase 3+`}
      body="This module is on the build roadmap and isn't wired to real data yet. Everything you see elsewhere in the app (Transactions, Income, Expenses, Accounts, Dashboard, Backup) is fully functional and persists locally."
    />
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className="bp-toast">{toast}</div>;
}

/* ----------------------------- Main App ----------------------------- */

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // initial load
  useEffect(() => {
    (async () => {
      const [s, a, t] = await Promise.all([
        loadKey("bp:settings", null),
        loadKey("bp:accounts", null),
        loadKey("bp:transactions", null),
      ]);
      if (s) setSettings(s);
      if (a) setAccounts(a); else setAccounts(DEFAULT_ACCOUNTS);
      if (t) setTransactions(t);
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) saveKey("bp:settings", settings); }, [settings, ready]);
  useEffect(() => { if (ready) saveKey("bp:accounts", accounts); }, [accounts, ready]);
  useEffect(() => { if (ready) saveKey("bp:transactions", transactions); }, [transactions, ready]);

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || "₹";

  const addTransaction = (tx) => {
    setTransactions(prev => [{ ...tx, id: genId() }, ...prev]);
    notify(`${tx.type === "income" ? "Income" : "Expense"} recorded.`);
  };
  const updateTransaction = (id, patch) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    notify("Transaction updated.");
  };
  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    notify("Transaction deleted.");
  };

  const loadDemo = () => {
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions(demoTransactions());
    setSettings(s => ({ ...s, demo: true, businessName: s.businessName === "My Business" ? "BrightWave Solutions" : s.businessName }));
    notify("Demo data loaded.");
  };
  const clearDemo = () => {
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions([]);
    setSettings(s => ({ ...s, demo: false }));
    notify("Demo data cleared.");
  };
  const clearAll = () => {
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions([]);
    notify("All data cleared.");
  };

  const theme = settings.theme === "light" ? "light" : "dark";

  if (!ready) {
    return (
      <div className={`bp-root bp-${theme}`}>
        <style>{CSS}</style>
        <div className="bp-boot">
          <div className="bp-boot-logo">B</div>
          <div>Loading BalancePoint…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bp-root bp-${theme}`}>
      <style>{CSS}</style>
      <Toast toast={toast} />
      <div className={`bp-shell ${sidebarOpen ? "" : "bp-shell-collapsed"}`}>
        <Sidebar page={page} setPage={setPage} open={sidebarOpen} />
        <div className="bp-main">
          <Topbar
            settings={settings} setSettings={setSettings}
            sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
            page={page}
          />
          <div className="bp-content">
            {page === "dashboard" && (
              <Dashboard
                transactions={transactions} accounts={accounts}
                currencySymbol={currencySymbol} setPage={setPage}
              />
            )}
            {page === "transactions" && (
              <TransactionsPage
                transactions={transactions} accounts={accounts}
                currencySymbol={currencySymbol}
                onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction}
                filterType="all"
              />
            )}
            {page === "income" && (
              <TransactionsPage
                transactions={transactions} accounts={accounts}
                currencySymbol={currencySymbol}
                onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction}
                filterType="income"
              />
            )}
            {page === "expenses" && (
              <TransactionsPage
                transactions={transactions} accounts={accounts}
                currencySymbol={currencySymbol}
                onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction}
                filterType="expense"
              />
            )}
            {page === "accounts" && (
              <AccountsPage
                accounts={accounts} setAccounts={setAccounts}
                transactions={transactions} currencySymbol={currencySymbol}
                notify={notify}
              />
            )}
            {page === "settings" && (
              <SettingsPage
                settings={settings} setSettings={setSettings}
                loadDemo={loadDemo} clearDemo={clearDemo} clearAll={clearAll}
              />
            )}
            {page === "backup" && (
              <BackupPage
                settings={settings} accounts={accounts} transactions={transactions}
                setSettings={setSettings} setAccounts={setAccounts} setTransactions={setTransactions}
                notify={notify}
              />
            )}
            {page === "about" && <AboutPage />}
            {["invoices", "payments", "customers", "suppliers", "tax", "analytics", "reports", "country", "currencies"].includes(page) && (
              <ComingSoon label={NAV.find(n => n.id === page)?.label} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Sidebar ------------------------------- */

function Sidebar({ page, setPage, open }) {
  return (
    <aside className="bp-sidebar">
      <div className="bp-brand">
        <div className="bp-brand-mark">B</div>
        {open && (
          <div>
            <div className="bp-brand-name">BalancePoint</div>
            <div className="bp-brand-sub">OFFLINE ACCOUNTING</div>
          </div>
        )}
      </div>
      <nav className="bp-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`bp-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
            title={item.label}
          >
            <item.icon size={18} strokeWidth={1.8} />
            {open && <span>{item.label}</span>}
            {open && item.status === "soon" && <em>soon</em>}
          </button>
        ))}
      </nav>
      <div className="bp-offline-pill">
        <CircleDot size={14} className="bp-pulse" />
        {open && (
          <div>
            <div className="bp-offline-title">Offline Mode</div>
            <div className="bp-offline-sub">All data is stored locally</div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------- Topbar -------------------------------- */

function Topbar({ settings, setSettings, sidebarOpen, setSidebarOpen, page }) {
  const title = NAV.find(n => n.id === page)?.label || "Dashboard";
  return (
    <header className="bp-topbar">
      <div className="bp-topbar-left">
        <button className="bp-icon-btn" onClick={() => setSidebarOpen(o => !o)}><Menu size={18} /></button>
        <h1>{title}</h1>
      </div>
      <div className="bp-topbar-right">
        <div className="bp-search">
          <Search size={15} />
          <span>Search… <kbd>⌘K</kbd></span>
        </div>
        <span className="bp-currency-chip">{settings.currency}</span>
        <button
          className="bp-icon-btn"
          onClick={() => setSettings(s => ({ ...s, theme: s.theme === "light" ? "dark" : "light" }))}
          title="Toggle theme"
        >
          {settings.theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <div className="bp-profile">
          <Building2 size={15} />
          <span>{settings.businessName}</span>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

function monthKey(dateStr) { return dateStr.slice(0, 7); }
function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function Dashboard({ transactions, accounts, currencySymbol, setPage }) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);

  const sumFor = (type, mKey) => transactions
    .filter(t => t.type === type && monthKey(t.date) === mKey)
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const incomeThis = sumFor("income", thisMonth);
  const incomeLast = sumFor("income", lastMonth);
  const expenseThis = sumFor("expense", thisMonth);
  const expenseLast = sumFor("expense", lastMonth);
  const profitThis = incomeThis - expenseThis;
  const profitLast = incomeLast - expenseLast;

  const cashBalance = accounts.reduce((sum, a) => {
    const delta = transactions.filter(t => t.account === a.id)
      .reduce((s, t) => s + (t.type === "income" ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
    return sum + Number(a.openingBalance || 0) + delta;
  }, 0);

  const pctChange = (cur, prev) => {
    if (prev === 0) return cur === 0 ? 0 : 100;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };

  const kpis = [
    { label: "Total Income", value: incomeThis, prev: incomeLast, icon: TrendingUp, tone: "up" },
    { label: "Total Expenses", value: expenseThis, prev: expenseLast, icon: TrendingDown, tone: "down" },
    { label: "Net Profit", value: profitThis, prev: profitLast, icon: Wallet, tone: profitThis >= 0 ? "up" : "down" },
    { label: "Cash Balance", value: cashBalance, prev: cashBalance, icon: Coins, tone: "neutral", noChange: true },
  ];

  // last 6 months cashflow series
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  const series = months.map(mk => ({
    month: monthLabel(mk),
    Income: sumFor("income", mk),
    Expenses: sumFor("expense", mk),
  }));

  const expenseByCat = {};
  transactions.filter(t => t.type === "expense" && monthKey(t.date) === thisMonth).forEach(t => {
    expenseByCat[t.category] = (expenseByCat[t.category] || 0) + Number(t.amount || 0);
  });
  const pieData = Object.entries(expenseByCat).map(([name, value]) => ({ name, value }));

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const quickActions = [
    { label: "Add Income", page: "income", icon: TrendingUp },
    { label: "Add Expense", page: "expenses", icon: TrendingDown },
    { label: "View Transactions", page: "transactions", icon: ArrowLeftRight },
    { label: "Manage Accounts", page: "accounts", icon: Wallet },
    { label: "Backup Data", page: "backup", icon: DatabaseBackup },
  ];

  return (
    <div className="bp-page">
      <div className="bp-kpi-grid">
        {kpis.map(k => {
          const change = pctChange(k.value, k.prev);
          return (
            <Card key={k.label} hover className="bp-kpi">
              <div className="bp-kpi-top">
                <span className="bp-kpi-label">{k.label}</span>
                <k.icon size={16} className="bp-kpi-icon" />
              </div>
              <div className="bp-kpi-value">{fmt(k.value, currencySymbol)}</div>
              {!k.noChange && (
                <div className={`bp-kpi-change ${change >= 0 ? "pos" : "neg"}`}>
                  {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(change).toFixed(1)}% from last month
                </div>
              )}
              {k.noChange && <div className="bp-kpi-change neutral">Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}</div>}
            </Card>
          );
        })}
      </div>

      <div className="bp-grid-2">
        <Card className="bp-chart-card">
          <div className="bp-card-head"><h3>Income vs Expenses</h3><span>Last 6 months</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F472B6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F472B6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: "#111A2E", border: "1px solid #1E293B", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="Income" stroke="#22D3EE" fill="url(#incGrad)" strokeWidth={2} animationDuration={900} />
              <Area type="monotone" dataKey="Expenses" stroke="#F472B6" fill="url(#expGrad)" strokeWidth={2} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bp-chart-card">
          <div className="bp-card-head"><h3>Expense Distribution</h3><span>This month</span></div>
          {pieData.length === 0 ? (
            <div className="bp-chart-empty">No expenses recorded this month yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} animationDuration={900}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111A2E", border: "1px solid #1E293B", borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="bp-grid-2">
        <Card>
          <div className="bp-card-head"><h3>Recent Transactions</h3><button className="bp-link" onClick={() => setPage("transactions")}>View all <ChevronRight size={13} /></button></div>
          {recent.length === 0 ? (
            <div className="bp-chart-empty">No transactions yet. Add your first one to see it here.</div>
          ) : (
            <div className="bp-tx-list">
              {recent.map(t => (
                <div key={t.id} className="bp-tx-row">
                  <div className={`bp-tx-dot ${t.type}`} />
                  <div className="bp-tx-info">
                    <div className="bp-tx-desc">{t.description || t.category}</div>
                    <div className="bp-tx-meta">{t.category} · {t.date}</div>
                  </div>
                  <div className={`bp-tx-amt ${t.type}`}>{t.type === "income" ? "+" : "−"}{fmt(t.amount, currencySymbol)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="bp-card-head"><h3>Account Summary</h3><button className="bp-link" onClick={() => setPage("accounts")}>Manage <ChevronRight size={13} /></button></div>
          <div className="bp-tx-list">
            {accounts.map(a => {
              const bal = Number(a.openingBalance || 0) + transactions.filter(t => t.account === a.id)
                .reduce((s, t) => s + (t.type === "income" ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
              return (
                <div key={a.id} className="bp-tx-row">
                  <div className="bp-acct-icon"><Wallet size={15} /></div>
                  <div className="bp-tx-info">
                    <div className="bp-tx-desc">{a.name}</div>
                    <div className="bp-tx-meta">{a.type} · {a.currency}</div>
                  </div>
                  <div className="bp-tx-amt">{fmt(bal, currencySymbol)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="bp-card-head"><h3>Quick Actions</h3></div>
        <div className="bp-quick-grid">
          {quickActions.map(qa => (
            <button key={qa.label} className="bp-quick-btn" onClick={() => setPage(qa.page)}>
              <qa.icon size={17} />
              <span>{qa.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Transactions ---------------------------- */

function TransactionsPage({ transactions, accounts, currencySymbol, onAdd, onUpdate, onDelete, filterType }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const scoped = filterType === "all" ? transactions : transactions.filter(t => t.type === filterType);
  const filtered = scoped.filter(t => {
    const matchSearch = !search || (t.description + t.category).toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || t.category === catFilter;
    return matchSearch && matchCat;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const categories = filterType === "income" ? INCOME_CATEGORIES : filterType === "expense" ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  const total = filtered.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);

  const heading = filterType === "income" ? "Income" : filterType === "expense" ? "Expenses" : "Transactions";

  return (
    <div className="bp-page">
      <Card>
        <div className="bp-toolbar">
          <div className="bp-search bp-search-inline">
            <Search size={15} />
            <input placeholder={`Search ${heading.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="bp-spacer" />
          <div className="bp-toolbar-total">{filtered.length} record{filtered.length !== 1 ? "s" : ""} · net {fmt(total, currencySymbol)}</div>
          <button className="bp-btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={15} /> Add {filterType === "all" ? "Transaction" : filterType === "income" ? "Income" : "Expense"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title={`No ${heading.toLowerCase()} yet`} body="Add your first record — it will immediately update the dashboard and account balances." />
        ) : (
          <div className="bp-table-wrap">
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Account</th><th>Amount</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const acct = accounts.find(a => a.id === t.account);
                  return (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td><Badge tone={t.type === "income" ? "green" : "red"}>{t.type}</Badge></td>
                      <td>{t.category}</td>
                      <td>{t.description}</td>
                      <td>{acct?.name || "—"}</td>
                      <td className={t.type === "income" ? "bp-pos" : "bp-neg"}>{t.type === "income" ? "+" : "−"}{fmt(t.amount, currencySymbol)}</td>
                      <td className="bp-row-actions">
                        <button className="bp-icon-btn sm" onClick={() => { setEditing(t); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="bp-icon-btn sm danger" onClick={() => onDelete(t.id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <TransactionForm
          accounts={accounts}
          defaultType={filterType === "all" ? "income" : filterType}
          editing={editing}
          onClose={() => setShowForm(false)}
          onSubmit={(tx) => {
            if (editing) onUpdate(editing.id, tx); else onAdd(tx);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function TransactionForm({ accounts, defaultType, editing, onClose, onSubmit }) {
  const [type, setType] = useState(editing?.type || defaultType);
  const [date, setDate] = useState(editing?.date || todayISO());
  const [category, setCategory] = useState(editing?.category || (defaultType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]));
  const [description, setDescription] = useState(editing?.description || "");
  const [account, setAccount] = useState(editing?.account || accounts[0]?.id || "");
  const [amount, setAmount] = useState(editing?.amount ?? "");
  const [notes, setNotes] = useState(editing?.notes || "");
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = (e) => {
    e.preventDefault();
    if (!date) return setError("Date is required.");
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount greater than zero.");
    if (!account) return setError("Select an account.");
    setError("");
    onSubmit({ type, date, category, description, account, amount: Number(amount), currency: "INR", notes });
  };

  return (
    <div className="bp-modal-backdrop" onClick={onClose}>
      <div className="bp-modal" onClick={e => e.stopPropagation()}>
        <div className="bp-modal-head">
          <h3>{editing ? "Edit" : "Add"} Transaction</h3>
          <button className="bp-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="bp-form">
          <div className="bp-form-row">
            <label>Type
              <select value={type} onChange={e => { setType(e.target.value); setCategory(e.target.value === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <label>Date
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
          </div>
          <div className="bp-form-row">
            <label>Category
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Account
              <select value={account} onChange={e => setAccount(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>
          <label>Description
            <input type="text" placeholder="e.g. Invoice payment from client" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label>Amount
            <input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <label>Notes
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </label>
          {error && <div className="bp-form-error"><AlertTriangle size={14} /> {error}</div>}
          <div className="bp-form-actions">
            <button type="button" className="bp-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="bp-btn-primary">{editing ? "Save Changes" : "Add Transaction"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------ Accounts ------------------------------ */

function AccountsPage({ accounts, setAccounts, transactions, currencySymbol, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Bank");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState("");

  const addAccount = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Account name is required.");
    setAccounts(prev => [...prev, { id: genId(), name: name.trim(), type, currency: "INR", openingBalance: Number(opening) || 0 }]);
    notify("Account created.");
    setName(""); setOpening(""); setError(""); setShowForm(false);
  };

  const removeAccount = (id) => {
    if (transactions.some(t => t.account === id)) {
      notify("Can't delete — account has transactions linked to it.");
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    notify("Account removed.");
  };

  return (
    <div className="bp-page">
      <Card>
        <div className="bp-toolbar">
          <h3 style={{ margin: 0 }}>Your Accounts</h3>
          <div className="bp-spacer" />
          <button className="bp-btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Account</button>
        </div>
        <div className="bp-kpi-grid">
          {accounts.map(a => {
            const bal = Number(a.openingBalance || 0) + transactions.filter(t => t.account === a.id)
              .reduce((s, t) => s + (t.type === "income" ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
            return (
              <Card key={a.id} hover className="bp-kpi">
                <div className="bp-kpi-top">
                  <span className="bp-kpi-label">{a.name}</span>
                  <button className="bp-icon-btn sm danger" onClick={() => removeAccount(a.id)}><Trash2 size={13} /></button>
                </div>
                <div className="bp-kpi-value">{fmt(bal, currencySymbol)}</div>
                <div className="bp-kpi-change neutral">{a.type} · Opening {fmt(a.openingBalance, currencySymbol)}</div>
              </Card>
            );
          })}
        </div>
      </Card>

      {showForm && (
        <div className="bp-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="bp-modal" onClick={e => e.stopPropagation()}>
            <div className="bp-modal-head"><h3>New Account</h3><button className="bp-icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <form className="bp-form" onSubmit={addAccount}>
              <label>Account name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Current Account" /></label>
              <label>Type
                <select value={type} onChange={e => setType(e.target.value)}>
                  {["Cash", "Bank", "Credit Card", "Petty Cash", "Digital Wallet", "Other"].map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Opening balance<input type="number" step="0.01" value={opening} onChange={e => setOpening(e.target.value)} placeholder="0.00" /></label>
              {error && <div className="bp-form-error"><AlertTriangle size={14} /> {error}</div>}
              <div className="bp-form-actions">
                <button type="button" className="bp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="bp-btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

function SettingsPage({ settings, setSettings, loadDemo, clearDemo, clearAll }) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="bp-page">
      <Card>
        <div className="bp-card-head"><h3>Business Profile</h3></div>
        <div className="bp-form">
          <label>Business name
            <input value={settings.businessName} onChange={e => setSettings(s => ({ ...s, businessName: e.target.value }))} />
          </label>
          <label>Base Currency
            <select value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <div className="bp-card-head"><h3>Appearance</h3></div>
        <div className="bp-toolbar">
          <span>Theme</span>
          <div className="bp-spacer" />
          <button className="bp-btn-ghost" onClick={() => setSettings(s => ({ ...s, theme: s.theme === "light" ? "dark" : "light" }))}>
            {settings.theme === "light" ? "Switch to Dark" : "Switch to Light"}
          </button>
        </div>
      </Card>

      <Card>
        <div className="bp-card-head"><h3>Demo Data</h3><span>“BrightWave Solutions” sample dataset</span></div>
        <div className="bp-toolbar">
          <p style={{ margin: 0, color: "var(--bp-muted)", fontSize: 13 }}>Loads 6 months of realistic income/expense activity so you can explore the dashboard and charts.</p>
          <div className="bp-spacer" />
          <button className="bp-btn-ghost" onClick={loadDemo}>Load Demo Data</button>
          <button className="bp-btn-ghost" onClick={clearDemo}>Clear Demo Data</button>
        </div>
      </Card>

      <Card>
        <div className="bp-card-head"><h3>Danger Zone</h3></div>
        <div className="bp-toolbar">
          <p style={{ margin: 0, color: "var(--bp-muted)", fontSize: 13 }}>Permanently erase all transactions and reset accounts. This can't be undone — export a backup first.</p>
          <div className="bp-spacer" />
          {!confirmClear ? (
            <button className="bp-btn-ghost danger" onClick={() => setConfirmClear(true)}>Clear All Data</button>
          ) : (
            <>
              <button className="bp-btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="bp-btn-primary danger" onClick={() => { clearAll(); setConfirmClear(false); }}>Confirm Delete</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Backup ------------------------------ */

function BackupPage({ settings, accounts, transactions, setSettings, setAccounts, setTransactions, notify }) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);

  const exportBackup = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), settings, accounts, transactions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balancepoint-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify("Backup downloaded.");
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.transactions || !parsed.accounts || !parsed.settings) throw new Error("bad shape");
        setPendingImport(parsed);
      } catch {
        notify("Backup file is invalid or corrupted.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmRestore = () => {
    setSettings(pendingImport.settings);
    setAccounts(pendingImport.accounts);
    setTransactions(pendingImport.transactions);
    setPendingImport(null);
    notify("Data restored from backup.");
  };

  return (
    <div className="bp-page">
      <Card>
        <div className="bp-card-head"><h3>Export Data</h3></div>
        <div className="bp-toolbar">
          <p style={{ margin: 0, color: "var(--bp-muted)", fontSize: 13 }}>
            Download a full JSON snapshot — {transactions.length} transactions, {accounts.length} accounts, and your settings.
          </p>
          <div className="bp-spacer" />
          <button className="bp-btn-primary" onClick={exportBackup}><Download size={15} /> Download Backup</button>
        </div>
      </Card>

      <Card>
        <div className="bp-card-head"><h3>Restore Data</h3></div>
        <div className="bp-toolbar">
          <p style={{ margin: 0, color: "var(--bp-muted)", fontSize: 13 }}>Select a BalancePoint backup JSON file to restore. This replaces your current local data after confirmation.</p>
          <div className="bp-spacer" />
          <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onFile} />
          <button className="bp-btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={15} /> Choose Backup File</button>
        </div>
      </Card>

      {pendingImport && (
        <div className="bp-modal-backdrop" onClick={() => setPendingImport(null)}>
          <div className="bp-modal" onClick={e => e.stopPropagation()}>
            <div className="bp-modal-head"><h3>Confirm Restore</h3><button className="bp-icon-btn" onClick={() => setPendingImport(null)}><X size={16} /></button></div>
            <div className="bp-form">
              <p>This backup contains:</p>
              <ul className="bp-restore-list">
                <li>{pendingImport.transactions.length} transactions</li>
                <li>{pendingImport.accounts.length} accounts</li>
                <li>Business: {pendingImport.settings.businessName}</li>
                <li>Exported: {new Date(pendingImport.exportedAt).toLocaleString()}</li>
              </ul>
              <div className="bp-form-error"><AlertTriangle size={14} /> Restoring will overwrite your current local data.</div>
              <div className="bp-form-actions">
                <button className="bp-btn-ghost" onClick={() => setPendingImport(null)}>Cancel</button>
                <button className="bp-btn-primary danger" onClick={confirmRestore}>Restore &amp; Overwrite</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- About -------------------------------- */

function AboutPage() {
  return (
    <div className="bp-page">
      <Card>
        <div className="bp-about-head">
          <div className="bp-brand-mark lg">B</div>
          <div>
            <h2>BalancePoint</h2>
            <p>Your Business Finances. Simplified. Secure. Offline.</p>
          </div>
        </div>
        <p style={{ color: "var(--bp-muted)", fontSize: 13.5, lineHeight: 1.6 }}>
          BalancePoint stores everything on this device — transactions, accounts, and settings persist locally
          and the dashboard, charts, and account balances are computed live from that data. No account, server,
          or internet connection is required for any of the modules currently live in the sidebar.
        </p>
        <div className="bp-card-head"><h3>Build Roadmap</h3></div>
        <ol className="bp-roadmap">
          <li><b>Live now:</b> Dashboard, Transactions, Income, Expenses, Accounts, Settings, Backup &amp; Restore</li>
          <li><b>Phase 3:</b> Customers, Suppliers, Invoices, Payments</li>
          <li><b>Phase 4:</b> Full Analytics (aging, trend comparisons), Profit &amp; Loss, Cash Flow reports</li>
          <li><b>Phase 5:</b> Tax Center + configurable Country Tax Profiles (India, UAE, Saudi Arabia, Oman, Qatar, Bahrain, Kuwait)</li>
          <li><b>Phase 6:</b> Multi-currency with manual exchange rates, Report Center with PDF/Excel/CSV/JSON export</li>
          <li><b>Phase 7:</b> Installable PWA with offline service-worker caching</li>
        </ol>
        <div className="bp-tax-disclaimer">
          Tax and regulatory information, once added, will be provided for general informational and calculation
          purposes only. Verify current requirements with the relevant government authority or a qualified tax professional.
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------- CSS --------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');

.bp-root { font-family: 'Inter', system-ui, sans-serif; height: 100%; min-height: 640px; }
.bp-dark {
  --bp-bg: #060A14; --bp-bg2: #0A0F1E; --bp-card: #0E1526; --bp-border: #1B2540;
  --bp-text: #E7ECF7; --bp-muted: #8B96B3; --bp-accent: #22D3EE; --bp-accent2: #6366F1;
  --bp-pos: #34D399; --bp-neg: #F87171;
}
.bp-light {
  --bp-bg: #F3F5FB; --bp-bg2: #FFFFFF; --bp-card: #FFFFFF; --bp-border: #E2E6F0;
  --bp-text: #101528; --bp-muted: #616B85; --bp-accent: #0891B2; --bp-accent2: #4F46E5;
  --bp-pos: #059669; --bp-neg: #DC2626;
}
.bp-root * { box-sizing: border-box; }
.bp-boot { height: 100%; min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: var(--bp-bg); color: var(--bp-muted); font-family: 'Space Grotesk', sans-serif; }
.bp-boot-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1E3A8A, #22D3EE); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px; }

.bp-shell { display: flex; height: 100%; min-height: 640px; background: var(--bp-bg); color: var(--bp-text); overflow: hidden; border-radius: 14px; border: 1px solid var(--bp-border); }
.bp-sidebar { width: 236px; background: var(--bp-bg2); border-right: 1px solid var(--bp-border); display: flex; flex-direction: column; padding: 18px 12px; transition: width .2s ease; flex-shrink: 0; }
.bp-shell-collapsed .bp-sidebar { width: 68px; }
.bp-brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 18px; }
.bp-brand-mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #1E3A8A, #22D3EE); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }
.bp-brand-mark.lg { width: 52px; height: 52px; font-size: 22px; border-radius: 14px; }
.bp-brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; line-height: 1.2; }
.bp-brand-sub { font-size: 9.5px; letter-spacing: .08em; color: var(--bp-muted); font-weight: 600; }
.bp-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; overflow-y: auto; }
.bp-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 9px; border: none; background: transparent; color: var(--bp-muted); font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; white-space: nowrap; }
.bp-nav-item:hover { background: rgba(148,163,184,0.08); color: var(--bp-text); }
.bp-nav-item.active { background: linear-gradient(90deg, rgba(34,211,238,0.14), rgba(99,102,241,0.06)); color: var(--bp-accent); }
.bp-nav-item em { margin-left: auto; font-style: normal; font-size: 9px; background: rgba(148,163,184,0.15); padding: 2px 6px; border-radius: 6px; }
.bp-offline-pill { display: flex; align-items: center; gap: 9px; padding: 10px; border-radius: 10px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); margin-top: 8px; }
.bp-offline-pill svg { color: #34D399; }
.bp-pulse { animation: bp-pulse 2s ease-in-out infinite; }
@keyframes bp-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.bp-offline-title { font-size: 11.5px; font-weight: 600; color: #34D399; }
.bp-offline-sub { font-size: 10px; color: var(--bp-muted); }

.bp-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.bp-topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-bottom: 1px solid var(--bp-border); flex-shrink: 0; }
.bp-topbar-left { display: flex; align-items: center; gap: 12px; }
.bp-topbar-left h1 { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; margin: 0; }
.bp-topbar-right { display: flex; align-items: center; gap: 10px; }
.bp-search { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 9px; background: rgba(148,163,184,0.08); color: var(--bp-muted); font-size: 12.5px; }
.bp-search kbd { background: rgba(148,163,184,0.15); padding: 1px 5px; border-radius: 4px; font-size: 10px; }
.bp-search-inline { flex: 1; max-width: 260px; }
.bp-search-inline input { background: transparent; border: none; outline: none; color: var(--bp-text); font-size: 13px; width: 100%; }
.bp-currency-chip { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 5px 9px; border-radius: 7px; background: rgba(99,102,241,0.12); color: var(--bp-accent2); font-weight: 600; }
.bp-icon-btn { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--bp-border); background: var(--bp-card); color: var(--bp-text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.bp-icon-btn:hover { border-color: var(--bp-accent); }
.bp-icon-btn.sm { width: 28px; height: 28px; border: none; background: transparent; }
.bp-icon-btn.sm:hover { background: rgba(148,163,184,0.1); }
.bp-icon-btn.danger:hover { color: var(--bp-neg); }
.bp-profile { display: flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 9px; border: 1px solid var(--bp-border); font-size: 12.5px; font-weight: 500; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bp-content { flex: 1; overflow-y: auto; padding: 20px 24px 32px; }
.bp-page { display: flex; flex-direction: column; gap: 18px; }

.bp-card { background: var(--bp-card); border: 1px solid var(--bp-border); border-radius: 14px; padding: 18px; transition: border-color .15s ease, transform .15s ease; }
.bp-card-hover:hover { border-color: rgba(34,211,238,0.4); }
.bp-card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.bp-card-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; margin: 0; }
.bp-card-head span { font-size: 11.5px; color: var(--bp-muted); }

.bp-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.bp-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.bp-kpi-label { font-size: 12px; color: var(--bp-muted); font-weight: 500; }
.bp-kpi-icon { color: var(--bp-accent); }
.bp-kpi-value { font-family: 'JetBrains Mono', monospace; font-size: 21px; font-weight: 600; margin-bottom: 6px; }
.bp-kpi-change { font-size: 11.5px; display: flex; align-items: center; gap: 3px; font-weight: 500; }
.bp-kpi-change.pos { color: var(--bp-pos); }
.bp-kpi-change.neg { color: var(--bp-neg); }
.bp-kpi-change.neutral { color: var(--bp-muted); }

.bp-grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }
.bp-chart-empty { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--bp-muted); font-size: 12.5px; }

.bp-tx-list { display: flex; flex-direction: column; gap: 2px; }
.bp-tx-row { display: flex; align-items: center; gap: 10px; padding: 9px 4px; border-bottom: 1px solid var(--bp-border); }
.bp-tx-row:last-child { border-bottom: none; }
.bp-tx-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.bp-tx-dot.income { background: var(--bp-pos); }
.bp-tx-dot.expense { background: var(--bp-neg); }
.bp-acct-icon { width: 26px; height: 26px; border-radius: 7px; background: rgba(99,102,241,0.12); color: var(--bp-accent2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bp-tx-info { flex: 1; min-width: 0; }
.bp-tx-desc { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bp-tx-meta { font-size: 11px; color: var(--bp-muted); }
.bp-tx-amt { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; }
.bp-tx-amt.income { color: var(--bp-pos); }
.bp-tx-amt.expense { color: var(--bp-neg); }
.bp-link { background: none; border: none; color: var(--bp-accent); font-size: 12px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-weight: 500; }

.bp-quick-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.bp-quick-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; border-radius: 11px; border: 1px solid var(--bp-border); background: var(--bp-bg2); color: var(--bp-text); cursor: pointer; font-size: 12px; font-weight: 500; }
.bp-quick-btn:hover { border-color: var(--bp-accent); color: var(--bp-accent); }

.bp-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.bp-toolbar select, .bp-toolbar input { background: var(--bp-bg2); border: 1px solid var(--bp-border); color: var(--bp-text); border-radius: 8px; padding: 8px 10px; font-size: 12.5px; }
.bp-spacer { flex: 1; }
.bp-toolbar-total { font-size: 12px; color: var(--bp-muted); font-family: 'JetBrains Mono', monospace; }
.bp-btn-primary { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #1E3A8A, #22D3EE); color: white; border: none; padding: 9px 15px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; }
.bp-btn-primary:hover { filter: brightness(1.08); }
.bp-btn-primary.danger { background: linear-gradient(135deg, #7F1D1D, #F87171); }
.bp-btn-ghost { background: var(--bp-bg2); border: 1px solid var(--bp-border); color: var(--bp-text); padding: 8px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.bp-btn-ghost:hover { border-color: var(--bp-accent); }
.bp-btn-ghost.danger { color: var(--bp-neg); }

.bp-table-wrap { overflow-x: auto; }
.bp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bp-table th { text-align: left; color: var(--bp-muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 1px solid var(--bp-border); }
.bp-table td { padding: 10px; border-bottom: 1px solid var(--bp-border); white-space: nowrap; }
.bp-table tr:last-child td { border-bottom: none; }
.bp-row-actions { display: flex; gap: 2px; }
.bp-pos { color: var(--bp-pos); font-family: 'JetBrains Mono', monospace; }
.bp-neg { color: var(--bp-neg); font-family: 'JetBrains Mono', monospace; }

.bp-badge { font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
.bp-badge-green { background: rgba(52,211,153,0.14); color: var(--bp-pos); }
.bp-badge-red { background: rgba(248,113,113,0.14); color: var(--bp-neg); }

.bp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 42px 20px; color: var(--bp-muted); }
.bp-empty h3 { font-size: 14.5px; color: var(--bp-text); margin: 6px 0 0; font-family: 'Space Grotesk', sans-serif; }
.bp-empty p { font-size: 12.5px; max-width: 380px; margin: 0; line-height: 1.5; }

.bp-modal-backdrop { position: fixed; inset: 0; background: rgba(3,6,14,0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 50; }
.bp-modal { background: var(--bp-card); border: 1px solid var(--bp-border); border-radius: 14px; width: 420px; max-width: 92vw; max-height: 86vh; overflow-y: auto; animation: bp-modal-in .15s ease; }
@keyframes bp-modal-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
.bp-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--bp-border); }
.bp-modal-head h3 { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 15px; }
.bp-form { display: flex; flex-direction: column; gap: 12px; padding: 18px; }
.bp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bp-form label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--bp-muted); font-weight: 500; }
.bp-form input, .bp-form select, .bp-form textarea { background: var(--bp-bg2); border: 1px solid var(--bp-border); color: var(--bp-text); border-radius: 8px; padding: 9px 11px; font-size: 13px; font-family: inherit; }
.bp-form-error { display: flex; align-items: center; gap: 6px; color: var(--bp-neg); font-size: 12px; background: rgba(248,113,113,0.1); padding: 8px 10px; border-radius: 8px; }
.bp-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.bp-restore-list { margin: 0; padding-left: 18px; font-size: 12.5px; color: var(--bp-muted); display: flex; flex-direction: column; gap: 4px; }

.bp-about-head { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.bp-about-head h2 { font-family: 'Space Grotesk', sans-serif; margin: 0 0 4px; font-size: 20px; }
.bp-about-head p { margin: 0; color: var(--bp-muted); font-size: 13px; }
.bp-roadmap { margin: 0; padding-left: 18px; font-size: 12.5px; color: var(--bp-muted); display: flex; flex-direction: column; gap: 6px; }
.bp-roadmap b { color: var(--bp-text); }
.bp-tax-disclaimer { margin-top: 16px; font-size: 11.5px; color: var(--bp-muted); background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); padding: 10px 12px; border-radius: 9px; }

.bp-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #0E1526; border: 1px solid #22D3EE; color: white; padding: 10px 18px; border-radius: 10px; font-size: 12.5px; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }

@media (max-width: 900px) {
  .bp-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bp-grid-2 { grid-template-columns: 1fr; }
  .bp-quick-grid { grid-template-columns: repeat(2, 1fr); }
  .bp-sidebar { position: absolute; z-index: 40; height: 100%; }
}
`;
