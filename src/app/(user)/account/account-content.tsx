'use client';

import { useRouter } from 'next/navigation';

import { Discord, Twitter } from '@privy-io/react-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyableText } from '@/components/ui/copyable-text';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import {
  formatPrivyId,
  formatUserCreationDate,
  formatWalletAddress,
} from '@/lib/utils/format';

import { LoadingStateSkeleton } from './loading-skeleton';

export function AccountContent() {
  const router = useRouter();
  const {
    isLoading,
    user,
    linkTwitter,
    unlinkTwitter,
    linkEmail,
    unlinkEmail,
    linkDiscord,
    unlinkDiscord,
  } = useUser();

  if (isLoading || !user) {
    return <LoadingStateSkeleton />;
  }

  const privyUser = user?.privyUser;

  const userData = {
    privyId: privyUser?.id,
    twitter: privyUser?.twitter as Twitter | undefined,
    email: privyUser?.email?.address,
    phone: privyUser?.phone?.number,
    walletAddress: privyUser?.wallet?.address || 'No wallet connected',
    createdAt: formatUserCreationDate(user?.createdAt?.toString()),
    discord: privyUser?.discord as Discord | undefined,
  };

  return (
    <div className="flex flex-1 flex-col py-8">
      <div className="w-full px-8">
        <div className="gap-4">
          <section className="space-y-4">
            <Card className="bg-sidebar">
              <CardContent className="pt-6">
                <div className="space-y-4 divide-y">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">
                        {userData.twitter
                          ? `@${userData.twitter.username}`
                          : formatWalletAddress(userData.walletAddress)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Member since {userData.createdAt}
                      </p>
                    </div>
                  </div>

                  {/* Contact information */}
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Account ID
                      </Label>
                      <div className="mt-1">
                        <CopyableText text={formatPrivyId(userData.privyId)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Connected Wallet
                      </Label>
                      <div className="mt-1">
                        <CopyableText
                          text={userData.walletAddress || ''}
                          showSolscan={true}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Early Access Program
                      </Label>
                      <div className="mt-1 flex h-8 items-center">
                        <span className={cn('text-sm font-medium')}>
                          {!user?.earlyAccess ? 'Active' : 'Not Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {/* Twitter Connection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent/50">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">X (Twitter)</p>
                          <p className="text-xs text-muted-foreground">
                            {userData.twitter
                              ? `@${userData.twitter.username}`
                              : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={
                          userData.twitter
                            ? () => unlinkTwitter(userData.twitter!.subject)
                            : linkTwitter
                        }
                        className={cn(
                          'min-w-[100px] text-xs',
                          userData.twitter &&
                            'hover:bg-destructive hover:text-destructive-foreground',
                        )}
                      >
                        {userData.twitter ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>

                    {/* Email Connection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent/50">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-xs text-muted-foreground">
                            {userData.email || 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={
                          userData.email
                            ? () => unlinkEmail(userData.email!)
                            : linkEmail
                        }
                        className={cn(
                          'min-w-[100px] text-xs',
                          userData.email &&
                            'hover:bg-destructive hover:text-destructive-foreground',
                        )}
                      >
                        {userData.email ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>

                    {/* Discord Connection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent/50">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                          >
                            <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 00-5.487 0 12.505 12.505 0 00-.617-1.249.077.077 0 00-.079-.037c-1.6.363-3.15.915-4.885 1.515a.07.07 0 00-.032.027C.533 9.045-.32 13.579.099 18.057a.082.082 0 00.031.056 19.908 19.908 0 005.993 3.04.078.078 0 00.084-.027c.464-.641.875-1.317 1.226-2.02a.076.076 0 00-.041-.105 13.098 13.098 0 01-1.872-.9.078.078 0 01-.008-.13c.126-.094.252-.192.373-.291a.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.121.099.247.198.373.292a.078.078 0 01-.006.13 12.39 12.39 0 01-1.873.899.076.076 0 00-.04.106c.36.703.772 1.379 1.226 2.02a.077.077 0 00.084.028 19.876 19.876 0 005.994-3.04.077.077 0 00.031-.055c.5-5.177-.838-9.657-4.268-13.661a.061.061 0 00-.031-.028zM8.02 15.331c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.095 2.156 2.418 0 1.334-.955 2.419-2.156 2.419zm7.975 0c-1.18 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Discord</p>
                          <p className="text-xs text-muted-foreground">
                            {userData.discord
                              ? `@${userData.discord.username}`
                              : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={
                          userData.discord
                            ? () => unlinkDiscord(userData.discord!.subject)
                            : linkDiscord
                        }
                        className={cn(
                          'min-w-[100px] text-xs',
                          userData.discord &&
                            'hover:bg-destructive hover:text-destructive-foreground',
                        )}
                      >
                        {userData.discord ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
