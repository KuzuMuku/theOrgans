;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
let Items = Java.loadClass('net.minecraft.world.item.Items')
let LootTableClass = Java.loadClass('net.minecraft.world.level.storage.loot.LootTable')
let LootParamsBuilder = Java.loadClass('net.minecraft.world.level.storage.loot.LootParams$Builder')
let LootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
let LootContextParamSets = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParamSets')

let DIR_KEY = 'vanillaNether'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimensions: [
    'minecraft:the_nether'
  ],
  biome_keywords: [
    'nether',
    'basalt',
    'soul',
    'crimson',
    'warped'
  ],
  structures: [
    'minecraft:fortress',
    'minecraft:bastion_remnant',
    'cataclysm:burning_arena',
    'cataclysm:soul_black_smith'
  ],
  structure_radius: 10,
  structure_cache: HOME_STRUCTURE_CACHE
}
let RESOURCE = {
  system: 'vanillaNether_system',
  capacity: 'kubejs:vanillaNether_resonance_capacity',
  current: 'kubejs:vanillaNether_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let SOURCE_IDS = new Set([
  'kubejs:infernal_hearth',
  'kubejs:sacrifice_spine_furnace',
  'kubejs:obsidian_chest_cavity',
  'kubejs:ember_liver',
  'kubejs:spiritflame_lung',
  'kubejs:overload_crown',
  'kubejs:ash_spleen',
  'kubejs:slag_reflux_gland',
  'kubejs:soulsand_lung_sac',
  'kubejs:netherwart_liver',
  'kubejs:furnaceslag_kidneysheath',
  'kubejs:blackstone_spleen_membrane',
  'kubejs:blazefire_arm',
  'kubejs:scorch_throat_sac',
  'kubejs:lava_tendon',
  'kubejs:emberstride_ankle',
  'kubejs:ash_iris',
  'kubejs:sacrifice_fire_fist',
  'kubejs:inferno_shoulderplate',
  'kubejs:hellfire_tailbone',
  'kubejs:furnace_kneering',
  'kubejs:blackflame_throat_pipe',
  'kubejs:fortress_bone_key',
  'kubejs:bastion_hoof_lock',
  'kubejs:ancient_relic_hand',
  'kubejs:gilded_recovery_claw',
  'kubejs:smeltfist_subcore',
  'kubejs:cataclysm_magma_core',
  'kubejs:piglin_contract_liver',
  'kubejs:ashvale_lung'
])
let ASH_CONDUIT_ID = 'kubejs:ash_conduit'
let SLAG_PUMP_ID = 'kubejs:slag_pump'
let SOULFIRE_RHYTHM_ID = 'kubejs:soulfire_rhythm'
let GILDED_BELT_ID = 'kubejs:gilded_recovery_belt'

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let rawEntity = Common.rawEntity
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Common.getRuntimePoint
let setCounter = Runtime.setCounter
let resourceReady = Runtime.resourceReady
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let hasNearbyBlock = Common.hasNearbyBlock
let hasNearbyStructure = Common.hasNearbyStructure
let targetsSortedByDistance = Common.targetsSortedByDistance
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget

let FURNACESLAG_EFFECT = 'kubejs:furnaceslag_kidneysheath_effect'
let SOULSAND_EFFECT = 'kubejs:soulsand_lung_sac_effect'
let ASHVALE_EFFECT = 'kubejs:ashvale_lung_effect'
let ASH_SPLEEN_LOOT = [
  { item: 'minecraft:blaze_powder', count: 1, weight: 6 },
  { item: 'minecraft:blaze_rod', count: 1, weight: 3 },
  { item: 'minecraft:ghast_tear', count: 1, weight: 2 },
  { item: 'minecraft:magma_cream', count: 1, weight: 4 },
  { item: 'minecraft:wither_skeleton_skull', count: 1, weight: 1 },
  { item: 'alexsmobs:blood_sac', count: 1, weight: 5 },
  { item: 'alexsmobs:mosquito_proboscis', count: 1, weight: 3 },
  { item: 'alexsmobs:hemolymph_sac', count: 1, weight: 4 },
  { item: 'alexsmobs:warped_muscle', count: 1, weight: 3 }
]
let FORTRESS_BONE_KEY_LOOT_TABLES = [
  'betterfortresses:chests/beacon',
  'betterfortresses:chests/keep',
  'betterfortresses:chests/obsidian',
  'betterfortresses:chests/storage'
]
let FORTRESS_BONE_KEY_FALLBACK_LOOT = [
  { item: 'minecraft:blaze_rod', count: 1, weight: 4 },
  { item: 'minecraft:quartz', count: 4, weight: 6 },
  { item: 'minecraft:gold_ingot', count: 1, weight: 4 },
  { item: 'minecraft:obsidian', count: 2, weight: 3 },
  { item: 'minecraft:golden_sword', count: 1, weight: 2 },
  { item: 'minecraft:netherite_scrap', count: 1, weight: 1 }
]

