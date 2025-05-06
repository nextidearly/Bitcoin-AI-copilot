import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getProviderById,
  sendBtcTransaction,
} from 'sats-connect';
import { toast } from 'sonner';
import { Badge } from './ui/badge';

declare global {
  interface Window {
    unisat: any;
    okxwallet: any;
    magicEden: any;
  }
}

type BillingPlan = 'monthly' | 'semiannual' | 'annual';

interface PlanDetails {
  id: BillingPlan;
  name: string;
  priceBTC: number;
  discount?: string;
  description: string;
}

const RECEIVE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_EAP_RECEIVE_WALLET_ADDRESS!;

export default function PaymentCard({
  user_id,
  setModel,
}: {
  user_id: string | undefined;
  setModel: (flag: boolean) => void;
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('monthly');

  const PLANS: Record<BillingPlan, PlanDetails> = {
    monthly: {
      id: 'monthly',
      name: 'Monthly',
      priceBTC: 0.0001,
      description: 'Billed every month',
    },
    semiannual: {
      id: 'semiannual',
      name: '6 Months',
      priceBTC: 0.0005,
      discount: '17% off',
      description: 'Billed every 6 months',
    },
    annual: {
      id: 'annual',
      name: 'Annual',
      priceBTC: 0.0009,
      discount: '25% off',
      description: 'Billed yearly',
    },
  };

  const handleError = (error: any) => {
    if (error?.error?.message) toast.error(error.error.message);
    else if (error?.messages) toast.error(error.messages[0]);
    else if (error?.message) toast.error(error.message);
    else if (error?.msg) toast.error(error.msg);
    else toast.error(error.toString());
    setIsProcessing('');
  };

  const processPayment = async (walletType: string) => {
    if (!user_id) {
      setIsProcessing('');
      return false;
    }

    const selectedPlanDetails = PLANS[selectedPlan];
    const amountSats = selectedPlanDetails.priceBTC * 10 ** 8;

    try {
      let txid: string | undefined;

      switch (walletType) {
        case 'unisat':
          if (typeof window?.unisat === 'undefined') {
            toast.error('UniSat Wallet is not installed!');
            return false;
          }
          txid = await window.unisat.sendBitcoin(RECEIVE_WALLET_ADDRESS, amountSats);
          break;

        case 'xverse':
          const xverseProvider = getProviderById('XverseProviders.BitcoinProvider');
          if (!xverseProvider) {
            toast.error('Xverse wallet is not installed');
            return false;
          }
          const xverseResponse = await xverseProvider.request('sendTransfer', {
            recipients: [{ address: RECEIVE_WALLET_ADDRESS, amount: amountSats }],
          });
          if (xverseResponse.status !== 'success') {
            throw new Error(xverseResponse.error?.message || 'Payment failed');
          }
          txid = xverseResponse.txid;
          break;

        case 'leather':
          const leatherProvider = getProviderById('LeatherProvider');
          if (!leatherProvider) {
            toast.error('Leather wallet is not installed');
            return false;
          }
          const leatherResponse = await leatherProvider.request('sendTransfer', {
            recipients: [{ address: RECEIVE_WALLET_ADDRESS, amount: amountSats.toString() }],
          });
          if (leatherResponse.status !== 'success') {
            throw new Error(leatherResponse.error?.message || 'Payment failed');
          }
          txid = leatherResponse.txid;
          break;

        case 'okx':
          const okxProvider = window?.okxwallet?.bitcoin;
          if (!okxProvider) {
            toast.error('Okx wallet is not installed');
            return false;
          }
          await okxProvider.connect();
          txid = await okxProvider.sendBitcoin(RECEIVE_WALLET_ADDRESS, amountSats);
          break;

        case 'magiceden':
          const magicedenProvider = window?.magicEden?.bitcoin;
          if (!magicedenProvider) {
            toast.error('Magic Eden wallet is not installed');
            return false;
          }

          let senderAddress = '';
          await getAddress({
            getProvider: () => magicedenProvider,
            payload: {
              purposes: [AddressPurpose.Payment],
              message: 'Address for receiving Ordinals and payments',
              network: { type: BitcoinNetworkType.Mainnet },
            },
            onFinish: (response) => {
              senderAddress = response.addresses[0].address;
            },
            onCancel: () => {
              throw new Error('Request canceled');
            },
          });

          await sendBtcTransaction({
            getProvider: () => magicedenProvider,
            payload: {
              network: { type: BitcoinNetworkType.Mainnet },
              recipients: [{ address: RECEIVE_WALLET_ADDRESS, amountSats: BigInt(amountSats) }],
              senderAddress,
            },
            onFinish: () => {
              txid = 'completed'; // Magic Eden doesn't return txid immediately
            },
            onCancel: () => {
              throw new Error('Payment canceled');
            },
          });
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      if (txid) {
        // Update user subscription in database
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user_id,
            plan: selectedPlan,
            transactionId: txid,
            amount: selectedPlanDetails.priceBTC,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update subscription');
        }

        return true;
      }

      return false;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const handlePayment = async (walletType: string) => {
    setIsProcessing(walletType);
    try {
      const success = await processPayment(walletType);
      if (success) {
        setModel(false);
        toast.success('Payment successful!');
        router.refresh();
      }
    } finally {
      setIsProcessing('');
    }
  };

  return (
    <div className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/10 p-2 backdrop-blur-lg">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Subscription Plans</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a plan that works best for you
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${selectedPlan === plan.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{plan.name}</h3>
                  {plan.discount && (
                    <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-800">
                      {plan.discount}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold">{plan.priceBTC} BTC</p>
                <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Pay with Bitcoin Wallet</h3>
            {['unisat', 'xverse', 'magiceden', 'okx', 'leather'].map((wallet) => (
              <button
                key={wallet}
                onClick={() => handlePayment(wallet)}
                disabled={!!isProcessing}
                className="flex w-full items-center gap-3 rounded-lg bg-gray-100 p-3 transition-colors hover:bg-gray-200 disabled:opacity-70"
              >
                <Image
                  src={`/wallet/${wallet}.${wallet === 'okx' ? 'png' : 'jpg'}`}
                  alt={wallet}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg border border-gray-300"
                />
                <span className="capitalize">
                  {wallet === 'magiceden' ? 'Magic Eden' : wallet}
                </span>
                {isProcessing === wallet && (
                  <span className="ml-auto text-xs text-gray-500">Processing...</span>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold">
                {PLANS[selectedPlan].priceBTC} BTC
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Funds support LLM integration, RPC services, and platform maintenance
              to ensure reliability and performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}