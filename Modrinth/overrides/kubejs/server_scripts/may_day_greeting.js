PlayerEvents.loggedIn(event => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 劳动节前夜（4月30日）
    if (year === 2026 && month === 4 && day === 30) {
        console.log('今天是劳动节前夜，给大伙儿发点福利！');
        event.player.tell([
            '§e§l明天就是五一啦，今晚好好歇歇！§r',
            '§6送你一整天§a幸运§r§6效果，愿你的每一份努力都能开花结果。§r',
            '§a在方块世界里搬砖也别忘了照顾好自己哦～§r'
        ]);
        event.player.tell('§6再给你一只不死图腾，就当是个护身符，愿你现实里身体倍儿棒，吃嘛嘛香！§r');
        event.player.tell('（小提示：每次有人上线，全服都能领一次，别客气～）');
        event.player.tell('任务书里还藏着烟花，记得去掏掏看！');

        event.server.runCommandSilent(`/effect give @a minecraft:luck 86400 10`);
        event.server.runCommandSilent(`/give @a minecraft:totem_of_undying 1`);
    }

    // 劳动节当天（5月1日）
    if (year === 2026 && month === 5 && day === 1) {
        console.log('劳动节到啦！给冒险家们发点奖励！');
        event.player.tell([
            '§e§l劳动人民最光荣！§r',
            '§6今天是咱们劳动者的日子，再给你续上一天§a幸运§r§6buff，干啥都顺！§r',
            '§a摸摸你的镐子和扳手，感谢它们陪你又度过了一年。§r'
        ]);
        event.player.tell('§c齿轮在转，炉子在烧，一砖一瓦都是你亲手铺出来的。这种踏实感，比什么都强。§r');
        event.player.tell('§6马年才刚开头，你的流水线还在轰鸣，你的故事还在继续——继续往前冲吧，方块人！§r');
        event.player.tell('§b压箱底的好东西掏出来了！一堆矿物砸脸上，就当是给劳动标兵的奖章。§r');
        event.player.tell('（还是老规矩，上线一次大家都有份，多上多得～）');

        event.server.runCommandSilent(`/give @a minecraft:emerald 64`);
        event.server.runCommandSilent(`/give @a minecraft:diamond 64`);
        event.server.runCommandSilent(`/give @a minecraft:gold_ingot 64`);
        event.server.runCommandSilent(`/give @a minecraft:netherite_scrap 64`);
        event.server.runCommandSilent(`/give @a minecraft:iron_ingot 64`);
        event.server.runCommandSilent(`/effect give @a minecraft:luck 86400 10`);
    }
});