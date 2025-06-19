const { Bot, InlineKeyboard } = require('grammy');
require('dotenv').config();

const bot = new Bot(process.env.BOT_TOKEN);


const games = new Map();


bot.command('start', (ctx) => {
    const helpText = `🎲 Добро пожаловать в игру "Орёл и решка"!\n\n` +
                    `Правила просты:\n` +
                    `1. Нажми /play чтобы начать игру\n` +
                    `2. Выбери свою ставку: Орёл или Решка\n` +
                    `3. Бот подбросит монету и объявит результат\n` +
                    `4. Сыграй ещё раз или заверши игру\n\n` +
                    `Используй /help для справки`;
    
    ctx.reply(helpText);
});


bot.command('play', (ctx) => {
    const userId = ctx.from.id;
    games.set(userId, { status: 'waiting_for_bet' });
    
    const betKeyboard = new InlineKeyboard()
        .text('Орёл', 'heads')
        .text('Решка', 'tails');
    
    ctx.reply('Сделай свою ставку:', { reply_markup: betKeyboard });
});


bot.command('help', (ctx) => {
    ctx.reply(`Доступные команды:\n` +
              `/start - начало работы с ботом\n` +
              `/play - начать новую игру\n` +
              `/help - справка по командам\n\n` +
              `Правила игры:\n` +
              `1. Выбери ставку: Орёл или Решка\n` +
              `2. Бот подбросит монету\n` +
              `3. Если угадал - победа!\n` +
              `4. Можешь сыграть ещё раз`);
});


bot.on('callback_query:data', async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.callbackQuery.data;
    
    try {
        
        if (data === 'heads' || data === 'tails') {
            if (!games.has(userId)) {
                await ctx.reply('Начни игру командой /play');
                return;
            }
            
            const userBet = data;
            const result = Math.random() < 0.5 ? 'heads' : 'tails'; // 50/50
            
            const betText = userBet === 'heads' ? 'Орёл' : 'Решка';
            const resultText = result === 'heads' ? 'Орёл' : 'Решка';
            
            let message = `Твоя ставка: ${betText}\n` +
                         `Результат: ${resultText}\n\n` +
                         `${userBet === result ? '🎉 Ты выиграл!' : '😢 Ты проиграл'}`;
            
            
            const playAgainKeyboard = new InlineKeyboard()
                .text('Да', 'play_again')
                .text('Нет', 'end_game');
            
            await ctx.reply(message, { reply_markup: playAgainKeyboard });
            await ctx.answerCallbackQuery();
            
            
            games.set(userId, { status: 'finished', lastResult: result });
        }
        
        else if (data === 'play_again') {
            const betKeyboard = new InlineKeyboard()
                .text('Орёл', 'heads')
                .text('Решка', 'tails');
            
            await ctx.reply('Сделай новую ставку:', { reply_markup: betKeyboard });
            await ctx.answerCallbackQuery();
            
            games.set(userId, { status: 'waiting_for_bet' });
        }
        
        else if (data === 'end_game') {
            await ctx.reply('Спасибо за игру! Если захочешь сыграть снова, нажми /play');
            await ctx.answerCallbackQuery();
            
            games.delete(userId);
        }
    } catch (error) {
        console.error('Ошибка обработки callback:', error);
        await ctx.answerCallbackQuery('Произошла ошибка, попробуй ещё раз');
    }
});


bot.catch((err) => {
    console.error('Ошибка бота:', err);
});


bot.start();
console.log('Бот "Орёл и решка" запущен...');