function itemExists(itemId) {
  let location = ResourceLocation.tryParse(itemId)
  if (!location) {
    return false
  }
  let item = BuiltInRegistries.ITEM.get(location)
  return item != null && item !== Items.AIR
}

function grantWeighted(player, entries) {
  let entity = entityOf(player)
  let totalWeight = 0
  for (let i = 0; i < entries.length; i++) {
    if (itemExists(entries[i].item)) {
      totalWeight += Number(entries[i].weight)
    }
  }
  if (totalWeight <= 0) {
    return
  }
  let roll = Math.floor(Math.random() * totalWeight)
  for (let i = 0; i < entries.length; i++) {
    let entry = entries[i]
    if (!itemExists(entry.item)) {
      continue
    }
    roll -= Number(entry.weight)
    if (roll < 0) {
      let stack = new ItemStack(BuiltInRegistries.ITEM.get(ResourceLocation.tryParse(entry.item)), Number(entry.count))
      if (!entity.addItem(stack)) {
        entity.spawnAtLocation(stack)
      }
      return
    }
  }
}

function setRuntime(player, pointId, value, durationTicks) {
  if (!player) {
    return
  }
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', pointId), Math.max(0, Number(value)), Math.max(2, Number(durationTicks || 2)))
}

// 真实战利品表：从服务器 LootDataManager 取表按 chest 参数集 roll 一次，取其中一件；缺表时回退到权重表
function grantLootTable(player, tableIds, fallbackEntries) {
  let entity = entityOf(player)
  let server = entity.getServer()
  if (!server) {
    grantWeighted(player, fallbackEntries)
    return
  }
  let granted = false
  try {
    let available = []
    for (let i = 0; i < tableIds.length; i++) {
      let location = ResourceLocation.tryParse(tableIds[i])
      if (!location) {
        continue
      }
      let table = server.getLootData().getLootTable(location)
      if (table != null && !LootTableClass.EMPTY.equals(table)) {
        available.push(table)
      }
    }
    if (available.length > 0) {
      let table = available[Math.floor(Math.random() * available.length)]
      let params = new LootParamsBuilder(entity.serverLevel())
        .withParameter(LootContextParams.ORIGIN, entity.position())
        .withLuck(Number(entity.getLuck()))
        .create(LootContextParamSets.CHEST)
      let items = table.getRandomItems(params)
      let iterator = items.iterator()
      let rolled = []
      while (iterator.hasNext()) {
        let stack = iterator.next()
        if (!stack || stack.isEmpty()) {
          continue
        }
        rolled.push(stack)
      }
      if (rolled.length > 0) {
        let stack = rolled[Math.floor(Math.random() * rolled.length)]
        granted = true
        if (!entity.addItem(stack)) {
          entity.spawnAtLocation(stack)
        }
      }
    }
  } catch (ignored) {
    granted = false
  }
  if (!granted) {
    grantWeighted(player, fallbackEntries)
  }
}

function clearRuntime(player, pointId) {
  if (!player) {
    return
  }
  try {
    OrganKubeJS.clearRuntimePoint(entityOf(player), pointKey('runtime', pointId))
  } catch (ignored) {
  }
}

function hasAccessory(player, itemId) {
  return !!player && Common.inventoryCount(player, [itemId]) > 0
}

function soulfireRhythmLinked(player) {
  return getCounter(player, 'kubejs:soulfire_rhythm_core') > 0 || getCounter(player, 'kubejs:soulfire_rhythm_crown') > 0
}

function homeMatch(player) {
  if (!player) {
    return false
  }
  let entity = entityOf(player)
  return Common.dimensionId(entity) === 'minecraft:the_nether' || entity.isOnFire()
}

