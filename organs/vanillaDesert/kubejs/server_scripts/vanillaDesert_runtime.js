;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
let Items = Java.loadClass('net.minecraft.world.item.Items')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')

let DIR_KEY = 'vanillaDesert'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimensions: ['minecraft:overworld'],
  biome_keywords: [
    'desert',
    'badlands'
  ],
  structures: [
    'minecraft:desert_pyramid',
    'cataclysm:cursed_pyramid'
  ],
  structure_radius: 8,
  structure_cache: HOME_STRUCTURE_CACHE
}
let RESOURCE = {
  system: 'vanillaDesert_system',
  capacity: 'kubejs:vanillaDesert_resonance_capacity',
  current: 'kubejs:vanillaDesert_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let AUX = {
  transpiration: 'kubejs:transpiration_conduit',
  sandVein: 'kubejs:sand_vein_bundle',
  sundial: 'kubejs:sundial_axle'
}
let STORM_POINT = 'kubejs:vanillaDesert_storm_window'
let STORM_KILL_KEY = 'kubejs:vanillaDesert_storm_kill'
let DESERT_ORGAN_IDS = new Set([
  'kubejs:sun_ventricle',
  'kubejs:sandstone_breastplate',
  'kubejs:drought_liver',
  'kubejs:heatwave_lung',
  'kubejs:quicksand_spleen',
  'kubejs:eclipse_crown',
  'kubejs:wind_erosion_arm',
  'kubejs:cactus_tendon',
  'kubejs:drysand_iris',
  'kubejs:temple_scavenger_hand',
  'kubejs:ancient_remnant_core'
])
let HUNT_LOOT = [
  { item: 'iceandfire:deathworm_chitin_red', count: 1, weight: 6 },
  { item: 'iceandfire:deathworm_chitin_yellow', count: 1, weight: 6 },
  { item: 'iceandfire:deathworm_chitin_white', count: 1, weight: 6 },
  { item: 'iceandfire:deathworm_egg', count: 1, weight: 3 },
  { item: 'iceandfire:deathworm_tounge', count: 1, weight: 1 },
  { item: 'iceandfire:myrmex_desert_chitin', count: 1, weight: 6 },
  { item: 'iceandfire:myrmex_desert_resin', count: 1, weight: 4 },
  { item: 'iceandfire:myrmex_desert_egg', count: 1, weight: 2 },
  { item: 'iceandfire:myrmex_stinger', count: 1, weight: 1 }
]
let RELIC_LOOT = [
  { item: 'minecraft:archer_pottery_sherd', count: 1, weight: 4 },
  { item: 'minecraft:miner_pottery_sherd', count: 1, weight: 4 },
  { item: 'minecraft:prize_pottery_sherd', count: 1, weight: 4 },
  { item: 'minecraft:skull_pottery_sherd', count: 1, weight: 4 },
  { item: 'minecraft:emerald', count: 1, weight: 6 },
  { item: 'minecraft:diamond', count: 1, weight: 2 },
  { item: 'minecraft:tnt', count: 1, weight: 2 },
  { item: 'minecraft:gunpowder', count: 2, weight: 5 },
  { item: 'minecraft:dune_armor_trim_smithing_template', count: 1, weight: 1 },
  { item: 'cataclysm:necklace_of_the_desert', count: 1, weight: 2 },
  { item: 'cataclysm:desert_eye', count: 1, weight: 2 },
  { item: 'cataclysm:ancient_metal_ingot', count: 1, weight: 4 },
  { item: 'cataclysm:unbreakable_skull', count: 1, weight: 1 },
  { item: 'cataclysm:vitality_ankh', count: 1, weight: 1 }
]

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, DIR_KEY + '_links', RESOURCE.current)
let entityOf = Common.entityOf
let getCounter = Runtime.getCounter
let setCounter = Runtime.setCounter
let getRuntimePoint = Runtime.getRuntimePoint
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let addEffect = Common.addEffect

function overworld(player) {
  let entity = entityOf(player)
  return entity != null && Common.dimensionId(entity) === 'minecraft:overworld'
}

function isDaytime(player) {
  try {
    return !!entityOf(player).level.isDay()
  } catch (ignored) {
  }
  return false
}

function highLight(player) {
  try {
    return Number(entityOf(player).level.getMaxLocalRawBrightness(entityOf(player).blockPosition())) >= 12
  } catch (ignored) {
  }
  return false
}

function daylightOnline(player) {
  return !!player && overworld(player) && isDaytime(player) && highLight(player)
}

function homeMatch(player) {
  if (!player || !overworld(player)) {
    return false
  }
  return Common.homeMatch(player, HOME)
}

function templeOnline(player) {
  if (!player || !overworld(player)) {
    return false
  }
  let entity = entityOf(player)
  return Common.hasNearbyStructure(entity, HOME.structures, HOME.structure_radius, HOME_STRUCTURE_CACHE)
}

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
      let item = BuiltInRegistries.ITEM.get(ResourceLocation.tryParse(entry.item))
      let stack = new ItemStack(item, Number(entry.count))
      if (!entity.addItem(stack)) {
        entity.spawnAtLocation(stack)
      }
      return
    }
  }
}

function inventoryAuxiliary(player, itemId) {
  return !!player && Common.inventoryCount(player, [itemId]) > 0
}

function desertOrganCount(player) {
  let installed = Common.installedSourceIds(player)
  return Common.countMatching(installed, DESERT_ORGAN_IDS)
}

function transpirationOnline(player) {
  return inventoryAuxiliary(player, AUX.transpiration)
}

