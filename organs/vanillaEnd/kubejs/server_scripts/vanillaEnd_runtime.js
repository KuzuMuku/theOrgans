;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

let DIR_KEY = 'vanillaEnd'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimensions: ['minecraft:the_end'],
  dimension_home: true,
  biome_keywords: ['the_end'],
  structures: [
    'minecraft:end_city',
    'minecraft:end_gateway',
    'minecraft:end_ship'
  ],
  structure_radius: 10,
  structure_cache: HOME_STRUCTURE_CACHE
}
let RESOURCE = {
  system: 'vanillaEnd_system',
  capacity: 'kubejs:vanillaEnd_resonance_capacity',
  current: 'kubejs:vanillaEnd_resonance'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let resourceReady = Runtime.resourceReady
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let inventoryCount = Common.inventoryCount
let dimensionId = Common.dimensionId
let biomeId = Common.biomeId
let hasNearbyBlock = Common.hasNearbyBlock
let targetsSortedByDistance = Common.targetsSortedByDistance
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget

function setExpiringRuntime(player, pointId, value, durationTicks) {
  let entity = entityOf(player)
  OrganKubeJS.setRuntimePoint(
    entity,
    pointKey('runtime', pointId),
    Math.max(0, Math.floor(value)),
    Math.max(0, Math.floor(durationTicks))
  )
}

let AUXILIARY = {
  void_conduit: 'kubejs:void_conduit',
  gate_anchor: 'kubejs:gate_anchor',
  purpur_nerve_cord: 'kubejs:purpur_nerve_cord',
  ender_tether: 'kubejs:ender_tether'
}
let MARK_POINT_KEY = pointKey('mark', 'kubejs:vanillaEnd_mark')
let END_MOB_IDS = [
  'minecraft:enderman',
  'minecraft:endermite',
  'minecraft:shulker',
  'minecraft:ender_dragon',
  'cataclysm:ender_guardian',
  'cataclysm:ender_golem'
]
let END_BLOCK_IDS = [
  'minecraft:end_stone',
  'minecraft:end_stone_bricks',
  'minecraft:end_stone_brick_stairs',
  'minecraft:end_stone_brick_slab',
  'minecraft:purpur_block',
  'minecraft:purpur_pillar',
  'minecraft:purpur_stairs',
  'minecraft:purpur_slab'
]
let CITY_BLOCK_IDS = [
  'minecraft:purpur_block',
  'minecraft:purpur_pillar',
  'minecraft:end_rod',
  'minecraft:end_stone_bricks'
]

let PREV_POSITIONS = global.vanillaEndPrevPositions || (global.vanillaEndPrevPositions = new Map())
let LAST_HOME_TICKS = global.vanillaEndLastHomeTicks || (global.vanillaEndLastHomeTicks = new Map())

function isInstalled(player, itemId) {
  let installed = installedSourceIds(player)
  return installed.indexOf(itemId) >= 0
}

function hasAuxiliary(player, auxKey) {
  return inventoryCount(player, [AUXILIARY[auxKey]]) > 0
}

function hasVoidKit(player) {
  return inventoryCount(player, [
    'minecraft:ender_pearl',
    'minecraft:chorus_fruit',
    'minecraft:elytra'
  ]) > 0
}

function homeMatch(player) {
  return !!player && Common.homeMatch(player, HOME)
}

function gateOnline(player) {
  if (!player) {
    return false
  }
  let entity = entityOf(player)
  if (dimensionId(entity) !== 'minecraft:the_end') {
    return false
  }
  return hasNearbyBlock(entity, [
    'minecraft:end_gateway',
    'minecraft:end_portal',
    'minecraft:end_portal_frame'
  ], 8) || hasVoidKit(player)
}

function cityOnline(player) {
  if (!player) {
    return false
  }
  let entity = entityOf(player)
  if (dimensionId(entity) !== 'minecraft:the_end') {
    return false
  }
  if (Common.hasNearbyStructure(entity, ['minecraft:end_city', 'minecraft:end_ship'], 8, HOME_STRUCTURE_CACHE)) {
    return true
  }
  return hasNearbyBlock(entity, CITY_BLOCK_IDS, 7)
}

function airOnline(player) {
  if (!player) {
    return false
  }
  let entity = entityOf(player)
  if (dimensionId(entity) !== 'minecraft:the_end') {
    return false
  }
  let biome = biomeId(entity)
  if (biome.indexOf('small_end_islands') >= 0) {
    return true
  }
  try {
    return entity.isFallFlying() || hasVoidKit(player)
  } catch (ignored) {
    return hasVoidKit(player)
  }
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function isEndMob(entity) {
  let id = entityTypeId(entity)
  return END_MOB_IDS.indexOf(id) >= 0 || String(id).indexOf('cataclysm:ender_') === 0
}

function isMarked(target) {
  if (!target) {
    return false
  }
  try {
    return OrganKubeJS.getMark(target, 'kubejs:vanillaEnd_mark') > 0
  } catch (ignored) {
  }
  return false
}

function fireEndEvent(player, type, target, amount) {
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder = builder.target(target)
  }
  if (amount && Number(amount) !== 0) {
    builder = builder.amount(Number(amount))
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
}

function sqDistanceBetween(a, b) {
  let dx = Number(a.getX()) - Number(b.getX())
  let dy = Number(a.getY()) - Number(b.getY())
  let dz = Number(a.getZ()) - Number(b.getZ())
  return dx * dx + dy * dy + dz * dz
}

function nearestEndTarget(player, radius) {
  let targets = targetsSortedByDistance(player, radius)
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    if (target instanceof LivingEntityClass && !(target instanceof PlayerClass)) {
      return target
    }
  }
  return null
}

function teleportBehindTarget(player, target, offset) {
  let entity = entityOf(player)
  let dx = Number(target.getX()) - Number(entity.getX())
  let dz = Number(target.getZ()) - Number(entity.getZ())
  let length = Math.max(0.01, Math.sqrt(dx * dx + dz * dz))
  entity.teleportTo(
    Number(target.getX()) - dx / length * offset,
    Number(target.getY()),
    Number(target.getZ()) - dz / length * offset
  )
}

function activeSkillCost(player) {
  return hasAuxiliary(player, 'gate_anchor') ? 10 : 12
}

let predicateResult = Common.predicateResult

OrganKubejsEvents.predicate('vanillaEnd_home', event => {
  return predicateResult(event, homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_gate_online', event => {
  return predicateResult(event, gateOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_city_online', event => {
  return predicateResult(event, cityOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_air_online', event => {
  return predicateResult(event, airOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaEnd_fold_ready', event => {
  return predicateResult(event, !!event.player && (gateOnline(event.player) || airOnline(event.player)))
})

OrganKubejsEvents.predicate('vanillaEnd_resource_online', event => {
  return predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaEnd_resource_ge_20', event => {
  return predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 20)
})

OrganKubejsEvents.predicate('vanillaEnd_void_conduit_online', event => {
  return predicateResult(event, !!event.player && hasAuxiliary(event.player, 'void_conduit'))
})

OrganKubejsEvents.predicate('vanillaEnd_void_conduit_offline', event => {
  return predicateResult(event, !!event.player && !hasAuxiliary(event.player, 'void_conduit'))
})

OrganKubejsEvents.predicate('vanillaEnd_gate_anchor_online', event => {
  return predicateResult(event, !!event.player && hasAuxiliary(event.player, 'gate_anchor'))
})

OrganKubejsEvents.predicate('vanillaEnd_purpur_nerve_cord_online', event => {
  return predicateResult(event, !!event.player && hasAuxiliary(event.player, 'purpur_nerve_cord'))
})

OrganKubejsEvents.predicate('vanillaEnd_purpur_nerve_cord_offline', event => {
  return predicateResult(event, !!event.player && !hasAuxiliary(event.player, 'purpur_nerve_cord'))
})

OrganKubejsEvents.predicate('vanillaEnd_ender_tether_online', event => {
  return predicateResult(event, !!event.player && hasAuxiliary(event.player, 'ender_tether'))
})

OrganKubejsEvents.predicate('vanillaEnd_void_guard_online', event => {
  return predicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaEnd_void_guard') > 0)
})

PlayerEvents.tick(event => {
  let player = event.player
  let entity = entityOf(player)
  if (!player || !entity) {
    return
  }
  let tick = Number(entity.tickCount)
  let uuid = String(entity.getUUID())
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    if (getCounter(player, RESOURCE.current) !== 0) {
      setCounter(player, RESOURCE.current, 0)
    }
    setRuntimePoint(player, 'kubejs:vanillaEnd_gate_window', 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_city_window', 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_air_window', 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_home_window', 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_fold_cycle', 0, 0)
    setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard', 0, 0)
    setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard_boost', 0, 0)
    return
  }
  let current = getCounter(player, RESOURCE.current)
  if (current > capacity) {
    setCounter(player, RESOURCE.current, capacity)
  }

  if (tick % 20 === 0) {
    setRuntimePoint(player, 'kubejs:vanillaEnd_gate_window', gateOnline(player) ? 1 : 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_city_window', cityOnline(player) ? 1 : 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_air_window', airOnline(player) ? 1 : 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_home_window', homeMatch(player) ? 1 : 0, 0)
    setRuntimePoint(player, 'kubejs:vanillaEnd_fold_cycle', (gateOnline(player) || airOnline(player)) ? 1 : 0, 0)
  }

  let previous = PREV_POSITIONS.get(uuid)
  let x = Number(entity.getX())
  let y = Number(entity.getY())
  let z = Number(entity.getZ())
  if (previous) {
    let dx = x - Number(previous.x)
    let dy = y - Number(previous.y)
    let dz = z - Number(previous.z)
    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (distance >= 5) {
      fireEndEvent(player, 'vanillaEnd:displacement', null, distance)
      let crownOnline = isInstalled(player, 'kubejs:gategap_crown')
      let tailboneOnline = isInstalled(player, 'kubejs:gategap_tailbone') && getCounter(player, RESOURCE.current) >= 20
      if (crownOnline || tailboneOnline) {
        let surgeTicks = hasAuxiliary(player, 'purpur_nerve_cord') ? 120 : 100
        setExpiringRuntime(player, 'kubejs:vanillaEnd_travel_surge', 1, surgeTicks)
      }
    }
  }
  PREV_POSITIONS.set(uuid, { x: x, y: y, z: z })

  let now = Number(entity.level().getGameTime())
  let lastHome = LAST_HOME_TICKS.get(uuid) || 0
  if (homeMatch(player)) {
    LAST_HOME_TICKS.set(uuid, now)
  } else if (now - lastHome >= 400 && tick % 60 === 0) {
    if (getCounter(player, RESOURCE.current) > 0) {
      spendResource(player, 1)
    }
  }

  let guardActive = getRuntimePoint(player, 'kubejs:vanillaEnd_void_guard') > 0
  if (guardActive && tick % 20 === 0) {
    let used = spendResource(player, 2)
    if (used < 2) {
      setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard', 0, 0)
      setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard_boost', 0, 0)
    }
  }
  if (guardActive && tick % 40 === 0) {
    let target = nearestEndTarget(player, 12)
    if (target) {
      teleportBehindTarget(player, target, 0.8)
      damageTarget(player, target, 3, 0.4)
      addEffect(target, MobEffects.WEAKNESS, 100, 0)
      setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard_boost', 1, 100)
      addResource(player, 3)
    }
  }
})

OrganKubejsEvents.skillCast('shadow_throat_sac_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let cost = activeSkillCost(player)
  if (!resourceReady(player, cost)) {
    return false
  }
  spendResource(player, cost)
  let duration = 100 + (gateOnline(player) ? 40 : 0) + (hasAuxiliary(player, 'gate_anchor') ? 40 : 0)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WEAKNESS, duration, 0)
    addEffect(targets[i], MobEffects.MOVEMENT_SLOWDOWN, Math.floor(duration / 2), 0)
  }
  return true
})

OrganKubejsEvents.skillCast('foldgate_fist_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let cost = activeSkillCost(player)
  if (!resourceReady(player, cost)) {
    return false
  }
  let range = 9 + (hasAuxiliary(player, 'gate_anchor') ? 2 : 0)
  let target = targetInFront(player, range)
  if (!target) {
    return false
  }
  spendResource(player, cost)
  let damage = 12 + (hasAuxiliary(player, 'gate_anchor') ? 2 : 0) + (airOnline(player) ? 2 : 0)
  teleportBehindTarget(player, target, 1.2)
  damageTarget(player, target, damage, 0.8)
  addEffect(target, MobEffects.WEAKNESS, 80, 0)
  return true
})

OrganKubejsEvents.skillCast('void_guard_core_cast', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 24) {
    return false
  }
  spendResource(player, 24)
  setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard', 1, 160)
  setExpiringRuntime(player, 'kubejs:vanillaEnd_void_guard_boost', 1, 100)
  return true
})

})()
