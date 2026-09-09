import { telegramSender } from '../adapters/telegram';
import { openRouterAssistant } from '../adapters/openrouter';
import { processNext, deliverNext, enqueueDailyBriefing, enqueueDueTaskReminders, enqueueJobFollowups, enqueueWeeklyProgressReminder, enqueueWeeklyReview, hasPending } from '../modules/execution/store';

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await processNext(env.DB, Date.now(), env.OPENROUTER_API_KEY ? openRouterAssistant(env.OPENROUTER_API_KEY) : undefined);
        await deliverNext(env.DB, telegramSender(env.TELEGRAM_BOT_TOKEN));
        if (await hasPending(env.DB)) await env.JOBS_QUEUE.send({wake:true}, {delaySeconds:5});
        message.ack();
      } catch {
        console.error(JSON.stringify({event:'processor_failed'}));
        message.retry({delaySeconds:30});
      }
    }
  },
  async scheduled(_event, env) {
    const [briefingQueued, taskQueued, followupQueued, reminderQueued, reviewQueued] = await Promise.all([
      enqueueDailyBriefing(env.DB), enqueueDueTaskReminders(env.DB), enqueueJobFollowups(env.DB), enqueueWeeklyProgressReminder(env.DB), enqueueWeeklyReview(env.DB),
    ]);
    const queued = briefingQueued || taskQueued || followupQueued || reminderQueued || reviewQueued;
    if (queued || await hasPending(env.DB)) await env.JOBS_QUEUE.send({wake:true}, {delaySeconds:queued ? 0 : 5});
  },
} satisfies ExportedHandler<CloudflareBindings>;
