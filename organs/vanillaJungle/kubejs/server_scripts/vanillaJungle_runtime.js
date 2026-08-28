;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')

let DIR_KEY = 'vanillaJungle'
let HOME_STRUCTURE_CACHE = new Map()
let HOME = {
  dimension_home: true,
  dimensions: [
    'minecraft:overworld'
  ],
  biome_keywords: [
    'jungle',
    'bamboo'
  ],
  structures: [
    'minecraft:jungle_temple'
  ],
  structure_radius: 8,
  structure_cache: HOME_STRUCTURE_CACHE
}
let RESOURCE = {
  system: 'vanillaJungle_system',
  capacity: 'kubejs:vanillaJungle_resonance_capacity',
  current: 'kubejs:vanillaJungle_resonance'
}
let PROTOCOL_POINT = 'kubejs:vanillaJungle_root_protocol'
let PROTOCOL_DURATION = 160
let MARK_POINT_ID = 'kubejs:vanillaJungle_mark'
let SOURCE_IDS = new Set([
  'kubejs:buttress_ventricle',
  'kubejs:mossbark_carapace',
  'kubejs:rainforest_water_sac',
  'kubejs:temple_moss_spine',
  'kubejs:stranglevine_arm',
  'kubejs:flytrap_throat_sac',
  'kubejs:jaguar_crouch_tendon',
  'kubejs:orchid_spellbud_lung',
  'kubejs:cocoa_marow_liver',
  'kubejs:sporeweb_crown',
  'kubejs:ancient_resonance_core',
  'kubejs:wooden_sap_conduit',
  'kubejs:root_anchor_silk',
  'kubejs:aerial_root_breathing_tube',
  'kubejs:vine_bind_bundle'
])
let SNARE_IDS = new Set([
  'kubejs:stranglevine_arm',
  'kubejs:flytrap_throat_sac',
  'kubejs:jaguar_crouch_tendon',
  'kubejs:vine_bind_bundle'
])
let STILL_TICKS = new Map()
let SAP_AWAY_TICKS = new Map()
let ROOT_PROTOCOL_ACTIVE = new Map()

