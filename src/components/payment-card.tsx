import React, { useState } from 'react';

import Image from 'next/image';

import { toast } from 'sonner';

import { Badge } from './ui/badge';

const EAP_PRICE = 0.0001;
const RECEIVE_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_EAP_RECEIVE_WALLET_ADDRESS!;

declare global {
  interface Window {
    unisat: any;
  }
}

export default function PaymentCard({
  user_id,
  setModel,
}: {
  user_id: string | undefined;
  setModel: Function;
}) {
  const [isProcessing, setIsProcessing] = useState('');

  const handlePayWithUnisat = async () => {
    try {
      if (!user_id) {
        return null;
      }

      if (typeof window?.unisat == 'undefined') {
        return toast.error('UniSat Wallet is not installed!');
      }

      let txid = await window?.unisat.sendBitcoin(
        RECEIVE_WALLET_ADDRESS,
        EAP_PRICE * 10 ** 8,
      );

      if (txid) {
        await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });

        setIsProcessing('');
        setModel(false);
        toast.success('You have paied successfully!');
      }
    } catch (error: any) {
      if (error?.message) {
        toast.error(error?.message);
      } else if (error?.messages) {
        toast.error(error?.messages[0]);
      } else if (error?.msg) {
        toast.error(error?.msg);
      } else {
        toast.error(error.toString());
      }

      setIsProcessing('');
    }
  };

  return (
    <div className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/10 p-2 backdrop-blur-lg">
      <div className="max-w-sm rounded-xl bg-white p-3">
        <div className="relative space-y-3">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold sm:text-2xl">
              Early Access Program
            </h2>
            <div className="text-sm text-muted-foreground">
              We&apos;re currently limiting <Badge>access</Badge> to a limited
              amount of users to ensure stable service while continuing to
              refine features.
            </div>
          </div>

          <div className="space-y-1">
            <button
              className="flex w-full items-center gap-3 bg-gray-200/50 p-[5px] font-[16px] hover:bg-gray-200/80"
              onClick={() => {
                console.log('test');

                setIsProcessing('unisat');
                handlePayWithUnisat();
              }}
            >
              <Image
                src={'/wallet/unisat.jpg'}
                alt="wallet"
                className="h-8 w-8 rounded-lg"
                width={32}
                height={32}
              />
              <span>Unisat</span>
              {isProcessing === 'unisat' && (
                <span className="ml-auto text-xs text-gray-400">
                  Processing...
                </span>
              )}
            </button>
            <button className="flex w-full items-center gap-3 bg-gray-200/50 p-[5px] font-[16px] hover:bg-gray-200/80">
              <Image
                src={'/wallet/xverse.jpg'}
                className="h-8 w-8 rounded-lg"
                alt="wallet"
                width={32}
                height={32}
              />
              Xverse
            </button>
            <button className="flex w-full items-center gap-3 bg-gray-200/50 p-[5px] font-[16px] hover:bg-gray-200/80">
              <Image
                src={'/wallet/magiceden.png'}
                alt="wallet"
                className="h-8 w-8 rounded-lg"
                width={32}
                height={32}
              />
              MagicEden
            </button>
            <button className="flex w-full items-center gap-3 bg-gray-200/50 p-[5px] text-sm font-[16px] hover:bg-gray-200/80">
              <Image
                src={'/wallet/okx.png'}
                alt="wallet"
                className="h-8 w-8 rounded-lg border border-gray-900"
                width={32}
                height={32}
              />
              Okx
            </button>
            <button className="flex w-full items-center gap-3 bg-gray-200/50 p-[5px] font-[16px] hover:bg-gray-200/80">
              <Image
                src={'/wallet/leather.jpg'}
                alt="wallet"
                className="h-8 w-8 rounded-lg border border-gray-900"
                width={32}
                height={32}
              />
              Leather
            </button>
          </div>

          <div className="rounded-lg bg-white/[0.01] pt-0 backdrop-blur-sm dark:bg-black/[0.01]">
            <div className="flex items-center justify-between">
              <span className="text:xs font-medium sm:text-sm">Payment</span>
              <span className="text-base font-semibold sm:text-lg">
                {EAP_PRICE} BTC
              </span>
            </div>
            <div className="rounded-lg border border-teal-600 bg-teal-500/10 p-3 text-xs sm:text-sm">
              Funds will be allocated to cover expenses such as LLM integration,
              RPC data services, infrastructure maintenance, and other
              operational costs, all aimed at ensuring the platform&apos;s
              stability and reliability.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
