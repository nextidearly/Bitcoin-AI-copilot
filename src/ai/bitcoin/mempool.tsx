import { z } from 'zod';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { formatNumber } from '@/lib/format';

// Types for Mempool API responses
interface MempoolStats {
    count: number;
    vsize: number;
    total_fee: number;
}

interface MempoolBlock {
    id: string;
    height: number;
    version: number;
    timestamp: number;
    tx_count: number;
    size: number;
    weight: number;
    merkle_root: string;
    previousblockhash: string;
    mediantime: number;
    nonce: number;
    bits: number;
    difficulty: number;
    extras?: {
        totalFees: number;
        medianFee: number;
        feeRange: number[];
        reward: number;
    };
}

interface Prevout {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
}

interface Vin {
    txid: string;
    vout: number;
    prevout: Prevout;
    scriptsig: string;
    scriptsig_asm: string;
    is_coinbase: boolean;
    sequence: number;
}

interface Vout {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
}

interface Status {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
}

interface BitcoinTransaction {
    txid: string;
    version: number;
    locktime: number;
    vin: Vin[];
    vout: Vout[];
    size: number;
    weight: number;
    sigops: number;
    fee: number;
    status: Status;
}

interface FeeEstimate {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
}

interface MiningPool {
    poolId: number,
    name: string,
    link: string,
    blockCount: number,
    rank: number,
    emptyBlocks: number,
    slug: string,
    avgMatchRate: number,
    avgFeeDelta: string,
    poolUniqueId: number
}

interface NetworkStats {
    difficulty: number;
    hashrate: string;
    block_height: number;
    mempool_transactions: number;
    mempool_size: number;
    mempool_tps: number;
    next_retarget: number;
    progress_percent: number;
    inflation_usd: number;
    total_fees_usd: number;
    vbytes_per_second: number;
}

interface BlockDetailsCardProps {
    block: any;
}

// Helper functions for API calls
async function fetchMempoolStats(): Promise<MempoolStats> {
    const response = await fetch('https://mempool.space/api/mempool');
    if (!response.ok) throw new Error('Failed to fetch mempool stats');
    return response.json();
}

async function fetchFeeEstimates(): Promise<FeeEstimate> {
    const response = await fetch('https://mempool.space/api/v1/fees/recommended');
    if (!response.ok) throw new Error('Failed to fetch fee estimates');
    return response.json();
}


async function fetchTipHeight(): Promise<MempoolBlock[]> {
    const response = await fetch(`https://mempool.space/api/blocks/tip/height`);
    if (!response.ok) throw new Error('Failed to fetch latest blocks');
    return response.json();
}

async function fetchHashByHeight(height: number): Promise<string> {
    const response = await fetch(`https://mempool.space/api/block-height/${height}`);

    if (!response.ok) throw new Error('Failed to fetch latest blocks');
    return response.text();
}

async function fetchLatestBlocks(limit = 5): Promise<MempoolBlock[]> {
    const response = await fetch(`https://mempool.space/api/v1/blocks/${limit}`);
    if (!response.ok) throw new Error('Failed to fetch latest blocks');
    return response.json();
}

async function fetchBlockByHeight(height: number): Promise<MempoolBlock> {
    const hash = await fetchHashByHeight(height);

    const response = await fetch(`https://mempool.space/api/block/${hash}`);
    if (!response.ok) throw new Error('Failed to fetch block');
    return response.json();
}

async function fetchTransaction(txid: string): Promise<BitcoinTransaction> {
    const response = await fetch(`https://mempool.space/api/tx/${txid}`);
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return response.json();
}

async function fetchMiningPools(): Promise<MiningPool[]> {
    const response: any = await fetch('https://mempool.space/api/v1/mining/pools/1w');
    if (!response.ok) throw new Error('Failed to fetch mining pools');
    const pools = await response.json();
    return pools?.pools;
}


// Component for displaying fee estimates
const FeeEstimateCard = ({ fees }: { fees: FeeEstimate }) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Fastest (10 min)</p>
            <p className="text-lg font-semibold">{fees.fastestFee} sat/vB</p>
        </div>
        <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Half hour</p>
            <p className="text-lg font-semibold">{fees.halfHourFee} sat/vB</p>
        </div>
        <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Hour</p>
            <p className="text-lg font-semibold">{fees.hourFee} sat/vB</p>
        </div>
        <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Economy</p>
            <p className="text-lg font-semibold">{fees.economyFee} sat/vB</p>
        </div>
        <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Minimum</p>
            <p className="text-lg font-semibold">{fees.minimumFee} sat/vB</p>
        </div>
    </div>
);

