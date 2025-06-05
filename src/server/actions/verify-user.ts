'use server'

import { actionClient, ActionResponse } from "@/lib/safe-action";
import { cookies } from "next/headers";

interface BitxUser {
  id: string;
  privyId: string;
}

export const verifyUser = actionClient.action<
  ActionResponse<{
    id: string;
    degenMode: boolean;
    privyId: string;
  }>
>(async () => {
  try {
    const cookieStore = cookies();
    const userCookie = (await cookieStore).get("bitx-user-data");

    if (!userCookie?.value) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const user = JSON.parse(userCookie.value) as BitxUser;

    return {
      success: true,
      data: {
        id: user.id,
        privyId: user.privyId,
        degenMode: false,
      },
    };
  } catch (err) {
    return { success: false, error: "Authentication failed" };
  }
});
