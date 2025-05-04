import * as React from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { toast } from "sonner";
import { CollapsibleContent, CollapsibleTrigger, Collapsible } from "@radix-ui/react-collapsible";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getProviderById,
  sendBtcTransaction,
} from 'sats-connect';

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
  popular?: boolean;
}

const RECEIVE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_EAP_RECEIVE_WALLET_ADDRESS!;

const PLANS: PlanDetails[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    priceBTC: 0.0001,
    description: 'Flexible monthly subscription',
  },
  {
    id: 'semiannual',
    name: '6 Months',
    priceBTC: 0.0005,
    discount: '17% off',
    description: 'Every 6 months',
    popular: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    priceBTC: 0.0009,
    discount: '25% off',
    description: 'Billed yearly',
  },
];

function PaymentCard({ user_id, setModel }: { user_id?: string; setModel: (flag: boolean) => void }) {
  const [selectedPlan, setSelectedPlan] = React.useState<BillingPlan>('semiannual');
  const [open, setOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState('');

  const handleError = (error: any) => {
    if (error?.error?.message) toast.error(error.error.message);
    else if (error?.messages) toast.error(error.messages[0]);
    else if (error?.message) toast.error(error.message);
    else if (error?.msg) toast.error(error.msg);
    else toast.error(error.toString());
    setIsProcessing('');
  };

  const processPayment = async (walletType: string, planId: BillingPlan) => {
    if (!user_id) {
      setIsProcessing('');
      return false;
    }

    const selectedPlanDetails = PLANS.find(plan => plan.id === planId);
    if (!selectedPlanDetails) {
      toast.error('Invalid plan selected');
      return false;
    }

    const amountSats = selectedPlanDetails.priceBTC * 10 ** 8;

    try {
      let txid: string | undefined = 'complete';

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
              txid = 'completed';
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
        const response = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user_id,
            plan: planId,
            transactionId: txid,
            amount: selectedPlanDetails.priceBTC,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update subscription');
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
      const success = await processPayment(walletType, selectedPlan);
      if (success) {
        setModel(false);
        toast.success('Payment successful!');
        window.location.reload();
      }
    } finally {
      setIsProcessing('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="space-y-2">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="mt-2 text-sm text-gray-500">
              Select the billing cycle that works best for you
            </p>
          </div>

          <div className="grid gap-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative cursor-pointer rounded-lg border p-3 transition-all ${selectedPlan === plan.id
                  ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-200'
                  : 'border-gray-200 hover:border-gray-300'
                  } ${plan.popular ? 'border-teal-300' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{plan.priceBTC} BTC</p>
                    {plan.discount && (
                      <p className="text-xs text-teal-600">{plan.discount}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg bg-gray-100 p-4 transition-colors hover:bg-gray-200">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">Payment Methods</span>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''
                    }`}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <div className="space-y-1 pt-2">
                {['unisat', 'xverse', 'magiceden', 'okx', 'leather'].map((wallet) => (
                  <button
                    key={wallet}
                    onClick={() => handlePayment(wallet)}
                    disabled={!!isProcessing}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 transition-colors border border-gray-200 ${isProcessing === wallet
                      ? 'bg-gray-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                  >
                    <Image
                      src={`/wallet/${wallet}.jpg`}
                      alt={wallet}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg border border-gray-200 object-cover"
                    />
                    <span className="capitalize text-gray-800">
                      {wallet === 'magiceden' ? 'Magic Eden' : wallet}
                    </span>
                    {isProcessing === wallet && (
                      <span className="ml-auto text-xs text-gray-500">Processing...</span>
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Order Summary</p>
                <p className="text-sm text-gray-500">
                  {PLANS.find(p => p.id === selectedPlan)?.name} Plan
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {PLANS.find(p => p.id === selectedPlan)?.priceBTC} BTC
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center mt-2">
              By completing your purchase, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCard;