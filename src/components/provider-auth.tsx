'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function AuthProviders({
  children,
}: {
  children: React.ReactNode;
  }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'light',
          logo: '/letter.svg',
        },
        loginMethods: ['email'],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
