import { NextResponse } from 'next/server';
import { verifyUser } from '@/server/actions/user';
import { dbUpdateSubscription } from '@/server/db/queries';

export async function PUT(request: Request) {
  try {
    // Verify user session
    const session = await verifyUser();
    if (!session?.data?.data?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { plan, transactionId, amount } = body;

    if (!plan || !transactionId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update subscription
    const updatedUser = await dbUpdateSubscription({
      userId: session.data.data.id,
      plan
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}