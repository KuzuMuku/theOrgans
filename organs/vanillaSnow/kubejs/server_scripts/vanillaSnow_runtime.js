;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let EnemyClass = Java.loadClass('net.minecraft.world.entity.monster.Enemy')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')
let MagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData')

let DIR_KEY = 'vanillaSnow'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimensions: [
    'minecraft:overworld'
  ],
  dimension_home: true,
  biome_keywords: [
    'snow',
    'frozen',
    'ice_spikes',
    'grove'
  ],
  structures: [
    'minecraft:igloo',
    'aquamirae:ship',
    'aquamirae:outpost',
    'aquamirae:shelter'
  ],
  structure_radius: 8,
  structure_cache: HOME_STRUCTURE_CACHE
}
let HOME_CALLBACK = 'vanillaSnow_home'
let RESOURCE = {
  system: 'vanillaSnow_system',
  capacity: 'kubejs:vanillaSnow_resonance_capacity',
  current: 'kubejs:vanillaSnow_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let DEEP_FREEZE_KEY = 'kubejs:vanillaSnow_deepfreeze_online'
let SOURCE_IDS = new Set([
  'kubejs:frostseal_ventricle',
  'kubejs:frozensoil_chest_membrane',
  'kubejs:birchmarrow_liver',
  'kubejs:icecrystal_lung',
  'kubejs:frostlight_crown',
  'kubejs:snowhide_spleen',
  'kubejs:icechip_arm',
  'kubejs:snowblind_iris',
  'kubejs:frosthoof_tendon',
  'kubejs:freezebreak_sheath',
  'kubejs:frozen_maze_core'
])
let AUX_ITEM_IDS = new Set([
  'kubejs:deposition_conduit',
  'kubejs:frostvein_bundle',
  'kubejs:icecore_rhythm'
])

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let addResource = Runtime.addResource
let spendResource = Runtime.spendResource
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let inventoryCount = Common.inventoryCount

function homeMatch(player) {
  return Common.homeMatch(player, HOME, player2 => Common.isSnowingHere(player2) || Common.hasSnowGround(player2))
}

function coldEnvironmentMatch(player) {
  if (!player) {
    return false
  }
  let biome = Common.biomeId(entityOf(player))
  for (let i = 0; i < HOME.biome_keywords.length; i++) {
    if (biome.indexOf(HOME.biome_keywords[i]) >= 0) {
      return true
    }
  }
  return Common.isSnowingHere(player) || Common.hasSnowGround(player)
}

function predicateResult(event, value) {
  return event.success(!!value)
}

function itemIdOf(stack) {
  if (!stack || stack.isEmpty()) {
    return ''
  }
  try {
    return String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
  } catch (ignored) {
    return ''
  }
}

function hasAuxItem(player, itemId) {
  if (!player || inventoryCount(player, [itemId]) > 0) {
    return !!player
  }
  let entity = entityOf(player)
  return itemIdOf(entity.getMainHandItem()) === itemId || itemIdOf(entity.getOffhandItem()) === itemId
}

function isDepositionConduitOnline(player) {
  return !!player && hasAuxItem(player, 'kubejs:deposition_conduit')
}

function isFrostveinOnline(player) {
  return !!player && hasAuxItem(player, 'kubejs:frostvein_bundle') && countMatching(installedSourceIds(player), SOURCE_IDS) >= 4
}

function isIcecoreRhythmOnline(player) {
  return !!player && hasAuxItem(player, 'kubejs:icecore_rhythm')
}

function isMidResonance(player) {
  return !!player && getCounter(player, RESOURCE.current) >= 20
}

function isHighResonance(player) {
  return !!player && getCounter(player, RESOURCE.current) >= 40
}

function isMarked(target) {
  try {
    return Number(OrganKubeJS.getMark(target, 'kubejs:vanillaSnow_mark')) > 0
  } catch (ignored) {
    return false
  }
}

function shortenColdDebuffs(player, ticks) {
  let entity = entityOf(player)
  let slow = entity.getEffect(MobEffects.MOVEMENT_SLOWDOWN)
  if (!slow) {
    return
  }
  let duration = Math.max(1, Number(slow.getDuration()) - Math.max(1, ticks))
  let amplifier = Number(slow.getAmplifier())
  entity.removeEffect(MobEffects.MOVEMENT_SLOWDOWN)
  if (duration > 0) {
    addEffect(entity, MobEffects.MOVEMENT_SLOWDOWN, duration, amplifier)
  }
}

function hurtEntity(target, player, amount) {
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return false
  }
  try {
    return target.hurt(entityOf(player).damageSources().magic(), Number(amount))
  } catch (ignored) {
    return Common.damageTarget(player, target, amount, 0)
  }
}

