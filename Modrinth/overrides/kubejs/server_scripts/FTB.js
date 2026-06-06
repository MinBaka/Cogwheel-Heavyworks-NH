// L2Hostility难度等级智能联动FTB Quests（修复版+总难度增强）
// 总难度 = 基础难度等级 + l2hostility:extra_difficulty 属性值
var PlayerDifficulty = Java.loadClass('dev.xkmc.l2hostility.content.capability.player.PlayerDifficulty');

console.log("L2Hostility-FTB Quests智能联动系统启动（支持总难度计算）");

var mcServer = null;

// ============== 配置区域 ==============
var questConfig = {
    // 任务ID配置 - 修复：每个等级有1个完成任务ID和1个重置任务ID
    levelQuests: {
        // 格式：等级: {complete: 完成任务ID, extraReset: 额外重置任务ID}
        20: {
            complete: "2F58B649D2CA80BD",      // 完成任务ID
            extraReset: "19D60EDA3DB119AF"     // 需要额外重置的任务ID
        },
        50: {
            complete: "4FD3D05FC1DB8E27",      // 完成任务ID
            extraReset: "76BBFE03C8290EF7"     // 需要额外重置的任务ID
        },

        100: {
            complete: "563F9B0C5FAA2D9E",      // 完成任务ID
            extraReset: "5B7C4A840BA9B10F"     // 需要额外重置的任务ID
        },
        300: {
            complete: "390DFBFD091DFEAB",      // 完成任务ID
            extraReset: "7C83BEA15ED5C05C"     // 需要额外重置的任务ID
        },
        600: {
            complete: "535F9E9D746BBDAB",      // 完成任务ID
            extraReset: "14C3128788130382"     // 需要额外重置的任务ID
        }

    },

    // 命令模板
    completeCommand: "/ftbquests change_progress %player% complete %questId%",
    resetCommand: "/ftbquests change_progress %player% reset %questId%",

    // 阈值设置 - 修复：检测标准等级50、100、200...，不需要加5级
    thresholds: {
        completeBuffer: 0,          // 完成任务的缓冲值（例如：>=50级时完成任务，50不是55）
        resetBuffer: 2,             // 重置任务的缓冲值（例如：<=48级时重置任务）
        minChangeForCheck: 2,       // 最小变化才触发检查
    },

    // 玩家状态记录
    players: {},

    // 调试设置
    debugMode: false,
    checkInterval: 40,
};

// ============== 核心逻辑函数 ==============

// 获取玩家难度等级
function getPlayerDifficultyLevel(player) {
    try {
        var pd = PlayerDifficulty.HOLDER.get(player);
        if (!pd) return 0;

        var diffField = pd.getClass().getDeclaredField('difficulty');
        diffField.setAccessible(true);
        var difficulty = diffField.get(pd);

        var levelField = difficulty.getClass().getDeclaredField('level');
        levelField.setAccessible(true);
        var level = levelField.get(difficulty);

        return Number(level);
    } catch (e) {
        if (questConfig.debugMode) console.log("获取难度失败: " + e);
        return 0;
    }
}

// 获取玩家总难度等级（原始难度 + extra_difficulty属性值）
function getTotalDifficultyLevel(player) {
    var baseLevel = getPlayerDifficultyLevel(player);
    var extraDifficulty = 0;

    try {
        // 直接使用 player.attributes.getValue 获取额外难度值
        extraDifficulty = player.attributes.getValue('l2hostility:extra_difficulty') || 0;
    } catch (e) {
        if (questConfig.debugMode) console.log("获取extra_difficulty属性失败: " + e);
    }

    var totalLevel = baseLevel + extraDifficulty;

    if (questConfig.debugMode) {
        console.log("玩家 " + player.getName().getString() + " - 基础难度: " + baseLevel +
            ", 额外难度: " + extraDifficulty + ", 总难度: " + totalLevel);
    }

    return totalLevel;
}

