;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let AABB = Java.loadClass('net.minecraft.world.phys.AABB')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let DIR_KEY = 'vanillaLushCaves'
let HOME = {
  dimensions: [
    'minecraft:overworld'
  ],
  dimension_home: true,
  biome_keywords: [
    'lush_caves',
    'fungal_fen',
    'bioshroom'
  ],
  structures: [
    'betterdungeons:skeleton_dungeon',
    'betterdungeons:zombie_dungeon'
  ],
  structure_radius: 8,
  structure_cache: new Map()
}

let RESOURCE = {
  system: 'vanillaLushCaves_system',
  capacity: 'kubejs:vanillaLushCaves_resonance_capacity',
  current: 'kubejs:vanillaLushCaves_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let FLOWER_FIELD_SOURCE = DIR_KEY + '_flower_field'
let SPORE_BLOOM_RUNTIME_KEY = Common.pointKey('runtime', 'kubejs:vanillaLushCaves_spore_bloom')
let FLOWER_PULSE_TYPE = 'vanillaLushCaves:spore_bloom_pulse'

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
let addResource = Runtime.addResource
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let hasMatching = Common.hasMatching
let addEffect = Common.addEffect

let SOURCE_IDS = new Set([
  'kubejs:mossglow_core',
  'kubejs:calcite_breastbone',
  'kubejs:sporeglow_lung',
  'kubejs:mossheal_liver',
  'kubejs:sporebud_gland',
  'kubejs:hangingroot_arm',
  'kubejs:mycelium_sole',
  'kubejs:brightpod_sac',
  'kubejs:sporebed_spleen',
  'kubejs:gloommoss_crown',
  'kubejs:sporebloom_core'
])
let BRIDGE_IDS = new Set([
  'kubejs:mycelium_bridge'
])
let CONDUIT_IDS = new Set([
  'kubejs:spore_conduit'
])
let GLOW_BED_IDS = new Set([
  'kubejs:glow_bed'
])
let ROOT_NETWORK_IDS = new Set([
  'kubejs:root_network'
])
let MOVEMENT_IDS = new Set([
  'kubejs:mycelium_sole'
])
let CROWN_IDS = new Set([
  'kubejs:gloommoss_crown'
])
let MANA_IDS = new Set([
  'kubejs:brightpod_sac'
])
let SPELL_IDS = new Set([
  'kubejs:sporeglow_lung'
])
let RECOVERY_IDS = new Set([
  'kubejs:mossheal_liver'
])

let FLOWERS = global.vanillaLushCavesFlowers || (global.vanillaLushCavesFlowers = {})

function homeMatch(player) {
  return !!player && Common.homeMatch(player, HOME)
}

function sameDimensionEntity(entityA, entityB) {
  return Common.dimensionId(entityA) === Common.dimensionId(entityB)
}

function distanceSqFromState(state, entity) {
  let dx = Number(entity.getX()) - Number(state.x)
  let dy = Number(entity.getY()) - Number(state.y)
  let dz = Number(entity.getZ()) - Number(state.z)
  return dx * dx + dy * dy + dz * dz
}

function getFlowerState(player) {
  let entity = entityOf(player)
  return FLOWERS[String(entity.uuid)]
}

function findFlowerForPlayer(player) {
  let entity = entityOf(player)
  for (let key in FLOWERS) {
    let state = FLOWERS[key]
    if (sameDimensionEntity(entity, entityOf(state.ownerEntity)) && distanceSqFromState(state, entity) <= state.radius * state.radius) {
      return state
    }
  }
  return null
}

function clearFlower(player) {
  let entity = entityOf(player)
  delete FLOWERS[String(entity.uuid)]
  OrganKubeJS.setRuntimePoint(entity, SPORE_BLOOM_RUNTIME_KEY, 0, 0)
}

function refreshFlowerState(player, state) {
  let installed = installedSourceIds(player)
  if (installed.indexOf('kubejs:sporebloom_core') < 0) {
    return false
  }
  let bridges = countMatching(installed, BRIDGE_IDS)
  state.radius = 3 + bridges
  state.expiresAt = state.startedAt + 200 + bridges * 40
  return true
}

function fireFlowerPulse(player) {
  let entity = entityOf(player)
  RuntimeEffectService.fireEvent(entity, RuntimeEvent.builder(FLOWER_PULSE_TYPE, entity).build())
}

function clampResource(player) {
  let capacity = getCounter(player, RESOURCE.capacity)
  let current = Math.max(0, getCounter(player, RESOURCE.current))
  if (capacity <= 0) {
    current = 0
  } else {
    current = Math.min(capacity, current)
  }
  setCounter(player, RESOURCE.current, current)
  return current
}

function applyFieldBuffs(player) {
  let entity = entityOf(player)
  let state = findFlowerForPlayer(player)
  let insideAlly = state != null && String(entity.uuid) !== state.ownerId
  let powerKey = pointKey('attribute', 'irons_spellbooks:nature_spell_power')
  let knockbackKey = pointKey('attribute', 'minecraft:generic.knockback_resistance')
  OrganKubeJS.setSourcePoint(entity, FLOWER_FIELD_SOURCE, powerKey, insideAlly ? 2 : 0)
  OrganKubeJS.setSourcePoint(entity, FLOWER_FIELD_SOURCE, knockbackKey, insideAlly ? 1 : 0)
}

function applyFlowerPulse(player) {
  let ownerEntity = entityOf(player)
  let state = FLOWERS[String(ownerEntity.uuid)]
  if (!state || !refreshFlowerState(player, state)) {
    return
  }
  let radius = state.radius
  let box = new AABB(
    state.x - radius,
    state.y - radius,
    state.z - radius,
    state.x + radius,
    state.y + radius,
    state.z + radius
  )
  let list = ownerEntity.level.getEntitiesOfClass(LivingEntityClass, box, target => target.isAlive() && sameDimensionEntity(target, ownerEntity) && distanceSqFromState(state, target) <= radius * radius)
  let iterator = list.iterator()
  let hasRootNetwork = hasMatching(installedSourceIds(player), ROOT_NETWORK_IDS)
  let hasGlowBed = hasMatching(installedSourceIds(player), GLOW_BED_IDS)
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (target instanceof PlayerClass) {
      target.heal(1)
      if (hasGlowBed) {
        target.heal(1)
      }
      if (hasRootNetwork && String(target.uuid) !== state.ownerId) {
        target.heal(1)
      }
    } else {
      addEffect(target, MobEffects.GLOWING, 80, 0)
      addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 60, 0)
    }
  }
}

function lushPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate('vanillaLushCaves_home', event => {
  return lushPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaLushCaves_major_set', event => {
  return lushPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaLushCaves_resource_online', event => {
  return lushPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaLushCaves_resource_cost_ready', event => {
  return lushPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 2)
})

OrganKubejsEvents.predicate('vanillaLushCaves_mycelium_ready', event => {
  return lushPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaLushCaves_mycelium_window') > 0)
})

OrganKubejsEvents.predicate('vanillaLushCaves_spore_bloom_online', event => {
  return lushPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaLushCaves_spore_bloom') > 0)
})

OrganKubejsEvents.predicate('vanillaLushCaves_glow_synergy', event => {
  if (!event.player) {
    return lushPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return lushPredicateResult(event, hasMatching(installed, CROWN_IDS) && (hasMatching(installed, MANA_IDS) || hasMatching(installed, SPELL_IDS) || hasMatching(installed, RECOVERY_IDS)))
})

OrganKubejsEvents.predicate('vanillaLushCaves_glow_online', event => {
  if (!event.player) {
    return lushPredicateResult(event, false)
  }
  let online = homeMatch(event.player) && (getRuntimePoint(event.player, 'kubejs:vanillaLushCaves_spore_bloom') > 0 || installedSourceIds(event.player).indexOf('kubejs:gloommoss_crown') >= 0)
  return lushPredicateResult(event, online)
})

OrganKubejsEvents.pointAction('vanillaLushCaves_spore_bloom_pulse', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  applyFlowerPulse(player)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.skillCast('sporebloom_core_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  if (getCounter(player, RESOURCE.current) < 16) {
    return false
  }
  let entity = entityOf(player)
  let installed = installedSourceIds(player)
  if (installed.indexOf('kubejs:sporebloom_core') < 0) {
    return false
  }
  let bridges = countMatching(installed, BRIDGE_IDS)
  let duration = 200 + bridges * 40
  let pos = entity.blockPosition()
  let state = {
    ownerId: String(entity.uuid),
    ownerEntity: entity,
    dimension: Common.dimensionId(entity),
    x: Number(pos.getX()) + 0.5,
    y: Number(entity.getY()),
    z: Number(pos.getZ()) + 0.5,
    startedAt: Number(entity.tickCount),
    radius: 3 + bridges
  }
  FLOWERS[state.ownerId] = state
  OrganKubeJS.setRuntimePoint(entity, SPORE_BLOOM_RUNTIME_KEY, 1, duration)
  Common.castSpell('irons_spellbooks:stomp', 1, player)
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  clampResource(player)
  applyFieldBuffs(player)

  let mycelium = homeMatch(player) && hasMatching(installedSourceIds(player), MOVEMENT_IDS)
  setRuntimePoint(player, 'kubejs:vanillaLushCaves_mycelium_window', mycelium ? 1 : 0)

  let state = FLOWERS[String(entity.uuid)]
  if (!state) {
    if (getRuntimePoint(player, 'kubejs:vanillaLushCaves_spore_bloom') > 0) {
      clearFlower(player)
    }
    return
  }

  if (!refreshFlowerState(player, state)) {
    clearFlower(player)
    return
  }
  if (Number(entity.tickCount) >= state.expiresAt) {
    clearFlower(player)
    return
  }
  if (getCounter(player, RESOURCE.current) <= 0) {
    clearFlower(player)
    return
  }

  if (entity.tickCount % 20 === 0) {
    let conduitCount = countMatching(installedSourceIds(player), CONDUIT_IDS)
    if (conduitCount > 0) {
      addResource(player, conduitCount)
    }
  }
  if (entity.tickCount % 40 === 0) {
    fireFlowerPulse(player)
  }
})

PlayerEvents.loggedOut(event => {
  clearFlower(event.player)
})

})()