function applyDeepfreezeAura(player) {
  let targets = Common.targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    if (!(target instanceof EnemyClass)) {
      continue
    }
    addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 80, 1)
    hurtEntity(target, player, 1.0)
  }
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  predicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_resource_online', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaSnow_resonance_10', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 10)
})

OrganKubejsEvents.predicate('vanillaSnow_resonance_20', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 20)
})

OrganKubejsEvents.predicate('vanillaSnow_resonance_25', event => {
  predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 25)
})

OrganKubejsEvents.predicate('vanillaSnow_resonance_mid', event => {
  predicateResult(event, isMidResonance(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_resonance_high', event => {
  predicateResult(event, isHighResonance(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_deepfreeze_online', event => {
  predicateResult(event, !!event.player && getRuntimePoint(event.player, DEEP_FREEZE_KEY) > 0)
})

OrganKubejsEvents.predicate('vanillaSnow_deposition_conduit_online', event => {
  predicateResult(event, isDepositionConduitOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_frostvein_online', event => {
  predicateResult(event, isFrostveinOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_icecore_rhythm_online', event => {
  predicateResult(event, isIcecoreRhythmOnline(event.player))
})

OrganKubejsEvents.pointAction('vanillaSnow_frostseal_heal', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 25) {
    return 0
  }
  if (spendResource(player, 2) <= 0) {
    return 0
  }
  entityOf(player).heal(1.0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaSnow_frostseal_suppress', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  shortenColdDebuffs(player, 20)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaSnow_birch_mana', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 10) {
    return 0
  }
  if (spendResource(player, 1) <= 0) {
    return 0
  }
  MagicData.getPlayerMagicData(entityOf(player)).addMana(2.0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaSnow_deposition_conduit', event => {
  let player = event.player
  if (!player || !isDepositionConduitOnline(player) || !isHighResonance(player)) {
    return 0
  }
  if (spendResource(player, 2) <= 0) {
    return 0
  }
  addEffect(entityOf(player), MobEffects.DAMAGE_RESISTANCE, 60, 0)
  shortenColdDebuffs(player, 20)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSnow_melee_mark', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || !target.isAlive()) {
    return 0
  }
  OrganKubeJS.addMarkPoint(target, 'kubejs:vanillaSnow_mark', 1)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSnow_ranged_mark', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || !target.isAlive() || !isMarked(target)) {
    return 0
  }
  let slowTicks = 60
  if (isMidResonance(player)) {
    slowTicks += 20
  }
  if (isFrostveinOnline(player)) {
    slowTicks += 20
  }
  addEffect(target, MobEffects.GLOWING, 80, 0)
  addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, slowTicks, 1)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaSnow_freezebreak_guard_self', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 20) {
    return 0
  }
  if (spendResource(player, 2) <= 0) {
    return 0
  }
  addEffect(entityOf(player), MobEffects.DAMAGE_RESISTANCE, 80, 0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaSnow_freezebreak_guard_retal', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || !target.isAlive()) {
    return 0
  }
  hurtEntity(target, player, 2.0)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.skillCast('frozen_maze_core_cast', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 16) {
    return false
  }
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', DEEP_FREEZE_KEY), 1, 160)
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    OrganKubeJS.clearRuntimePoint(entity, pointKey('runtime', DEEP_FREEZE_KEY))
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)

  if (entity.tickCount % 40 === 0 && entity.isOnFire()) {
    setCounter(player, RESOURCE.current, Math.max(0, getCounter(player, RESOURCE.current) - 2))
  } else if (entity.tickCount % 100 === 0 && !coldEnvironmentMatch(player)) {
    setCounter(player, RESOURCE.current, Math.max(0, getCounter(player, RESOURCE.current) - 1))
  }

  if (isHighResonance(player) && entity.tickCount % 60 === 0) {
    setCounter(player, RESOURCE.current, Math.max(0, getCounter(player, RESOURCE.current) - 1))
  }

  if (getRuntimePoint(player, DEEP_FREEZE_KEY) > 0) {
    if (getCounter(player, RESOURCE.current) < 2) {
      OrganKubeJS.clearRuntimePoint(entity, pointKey('runtime', DEEP_FREEZE_KEY))
    } else if (entity.tickCount % 20 === 0) {
      spendResource(player, 2)
      applyDeepfreezeAura(player)
    }
    if (isIcecoreRhythmOnline(player) && entity.tickCount % 60 === 0) {
      addResource(player, 1)
    }
  }
})

})()