// 执行命令并验证结果
function executeCommand(command) {
    if (!mcServer) {
        console.log("执行命令失败: 服务器未初始化");
        return false;
    }

    try {
        //注释，避免刷屏    console.log("正在执行命令: " + command);

        // 使用runCommand代替runCommandSilent，这样可以获取返回值
        var success = mcServer.runCommand(command);

        if (success) {
            //注释，避免刷屏   console.log("命令执行成功: " + command);
            return true;
        } else {
            console.log("命令执行失败（返回false）: " + command);
            return false;
        }
    } catch (e) {
        console.log("执行命令时出错: " + e);
        console.log("错误命令: " + command);
        return false;
    }
}

// 智能判断：是否需要检查这个玩家
function shouldCheckPlayer(player, currentLevel) {
    var playerName = player.getName().getString();
    var playerData = questConfig.players[playerName];

    if (!playerData) return true;

    var lastLevel = playerData.lastLevel || 0;
    var levelDiff = Math.abs(currentLevel - lastLevel);

    if (levelDiff >= questConfig.thresholds.minChangeForCheck) {
        if (questConfig.debugMode) {
            console.log("玩家 " + playerName + " 等级变化 " + levelDiff + "，触发检查");
        }
        return true;
    }

    return false;
}

// 更新玩家记录
function updatePlayerRecord(player, currentLevel) {
    var playerName = player.getName().getString();
    if (!questConfig.players[playerName]) {
        questConfig.players[playerName] = {
            lastLevel: currentLevel,
            completedLevels: [],
            lastCheckTime: Date.now()
        };
    }

    questConfig.players[playerName].lastLevel = currentLevel;
    questConfig.players[playerName].lastCheckTime = Date.now();
}

// 检查是否已完成某等级
function hasCompletedLevel(playerName, targetLevel) {
    var playerData = questConfig.players[playerName];
    if (!playerData || !playerData.completedLevels) return false;

    return playerData.completedLevels.includes(targetLevel);
}

// 标记等级为已完成
function markLevelCompleted(playerName, targetLevel) {
    if (!questConfig.players[playerName]) {
        questConfig.players[playerName] = {
            lastLevel: 0,
            completedLevels: [],
            lastCheckTime: Date.now()
        };
    }

    if (!hasCompletedLevel(playerName, targetLevel)) {
        questConfig.players[playerName].completedLevels.push(targetLevel);
    }
}

// 标记等级为未完成
function markLevelIncomplete(playerName, targetLevel) {
    if (!questConfig.players[playerName]) return;

    var index = questConfig.players[playerName].completedLevels.indexOf(targetLevel);
    if (index !== -1) {
        questConfig.players[playerName].completedLevels.splice(index, 1);
    }
}

