import Image from 'next/image';

import { ExternalLink } from 'lucide-react';
import { z } from 'zod';

import { formatNumber } from '@/lib/format';

export interface BitcoinPriceData {
  price: number;
  lastUpdated: string;
  source: string;
}

interface BitcoinAddressParam {
  address: string;
}

interface BitcoinUTXO {
  outpoint: string;
  value: number;
  runes: {
    name: string;
    balance: string;
  }[];
  inscriptions: string[];
}

interface BitcoinInscription {
  inscription_id: string;
  inscription_number: number;
  content_type: string;
  owner_address: string;
  genesis_address: string;
  timestamp: string;
  content_url: string;
}

interface BRC20Token {
  tick: string;
  balance: number;
}

interface RuneBalance {
  name: string;
  balance: string;
}

interface BitcoinWalletData {
  address: string;
  balance: number;
  utxos: BitcoinUTXO[];
  inscriptions: BitcoinInscription[];
  brc20: BRC20Token[];
  runes: RuneBalance[];
  lastUpdated: string;
}

export async function getBitcoinPrice(): Promise<BitcoinPriceData> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    );
    const data = await response.json();

    return {
      price: data.bitcoin.usd,
      lastUpdated: new Date().toISOString(),
      source: 'CoinGecko',
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    return {
      price: 84847,
      lastUpdated: new Date().toISOString(),
      source: 'Mock Data',
    };
  }
}

async function fetchWalletUTXOs(address: string): Promise<BitcoinUTXO[]> {
  const response = await fetch(
    `https://api.ordiscan.com/v1/address/${address}/utxos`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
      },
    },
  );
  if (!response.ok) throw new Error('Failed to fetch UTXOs');
  const { data } = await response.json();
  return data;
}

async function fetchWalletInscriptions(
  address: string,
): Promise<BitcoinInscription[]> {
  const response = await fetch(
    `https://api.ordiscan.com/v1/address/${address}/inscriptions`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
      },
    },
  );
  if (!response.ok) throw new Error('Failed to fetch inscriptions');
  const { data } = await response.json();
  return data;
}

async function fetchWalletRunes(address: string): Promise<RuneBalance[]> {
  const response = await fetch(
    `https://api.ordiscan.com/v1/address/${address}/runes`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
      },
    },
  );
  if (!response.ok) throw new Error('Failed to fetch runes');
  const { data } = await response.json();
  return data;
}

async function fetchWalletBRC20(address: string): Promise<BRC20Token[]> {
  const response = await fetch(
    `https://api.ordiscan.com/v1/address/${address}/brc20`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
      },
    },
  );
  if (!response.ok) throw new Error('Failed to fetch BRC20 tokens');
  const { data } = await response.json();
  return data;
}

