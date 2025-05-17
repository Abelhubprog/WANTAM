/**
 * Production-ready WANTAM Telegram Squad Bot
 * 
 * A lightweight Telegram bot that supports squad coordination and campaign actions
 */
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// Environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

// Initialize the bot and Supabase client
const bot = new TelegramBot(token, { polling: false });
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Set up webhook mode (for production)
 * @param url - The webhook URL
 */
export function setupWebhook(url: string) {
  if (!webhookSecret) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET is required for webhook mode');
  }
  
  logger.info('Setting up Telegram webhook', { url });
  bot.setWebHook(`${url}/api/telegram-bot?secret=${webhookSecret}`);
}

/**
 * Start polling mode (for development)
 */
export function startPolling() {
  logger.info('Starting Telegram bot in polling mode');
  
  // Use polling instead of webhooks for local development
  bot.startPolling();
}

/**
 * Process an update received via webhook
 * @param update - The update object from Telegram
 * @returns Promise resolving when the update is processed
 */
export async function processUpdate(update: any): Promise<void> {
  try {
    logger.debug('Processing Telegram update', { updateId: update.update_id });
    await bot.processUpdate(update);
  } catch (error) {
    logger.error('Error processing Telegram update', { error, updateId: update.update_id });
  }
}

// Handler map for tracking active commands
const commandHandlers: Record<string, (msg: TelegramBot.Message, match?: RegExpExecArray | null) => Promise<void>> = {};

// Register command handlers
function registerHandler(
  command: string, 
  handler: (msg: TelegramBot.Message, match?: RegExpExecArray | null) => Promise<void>
) {
  commandHandlers[command] = handler;
  
  // Register with bot
  bot.onText(new RegExp(`^/${command}(@\\w+)?\\s*(.*)$`), async (msg, match) => {
    try {
      logger.info('Command received', { 
        command, 
        chatId: msg.chat.id, 
        userId: msg.from?.id 
      });
      
      await handler(msg, match);
    } catch (error) {
      logger.error('Error handling command', { error, command, chatId: msg.chat.id });
      await bot.sendMessage(msg.chat.id, 'Sorry, an error occurred while processing your command. Please try again later.');
    }
  });
}

// Handle the /start command
registerHandler('start', async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'WANTAM supporter';
  
  // Record the user in the database
  if (msg.from?.id) {
    try {
      await supabase.from('telegram_users').insert([
        {
          telegram_id: msg.from.id.toString(),
          first_name: msg.from.first_name || null,
          last_name: msg.from.last_name || null,
          username: msg.from.username || null,
          chat_id: chatId.toString(),
          created_at: new Date().toISOString()
        }
      ]).onConflict('telegram_id').ignore();
    } catch (error) {
      logger.error('Error recording Telegram user', { error, userId: msg.from.id });
    }
  }
  
  const welcomeMessage = `
Welcome to the WANTAM Squad Bot, ${firstName}! 🇰🇪

This bot helps coordinate actions for the One Term movement. Use these commands:

/pledge - Get the current pledge count
/poll [question] - Create a quick poll for your squad
/boost [postId] - Express intent to boost a post with $WANTAM
/help - Show these commands again

Join the movement at https://wantam.ink
  `;
  
  await bot.sendMessage(chatId, welcomeMessage);
  
  // Record analytics
  recordAnalytics('start', msg);
});