// Component for displaying a block
const BlockCard = ({ block }: { block: MempoolBlock }) => (
    <div className="rounded-md border bg-muted/50 p-3">
        <div className="flex items-start justify-between">
            <div>
                <p className="font-medium">Block #{block.height}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(block.timestamp * 1000).toLocaleString()}
                </p>
            </div>
            <a
                href={`https://mempool.space/block/${block.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-blue-500 hover:text-blue-700"
            >
                View <ExternalLink className="ml-1 h-3 w-3" />
            </a>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p>{block.tx_count}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p>{(block.size / 1000).toFixed(2)} KB</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p>{formatNumber(block.difficulty, 'number')}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Reward</p>
                <p>{block.extras?.reward ? (block.extras.reward / 100000000).toFixed(8) + ' BTC' : 'N/A'}</p>
            </div>
        </div>
    </div>
);

// Component for displaying a block details information
const BlockDetailsCard = ({ block }: BlockDetailsCardProps) => {
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    };

    const formatHash = (hash: string) => {
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    };

    const formatValue = (value: number, unit: string = 'BTC', decimals: number = 8) => {
        if (unit === 'BTC') {
            return (value / 100000000).toFixed(decimals) + ' ' + unit;
        }
        return value.toLocaleString() + (unit ? ' ' + unit : '');
    };


    return (
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Mined on {formatTimestamp(block.timestamp)}
                    </p>
                </div>
                <a
                    href={`https://mempool.space/block/${block.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                    View in Explorer <ExternalLink className="ml-1 h-4 w-4" />
                </a>
            </div>

            {/* Block Hash Section */}
            <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm font-medium">Block Hash</p>
                <p className="mt-1 font-mono text-sm break-all">{block.id}</p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-3">
                    <div className="rounded-md border p-3">
                        <h3 className="text-sm font-medium">Summary</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Transactions</p>
                                <p className="font-medium">{block.tx_count.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Size</p>
                                <p className="font-medium">{(block.size / 1000).toFixed(2)} KB</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Weight</p>
                                <p className="font-medium">{block.weight.toLocaleString()} WU</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Version</p>
                                <p className="font-medium">0x{block.version.toString(16)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border p-3">
                        <h3 className="text-sm font-medium">Mining Information</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Difficulty</p>
                                <p className="font-medium">{formatNumber(block.difficulty)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Bits</p>
                                <p className="font-mono text-sm">{block.bits}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Nonce</p>
                                <p className="font-mono text-sm">{block.nonce.toLocaleString()}</p>
                            </div>
                            {block.extras?.matchRate && (
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Match Rate</p>
                                    <p className="font-medium">{block.extras.matchRate}%</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}

                <div className="space-y-3">
                    {
                        block.extras && <div className="rounded-md border p-3">
                            <h3 className="text-sm font-medium">Reward & Fees</h3>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Block Reward</p>
                                    <p className="font-medium">
                                        {block.extras?.reward ? formatValue(block.extras.reward) : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Total Fees</p>
                                    <p className="font-medium">
                                        {block.extras?.totalFees ? formatValue(block.extras.totalFees) : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Average Fee</p>
                                    <p className="font-medium">
                                        {block.extras?.avgFee ? formatValue(block.extras.avgFee, 'sat/vB', 0) : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Median Fee</p>
                                    <p className="font-medium">
                                        {block.extras?.medianFee ? formatValue(block.extras.medianFee, 'sat/vB', 0) : 'N/A'}
                                    </p>
                                </div>
                                {block.extras?.feeRange && (
                                    <div className="flex justify-between">
                                        <p className="text-xs text-muted-foreground">Fee Range</p>
                                        <p className="font-medium">
                                            {block.extras.feeRange.join(', ')} sat/vB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    }


                    <div className="rounded-md border p-3">
                        <h3 className="text-sm font-medium">Chain Links</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Merkle Root</p>
                                <p className="font-mono text-xs">{formatHash(block.merkle_root)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Previous Block</p>
                                <p className="font-mono text-xs">{formatHash(block.previousblockhash)}</p>
                            </div>
                        </div>
                    </div>

                    {block.extras?.coinbaseTx && (
                        <div className="rounded-md border p-3">
                            <h3 className="text-sm font-medium">Coinbase Transaction</h3>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Recipient</p>
                                    <p className="font-mono text-xs">
                                        {block.extras.coinbaseTx.vout[0].scriptpubkey_address}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-medium">
                                        {formatValue(block.extras.coinbaseTx.vout[0].value)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// Component for displaying a transaction
const TransactionCard = ({ transaction }: { transaction: BitcoinTransaction }) => {
    const formatBTC = (satoshi: number): string => {
        return (satoshi / 100000000).toFixed(8);
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const totalInput = transaction.vin.reduce((sum, input) => sum + input.prevout.value, 0);
    const totalOutput = transaction.vout.reduce((sum, output) => sum + output.value, 0);

    return (
        <div className='bg-muted/50 border rounded p-4'>
            <div className="flex items-center justify-between">
                <div></div>
                <a
                    href={`https://mempool.space/tx/${transaction.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-500"
                >
                    View in explorer <ExternalLink className="ml-1 h-4 w-4" />
                </a>
            </div>

            <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider">
                                General Information
                            </h4>
                            <dl className="mt-2 space-y-2 bg-muted border rounded p-2">
                                <div className="flex justify-between">
                                    <dt className="text-sm">Status</dt>
                                    <dd className="text-sm">
                                        {transaction.status.confirmed ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Confirmed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                Pending
                                            </span>
                                        )}
                                    </dd>
                                </div>
                                {transaction.status.confirmed && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-sm">Block Height</dt>
                                            <dd className="text-sm">{transaction.status.block_height}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-sm">Block Time</dt>
                                            <dd className="text-sm">
                                                {formatDate(transaction.status.block_time!)}
                                            </dd>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-sm">Version</dt>
                                    <dd className="text-sm">{transaction.version}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Locktime</dt>
                                    <dd className="text-sm">{transaction.locktime}</dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider">
                                Technical Details
                            </h4>
                            <dl className="mt-2 space-y-2 bg-muted border rounded p-2">
                                <div className="flex justify-between">
                                    <dt className="text-sm">Size</dt>
                                    <dd className="text-sm">{transaction.size} bytes</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Weight</dt>
                                    <dd className="text-sm">{transaction.weight} WU</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">SigOps</dt>
                                    <dd className="text-sm">{transaction.sigops}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider">
                                Financial Information
                            </h4>
                            <dl className="mt-2 space-y-2 bg-muted border rounded p-2">
                                <div className="flex justify-between">
                                    <dt className="text-sm">Total Input</dt>
                                    <dd className="text-sm">{formatBTC(totalInput)} BTC</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Total Output</dt>
                                    <dd className="text-sm">{formatBTC(totalOutput)} BTC</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Fee</dt>
                                    <dd className="text-sm">{formatBTC(transaction.fee)} BTC</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Input Count</dt>
                                    <dd className="text-sm">{transaction.vin.length}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm">Output Count</dt>
                                    <dd className="text-sm">{transaction.vout.length}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Inputs & Outputs
                    </h4>
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h5 className="mb-2 text-sm">Inputs ({transaction.vin.length})</h5>
                            <div className="space-y-2">
                                {transaction.vin.map((input, index) => (
                                    <div
                                        key={`${input.txid}-${input.vout}`}
                                        className="rounded bg-muted border p-2"
                                    >
                                        <p className="truncate text-xs font-mono">
                                            {input.txid}:{input.vout}
                                        </p>
                                        <p className="text-sm">
                                            {formatBTC(input.prevout.value)} BTC
                                        </p>
                                        <p className="truncate text-xs">
                                            {input.prevout.scriptpubkey_address}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h5 className="mb-2 text-sm">Outputs ({transaction.vout.length})</h5>
                            <div className="space-y-2">
                                {transaction.vout.map((output, index) => (
                                    <div
                                        key={`${output.scriptpubkey}-${index}`}
                                        className="rounded bg-muted border p-2"
                                    >
                                        <p className="text-sm">{formatBTC(output.value)} BTC</p>
                                        <p className="truncate text-xs">
                                            {output.scriptpubkey_address}
                                        </p>
                                        <p className="truncate text-xs font-mono">
                                            {output.scriptpubkey_type}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component for displaying mining pool
const MiningPoolCard = ({ pool }: { pool: MiningPool }) => (
    <div className="rounded-md border bg-muted/50 p-3">
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{pool.name}</p>
                <p className="text-xs text-muted-foreground">
                    {pool.blockCount} blocks ({pool.emptyBlocks} empty)
                </p>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium">{pool.avgMatchRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Rank #{pool.rank}</p>
            </div>
        </div>
    </div>
);

// 1. Fee Estimates Tool
export const bitcoinFeeTool = {
    getFeeEstimates: {
        displayName: '⛽ Bitcoin Fee Estimates',
        description: 'Get current recommended Bitcoin transaction fee rates',
        parameters: z.object({}),
        execute: async () => {
            try {
                const fees = await fetchFeeEstimates();
                return {
                    success: true,
                    data: fees,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch fee estimates',
                };
            }
        },
        render: (result: unknown) => {
            const typedResult = result as {
                success: boolean;
                data?: FeeEstimate;
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
                                No fee data available
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl">⛽</p>
                        <h3 className="font-medium">Current Fee Estimates</h3>
                    </div>
                    <FeeEstimateCard fees={typedResult.data} />
                    <p className="text-xs text-muted-foreground">
                        Fee rates in satoshis per virtual byte (sat/vB)
                    </p>
                </div>
            );
        },
    },
};

// 2. Latest Blocks Tool
export const bitcoinBlocksTool = {
    getLatestBlocks: {
        displayName: '🔄 Latest Bitcoin Blocks',
        description: 'Get the most recently mined Bitcoin blocks',
        parameters: z.object({}),
        execute: async () => {
            try {
                const latest_height = await fetchTipHeight();
                const blocks = await fetchLatestBlocks(Number(latest_height));
                return {
                    success: true,
                    data: blocks,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch blocks',
                };
            }
        },
        render: (result: unknown) => {
            const typedResult = result as {
                success: boolean;
                data?: MempoolBlock[];
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

            if (!typedResult.data || typedResult.data.length === 0) {
                return (
                    <div className="relative overflow-hidden rounded-md bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                No block data available
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl">🔄</p>
                        <h3 className="font-medium">Latest Blocks</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {typedResult.data.map((block) => (
                            <BlockCard key={block.id} block={block} />
                        ))}
                    </div>
                </div>
            );
        },
    },
};

// 3. Block by Height Tool
export const bitcoinBlockByHeightTool = {
    getBlockByHeight: {
        displayName: '📦 Bitcoin block data',
        description: 'Get detailed data about a specific Bitcoin block by its height',
        parameters: z.object({
            height: z.number().min(0),
        }),
        execute: async ({ height }: { height: number }) => {
            try {
                const block = await fetchBlockByHeight(height);

                return {
                    success: true,
                    data: block,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch block',
                };
            }
        },
        render: (result: unknown) => {
            const typedResult = result as {
                success: boolean;
                data?: MempoolBlock;
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
                                Block not found
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl">📦</p>
                        <h3 className="font-medium">Block #{typedResult.data.height}</h3>
                    </div>
                    <BlockDetailsCard block={typedResult.data} />
                </div>
            );
        },
    },
};

// 4. Transaction Tool
export const bitcoinTransactionTool = {
    getTransaction: {
        displayName: '📝 Bitcoin Transaction',
        description: 'Get detailed information about a specific Bitcoin transaction',
        parameters: z.object({
            txid: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid transaction ID'),
        }),
        execute: async ({ txid }: { txid: string }) => {
            try {
                const tx = await fetchTransaction(txid);

                return {
                    success: true,
                    data: tx,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch transaction',
                };
            }
        },
        render: (result: unknown) => {
            const typedResult = result as {
                success: boolean;
                data?: BitcoinTransaction;
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
                                Transaction not found
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl">📝</p>
                        <h3 className="font-medium">Transaction</h3>
                    </div>
                    <TransactionCard transaction={typedResult.data} />
                    <div className="rounded-md border bg-muted/50 p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Status</p>
                            <p className="text-sm">
                                {typedResult.data.status.confirmed ? (
                                    <span className="text-green-500">Confirmed</span>
                                ) : (
                                    <span className="text-yellow-500">Pending</span>
                                )}
                            </p>
                        </div>
                        {typedResult.data.status.confirmed && (
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-sm font-medium">Block Height</p>
                                <p className="text-sm">{typedResult.data.status.block_height}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        },
    },
};

// 5. Mining Pools Tool
export const bitcoinMiningPoolsTool = {
    getMiningPools: {
        displayName: '⛏️ Bitcoin Mining Pools',
        description: 'Returns a list of all known mining pools ordered by blocks found over the specified trailing 1w',
        parameters: z.object({}),
        execute: async () => {
            try {
                const pools = await fetchMiningPools();
                return {
                    success: true,
                    data: pools,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch mining pools',
                };
            }
        },
        render: (result: unknown) => {
            const typedResult = result as {
                success: boolean;
                data?: MiningPool[];
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

            if (!typedResult.data || typedResult.data.length === 0) {
                return (
                    <div className="relative overflow-hidden rounded-md bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                No mining pool data available
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl">⛏️</p>
                        <h3 className="font-medium">Mining Pools</h3>
                    </div>
                    <div className="gap-2 grid grid-cols-3">
                        {typedResult.data.slice(0, 15).map((pool) => (
                            <MiningPoolCard key={pool.name} pool={pool} />
                        ))}
                    </div>
                    {typedResult.data.length > 15 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Showing top 5 of {typedResult.data.length} pools
                        </p>
                    )}
                </div>
            );
        },
    },
};

// Combine all tools
export const mempoolTools = {
    ...bitcoinFeeTool,
    ...bitcoinBlocksTool,
    ...bitcoinBlockByHeightTool,
    ...bitcoinTransactionTool,
    ...bitcoinMiningPoolsTool
};