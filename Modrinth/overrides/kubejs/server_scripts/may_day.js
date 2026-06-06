// 检测系统时间，2026年4月30日23:59:50开始10秒倒计时

PlayerEvents.loggedIn(event => {
    const player = event.player;
    
    // 初始化玩家数据
    if (!player.persistentData.countdownStarted) {
        player.persistentData.countdownStarted = false;
        player.persistentData.countdownValue = 0;
        player.persistentData.lastCheckTime = 0;
    }
});

ServerEvents.tick(event => {
    // 每20 ticks（1秒）检查一次
    if (event.server.tickCount % 20 !== 0) return;
    
    // 获取当前系统时间
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // 检查是否是2026年4月30日23:59:50
    if (year === 2026 && month === 4 && day === 30 && hours === 23 && minutes === 59 && seconds === 50) {
        console.log('开始五一倒计时！');
        
        // 为所有在线玩家开始倒计时
        event.server.players.forEach(player => {
            if (!player.persistentData.countdownStarted) {
                player.persistentData.countdownStarted = true;
                player.persistentData.countdownValue = 10;
                player.persistentData.lastCheckTime = event.server.tickCount;
            }
        });
    }
    
    // 处理倒计时
    event.server.players.forEach(player => {
        if (player.persistentData.countdownStarted && player.persistentData.countdownValue > 0) {
            // 检查是否已经过了一秒
            if (event.server.tickCount - player.persistentData.lastCheckTime >= 20) {
                // 发送倒计时消息
                player.tell(`§e§l${player.persistentData.countdownValue}§r`);
                
                // 播放音符盒音效
                playNoteSound(player, player.persistentData.countdownValue);
                
                // 更新倒计时值和时间
                player.persistentData.countdownValue--;
                player.persistentData.lastCheckTime = event.server.tickCount;
                
                // 如果倒计时结束，发送五一祝福
                if (player.persistentData.countdownValue === 0) {
                    player.persistentData.countdownStarted = false;
                    sendLaborDayGreetings(player);
                }
            }
        }
    });
});

// 播放音符盒音效
function playNoteSound(player, number) {
    const notes = [
        'minecraft:block.note_block.harp',
        'minecraft:block.note_block.bass',
        'minecraft:block.note_block.snare',
        'minecraft:block.note_block.hat',
        'minecraft:block.note_block.basedrum',
        'minecraft:block.note_block.bell',
        'minecraft:block.note_block.flute',
        'minecraft:block.note_block.chime',
        'minecraft:block.note_block.chime',
        'minecraft:entity.firework_rocket.twinkle'
    ];
    const noteIndex = 10 - number;
    const sound = notes[noteIndex];
    player.level.playSound(null, player.x, player.y, player.z, sound, 'players', 1.0, 1.0);
}

// 发送五一祝福
function sendLaborDayGreetings(player) {
    console.log('发送五一祝福！');
    player.tell([
        '§e§l劳动节快乐！',
        '§6感谢每个玩家！你们的支持就是我创作的动力！',
        '§a祝大家五一假期快乐，继续在Minecraft里实现你的小巧思！'
    ]);
    player.tell('§c五一到啦，祝大家玩的开心，毕竟开心最重要o(*￣▽￣*)ブ！');
    
    // 庆祝效果
    player.potionEffects.add('minecraft:speed', 600, 1, false, false);
    player.potionEffects.add('minecraft:jump_boost', 600, 1, false, false);
    
    // 可选的烟花控制数据（若需后续处理tick事件中的烟花，可保留）
    player.persistentData.fireworkCount = 0;
    player.persistentData.nextFireworkTime = player.server.tickCount;
    player.persistentData.celebrationSoundPlayed = false;
}