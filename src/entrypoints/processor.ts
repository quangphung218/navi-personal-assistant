import { sendTyping, telegramSender } from '../adapters/telegram';
import { openRouterStructuredAssistant } from '../adapters/openrouter';
import { processNext, deliverNext, enqueueDailyBriefing, enqueueDueTaskReminders, enqueueWeeklyProgressReminder, enqueueWeeklyReview, hasPending, ownerFor } from '../modules/execution/store';

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const owner = await ownerFor(env.DB);
        if (owner) await sendTyping(env.TELEGRAM_BOT_TOKEN, owner.chat_id);
        await processNext(env.DB, Date.now(), undefined, env.OPENROUTER_API_KEY ? openRouterStructuredAssistant(env.OPENROUTER_API_KEY) : undefined);
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
    const [briefingQueued, taskQueued, reminderQueued, reviewQueued] = await Promise.all([
      enqueueDailyBriefing(env.DB), enqueueDueTaskReminders(env.DB), enqueueWeeklyProgressReminder(env.DB), enqueueWeeklyReview(env.DB),
    ]);
    const queued = briefingQueued || taskQueued || reminderQueued || reviewQueued;
    if (queued || await hasPending(env.DB)) await env.JOBS_QUEUE.send({wake:true}, {delaySeconds:queued ? 0 : 5});
  },
} satisfies ExportedHandler<CloudflareBindings>;
