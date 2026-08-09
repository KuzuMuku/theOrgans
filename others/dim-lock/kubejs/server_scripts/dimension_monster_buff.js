// priority: 0
// 维度怪物增强：按难度递进，血量/攻击几何翻倍
// 难度 1 主世界(不变) → 2 地狱(×2) → 3 暮光(×4) → 4 天境(×8) → 5 深暗(×16) → 6 末地(×32)

var DIMENSION_MULTIPLIER = {
    "minecraft:the_nether": 2,
    "twilightforest:twilight_forest": 4,
    "aether:the_aether": 8,
    "deeperdarker:otherside": 16,
    "minecraft:the_end": 32
};

EntityEvents.spawned(function(event) {
    var entity = event.entity;
    if (!entity || !entity.level) {
        return;
    }

    // ===== 1. 获取维度 ID =====
    var dimensionId = "未知";
    try {
        if (entity.level.dimension) {
            if (entity.level.dimension.id) {
                dimensionId = entity.level.dimension.id;
            } else if (entity.level.dimension.toString) {
                dimensionId = entity.level.dimension.toString();
            }
        }
    } catch (e) {
        return;
    }

    // ===== 2. 判断是否为目标维度 =====
    var multiplier = DIMENSION_MULTIPLIER[dimensionId];
    if (!multiplier) {
        return; // 不是目标维度，跳过
    }

    // ===== 3. 只处理生物实体 =====
    var isLiving = false;
    try {
        isLiving = entity.isLiving();
    } catch (e) {
        isLiving = false;
    }
    if (!isLiving) {
        return;
    }

    // ===== 4. 排除玩家 =====
    try {
        if (entity.isPlayer && entity.isPlayer()) {
            return;
        }
    } catch (e) {
        // 无法判断时继续执行
    }

    // ===== 5. 修改属性 =====
    var m = multiplier;
    try {
        // --- 血量翻倍 ---
        var baseHealth = entity.getMaxHealth();
        if (entity.setMaxHealth) {
            entity.setMaxHealth(baseHealth * m);
        }
        if (entity.setHealth) {
            entity.setHealth(baseHealth * m);
        }

        // --- 攻击翻倍 ---
        var atk = entity.getAttribute("minecraft:generic.attack_damage");
        if (atk) {
            atk.setBaseValue(atk.getBaseValue() * m);
        }

        // --- 力量药水（-1 = 无限时间） ---
        if (entity.potionEffects) {
            // 药水等级 = log2(倍率)，每级 +3 攻击
            var strengthLevel = Math.floor(Math.log(m) / Math.log(2)) - 1;
            entity.potionEffects.add("minecraft:strength", -1, strengthLevel, false, false);
        }
    } catch (e) {
        // 修改失败，静默跳过
    }
});