let Runtime = Common.createRuntimeTools(RESOURCE.system, DIR_KEY + '_links', RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
let consumeCounter = Runtime.consumeCounter
let spendResource = Runtime.spendResource
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let targetsSortedByDistance = Common.targetsSortedByDistance

function uuidOf(player) {
  return String(entityOf(player).getUUID())
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  let state = homeState(player)
  return !!state.dimension && (!!state.biome || !!state.structure)
}

function stillFor(player) {
  return STILL_TICKS.get(uuidOf(player)) || 0
}

function rootedOnline(player) {
  return homeMatch(player) && stillFor(player) >= 60
}

function rainforestOnline(player) {
  return homeMatch(player)
}

function snareOnline(player) {
  let state = homeState(player)
  return !!state.dimension && !!state.structure
}

function canopyOnline(player) {
  let state = homeState(player)
  return !!state.dimension && !!state.biome
}

function protocolOnline(player) {
  return getRuntimePoint(player, PROTOCOL_POINT) > 0
}

function queueProtocolEndHeal(player) {
  let remaining = getCounter(player, RESOURCE.current)
  let heal = Math.floor(remaining / 5)
  if (heal > 0) {
    OrganKubeJS.addRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:ancient_resonance_core_end_recover'), heal, 2)
  }
}

function applySapDecay(player, inHome, uuid) {
  if (inHome) {
    SAP_AWAY_TICKS.delete(uuid)
    return
  }
  let away = (SAP_AWAY_TICKS.get(uuid) || 0) + 1
  if (away >= 600) {
    if (getCounter(player, RESOURCE.current) > 0) {
      consumeCounter(player, RESOURCE.current, 2)
    }
    away = 0
  }
  SAP_AWAY_TICKS.set(uuid, away)
}

function applyRootProtocol(player, uuid) {
  let entity = entityOf(player)
  if (protocolOnline(player)) {
    ROOT_PROTOCOL_ACTIVE.set(uuid, true)
    if (getCounter(player, RESOURCE.current) < 3) {
      OrganKubeJS.clearRuntimePoint(entity, pointKey('runtime', PROTOCOL_POINT))
      ROOT_PROTOCOL_ACTIVE.delete(uuid)
      queueProtocolEndHeal(player)
    }
    return
  }
  if (ROOT_PROTOCOL_ACTIVE.get(uuid) === true) {
    ROOT_PROTOCOL_ACTIVE.delete(uuid)
    queueProtocolEndHeal(player)
  }
}

function refreshWindows(player, uuid) {
  let entity = entityOf(player)
  let movement = entity.getDeltaMovement()
  let still = Math.abs(Number(movement.x())) + Math.abs(Number(movement.z())) < 0.04
  let stillTicks = still ? (STILL_TICKS.get(uuid) || 0) + 1 : 0
  STILL_TICKS.set(uuid, stillTicks)

  let state = homeState(player)
  let rainforest = homeMatch(player)
  let rooted = rainforest && stillTicks >= 60
  let snare = !!state.dimension && !!state.structure
  let canopy = !!state.dimension && !!state.biome

  setRuntimePoint(player, 'kubejs:vanillaJungle_rooted_window', rooted ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_rainforest_window', rainforest ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_snare_window', snare ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_canopy_window', canopy ? 1 : 0)

  return {
    inHome: rainforest,
    rooted: rooted,
    snare: snare,
    canopy: canopy
  }
}

OrganKubejsEvents.predicate('vanillaJungle_home', event => {
  return Common.predicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_set_major', event => {
  return Common.predicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaJungle_rooted_online', event => {
  return Common.predicateResult(event, !!event.player && rootedOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_rainforest_online', event => {
  return Common.predicateResult(event, !!event.player && rainforestOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_snare_online', event => {
  return Common.predicateResult(event, !!event.player && snareOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_canopy_online', event => {
  return Common.predicateResult(event, !!event.player && canopyOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_root_protocol_online', event => {
  return Common.predicateResult(event, !!event.player && protocolOnline(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_marked_online', event => {
  let player = event.player
  if (!player) {
    return Common.predicateResult(event, false)
  }
  let marked = Common.findNearbyMarkedEntities(player, 6)
  let hasJungleMark = false
  for (let i = 0; i < marked.length; i++) {
    if (OrganKubeJS.getMark(entityOf(marked[i]), MARK_POINT_ID) > 0) {
      hasJungleMark = true
      break
    }
  }
  return Common.predicateResult(event, hasJungleMark)
})

OrganKubejsEvents.targetAction('vanillaJungle_stranglevine_snare', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || !target.isAlive()) {
    return 0
  }
  let marked = OrganKubeJS.getMark(target, MARK_POINT_ID) > 0
  if (marked) {
    addEffect(target, MobEffects.WEAKNESS, 60, 0)
  } else {
    OrganKubeJS.addMarkPoint(target, MARK_POINT_ID, 1)
  }
  return event.isPointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('vanillaJungle_orchid_spell_echo', event => {
  let player = event.player
  let origin = entityOf(event.target)
  if (!player || !origin || !origin.isAlive()) {
    return 0
  }
  let playerEntity = entityOf(player)
  let list = origin.level().getEntities(origin, origin.getBoundingBox().inflate(4))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!(target instanceof LivingEntityClass) || !target.isAlive() || target === playerEntity || target instanceof PlayerClass) {
      continue
    }
    addEffect(target, MobEffects.WEAKNESS, 60, 0)
    target.hurt(target.level().damageSources().magic(), 2.0)
  }
  return event.isPointsConsume ? 1 : 0
})

OrganKubejsEvents.nearbyEntityAction('vanillaJungle_root_pressure', event => {
  let target = entityOf(event.target)
  if (!target || !target.isAlive()) {
    return 0
  }
  addEffect(target, MobEffects.WEAKNESS, 60, 0)
  addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 60, 0)
  return event.isPointsConsume ? 1 : 0
})

OrganKubejsEvents.nearbyEntityAction('vanillaJungle_vine_bind', event => {
  let target = entityOf(event.target)
  if (!target || !target.isAlive()) {
    return 0
  }
  addEffect(target, MobEffects.WEAKNESS, 40, 0)
  addEffect(target, MobEffects.MOVEMENT_SLOWDOWN, 40, 0)
  return event.isPointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('vanillaJungle_root_protocol_end_heal', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let amount = event.getAvailablePoints()
  let entity = entityOf(player)
  if (amount > 0 && entity.getHealth() < entity.getMaxHealth()) {
    entity.heal(amount)
  }
  return event.isPointsConsume ? amount : 0
})

OrganKubejsEvents.skillCast('flytrap_throat_sac_cast', event => {
  let player = event.player
  if (!player || !spendResource(player, 12)) {
    return false
  }
  let snareLine = countMatching(installedSourceIds(player), SNARE_IDS)
  let duration = 80 + snareLine * 20
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WEAKNESS, duration, 0)
    addEffect(targets[i], MobEffects.MOVEMENT_SLOWDOWN, duration, 0)
  }
  return true
})

OrganKubejsEvents.skillCast('ancient_resonance_core_cast', event => {
  let player = event.player
  if (!player || getCounter(player, RESOURCE.current) < 20) {
    return false
  }
  let entity = entityOf(player)
  OrganKubeJS.setRuntimePoint(entity, pointKey('runtime', PROTOCOL_POINT), 1, PROTOCOL_DURATION)
  ROOT_PROTOCOL_ACTIVE.set(uuidOf(player), true)
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  if (!player) {
    return
  }
  let uuid = uuidOf(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    if (protocolOnline(player)) {
      OrganKubeJS.clearRuntimePoint(entityOf(player), pointKey('runtime', PROTOCOL_POINT))
    }
    ROOT_PROTOCOL_ACTIVE.delete(uuid)
    STILL_TICKS.delete(uuid)
    SAP_AWAY_TICKS.delete(uuid)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)

  let state = refreshWindows(player, uuid)
  applySapDecay(player, state.inHome, uuid)
  applyRootProtocol(player, uuid)
})
})()
