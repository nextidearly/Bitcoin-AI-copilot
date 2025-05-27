'use client';

import { useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useLogin } from '@privy-io/react-auth';

import { Button } from '@/components/ui/button';

const Hero = ({ handleLogin }: { handleLogin: () => void }) => {
  const productRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative pt-[5.75rem]" ref={productRef}>
      <div className="relative mx-auto max-w-screen-xl px-6 pb-6 pt-12 text-center md:pb-8 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <div className="mt-8">
            <Button
              onClick={handleLogin}
              className="h-12 min-w-[180px] text-base transition-all duration-300 hover:scale-105"
            >
              Getting Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const router = useRouter();
  let { login } = useLogin({
    onComplete: async (
      user,
      isNewUser,
      wasAlreadyAuthenticated,
      loginMethod,
      loginAccount,
    ) => {
      router.push('/home');
    },
  });

  if (isMaintenanceMode) {
    login = () => {
      window.location.href = 'https://x.com/nextidearly';
    };
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Hero handleLogin={login} />
      </main>
    </div>
  );
}
