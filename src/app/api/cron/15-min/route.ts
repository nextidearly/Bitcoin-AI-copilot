import { processAction } from '@/server/actions/action';
import { dbGetActions } from '@/server/db/queries';

export const maxDuration = 60;
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // Quarter-hour cron job
  // Get all Actions that are not completed or paused
  const actions = await dbGetActions({
    triggered: true,
    completed: false,
    paused: false,
  });

  console.log(`[cron/action] Fetched ${actions.length} actions`);

  // This job runs every 15 minutes, but we only need to process actions that are ready to be processed, based on their frequency
  // Filter the actions to only include those that are ready to be processed based on their lastExecutedAt and frequency
  const now = new Date();
  const actionsToProcess = actions.filter((action) => {
    // Filter out actions without a frequency
    if (!action.frequency) {
      return false;
    }

    // If the action has never been executed, it should be processed now
    // This means that the first time this job sees an action, it will process it
    if (!action.lastExecutedAt) {
      return true;
    }

    // Next execution time is the last execution time plus the frequency (seconds) * 1000
    const nextExecutionAt = new Date(
      action.lastExecutedAt.getTime() + action.frequency * 1000,
    );

    return now >= nextExecutionAt;
  });

  await Promise.all(actionsToProcess.map((action) => processAction(action)));

  return Response.json({ success: true });
}