// 处理单个任务
function processQuestForPlayer(player, targetLevel, questInfo) {
    var playerName = player.getName().getString();
    var baseLevel = getPlayerDifficultyLevel(player);
    var totalLevel = getTotalDifficultyLevel(player);
    var isCompleted = hasCompletedLevel(playerName, targetLevel);

    // 修复：判断逻辑使用标准等级，不加5级
    var requiredLevel = targetLevel + questConfig.thresholds.completeBuffer; // 50+0=50

    // 判断逻辑 - 使用总难度等级进行判断
    if (totalLevel >= requiredLevel && !isCompleted) {
        // 完成任务 - 只完成一个任务
        var completeCmd = questConfig.completeCommand
            .replace("%player%", playerName)
            .replace("%questId%", questInfo.complete);

        console.log("尝试完成任务 " + targetLevel + "（需" + requiredLevel + "级），基础难度: " + baseLevel + "，总难度: " + totalLevel);

        if (executeCommand(completeCmd)) {
            markLevelCompleted(playerName, targetLevel);
            player.tell("§a✓ 达到总难度等级 " + totalLevel + "（基础" + baseLevel + "），任务 " + targetLevel + " 已完成");
            console.log("玩家 " + playerName + " 完成任务: " + questInfo.complete);
            return "completed";
        } else {
            console.log("玩家 " + playerName + " 完成任务失败: " + questInfo.complete);
            return "failed";
        }
    }
    else if (totalLevel <= targetLevel - questConfig.thresholds.resetBuffer && isCompleted) {
        // 重置任务 - 需要重置两个任务，两个都必须成功
        console.log("尝试重置任务 " + targetLevel + "（需重置2个任务），基础难度: " + baseLevel + "，总难度: " + totalLevel);

        // 1. 重置主要任务
        var resetCmd1 = questConfig.resetCommand
            .replace("%player%", playerName)
            .replace("%questId%", questInfo.complete);

        //注释了避免刷屏  console.log("执行第一个重置命令: " + resetCmd1);
        var success1 = executeCommand(resetCmd1);

        // 2. 重置额外任务
        var resetCmd2 = questConfig.resetCommand
            .replace("%player%", playerName)
            .replace("%questId%", questInfo.extraReset);

        //注释了避免刷屏   console.log("执行第二个重置命令: " + resetCmd2);
        var success2 = executeCommand(resetCmd2);

        // 两个任务都必须重置成功才标记为已重置
        if (success1 && success2) {
            markLevelIncomplete(playerName, targetLevel);
            player.tell("§c⚠ 总难度等级下降至 " + totalLevel + "（基础" + baseLevel + "），任务 " + targetLevel + " 已重置");
            console.log("玩家 " + playerName + " 成功重置等级" + targetLevel + "的2个任务");
            return "reset";
        } else {
            // 如果有失败，记录具体哪个失败了
            if (!success1) {
                console.log("玩家 " + playerName + " 重置主任务失败: " + questInfo.complete);
            }
            if (!success2) {
                console.log("玩家 " + playerName + " 重置额外任务失败: " + questInfo.extraReset);
            }

            // 如果只有一个成功，尝试回滚？或者显示部分失败消息
            if (success1 || success2) {
                player.tell("§6⚠ 任务 " + targetLevel + " 重置部分失败，请手动检查");
            }

            return "failed";
        }
    }
    return "unchanged";
}

// 智能检查玩家所有任务
function smartCheckPlayerQuests(player) {
    var playerName = player.getName().getString();
    var baseLevel = getPlayerDifficultyLevel(player);
    var totalLevel = getTotalDifficultyLevel(player);

    if (!shouldCheckPlayer(player, totalLevel)) {
        return;
    }

    console.log("检查玩家: " + playerName + "，基础难度: " + baseLevel + "，总难度: " + totalLevel);

    // 获取所有目标等级并排序
    var targetLevels = Object.keys(questConfig.levelQuests)
        .map(function (str) { return Number(str); })
        .sort(function (a, b) { return a - b; });

    // 处理每个任务
    var changes = { completed: 0, reset: 0, failed: 0 };

    for (var i = 0; i < targetLevels.length; i++) {
        var targetLevel = targetLevels[i];
        var questInfo = questConfig.levelQuests[targetLevel];

        var result = processQuestForPlayer(player, targetLevel, questInfo);
        if (result === "completed") changes.completed++;
        else if (result === "reset") changes.reset++;
        else if (result === "failed") changes.failed++;
    }

    // 更新玩家记录 - 使用总难度等级
    updatePlayerRecord(player, totalLevel);

    // 显示总结
    if (changes.completed > 0 || changes.reset > 0 || changes.failed > 0) {
        var summary = "§7📊 检查完成: ";
        var parts = [];
        if (changes.completed > 0) parts.push("§a完成" + changes.completed + "个");
        if (changes.reset > 0) parts.push("§c重置" + changes.reset + "个");
        if (changes.failed > 0) parts.push("§6失败" + changes.failed + "个");

        player.tell(summary + parts.join(" "));
    }
}

