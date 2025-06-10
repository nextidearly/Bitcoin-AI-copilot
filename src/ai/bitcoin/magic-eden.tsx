import { ExternalLink } from 'lucide-react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Placeholder } from '@/lib/placeholder';

// Types
interface MagicEdenStats {
  symbol: string;
  floorPrice: string;
  totalListed: string;
  owners: string;
  totalVolume: string;
  pendingTransactions: string;
  supply: string;
}

interface MagicEdenActivity {
  kind: string;
  collectionSymbol: string;
  tokenInscriptionNumber: number;
  createdAt: string;
  txBlockTime: string;
  listedPrice?: number;
  txId?: string;
}

interface MagicEdenRuneActivity {
  amount: string;
  formattedAmount: string;
  updatedAt: string;
  maker: string;
  price: number;
  side: string;
  formattedUnitPrice: string;
  fillableAmount: string;
}

interface MagicEdenCollection {
  cohort: string;
  name: string;
  collectionSymbol: string;
  collectionId: string;
  vol: number;
  totalVol: number;
  totalTxns: number;
  txns: number;
  fp: number;
  fpPctChg: number;
  fpListingPrice: number;
  fpListingCurrency: string;
  highestGlobalOfferBidCurrency: string;
  marketCap: number;
  totalSupply: number;
  listedCount: number;
  ownerCount: number;
  uniqueOwnerRatio: number;
  image: string;
  isCompressed: boolean;
  hasInscriptions: boolean;
  currency: string;
  pending: number;
  currencyUsdRate: number;
  marketCapUsd: number;
  fpSparkLinePath: string;
}

interface MagicEdenRuneStats {
  rune: string;
  runeNumber: number;
  symbol: string;
  ticker: string;
  name: string;
  totalSupply: string;
  formattedTotalSupply: string;
  divisibility: number;
  imageURI: string;
  minOrderSize: number;
  maxOrderSize: number;
  pendingTxnCount: number;
  floorUnitPrice: { formatted: string; value: string };
  bestOfferPrice: { formatted: string; value: string };
  bidsTVL: number;
  marketCap: number;
  holderCount: number;
  volume: {
    '1d': number;
    '7d': number;
    '30d': number;
    all: number;
  };
  deltaFloor: {
    '1d': number;
    '7d': number;
    '30d': number;
  };
  txnCount: { '1d': number; '7d': number; '30d': number; all: number };
  isVerified: true;
  offChainTicker: string;
}

interface MagicEdenRunes {
  rune: string;
  etching: {
    divisibility: number;
    premine: string;
    runeId: {
      block: number;
      tx: number;
    };
    runeName: string;
    runeTicker: string;
    runeNumber: number;
    symbol: string;
    txid: string;
  };
  vol: number;
  totalVol: number;
  totalTxns: number;
  unitPriceSats: number;
  formattedUnitPriceSats: string;
  txnCount: number;
  imageURI: string;
  unitPriceChange: number;
  holderCount: number;
  pendingCount: number;
  marketCap: number;
  unitPriceSparkLinePath: string;
  isVerified: true;
  offChainTicker: string;
}

function convertRuneNameToTicker(runeName: string) {
  // Remove all bullet characters and any whitespace
  return runeName.replace(/[•\s]/g, '');
}

const satsToBTC = (lamports: number) => {
  return lamports / 10 ** 8;
};

const formatLargeNumber = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const processImageUrl = (url: string): string => {
  if (!url) return Placeholder.nft();

  try {
    // Remove query parameters and get clean URL
    const cleanUrl = url.split('?')[0];

    // Handle IPFS URLs
    if (cleanUrl.includes('ipfs://')) {
      const hash = cleanUrl.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }

    // Handle various IPFS gateway URLs
    const ipfsMatch = cleanUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (ipfsMatch || cleanUrl.includes('nftstorage.link')) {
      let cid = ipfsMatch ? ipfsMatch[1] : cleanUrl.split('/').pop();
      if (cid) {
        // Remove file extension if present
        cid = cid.split('.')[0];
        return `https://ipfs.io/ipfs/${cid}`;
      }
    }

    // Handle Arweave URLs
    if (cleanUrl.includes('arweave.net')) {
      // Keep the original Arweave URL but ensure it's HTTPS
      return cleanUrl.replace('http://', 'https://');
    }

    return url;
  } catch (error) {
    console.warn('Error processing image URL:', error);
    return Placeholder.nft();
  }
};

// Components
const CollectionStats = ({ stats }: { stats: MagicEdenStats }) => {
  return (
    <Card className="space-y-4 bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Collection Stats</h3>
        <a
          href={`https://magiceden.io/ordinals/marketplace/${stats.symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Floor Price
          </div>
          <div className="mt-1 text-xl font-semibold">
            ◎ {satsToBTC(Number(stats.floorPrice))} BTC
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Total Volume
          </div>
          <div className="mt-1 text-xl font-semibold">
            ◎ {satsToBTC(Number(stats.totalVolume))} BTC
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Listed
          </div>
          <div className="mt-1 text-xl font-semibold">
            {stats.totalListed.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Owners
          </div>
          <div className="mt-1 text-xl font-semibold">◎ {stats.owners}</div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Pending Transactions
          </div>
          <div className="mt-1 text-xl font-semibold">
            ◎ {stats.pendingTransactions}
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Supply
          </div>
          <div className="mt-1 text-xl font-semibold">◎ {stats.supply}</div>
        </div>
      </div>
    </Card>
  );
};

const RuneStats = ({ stats }: { stats: MagicEdenRuneStats }) => {
  return (
    <Card className="space-y-4 bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Rune Stats</h3>
        <a
          href={`https://magiceden.io/runes/${stats.ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Floor Price
          </div>
          <div className="mt-1 text-xl font-semibold">
            ▣ {stats.floorUnitPrice.formatted} sats/{stats.symbol}
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Volume (1d)
          </div>
          <div className="mt-1 text-xl font-semibold">
            ▣ {satsToBTC(Number(stats.volume[`1d`]))} BTC
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Bids TVL
          </div>
          <div className="mt-1 text-xl font-semibold">
            ▣ {satsToBTC(stats.bidsTVL)} BTC
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Holders
          </div>
          <div className="mt-1 text-xl font-semibold">
            ▣ {stats.holderCount}
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Trades (1d)
          </div>
          <div className="mt-1 text-xl font-semibold">
            ▣ {stats.txnCount[`1d`]}
          </div>
        </div>
        <div className="rounded-lg bg-background/50 p-2 shadow-md">
          <div className="text-sm font-medium text-muted-foreground">
            Supply
          </div>
          <div className="mt-1 text-xl font-semibold">
            ◎ {formatLargeNumber(Number(stats.totalSupply))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const ActivityList = ({ activities }: { activities: MagicEdenActivity[] }) => {
  const renderKind = (kind: string) => {
    if (kind === 'coll_offer_edited' || kind === 'coll_offer_created') {
      return 'offer';
    } else if (kind === 'list') {
      return 'list';
    } else if (kind === 'transfer') {
      return 'transfer';
    } else if (kind === 'mint_broadcasted') {
      return 'mint';
    } else if (kind === 'buying_broadcasted') {
      return 'buy';
    } else {
      return '';
    }
  };

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => (
        <Card
          key={index}
          className="flex flex-col items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row"
        >
          <div className="flex items-center gap-2">
            {activity.listedPrice ? (
              <span className="text-sm font-medium">
                Price: {Number(activity.listedPrice) / 10 ** 8}
              </span>
            ) : (
              <></>
            )}

            <div className="flex items-center gap-1 bg-red-500">
              <Badge
                variant={
                  activity.kind === 'coll_offer_edited'
                    ? 'secondary'
                    : activity.kind === 'list'
                      ? 'outline'
                      : activity.kind === 'delist'
                        ? 'destructive'
                        : 'default'
                }
              >
                {renderKind(activity.kind)}
              </Badge>
            </div>
          </div>

          <div className="flex gap-1 text-sm text-muted-foreground">
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatTimestamp(new Date(activity.createdAt).getTime())}
            </span>

            {activity.txId ? (
              <a
                href={`https://mempool.space/tx/${activity.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <div className="cursor-not-allowed text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const RuneActivityList = ({
  activities,
}: {
  activities: MagicEdenRuneActivity[];
}) => {
  return (
    <div className="space-y-1">
      {activities.map((activity, index) => (
        <Card
          key={index}
          className="flex flex-col items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row"
        >
          <div className="flex items-center gap-2">
            {activity.price ? (
              <span className="text-sm font-medium">
                Price: {Number(activity.price) / 10 ** 8}
              </span>
            ) : (
              <></>
            )}

            {activity.maker ? (
              <span className="text-sm font-medium">
                Maker: {activity.maker.slice(0, 4)}...{activity.maker.slice(-4)}
              </span>
            ) : (
              <></>
            )}

            <div className="flex items-center gap-1 bg-red-500">
              <Badge
                variant={
                  activity.side === 'coll_offer_edited'
                    ? 'secondary'
                    : activity.side === 'list'
                      ? 'outline'
                      : activity.side === 'delist'
                        ? 'destructive'
                        : 'default'
                }
              >
                {activity.side}
              </Badge>
            </div>
          </div>

          <div className="flex gap-1 text-sm text-muted-foreground">
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatTimestamp(new Date(activity.updatedAt).getTime())}
            </span>

            {activity.maker ? (
              <a
                href={`https://mempool.space/address/${activity.maker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <div className="cursor-not-allowed text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const PopularCollections = ({
  collections,
  timeRange,
}: {
  collections: MagicEdenCollection[];
  timeRange: string;
}) => {
  return (
    <div className="space-y-1">
      {collections.map((collection, index) => (
        <Card
          className="space-y-4 bg-muted/50 p-3 shadow-none w-full"
          key={collection.collectionId}
        >
          <a
            href={`https://magiceden.io/ordinals/marketplace/${collection.collectionSymbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="block sm:flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <img
                  src={processImageUrl(collection.image)}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = Placeholder.nft();
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <h4 className="truncate text-sm font-medium">
                    {collection.name}
                  </h4>
                  <Badge variant="outline" className="ml-2">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Floor: {collection.fp} ₿</span>
                  <span >
                    Volume {timeRange}: {collection.vol} ₿
                  </span>
                  <span className='sm:whitespace-nowrap'>
                    Sales {timeRange}: {collection.txns}
                  </span>
                </div>
              </div>
              <div className="relative shrink-0 overflow-hidden rounded-xl">
                <img
                  src={processImageUrl(
                    `https://stats-mainnet.magiceden.io${collection.fpSparkLinePath}`,
                  )}
                  alt={collection.fpSparkLinePath}
                  className="h-full object-cover w-full sm:w-20"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = Placeholder.nft();
                  }}
                />
              </div>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
};

const PopularRunes = ({
  runes,
  timeRange,
}: {
  runes: MagicEdenRunes[];
  timeRange: string;
}) => {
  return (
    <div className="space-y-1">
      {runes.map((rune, index) => (
        <Card className="space-y-4 bg-muted/50 p-3 shadow-none" key={rune.rune}>
          <a
            href={`https://magiceden.io/runes/${rune.etching.runeName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="block sm:flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <img
                  src={processImageUrl(rune.imageURI)}
                  alt={rune.rune}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = Placeholder.nft();
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <h4 className="truncate text-sm font-medium">
                    {rune.etching.runeName}
                  </h4>
                  <Badge variant="outline" className="ml-2">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex">
                    Price Sats: {rune.unitPriceSats} sats/{rune.etching.symbol}
                  </span>
                  <span className="flex">
                    Volume {timeRange}: {rune.vol} ₿
                  </span>
                  <span className="flex">
                    Sales {timeRange}: {rune.txnCount}
                  </span>
                </div>
              </div>
              <div className="relative shrink-0 overflow-hidden rounded-xl">
                <img
                  src={processImageUrl(
                    `https://stats-mainnet.magiceden.io${rune.unitPriceSparkLinePath}`,
                  )}
                  alt={rune.unitPriceSparkLinePath}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = Placeholder.nft();
                  }}
                />
              </div>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
};

// Tools Export
export const magicEdenTools = {
  getCollectionStats: {
    displayName: '📊 Collection Stats',
    description:
      'Get detailed statistics for a collection including floor price, listed count, owners, and total volume.',
    parameters: z.object({
      symbol: z.string().describe('The collection symbol/slug to check'),
    }),
    execute: async ({ symbol }: { symbol: string }) => {
      try {
        const response = await fetch(
          `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=${symbol}`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch collection stats: ${response.statusText}`,
          );
        }

        const data = (await response.json()) as MagicEdenStats;
        return {
          suppressFollowUp: true,
          data,
        };
      } catch (error) {
        throw new Error(
          `Failed to get collection stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenStats }).data;
      return <CollectionStats stats={result} />;
    },
  },

  getCollectionActivities: {
    displayName: '📈 Collection Activities',
    description:
      'Get recent trading activities for a collection including bids, listings, and sales.',
    parameters: z.object({
      symbol: z.string().describe('The collection symbol/slug to check'),
    }),
    execute: async ({ symbol }: { symbol: string }) => {
      try {
        const response = await fetch(
          `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?limit=100&collectionSymbol=${symbol}&kind[]=buying_broadcasted&kind[]=offer_accepted_broadcasted&kind[]=coll_offer_fulfill_broadcasted&kind[]=list&kind[]=coll_offer_created&kind[]=coll_offer_edited&kind[]=delist&kind[]=transfer&kind[]=mint_broadcasted`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch collection activities: ${response.statusText}`,
          );
        }

        const data = (await response.json()).activities as MagicEdenActivity[];
        // Only return the most recent 10 activities
        return {
          suppressFollowUp: true,
          data: data.slice(0, 10),
        };
      } catch (error) {
        throw new Error(
          `Failed to get collection activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenActivity[] }).data;
      return <ActivityList activities={result} />;
    },
  },

  getPopularCollections: {
    displayName: '🔥 Popular Collections',
    description:
      'Get the most popular collections on volume and activity.',
    parameters: z.object({
      timeRange: z
        .enum(['1h', '1d', '7d', '30d'])
        .describe('Time range for popularity metrics'),
    }),
    execute: async ({
      timeRange,
      limit,
    }: {
      timeRange: string;
      limit: number;
    }) => {
      try {
        const response = await fetch(
          `https://stats-mainnet.magiceden.io/collection_stats/search/bitcoin?offset=0&window=${timeRange}&limit=10&sort=volume&direction=desc&filter=%7B%22qc%22:%7B%22isVerified%22:true,%22minOwnerCount%22:30,%22minTxns%22:5%7D%7D`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch popular collections: ${response.statusText}`,
          );
        }

        const data = (await response.json()) as MagicEdenCollection[];

        // Remove duplicate collections (same symbol)
        const uniqueCollections = data.filter(
          (collection, index, self) =>
            index ===
            self.findIndex(
              (c) => c.collectionSymbol === collection.collectionSymbol,
            ),
        );

        return {
          suppressFollowUp: true,
          data: uniqueCollections.slice(0, limit),
          timeRange: timeRange,
        };
      } catch (error) {
        throw new Error(
          `Failed to get popular collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenCollection[] }).data;
      return (
        <PopularCollections
          collections={result}
          timeRange={(raw as { timeRange: string }).timeRange}
        />
      );
    },
  },

  getRuneActivities: {
    displayName: '📈 Rune Activities',
    description:
      'Get recent trading activities for a rune including bids, listings, and sales.',
    parameters: z.object({
      symbol: z.string().describe('The rune name/symbol to check'),
    }),
    execute: async ({ symbol }: { symbol: string }) => {
      try {
        const response = await fetch(
          `https://api-mainnet.magiceden.dev/v2/ord/btc/runes/orders/${convertRuneNameToTicker(symbol)}?offset=0&includePending=false&sort=unitPriceAsc&rbfPreventionListingOnly=false&side=buy`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch collection activities: ${response.statusText}`,
          );
        }

        const data = (await response.json()).orders as MagicEdenRuneActivity[];
        console.log(data);
        // Only return the most recent 10 activities
        return {
          suppressFollowUp: true,
          data: data.slice(0, 10),
        };
      } catch (error) {
        throw new Error(
          `Failed to get collection activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenRuneActivity[] }).data;
      return <RuneActivityList activities={result} />;
    },
  },

  getRuneStats: {
    displayName: '📊 Rune Stats',
    description:
      'Get detailed statistics for a rune including floor price, listed count, owners, and total volume.',
    parameters: z.object({
      symbol: z.string().describe('The rune name/symbol to check'),
    }),
    execute: async ({ symbol }: { symbol: string }) => {
      try {
        const response = await fetch(
          `https://api-mainnet.magiceden.dev/v2/ord/btc/runes/market/${convertRuneNameToTicker(symbol)}/info`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch collection stats: ${response.statusText}`,
          );
        }

        const data = (await response.json()) as MagicEdenRuneStats;
        return {
          suppressFollowUp: true,
          data,
        };
      } catch (error) {
        throw new Error(
          `Failed to get collection stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenRuneStats }).data;
      return <RuneStats stats={result} />;
    },
  },

  getPopularRunes: {
    displayName: '🔥 Popular Runes',
    description:
      'Get the most popular runes on volume and activity.',
    parameters: z.object({
      timeRange: z
        .enum(['1h', '1d', '7d', '30d'])
        .describe('Time range for popularity metrics'),
    }),
    execute: async ({
      timeRange,
      limit,
    }: {
      timeRange: string;
      limit: number;
    }) => {
      try {
        const response = await fetch(
          `https://api-mainnet.magiceden.dev/v2/ord/btc/runes/collection_stats/search?offset=0&limit=10&sort=volume&direction=desc&window=${timeRange}&isVerified=false&filter=%7B%22allCollections%22:true%7D`,
          {
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer 8942b425-88bf-40b4-88f2-cb45a983c15f',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch popular collections: ${response.statusText}`,
          );
        }

        const data = (await response.json()).runes as MagicEdenRunes[];

        return {
          suppressFollowUp: true,
          data: data.slice(0, limit),
          timeRange: timeRange,
        };
      } catch (error) {
        throw new Error(
          `Failed to get popular collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    render: (raw: unknown) => {
      const result = (raw as { data: MagicEdenRunes[] }).data;
      return (
        <PopularRunes
          runes={result}
          timeRange={(raw as { timeRange: string }).timeRange}
        />
      );
    },
  },
};
