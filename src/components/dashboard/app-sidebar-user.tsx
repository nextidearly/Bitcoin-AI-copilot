'use client';
import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';

export const AppSidebarUser = () => {
  const { isLoading, user, logout } = useUser();
  const privyUser = user?.privyUser;

  const label = privyUser?.wallet
    ? privyUser.wallet.address.substring(0, 5)
    : privyUser?.email?.address;
  const twitter = privyUser?.twitter;
  const twitterProfileImage = twitter?.profilePictureUrl;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isLoading || !privyUser ? (
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <div className='flex gap-2 justify-center'>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto size-4" />
              </div>
            </div>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton
              onClick={logout}
            size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-muted"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={twitterProfileImage || undefined} />
                <AvatarFallback className="rounded-full bg-muted-foreground/10">
                  <span className='uppercase font-semibold'>{label?.substring(0, 1)}</span>
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight pr-5">
                <div className='flex gap-2 justify-center'>
                  <span>Log out</span> <LogOut className="mr-2 h-4 w-4" />
                </div>
              </div>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