// ============== 主系统 ==============

ServerEvents.loaded(function (event) {
    mcServer = event.server;
    console.log("系统初始化完成");
    console.log("监控等级: " + Object.keys(questConfig.levelQuests).join(", "));
    console.log("阈值设置: 完成缓冲=" + questConfig.thresholds.completeBuffer +
        " 重置缓冲=" + questConfig.thresholds.resetBuffer);

    // 启动智能检查
    mcServer.scheduleRepeatingInTicks(questConfig.checkInterval, function () {
        if (!mcServer) return;

        var players = mcServer.players;
        for (var i = 0; i < players.size(); i++) {
            smartCheckPlayerQuests(players.get(i));
        }
    });

    console.log("监控已启动");
});

// ============== 简化的命令系统 ==============

ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands;

    // /questinfo - 查看任务信息
    event.register(
        Commands.literal('questinfo')
            .executes(function (context) {
                var player = context.source.getPlayer();
                if (!player) return 0;

                var playerName = player.getName().getString();
                var baseLevel = getPlayerDifficultyLevel(player);
                var totalLevel = getTotalDifficultyLevel(player);
                var playerData = questConfig.players[playerName];

                player.tell("§6=== 任务信息 ===");
                player.tell("§7基础难度: §e" + baseLevel + "  §7总难度: §b" + totalLevel);
                player.tell("§7监控等级: 50, 100, 200, 300, 600, 1000");
                player.tell("§7完成阈值: 总难度≥目标等级");
                player.tell("§7重置阈值: 总难度≤目标等级-2");
                player.tell("");
                player.tell("§7任务状态:");

                var levels = Object.keys(questConfig.levelQuests)
                    .map(function (str) { return Number(str); })
                    .sort(function (a, b) { return a - b; });

                for (var i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    var isCompleted = hasCompletedLevel(playerName, level);
                    var required = level + questConfig.thresholds.completeBuffer;
                    var status = isCompleted ? "§a已完成" : "§7未完成";
                    var condition = isCompleted ?
                        "（当前总难度" + totalLevel + "级）" :
                        "（总难度需≥" + required + "级）";
                    player.tell("  " + status + " §7等级" + level + condition);
                }

                return 1;
            })
    );

    // /testcommand - 测试命令执行
    event.register(
        Commands.literal('testcommand')
            .executes(function (context) {
                var player = context.source.getPlayer();
                if (!player) return 0;

                var playerName = player.getName().getString();

                // 测试一个简单的命令
                var testCmd = "/say 测试FTB命令系统";
                player.tell("§7测试命令: " + testCmd);

                var result = mcServer.runCommand(testCmd);
                player.tell("§7命令执行结果: " + (result ? "成功" : "失败"));

                return 1;
            })
    );

    // /forcecomplete - 强制完成任务（简化版）
    event.register(
        Commands.literal('forcecomplete')
            .executes(function (context) {
                var player = context.source.getPlayer();
                if (!player) return 0;

                var playerName = player.getName().getString();
                var baseLevel = getPlayerDifficultyLevel(player);
                var totalLevel = getTotalDifficultyLevel(player);

                player.tell("§6=== 强制完成任务 ===");
                player.tell("§7基础难度: " + baseLevel + "  §7总难度: §b" + totalLevel);

                // 尝试完成所有符合条件的任务
                var completed = 0;
                var levels = Object.keys(questConfig.levelQuests)
                    .map(function (str) { return Number(str); })
                    .sort(function (a, b) { return a - b; });

                for (var i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    var questInfo = questConfig.levelQuests[level];

                    if (totalLevel >= level && !hasCompletedLevel(playerName, level)) {
                        var cmd = "/ftbquests change_progress " + playerName + " complete " + questInfo.complete;
                        player.tell("§7尝试完成等级" + level + "...");

                        if (mcServer.runCommand(cmd)) {
                            markLevelCompleted(playerName, level);
                            player.tell("  §a成功完成等级" + level);
                            completed++;
                        } else {
                            player.tell("  §c失败: 等级" + level);
                        }
                    }
                }

                player.tell("§7总计完成: §e" + completed + " §7个任务");
                return 1;
            })
    );

    // /forcereset - 强制重置所有任务
    event.register(
        Commands.literal('forcereset')
            .executes(function (context) {
                var player = context.source.getPlayer();
                if (!player) return 0;

                var playerName = player.getName().getString();

                player.tell("§6=== 强制重置任务 ===");
                player.tell("§7注意：每个等级将重置2个任务");

                var reset = 0;
                var levels = Object.keys(questConfig.levelQuests)
                    .map(function (str) { return Number(str); })
                    .sort(function (a, b) { return a - b; });

                for (var i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    var questInfo = questConfig.levelQuests[level];

                    if (hasCompletedLevel(playerName, level)) {
                        player.tell("§7尝试重置等级" + level + "...");
                        var successCount = 0;

                        // 重置主任务
                        var cmd1 = "/ftbquests change_progress " + playerName + " reset " + questInfo.complete;
                        if (mcServer.runCommand(cmd1)) {
                            player.tell("  §a重置主任务成功");
                            successCount++;
                        } else {
                            player.tell("  §c重置主任务失败");
                        }

                        // 重置额外任务
                        var cmd2 = "/ftbquests change_progress " + playerName + " reset " + questInfo.extraReset;
                        if (mcServer.runCommand(cmd2)) {
                            player.tell("  §a重置额外任务成功");
                            successCount++;
                        } else {
                            player.tell("  §c重置额外任务失败");
                        }

                        if (successCount > 0) {
                            markLevelIncomplete(playerName, level);
                            player.tell("  §a等级" + level + "重置完成 (" + successCount + "/2)");
                            reset++;
                        }
                    }
                }

                player.tell("§7总计重置: §e" + reset + " §7个等级的任务");
                return 1;
            })
    );

    // /debuginfo - 调试信息
    event.register(
        Commands.literal('debuginfo')
            .executes(function (context) {
                var player = context.source.getPlayer();
                if (!player) return 0;

                var playerName = player.getName().getString();
                var baseLevel = getPlayerDifficultyLevel(player);
                var totalLevel = getTotalDifficultyLevel(player);
                var playerData = questConfig.players[playerName];

                player.tell("§6=== 调试信息 ===");
                player.tell("§7玩家: " + playerName);
                player.tell("§7基础难度: " + baseLevel + "  §7总难度: §b" + totalLevel);
                player.tell("§7完成的任务等级: " + (playerData ? playerData.completedLevels.join(", ") : "无记录"));
                player.tell("§7最后总难度: " + (playerData ? playerData.lastLevel : "无记录"));

                // 显示所有配置
                player.tell("§7配置的任务:");
                for (var level in questConfig.levelQuests) {
                    var info = questConfig.levelQuests[level];
                    player.tell("  §7等级" + level + ":");
                    player.tell("    完成: " + info.complete);
                    player.tell("    重置: " + info.extraReset);
                }

                return 1;
            })
    );
});

console.log("修复版系统加载完成（支持总难度计算）");
console.log("重要修复：");
console.log("1. 检测阈值为标准等级（50,100,200...），不加5级");
console.log("2. 重置时需要重置2个任务ID");
console.log("3. 总难度 = 基础难度等级 + l2hostility:extra_difficulty 属性值");
console.log("4. 所有判断均基于总难度进行");
console.log("使用命令:");
console.log("/questinfo - 查看任务状态（显示基础难度和总难度）");
console.log("/testcommand - 测试命令执行");
console.log("/forcecomplete - 强制完成任务（基于总难度）");
console.log("/forcereset - 强制重置任务");
console.log("/debuginfo - 查看调试信息（显示基础难度和总难度）");