function isLowHealth(player) {
  let entity = entityOf(player)
  return Number(entity.getHealth()) <= Number(entity.getMaxHealth()) * 0.6
}

function nearbyStructure(player, ids, radiusChunks) {
  return !!player && hasNearbyStructure(entityOf(player), ids, radiusChunks || HOME.structure_radius, HOME_STRUCTURE_CACHE)
}

function isFortressZone(player) {
  if (nearbyStructure(player, ['minecraft:fortress'], 10) || nearbyStructure(player, HOME.structures, 10)) {
    return true
  }
  return hasNearbyBlock(entityOf(player), [
    'minecraft:nether_bricks',
    'minecraft:red_nether_bricks',
    'minecraft:polished_blackstone_bricks',
    'minecraft:gold_block',
    'minecraft:nether_wart_block'
  ], 5)
}

function isBastionZone(player) {
  if (nearbyStructure(player, ['minecraft:bastion_remnant'], 10)) {
    return true
  }
  let entity = entityOf(player)
  return hasNearbyBlock(entity, ['minecraft:gold_block', 'minecraft:gilded_blackstone', 'minecraft:blackstone'], 5)
}

function isBlacksmithZone(player) {
  return nearbyStructure(player, ['cataclysm:soul_black_smith'], 10)
}

function isCrimsonZone(player) {
  let biome = Common.biomeId(entityOf(player))
  if (biome.indexOf('crimson') >= 0 || biome.indexOf('warped') >= 0) {
    return true
  }
  return nearbyStructure(player, ['cataclysm:burning_arena', 'cataclysm:soul_black_smith'], 10)
}

function isSoulZone(player) {
  let biome = Common.biomeId(entityOf(player))
  let entity = entityOf(player)
  if (biome.indexOf('soul') >= 0) {
    return true
  }
  if (isFortressZone(player) || isBlacksmithZone(player)) {
    return true
  }
  return hasNearbyBlock(entity, ['minecraft:soul_sand', 'minecraft:soul_soil', 'minecraft:soul_lantern', 'minecraft:soul_torch'], 5)
}

function isAshvaleZone(player) {
  let biome = Common.biomeId(entityOf(player))
  let entity = entityOf(player)
  if (biome.indexOf('soul') >= 0 || biome.indexOf('ash') >= 0) {
    return true
  }
  try {
    if (Number(entity.level.getMaxLocalRawBrightness(entity.blockPosition())) <= 7) {
      return true
    }
  } catch (ignored) {
  }
  return nearbyStructure(player, ['cataclysm:burning_arena', 'cataclysm:soul_black_smith'], 10)
}

function isLavaZone(player) {
  let entity = entityOf(player)
  if (!homeMatch(player)) {
    return false
  }
  if (entity.isInLava()) {
    return true
  }
  return hasNearbyBlock(entity, [
    'minecraft:lava',
    'minecraft:flowing_lava',
    'minecraft:magma_block',
    'minecraft:blackstone',
    'minecraft:basalt'
  ], 5)
}

function isMarked(target) {
  if (!target) {
    return false
  }
  try {
    let points = OrganKubeJS.getPoints(rawEntity(target))
    let iterator = points.entrySet().iterator()
    while (iterator.hasNext()) {
      let entry = iterator.next()
      if (String(entry.getKey()) === pointKey('mark', 'kubejs:vanillaNether_mark') && Number(entry.getValue()) > 0) {
        return true
      }
    }
  } catch (ignored) {
  }
  return false
}

function vanillaNetherPredicateResult(event, value) {
  event.success(!!value)
}

OrganKubejsEvents.predicate('vanillaNether_home', event => {
  vanillaNetherPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_heat_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_resource_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaNether_ember_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && (entityOf(event.player).isOnFire() || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaNether_ember_ge_10', event => {
  vanillaNetherPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 10)
})

OrganKubejsEvents.predicate('vanillaNether_fortress_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isFortressZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_bastion_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isBastionZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_blacksmith_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isBlacksmithZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_crimson_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isCrimsonZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_soul_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isSoulZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_ashvale_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isAshvaleZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_lava_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && isLavaZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_overload_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaNether_overload_window') > 0)
})

OrganKubejsEvents.predicate('vanillaNether_inferno_upkeep_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaNether_inferno_upkeep') > 0)
})

