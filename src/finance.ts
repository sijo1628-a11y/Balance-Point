export type TxType = 'Income' | 'Expense' | 'Payment'
export type Transaction = { id: string; date: string; type: TxType; description: string; category: string; account: string; party: string; amount: number; status: 'Cleared' | 'Pending' }
export type Invoice = { id: string; number: string; customer: string; date: string; dueDate: string; amount: number; paid: number; status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' }
export type Contact = { id: string; name: string; company: string; email: string; openingBalance: number }
export type Account = { id: string; name: string; type: string; balance: number }
export type Data = { version: 1; business: string; currency: string; country: string; theme: 'dark' | 'light'; taxRates: number[]; transactions: Transaction[]; invoices: Invoice[]; customers: Contact[]; suppliers: Contact[]; accounts: Account[]; rates: Record<string, number> }

export const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
export const money = (value: number, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0)
export const totals = (data: Data) => {
  const income = data.transactions.filter(x => x.type === 'Income' || x.type === 'Payment').reduce((n, x) => n + x.amount, 0)
  const expenses = data.transactions.filter(x => x.type === 'Expense').reduce((n, x) => n + x.amount, 0)
  const receivable = data.invoices.reduce((n, x) => n + Math.max(0, x.amount - x.paid), 0)
  const payable = data.suppliers.reduce((n, x) => n + x.openingBalance, 0)
  const cash = data.accounts.reduce((n, x) => n + x.balance, 0)
  return { income, expenses, profit: income - expenses, receivable, payable, cash }
}
export const expensesByCategory = (items: Transaction[]) => Object.entries(items.filter(x => x.type === 'Expense').reduce<Record<string, number>>((all, x) => { all[x.category] = (all[x.category] || 0) + x.amount; return all }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
export const tax = (amount: number, rate: number, inclusive: boolean) => { const net = inclusive ? amount / (1 + rate / 100) : amount; const value = net * rate / 100; return { net, value, total: inclusive ? amount : net + value } }

export const demo = (): Data => ({
  version: 1, business: 'BrightWave Solutions', currency: 'INR', country: 'India', theme: 'dark', taxRates: [0, 5, 12, 18, 28], rates: { USD: 83.2, AED: 22.65, SAR: 22.18, OMR: 216.2, QAR: 22.85, BHD: 220.7, KWD: 269.8, EUR: 90.4, GBP: 105.8 },
  accounts: [ { id: 'a1', name: 'HDFC Business Account', type: 'Bank', balance: 486520 }, { id: 'a2', name: 'Cash in Hand', type: 'Cash', balance: 24850 }, { id: 'a3', name: 'Stripe Wallet', type: 'Digital Wallet', balance: 68540 } ],
  customers: [ { id: 'c1', name: 'Arjun Mehta', company: 'Mehta & Co.', email: 'arjun@mehta.co', openingBalance: 0 }, { id: 'c2', name: 'Nadia Al Farsi', company: 'Naf Digital', email: 'nadia@nafdigital.ae', openingBalance: 0 }, { id: 'c3', name: 'Maya Thomas', company: 'Mosaic Studio', email: 'maya@mosaic.studio', openingBalance: 0 } ],
  suppliers: [ { id: 's1', name: 'Northstar Software', company: 'Northstar', email: 'billing@northstar.so', openingBalance: 12800 }, { id: 's2', name: 'Pixelcraft Media', company: 'Pixelcraft', email: 'hello@pixelcraft.media', openingBalance: 24000 } ],
  invoices: [ { id: 'i1', number: 'INV-1024', customer: 'Arjun Mehta', date: '2026-05-02', dueDate: '2026-05-16', amount: 78500, paid: 78500, status: 'Paid' }, { id: 'i2', number: 'INV-1025', customer: 'Nadia Al Farsi', date: '2026-05-12', dueDate: '2026-06-12', amount: 122400, paid: 45000, status: 'Partially Paid' }, { id: 'i3', number: 'INV-1026', customer: 'Maya Thomas', date: '2026-05-23', dueDate: '2026-06-07', amount: 46500, paid: 0, status: 'Sent' } ],
  transactions: [
    { id: 't1', date: '2025-12-14', type: 'Income', description: 'December advisory services', category: 'Consulting', account: 'HDFC Business Account', party: 'Arjun Mehta', amount: 82000, status: 'Cleared' },
    { id: 't2', date: '2026-01-18', type: 'Expense', description: 'January team payroll', category: 'Salaries', account: 'HDFC Business Account', party: '', amount: 48500, status: 'Cleared' },
    { id: 't3', date: '2026-02-08', type: 'Income', description: 'Product design milestone', category: 'Design Services', account: 'HDFC Business Account', party: 'Nadia Al Farsi', amount: 110000, status: 'Cleared' },
    { id: 't4', date: '2026-02-28', type: 'Expense', description: 'Campaign production', category: 'Marketing', account: 'HDFC Business Account', party: 'Pixelcraft Media', amount: 28600, status: 'Cleared' },
    { id: 't5', date: '2026-03-11', type: 'Income', description: 'Growth advisory sprint', category: 'Consulting', account: 'Stripe Wallet', party: 'Arjun Mehta', amount: 96500, status: 'Cleared' },
    { id: 't6', date: '2026-03-29', type: 'Expense', description: 'Annual software licences', category: 'Software', account: 'HDFC Business Account', party: 'Northstar Software', amount: 31200, status: 'Cleared' },
    { id: 't7', date: '2026-04-09', type: 'Income', description: 'Application delivery phase 1', category: 'Development', account: 'HDFC Business Account', party: 'Maya Thomas', amount: 128400, status: 'Cleared' },
    { id: 't8', date: '2026-04-21', type: 'Expense', description: 'April studio rent', category: 'Rent', account: 'HDFC Business Account', party: '', amount: 35000, status: 'Cleared' },
    { id: 't9', date: '2026-05-02', type: 'Income', description: 'Brand strategy retainer', category: 'Consulting', account: 'HDFC Business Account', party: 'Arjun Mehta', amount: 78500, status: 'Cleared' },
    { id: 't10', date: '2026-05-06', type: 'Expense', description: 'Legal and compliance review', category: 'Professional Services', account: 'HDFC Business Account', party: '', amount: 18800, status: 'Cleared' },
    { id: 't11', date: '2026-05-12', type: 'Income', description: 'Naf Digital product design', category: 'Design Services', account: 'HDFC Business Account', party: 'Nadia Al Farsi', amount: 122400, status: 'Cleared' },
    { id: 't12', date: '2026-05-19', type: 'Expense', description: 'Search campaign spend', category: 'Marketing', account: 'Stripe Wallet', party: '', amount: 16400, status: 'Cleared' },
    { id: 't13', date: '2026-05-25', type: 'Expense', description: 'May team payroll', category: 'Salaries', account: 'HDFC Business Account', party: '', amount: 57800, status: 'Cleared' },
    { id: 't14', date: '2026-05-27', type: 'Payment', description: 'Part payment received', category: 'Invoice Payment', account: 'HDFC Business Account', party: 'Nadia Al Farsi', amount: 45000, status: 'Cleared' }
  ]
})
