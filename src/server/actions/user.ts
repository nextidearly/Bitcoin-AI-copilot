'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

import { PrivyClient } from '@privy-io/server-auth';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { ActionResponse, actionClient } from '@/lib/safe-action';
import { PrismaUser } from '@/types/db';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const PRIVY_SIGNING_KEY = process.env.PRIVY_SIGNING_KEY;

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  throw new Error('Missing required Privy environment variables');
}

const PRIVY_SERVER_CLIENT = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET, {
  ...(!!PRIVY_SIGNING_KEY && {
    walletApi: {
      authorizationPrivateKey: PRIVY_SIGNING_KEY,
    },
  }),
});

const getOrCreateUser = actionClient
  .schema(z.object({ userId: z.string() }))
  .action<ActionResponse<any>>(async ({ parsedInput: { userId } }) => {
    const existingUser = await prisma.user.findUnique({
      where: { privyId: userId },
    });

    if (existingUser) {
      return { success: true, data: existingUser };
    }

    const createdUser = await prisma.user.create({
      data: {
        privyId: userId,
      },
    });

    return {
      success: true,
      data: {
        ...createdUser,
        subscription: null,
      },
    };
  });

export const verifyUser = actionClient.action<
  ActionResponse<{
    id: string;
    degenMode: boolean;
    publicKey?: string;
    privyId: string;
  }>
>(async () => {
  const token = (await cookies()).get('privy-token')?.value;
  if (!token) {
    return {
      success: false,
      error: 'No privy token found',
    };
  }

  try {
    const claims = await PRIVY_SERVER_CLIENT.verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      select: {
        id: true,
        degenMode: true,
        privyId: true,
        wallets: {
          select: {
            publicKey: true,
          },
          where: {
            active: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        privyId: user.privyId,
        degenMode: user.degenMode,
      },
    };
  } catch {
    return { success: false, error: 'Authentication failed' };
  }
});

export const getUserData = actionClient.action<ActionResponse<PrismaUser>>(
  async () => {
    const token = (await cookies()).get('privy-token')?.value;
    if (!token) {
      return {
        success: false,
        error: 'No privy token found',
      };
    }

    try {
      const claims = await PRIVY_SERVER_CLIENT.verifyAuthToken(token);

      const response = await getOrCreateUser({ userId: claims.userId });
      if (!response?.data?.success) {
        return { success: false, error: response?.data?.error };
      }

      const user = response.data?.data;
      if (!user) {
        return { success: false, error: 'Could not create or retrieve user' };
      }

      return { success: true, data: user };
    } catch {
      return { success: false, error: 'Authentication failed' };
    }
  },
);

export const getPrivyClient = actionClient.action(
  async () => PRIVY_SERVER_CLIENT,
);

export type UserUpdateData = {
  degenMode?: boolean;
  referralCode?: string; // Add referralCode as an optional field
};

export async function updateUser(data: UserUpdateData) {
  try {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;
    const privyId = authResult?.data?.data?.privyId;

    if (!userId) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Extract referralCode from the input data
    const { referralCode, degenMode } = data;

    // If referralCode is provided, validate and update referringUserId
    if (referralCode) {
      const referringUser = await prisma.user.findUnique({
        where: { referralCode },
      });

      if (!referringUser) {
        return { success: false, error: 'Invalid referral code' };
      }

      if (referringUser.id === userId) {
        return {
          success: false,
          error: 'You cannot use your own referral code',
        };
      }

      // Prevent getting referred by a user who has already been referred by you
      if (referringUser.referringUserId === userId) {
        return {
          success: false,
          error: 'You cannot use a referral code from someone you referred',
        };
      }

      // Update referringUserId along with other fields
      await prisma.user.update({
        where: { id: userId },
        data: {
          degenMode,
          referringUserId: referringUser.id,
        },
      });
    } else {
      // Update user without referral logic if no referralCode is provided
      await prisma.user.update({
        where: { id: userId },
        data: {
          degenMode,
        },
      });
    }

    // Revalidate user cache
    revalidateTag(`user-${privyId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}