const UTXOCard = ({ utxo }: { utxo: BitcoinUTXO }) => {
  const [txid, vout] = utxo.outpoint.split(':');
  return (
    <div className="rounded-md border bg-muted/50 p-3">
      <div className="flex justify-between">
        <p className="font-mono text-sm">
          {utxo.outpoint.slice(0, 4)}...{utxo.outpoint.slice(-6)}
        </p>
        <div className="flex">
          <a
            href={`https://mempool.space/tx/${txid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-xs text-blue-500 hover:text-blue-700"
          >
            View <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
      <p className="text-sm font-medium">
        {(utxo.value / 100000000).toFixed(8)} BTC
      </p>
      {utxo.inscriptions.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Contains {utxo.inscriptions.length} inscription(s)
        </p>
      )}
      {utxo.runes.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {utxo.runes.map((rune) => (
            <span
              key={rune.name}
              className="rounded-full bg-accent/10 px-2 py-1 text-xs"
            >
              {rune.name}: {rune.balance}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const InscriptionCard = ({
  inscription,
}: {
  inscription: BitcoinInscription;
}) => (
  <div className="rounded-md border bg-muted/50 p-3">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium">#{inscription.inscription_number}</p>
        <p className="text-xs text-muted-foreground">
          {inscription.content_type}
        </p>
      </div>
      <a
        href={inscription.content_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-xs text-blue-500 hover:text-blue-700"
      >
        View <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    </div>
  </div>
);

const TokenCard = ({
  token,
  type,
}: {
  token: BRC20Token | RuneBalance;
  type: 'brc20' | 'rune';
}) => (
  <div className="rounded-md border bg-muted/50 p-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">
        {type === 'brc20'
          ? (token as BRC20Token).tick
          : (token as RuneBalance).name}
      </span>
      <span className="text-sm">
        {type === 'brc20'
          ? formatNumber((token as BRC20Token).balance, 'number')
          : (token as RuneBalance).balance}
      </span>
    </div>
  </div>
);

// 1. Balance Tool
export const bitcoinBalanceTool = {
  getBitcoinBalance: {
    displayName: '💰 Bitcoin Balance',
    description: 'Get the total BTC balance for an address',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
    }),
    execute: async ({ address }: BitcoinAddressParam) => {
      const utxos = await fetchWalletUTXOs(address);
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      return {
        suppressFollowUp: true,
        data: {
          address,
          balance,
          balanceBTC: balance / 100000000,
          lastUpdated: new Date().toISOString(),
        },
      };
    },
    render: ({
      data,
    }: {
      data: { address: string; balance: number; balanceBTC: number };
    }) => (
      <div className="flex items-center gap-3 rounded-md bg-muted/50 p-4">
        <Image
          src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
          alt="Bitcoin"
          width={40}
          height={40}
          className="rounded-xl"
        />
        <div>
          <p className="font-mono">
            {data.address.slice(0, 6)}...{data.address.slice(-4)}
          </p>
          <p className="text-2xl font-bold">{data.balanceBTC.toFixed(8)} BTC</p>
          <p className="text-sm text-muted-foreground">
            {data.balance.toLocaleString()} satoshis
          </p>
        </div>
      </div>
    ),
  },
};

// 2. UTXOs Tool
export const bitcoinUtxosTool = {
  getBitcoinUTXOs: {
    displayName: '📦 Bitcoin UTXOs',
    description: 'Get all UTXOs owned by an address',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
    }),
    execute: async ({ address }: BitcoinAddressParam) => {
      const utxos = await fetchWalletUTXOs(address);
      return { suppressFollowUp: true, data: { address, utxos } };
    },
    render: ({ data }: { data: { address: string; utxos: BitcoinUTXO[] } }) => {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-2xl">🏦</p>
            <h3 className="font-medium">UTXOs ({data.utxos.length})</h3>
            <span className="ml-auto text-sm text-muted-foreground">
              {data.address.slice(0, 6)}...{data.address.slice(-4)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.utxos.slice(0, 4).map((utxo) => (
              <UTXOCard key={utxo.outpoint} utxo={utxo} />
            ))}
          </div>
          {data.utxos.length > 4 && (
            <p className="text-center text-xs text-muted-foreground">
              + {data.utxos.length - 4} more UTXOs
            </p>
          )}
        </div>
      );
    },
  },
};

// 3. Inscriptions Tool
export const bitcoinInscriptionsTool = {
  getBitcoinInscriptions: {
    displayName: '⦿ Bitcoin Inscriptions',
    description: 'Get all inscriptions owned by an address',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
      page: z.number().optional().default(1),
    }),
    execute: async ({
      address,
      page,
    }: BitcoinAddressParam & { page?: number }) => {
      const inscriptions = await fetchWalletInscriptions(address);
      return { suppressFollowUp: true, data: { address, inscriptions } };
    },
    render: ({
      data,
    }: {
      data: { address: string; inscriptions: BitcoinInscription[] };
    }) => (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-2xl">◎</p>
          <h3 className="font-medium">
            Inscriptions ({data.inscriptions.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.inscriptions.slice(0, 4).map((inscription) => (
            <InscriptionCard
              key={inscription.inscription_id}
              inscription={inscription}
            />
          ))}
        </div>
        {data.inscriptions.length > 4 && (
          <p className="text-center text-xs text-muted-foreground">
            + {data.inscriptions.length - 4} more inscriptions
          </p>
        )}
      </div>
    ),
  },
};

// 4. BRC20 Tool
export const bitcoinBRC20Tool = {
  getBitcoinBRC20: {
    displayName: '🏷️ BRC20 Tokens',
    isCollapsible: true,
    description: 'Get all BRC20 token balances for an address',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
    }),
    execute: async ({ address }: BitcoinAddressParam) => {
      const brc20 = await fetchWalletBRC20(address);
      return { suppressFollowUp: true, data: { address, brc20 } };
    },
    render: ({ data }: { data: { address: string; brc20: BRC20Token[] } }) => (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-2xl">◎</p>
          <h3 className="font-medium">BRC20 Tokens ({data.brc20.length})</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.brc20.map((token) => (
            <TokenCard key={token.tick} token={token} type="brc20" />
          ))}
        </div>
      </div>
    ),
  },
};

// 5. Runes Tool
export const bitcoinRunesTool = {
  getBitcoinRunes: {
    displayName: '▣ Runes',
    isCollapsible: true,
    description: 'Get all Rune balances for an address',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
    }),
    execute: async ({ address }: BitcoinAddressParam) => {
      const runes = await fetchWalletRunes(address);
      return { suppressFollowUp: true, data: { address, runes } };
    },
    render: ({ data }: { data: { address: string; runes: RuneBalance[] } }) => (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-2xl">▣</p>
          <h3 className="font-medium">Runes ({data.runes.length})</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.runes.map((rune) => (
            <TokenCard key={rune.name} token={rune} type="rune" />
          ))}
        </div>
      </div>
    ),
  },
};

// 6. Bitcoin price Tool
export const getBitcoinPriceTool = {
  getBitcoinPrice: {
    displayName: '💰 Get Bitcoin Price',
    isCollapsible: true,
    description: 'Get the current price of Bitcoin (BTC) in USD',
    parameters: z.object({}), // No parameters needed
    execute: async () => {
      try {
        const priceData = await getBitcoinPrice();
        return {
          success: true,
          data: priceData,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch Bitcoin price',
        };
      }
    },
    render: (result: unknown) => {
      console.log(result);

      const typedResult = result as {
        success: boolean;
        data?: {
          price: number;
          lastUpdated: string;
          source: string;
        };
        error?: string;
      };

      if (!typedResult.success) {
        return (
          <div className="relative overflow-hidden rounded-md bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-destructive">
                Error: {typedResult.error}
              </p>
            </div>
          </div>
        );
      }

      if (!typedResult.data) {
        return (
          <div className="relative overflow-hidden rounded-md bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                No price data available
              </p>
            </div>
          </div>
        );
      }

      const { price, lastUpdated, source } = typedResult.data;
      const formattedPrice = formatNumber(price, 'currency');

      return (
        <div className="relative overflow-hidden rounded-md bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
                alt="Bitcoin"
                className="object-cover"
                fill
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-medium">Bitcoin</h3>
                <span className="shrink-0 rounded-md bg-background/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  BTC
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <span className="text-lg font-semibold">{formattedPrice}</span>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>Updated: {new Date(lastUpdated).toLocaleString()}</span>
                  <span className="mx-1">•</span>
                  <span>Source: {source}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  },
};

// 7. Portfolio Tool (Combines all others)
export const bitcoinPortfolioTool = {
  getWalletPortfolio: {
    displayName: '🏦 Wallet Portfolio',
    description:
      'Get detailed portfolio information for a wallet including BTC balance, UTXOs, inscriptions, BRC20 tokens, and Runes',
    parameters: z.object({
      address: z
        .string()
        .regex(
          /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i,
          'Invalid Bitcoin address',
        ),
    }),
    execute: async ({ address }: BitcoinAddressParam) => {
      const [balance, utxos, inscriptions, brc20, runes] = await Promise.all([
        bitcoinBalanceTool.getBitcoinBalance.execute({ address }),
        bitcoinUtxosTool.getBitcoinUTXOs.execute({ address }),
        bitcoinInscriptionsTool.getBitcoinInscriptions.execute({ address }),
        bitcoinBRC20Tool.getBitcoinBRC20.execute({ address }),
        bitcoinRunesTool.getBitcoinRunes.execute({ address }),
      ]);

      return {
        suppressFollowUp: true,
        data: {
          address,
          balance: balance.data.balance,
          utxos: utxos.data.utxos,
          inscriptions: inscriptions.data.inscriptions,
          brc20: brc20.data.brc20,
          runes: runes.data.runes,
          lastUpdated: new Date().toISOString(),
        },
      };
    },
    render: ({ data }: { data: BitcoinWalletData }) => (
      <div className="space-y-4">
        {/* Render balance */}
        {bitcoinBalanceTool.getBitcoinBalance.render({
          data: {
            address: data.address,
            balance: data.balance,
            balanceBTC: data.balance / 100000000,
          },
        })}

        {/* Render UTXOs */}
        {bitcoinUtxosTool.getBitcoinUTXOs.render({
          data: {
            address: data.address,
            utxos: data.utxos,
          },
        })}

        {/* Render Inscriptions */}
        {bitcoinInscriptionsTool.getBitcoinInscriptions.render({
          data: {
            address: data.address,
            inscriptions: data.inscriptions,
          },
        })}

        {/* Render BRC20 */}
        {bitcoinBRC20Tool.getBitcoinBRC20.render({
          data: {
            address: data.address,
            brc20: data.brc20,
          },
        })}

        {/* Render Runes */}
        {bitcoinRunesTool.getBitcoinRunes.render({
          data: {
            address: data.address,
            runes: data.runes,
          },
        })}
      </div>
    ),
  },
};

export const bitcoinTools = {
  ...getBitcoinPriceTool,
  ...bitcoinBalanceTool,
  ...bitcoinUtxosTool,
  ...bitcoinInscriptionsTool,
  ...bitcoinBRC20Tool,
  ...bitcoinRunesTool,
  ...bitcoinPortfolioTool,
};
