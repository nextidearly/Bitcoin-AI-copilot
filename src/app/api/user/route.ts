import { NextRequest, NextResponse } from 'next/server';

import { verifyUser } from '@/server/actions/user';
import { dbUpdateEarlyAccess } from '@/server/db/queries';

export async function PUT(req: NextRequest) {
  try {
    const session = await verifyUser();
    const userId = session?.data?.data?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await dbUpdateEarlyAccess({ userId });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