function sandVeinOnline(player) {
  return inventoryAuxiliary(player, AUX.sandVein) && desertOrganCount(player) >= 4
}

function sundialOnline(player) {
  return inventoryAuxiliary(player, AUX.sundial)
}

function stormOnline(player) {
  return !!player && getRuntimePoint(player, STORM_POINT) > 0
}

function clearStoredPoints(player, pointId) {
  OrganKubeJS.clearRuntimePoint(entityOf(player), Common.pointKey('runtime', pointId))
}

function removeEffectIfPresent(entity, effectId) {
  let location = ResourceLocation.tryParse(effectId)
  if (!location) {
    return
  }
  let effect = BuiltInRegistries.MOB_EFFECT.get(location)
  if (effect) {
    entity.removeEffect(effect)
  }
}

function applyTranspiration(player) {
  let entity = entityOf(player)
  if (spendResource(player, 2) <= 0) {
    return
  }
  entity.setRemainingFireTicks(0)
  removeEffectIfPresent(entity, 'cataclysm:curse_of_desert')
  addEffect(entity, MobEffects.FIRE_RESISTANCE, 60, 0)
}

OrganKubejsEvents.predicate('vanillaDesert_home', event => {
  return Common.predicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_daylight_online', event => {
  return Common.predicateResult(event, !!event.player && daylightOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_temple_online', event => {
  return Common.predicateResult(event, !!event.player && templeOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_heat_ge_2', event => {
  return Common.predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 2)
})

OrganKubejsEvents.predicate('vanillaDesert_heat_ge_1', event => {
  return Common.predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 1)
})

OrganKubejsEvents.predicate('vanillaDesert_heat_ge_10', event => {
  return Common.predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 10)
})

OrganKubejsEvents.predicate('vanillaDesert_heat_ge_25', event => {
  return Common.predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 25)
})

OrganKubejsEvents.predicate('vanillaDesert_transpiration_online', event => {
  return Common.predicateResult(event, transpirationOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_sand_vein_online', event => {
  return Common.predicateResult(event, sandVeinOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_sundial_online', event => {
  return Common.predicateResult(event, sundialOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_night_shade_online', event => {
  return Common.predicateResult(event, !!event.player && !daylightOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_wet_online', event => {
  return Common.predicateResult(event, !!event.player && Common.isWet(event.player))
})

OrganKubejsEvents.predicate('vanillaDesert_storm_online', event => {
  return Common.predicateResult(event, stormOnline(event.player))
})

OrganKubejsEvents.targetAction('vanillaDesert_apply_mark', event => {
  let target = entityOf(event.target)
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  OrganKubeJS.addMarkPoint(target, 'kubejs:vanillaDesert_mark', 1)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaDesert_drysand_mark_consume', event => {
  let target = entityOf(event.target)
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return event.pointsConsume ? 1 : 0
  }
  if (OrganKubeJS.getMark(target, 'kubejs:vanillaDesert_mark') <= 0) {
    return event.pointsConsume ? 1 : 0
  }
  let weaknessTicks = 40
  if (sandVeinOnline(event.player)) {
    weaknessTicks = 60
  }
  addEffect(target, MobEffects.GLOWING, 100, 0)
  addEffect(target, MobEffects.WEAKNESS, weaknessTicks, 0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaDesert_grant_hunt_loot', event => {
  if (!event.player) {
    return 0
  }
  grantWeighted(event.player, HUNT_LOOT)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaDesert_grant_relic_loot', event => {
  if (!event.player) {
    return 0
  }
  let rolls = 1 + (Math.random() < 0.5 ? 1 : 0)
  if (sundialOnline(event.player)) {
    rolls += 1
  }
  for (let i = 0; i < rolls; i++) {
    grantWeighted(event.player, RELIC_LOOT)
  }
  return event.pointsConsume ? 1 : 0
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  let current = getCounter(player, RESOURCE.current)
  if (capacity <= 0) {
    if (current !== 0) {
      setCounter(player, RESOURCE.current, 0)
    }
    return
  }
  let clamped = Math.min(capacity, current)
  if (clamped !== current) {
    setCounter(player, RESOURCE.current, clamped)
  }

  let wasStormOnline = stormOnline(player)
  if (stormOnline(player) && entity.tickCount % 20 === 0) {
    if (spendResource(player, 2) < 2) {
      clearStoredPoints(player, STORM_POINT)
    }
  }
  if (wasStormOnline && !stormOnline(player)) {
    if (getCounter(player, STORM_KILL_KEY) > 0) {
      addResource(player, 4)
    }
    setCounter(player, STORM_KILL_KEY, 0)
  }

  if (transpirationOnline(player) && getCounter(player, RESOURCE.current) >= 25 && entity.tickCount % 100 === 0) {
    applyTranspiration(player)
  }

  if (sundialOnline(player) && homeMatch(player) && entity.tickCount % 60 === 0) {
    addResource(player, 1)
  }
  if (sundialOnline(player) && !homeMatch(player) && entity.tickCount % 100 === 0) {
    spendResource(player, 1)
  }
})

OrganKubejsEvents.skillCast('ancient_remnant_core_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let current = getCounter(player, RESOURCE.current)
  if (current < 16 || stormOnline(player)) {
    return false
  }
  setCounter(player, STORM_KILL_KEY, 0)
  OrganKubeJS.setRuntimePoint(entityOf(player), Common.pointKey('runtime', STORM_POINT), 1, 160)
  return true
})

})()