OrganKubejsEvents.predicate('vanillaNether_magma_overload_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaNether_magma_overload') > 0)
})

OrganKubejsEvents.predicate('vanillaNether_contract_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaNether_contract_window') > 0)
})

OrganKubejsEvents.predicate('vanillaNether_emberstride_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaNether_emberstride_window') > 0)
})

OrganKubejsEvents.predicate('vanillaNether_furnace_kneering_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && (getRuntimePoint(event.player, 'kubejs:vanillaNether_jump_momentum') > 0 || entityOf(event.player).isSprinting()))
})

OrganKubejsEvents.predicate('vanillaNether_set_major', event => {
  vanillaNetherPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaNether_ash_conduit_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && hasAccessory(event.player, ASH_CONDUIT_ID))
})

OrganKubejsEvents.predicate('vanillaNether_slag_pump_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && hasAccessory(event.player, SLAG_PUMP_ID))
})

OrganKubejsEvents.predicate('vanillaNether_soulfire_rhythm_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && hasAccessory(event.player, SOULFIRE_RHYTHM_ID))
})

OrganKubejsEvents.predicate('vanillaNether_gilded_belt_online', event => {
  vanillaNetherPredicateResult(event, !!event.player && hasAccessory(event.player, GILDED_BELT_ID))
})

