// 前七天和平时期 - 禁止敌对怪物生成
EntityEvents.spawned(event => {
    // 只在服务端处理
    if (event.level.isClientSide()) return;

    // 获取世界时间
    const worldTime = event.level.dayTime();
    const dayTime = worldTime % 24000; // 一天24000 ticks
    const currentDay = Math.floor(worldTime / 24000);

    // 检查是否在前七个游戏日内（第0天到第6天）
    if (currentDay < 7) {
        // 获取实体类型
        const entityType = event.entity.type;

        // 敌对怪物列表（可根据需要扩展）
        const hostileMobs = [
            'minecraft:zombie',
            'minecraft:skeleton',
            'minecraft:spider',
            'minecraft:creeper',
            'minecraft:enderman',
            'minecraft:witch',
            'minecraft:slime',
            'minecraft:magma_cube',
            'minecraft:ghast',
            'minecraft:zombie_villager',
            'minecraft:husk',
            'minecraft:stray',
            'minecraft:phantom',
            'minecraft:drowned',
            'minecraft:pillager',
            'minecraft:vindicator',
            'minecraft:evoker',
            'minecraft:vex',
            'minecraft:ravager',
            'minecraft:blaze',
            'minecraft:wither_skeleton',
            'minecraft:piglin',
            'minecraft:hoglin',
            'minecraft:zoglin',
            'minecraft:shulker',
            'touhou_little_maid:fairy'
        ];

        if (hostileMobs.includes(entityType)) {
            event.cancel();
        }
    }
});

ServerEvents.tick(event => {
    const overworld = event.server.getLevel('minecraft:overworld');
    if (!overworld) return;
    const worldTime = overworld.dayTime();
    // 第7天日出时刻 (7 * 24000 = 168000)
    if (worldTime === 168000) {
        console.log("怪物将出现在世界中！！");
        event.server.runCommandSilent('tellraw @a {"text":"怪物将出现在世界中！！","color":"red"}');
        event.server.runCommandSilent(`execute at @a run playsound minecraft:entity.ender_dragon.ambient block @a ~ ~ ~ 1 1.5`);
    }
});

PlayerEvents.loggedIn(event => {
    const overworld = event.server.getLevel('minecraft:overworld');
    if (!overworld) return;
    const worldTime = overworld.dayTime();
    if (worldTime < 168000) {
        event.player.tell('§a世界创建前七天，大部分怪物将不会在世界中生成！详情查阅任务书“关于......”');
    }
});