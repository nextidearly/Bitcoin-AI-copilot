import { ComponentType } from 'react';

import {
  ActivityIcon,
  BanknoteIcon,
  Bitcoin,
  LineChart,
  List,
  Nfc,
} from 'lucide-react';

export interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const SUGGESTIONS = [
  {
    id: 'btc-price',
    title: "What's Bitcoin's price?",
    subtitle: 'get the latest BTC/USD rate',
    icon: Bitcoin,
  },
  {
    id: 'trending-collections',
    title: 'Trending collections today',
    subtitle: 'get list trending collections',
    icon: Nfc,
  },
  {
    id: 'trending-runes',
    title: 'Trending runes this week',
    subtitle: 'get list trending runes this week',
    icon: BanknoteIcon,
  },
  {
    id: 'wallet-portfolio',
    title: 'Show me wallet balance of [Bitcoin address]',
    subtitle:
      'get wallet balance including btc, utxos, inscriptions, brc20 and runes',
    icon: LineChart,
  },
  {
    id: 'check-activity',
    title: 'Scan the recent activities of [collection/runes]',
    subtitle: 'get list the recent activites for a collection or rune',
    icon: ActivityIcon,
  },
  {
    id: 'check-statistic',
    title: 'Scan the statistic data of [collection/runes]',
    subtitle: 'get the statistic data for a collection or rune',
    icon: List,
  },
];

export function getRandomSuggestions(count: number): Suggestion[] {
  const safeCount = Math.min(count, SUGGESTIONS.length);
  const startIndex = Math.floor(Date.now() / 1000) % SUGGESTIONS.length;

  const rotatedSuggestions = [
    ...SUGGESTIONS.slice(startIndex),
    ...SUGGESTIONS.slice(0, startIndex),
  ];

  return rotatedSuggestions.slice(0, safeCount);
}