OrganKubejsEvents.pointAction('vanillaNether_grant_ash_spleen_loot', event => {
  if (!event.player) {
    return 0
  }
  grantWeighted(event.player, ASH_SPLEEN_LOOT)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaNether_fortress_bone_key_loot', event => {
  if (!event.player) {
    return 0
  }
  grantLootTable(event.player, FORTRESS_BONE_KEY_LOOT_TABLES, FORTRESS_BONE_KEY_FALLBACK_LOOT)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaNether_blazefire_arm_strike', event => {
  let player = event.player
  let target = rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  OrganKubeJS.addMarkPoint(target, 'kubejs:vanillaNether_mark', 1)
  target.setSecondsOnFire(2)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaNether_spiritflame_lung_ignite', event => {
  let target = rawEntity(event.target)
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  target.setSecondsOnFire(2)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaNether_hellfire_tailbone_strike', event => {
  // 目标执行器会在任何带目标的事件上被遍历，这里只认近战造成伤害的那一次
  if (String(event.eventType) !== 'deal_damage' || String(event.eventExtraString('damage_type')) !== 'player') {
    return 0
  }
  let player = event.player
  let target = rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  target.setSecondsOnFire(2)
  // 受击窗口在本次命中兑现：清掉窗口，改挂一次性点位，交给紧随其后的 modify_damage 消耗
  clearRuntime(player, 'kubejs:vanillaNether_hellfire_retribution')
  setRuntime(player, 'kubejs:vanillaNether_hellfire_strike', 1, 2)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaNether_ash_iris_hit', event => {
  let player = event.player
  let target = rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  if (!isMarked(target)) {
    return 0
  }
  if (!resourceReady(player, 4)) {
    return 0
  }
  spendResource(player, 4)
  target.setSecondsOnFire(3)
  addEffect(target, MobEffects.WEAKNESS, 40, 0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaNether_inferno_shoulderplate_burst', event => {
  let player = event.player
  let target = rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  let entity = entityOf(player)
  target.setSecondsOnFire(3)
  target.knockback(0.45, entity.getX() - target.getX(), entity.getZ() - target.getZ())
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaNether_slag_reflux_recover', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let cheaper = getCounter(player, 'kubejs:slag_pump_effect') > 0 || getCounter(player, 'kubejs:inferno_upkeep_reflux') > 0
  if (!resourceReady(player, cheaper ? 3 : 4)) {
    return 0
  }
  spendResource(player, cheaper ? 3 : 4)
  addEffect(entityOf(player), MobEffects.REGENERATION, 80, 0)
  return event.pointsConsume ? 1 : 0
})

function shortenNetherEffects(player) {
  let entity = entityOf(player)
  if (entity.tickCount % 20 !== 0) {
    return
  }
  let kidneyShorten = getCounter(player, FURNACESLAG_EFFECT) > 0 ? 20 : 0
  if (kidneyShorten > 0 && getCounter(player, 'kubejs:kidneysheath_slag_pump') > 0) {
    kidneyShorten += 20
  }
  let soulShorten = getCounter(player, SOULSAND_EFFECT) > 0 ? 20 : 0
  let ashvaleShorten = getCounter(player, ASHVALE_EFFECT) > 0 ? 20 : 0
  let effects = entity.getActiveEffects()
  let iterator = effects.iterator()
  while (iterator.hasNext()) {
    let instance = iterator.next()
    let effect = instance.getEffect()
    let effectId = ''
    try {
      effectId = String(BuiltInRegistries.MOB_EFFECT.getKey(effect))
    } catch (ignored) {
    }
    let reduction = 0
    if (effectId === 'minecraft:wither') {
      reduction = kidneyShorten + soulShorten + ashvaleShorten
    } else if (effectId === 'minecraft:slowness') {
      reduction = kidneyShorten + soulShorten
    }
    if (reduction <= 0 || Number(instance.getDuration()) <= 20) {
      continue
    }
    let duration = Math.max(1, Number(instance.getDuration()) - reduction)
    entity.removeEffect(effect)
    entity.addEffect(new MobEffectInstance(effect, duration, instance.getAmplifier(), instance.isAmbient(), instance.isVisible(), instance.showIcon()))
  }
}

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    if (getCounter(player, RESOURCE.current) !== 0) {
      setCounter(player, RESOURCE.current, 0)
    }
    clearRuntime(player, 'kubejs:vanillaNether_overload_window')
    clearRuntime(player, 'kubejs:vanillaNether_inferno_upkeep')
    return
  }

  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)

  if (isLowHealth(player) || current >= 16) {
    let duration = soulfireRhythmLinked(player) ? 120 : 100
    setRuntime(player, 'kubejs:vanillaNether_overload_window', 1, duration)
  } else {
    clearRuntime(player, 'kubejs:vanillaNether_overload_window')
  }

  if (homeMatch(player) && (entity.isSprinting() || hasNearbyBlock(entity, ['minecraft:blackstone', 'minecraft:basalt'], 4))) {
    setRuntime(player, 'kubejs:vanillaNether_emberstride_window', 1, 80)
  } else {
    clearRuntime(player, 'kubejs:vanillaNether_emberstride_window')
  }

  if (getRuntimePoint(player, 'kubejs:vanillaNether_jump_momentum') <= 0 && entity.isSprinting()) {
    setRuntime(player, 'kubejs:vanillaNether_jump_momentum', 1, 80)
  }

  if (getRuntimePoint(player, 'kubejs:vanillaNether_inferno_upkeep') > 0 && entity.tickCount % 20 === 0) {
    let cost = soulfireRhythmLinked(player) ? 1 : 2
    // 仍处于下界高温/燃烧环境时保留最多 5 点余烬作为底火
    let floor = homeMatch(player) ? 5 : 0
    if (current - cost < floor) {
      clearRuntime(player, 'kubejs:vanillaNether_inferno_upkeep')
    } else {
      spendResource(player, cost)
    }
  }

  shortenNetherEffects(player)
})

OrganKubejsEvents.skillCast('scorch_throat_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WITHER, 120, 0)
    targets[i].setSecondsOnFire(3)
  }
  return true
})

OrganKubejsEvents.skillCast('sacrifice_fire_fist_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  spendResource(player, 12)
  damageTarget(player, target, 12.0, 1.2)
  if (isMarked(target)) {
    target.setSecondsOnFire(4)
  }
  return true
})

OrganKubejsEvents.skillCast('blackflame_throat_pipe_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 11.0)
  if (!target) {
    return false
  }
  spendResource(player, 12)
  damageTarget(player, target, 10.0, 0.2)
  addEffect(target, MobEffects.WITHER, 100, 0)
  target.setSecondsOnFire(3)
  return true
})

OrganKubejsEvents.skillCast('cataclysm_magma_burst_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 18)) {
    return false
  }
  spendResource(player, 18)
  Common.castSpell('irons_spellbooks:heat_surge', 3, player)
  setRuntime(player, 'kubejs:vanillaNether_magma_overload', 1, 120)
  return true
})

OrganKubejsEvents.skillCast('cataclysm_magma_upkeep_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 20)) {
    return false
  }
  setRuntime(player, 'kubejs:vanillaNether_inferno_upkeep', 1, 160)
  return true
})

})()