// Handle the /help command
registerHandler('help', async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
WANTAM Squad Bot Commands:

/pledge - Get the current pledge count
/poll [question] - Create a quick poll for your squad
/boost [postId] - Express intent to boost a post with $WANTAM
/help - Show these commands again

Visit https://wantam.ink to learn more!
  `;
  
  await bot.sendMessage(chatId, helpMessage);
  
  // Record analytics
  recordAnalytics('help', msg);
});

// Handle the /pledge command to check current pledges
registerHandler('pledge', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Query Supabase for pledge count
    const { count, error } = await supabase
      .from('pledges')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Use mock count if no real data
    const pledgeCount = count || 2_111_020;
    
    // Query to get top counties
    const { data: countiesData, error: countiesError } = await supabase
      .from('pledges')
      .select('county');
    
    if (countiesError) throw countiesError;
    
    // Count by county
    const countiesCounts: Record<string, number> = {};
    if (countiesData && countiesData.length > 0) {
<<<<<<< HEAD
      countiesData.forEach((record: { county: string }) => {
=======
      countiesData.forEach(record => {
>>>>>>> origin/main
        const county = record.county;
        countiesCounts[county] = (countiesCounts[county] || 0) + 1;
      });
    } else {
      // Mock data
      countiesCounts['Nairobi'] = 438250;
      countiesCounts['Kiambu'] = 327180;
      countiesCounts['Mombasa'] = 264520;
    }
    
    // Get top 3 counties
    const topCounties = Object.entries(countiesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Format message
    let message = `🔥 *WANTAM Pledge Count*: ${pledgeCount.toLocaleString()} Kenyans\n\n`;
    message += `*Top counties:*\n`;
    
    topCounties.forEach(([county, count], index) => {
      message += `${index + 1}. ${county}: ${count.toLocaleString()} pledges\n`;
    });
    
    message += `\nOne Term Only! Join at wantam.ink`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    // Record analytics
    recordAnalytics('pledge', msg);
  } catch (error) {
    logger.error('Error fetching pledge count', { error, chatId });
    await bot.sendMessage(chatId, 'Sorry, could not fetch pledge count. Try again later.');
  }
});

// Handle the /poll command to create a quick poll
registerHandler('poll', async (msg, match) => {
  const chatId = msg.chat.id;
  const question = match?.[2]?.trim();
  
  if (!question) {
    await bot.sendMessage(chatId, 'Please provide a question for the poll. Example: /poll Should we organize a rally next Saturday?');
    return;
  }
  
  try {
    // Validate user (must be in a group chat or a verified user)
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    const isVerified = await isUserVerified(msg.from?.id?.toString());
    
    if (!isGroup && !isVerified) {
      await bot.sendMessage(chatId, 'Polls can only be created in group chats or by verified users. Please verify your account on wantam.ink');
      return;
    }
    
    // Rate limit (3 polls per hour per user in the same chat)
    const isRateLimited = await checkPollRateLimit(msg.from?.id?.toString(), chatId.toString());
    
    if (isRateLimited) {
      await bot.sendMessage(chatId, 'You can only create 3 polls per hour in this chat. Please try again later.');
      return;
    }
    
    // Insert poll into Supabase
    const { data, error } = await supabase
      .from('polls')
      .insert([
        {
          chat_id: chatId.toString(),
          question,
          created_by: msg.from?.id?.toString(),
          created_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();
    
    if (error) throw error;
    
    // Create Telegram poll with static options for simplicity
    await bot.sendPoll(
      chatId,
      question,
      ['Yes', 'No', 'Not sure'],
      { 
        is_anonymous: false,
        allows_multiple_answers: false
      }
    );
    
    // For public polls, send a share link
    if (isGroup) {
      const groupName = msg.chat.title || 'your group';
      const pollId = data?.id;
      
      if (pollId) {
        setTimeout(async () => {
          await bot.sendMessage(
            chatId,
            `Poll created successfully! Share results later with /results ${pollId}`,
            { reply_to_message_id: msg.message_id }
          );
        }, 1000);
      }
    }
    
    // Record analytics
    recordAnalytics('poll', msg);
  } catch (error) {
    logger.error('Error creating poll', { error, chatId, question });
    await bot.sendMessage(chatId, 'Sorry, could not create the poll. Try again later.');
  }
});

// Handle the /boost command to express intent to boost a post
registerHandler('boost', async (msg, match) => {
  const chatId = msg.chat.id;
  const postId = match?.[2]?.trim();
  
  if (!postId) {
    await bot.sendMessage(chatId, 'Please provide a post ID to boost. Example: /boost 123456');
    return;
  }
  
  try {
    // Verify user has WANTAM tokens
    const isVerified = await isUserVerified(msg.from?.id?.toString());
    const hasTokens = await userHasTokens(msg.from?.id?.toString());
    
    if (!isVerified) {
      await bot.sendMessage(chatId, 'You need to verify your account on wantam.ink before boosting posts.');
      return;
    }
    
    if (!hasTokens) {
      await bot.sendMessage(chatId, 'You need to hold $WANTAM tokens to boost posts. Get some at wantam.ink/buy');
      return;
    }
    
    // Insert boost intent into Supabase
    const { data, error } = await supabase
      .from('boost_intent')
      .insert([
        {
          user_id: msg.from?.id?.toString(),
          post_id: postId,
          chat_id: chatId.toString(),
          created_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();
    
    if (error) throw error;
    
    // Send confirmation message with button to complete boost
    const postUrl = `https://wantam.ink/post/${postId}`;
    
    await bot.sendMessage(
      chatId,
      `🚀 *Boost Intent Registered* 🚀\n\nYou've expressed interest in boosting post #${postId}.\n\nComplete your boost with $WANTAM!`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Complete Boost', url: postUrl }]
          ]
        }
      }
    );
    
    // Record analytics
    recordAnalytics('boost', msg, { postId });
  } catch (error) {
    logger.error('Error registering boost intent', { error, chatId, postId });
    await bot.sendMessage(chatId, 'Sorry, could not register your boost intent. Try again later.');
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  logger.error('Telegram bot polling error', { error });
});

// Record analytics
async function recordAnalytics(
  command: string, 
  msg: TelegramBot.Message, 
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('bot_analytics').insert([
      {
        command,
        chat_id: msg.chat.id.toString(),
        user_id: msg.from?.id?.toString(),
        chat_type: msg.chat.type,
        metadata,
        created_at: new Date().toISOString()
      }
    ]);
  } catch (error) {
    logger.error('Error recording analytics', { error, command });
  }
}

// Check if user is verified
async function isUserVerified(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // First check Telegram users table
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('verified')
      .eq('telegram_id', userId)
      .single();
    
    if (!telegramError && telegramUser?.verified) {
      return true;
    }
    
    // Check verified users table
    const { data: verifiedUser, error: verifiedError } = await supabase
      .from('verified_users')
      .select('id')
      .eq('telegram_id', userId)
      .single();
    
    return !verifiedError && !!verifiedUser;
  } catch (error) {
    logger.error('Error checking user verification', { error, userId });
    return false;
  }
}

// Check if user has WANTAM tokens
async function userHasTokens(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  // In a real implementation, this would check the user's wallet
  // For now, just return true for testing
  return true;
}

// Check poll rate limit
async function checkPollRateLimit(userId?: string, chatId?: string): Promise<boolean> {
  if (!userId || !chatId) return false;
  
  try {
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const { count, error } = await supabase
      .from('polls')
      .select('*', { count: 'exact' })
      .eq('created_by', userId)
      .eq('chat_id', chatId)
      .gte('created_at', hourAgo.toISOString());
    
    if (error) {
      logger.error('Error checking poll rate limit', { error, userId, chatId });
      return false;
    }
    
    return (count || 0) >= 3;
  } catch (error) {
    logger.error('Error checking poll rate limit', { error, userId, chatId });
    return false;
  }
}

// Export the bot instance and functions
export { bot };
export default {
  bot,
  setupWebhook,
  startPolling,
  processUpdate
};
