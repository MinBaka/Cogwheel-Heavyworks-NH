const PromptUtils = Java.loadClass('com.mafuyu404.smartkeyprompts.util.PromptUtils');
const CommonUtils = Java.loadClass('com.mafuyu404.smartkeyprompts.util.CommonUtils');

ClientEvents.tick(event => {
    try {
        if (!Platform.isLoaded("parcool")) return;
        
        let player = Client.player;
        if (player == null || CommonUtils.isScreenOpen()) return;

        let isSprinting = player.isSprinting();
        let isCrouching = player.isCrouching();
        let onGround = player.onGround();
        let fallDistance = player.fallDistance;

        // 1. 奔跑时
        if (isSprinting) {
            PromptUtils.show("parcool", "key.parcool.FastRun");
            PromptUtils.show("parcool", "key.parcool.Dodge");
            PromptUtils.show("parcool", "key.parcool.Crawl");
        }

        // 2. 下落时 (高空)
        if (fallDistance > 1.5) {
            PromptUtils.show("parcool", "key.parcool.Breakfall");
            PromptUtils.show("parcool", "key.parcool.ClingToCliff");
        }

        // 3. 悬空/贴墙时 (低空或跳跃中)
        if (!onGround && fallDistance <= 1.5) {
            PromptUtils.show("parcool", "key.parcool.WallJump");
            PromptUtils.show("parcool", "key.parcool.HangDown");
        }

        // 4. 潜行时
        if (isCrouching) {
            PromptUtils.show("parcool", "key.parcool.Crawl");
            PromptUtils.show("parcool", "key.parcool.Flipping");
        }

        // 5. 准星看向方块时 (且没有在跑、潜行或浮空)
        if (onGround && !isSprinting && !isCrouching) {
            let hit = player.pick(4.0, 0.0, false);
            if (hit != null && hit.getType().name() != 'MISS') {
                PromptUtils.show("parcool", "key.parcool.Vault");
                PromptUtils.show("parcool", "key.parcool.ClimbPoles");
            }
        }
    } catch(err) {
        console.error("SKP Error: " + err);
    }
});
