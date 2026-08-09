// priority: 0
// 维度阶段锁：按难度递进，主世界无需阶段

StartupEvents.postInit(e => {
    // 难度 2 — 地狱
    GamePhase.addDimensionRestriction("nether", "minecraft:the_nether");

    // 难度 3 — 暮光森林
    GamePhase.addDimensionRestriction("twilight_forest", "twilightforest:twilight_forest");

    // 难度 4 — 天境
    GamePhase.addDimensionRestriction("aether", "aether:the_aether");

    // 难度 5 — 深暗之域
    GamePhase.addDimensionRestriction("otherside", "deeperdarker:otherside");

    // 难度 6 — 末地
    GamePhase.addDimensionRestriction("end", "minecraft:the_end");
});
