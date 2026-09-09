import commands from '../../../config/telegram-commands.json';

export type TelegramMenuCommand = { command: string; description: string };
export const telegramMenuCommands: readonly TelegramMenuCommand[] = commands;
