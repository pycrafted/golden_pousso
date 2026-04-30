import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ─── Taux de conversion (base : XOF / FCFA) ─────────────── */
export const RATES = {
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 598,
  GBP: 1 / 758,
};

export const CURRENCIES = [
  { value: 'XOF', label: 'FCFA',   symbol: 'FCFA' },
  { value: 'EUR', label: 'EUR €',  symbol: '€'    },
  { value: 'USD', label: 'USD $',  symbol: '$'    },
  { value: 'GBP', label: 'GBP £',  symbol: '£'    },
];

export const LANGUAGES = [
  { value: 'FR', label: 'FR' },
  { value: 'EN', label: 'EN' },
];

/* ─── Formatage du prix ──────────────────────────────────── */
export const formatPrice = (amountXOF, currency = 'XOF') => {
  if (amountXOF === null || amountXOF === undefined) return '—';
  const rate    = RATES[currency] ?? 1;
  const amount  = amountXOF * rate;
  const locale  = currency === 'XOF' ? 'fr-FR' : 'en-US';

  switch (currency) {
    case 'XOF':
      return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
    case 'EUR':
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    case 'USD':
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    case 'GBP':
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);
    default:
      return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  }
};

/* ─── Store ──────────────────────────────────────────────── */
const useSettingsStore = create(
  persist(
    (set) => ({
      currency: 'XOF',
      language: 'FR',
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'golden-pousso-settings' }
  )
);

export default useSettingsStore;
