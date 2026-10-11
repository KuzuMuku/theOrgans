;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let DIR_KEY = 'createT2'
let RESOURCE = {
  system: 'kubejs_level2_system',
  capacity: 'kubejs:torque_capacity',
  current: 'kubejs:torque'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)

let SOURCE_IDS = new Set([
  'createt2:brass_pressure_ventricle',
  'createt2:weighted_flywheel_sac',
  'createt2:brass_clutch_spine',
  'createt2:tempo_calibration_cochlea',
  'createt2:overpressure_forge_lung',
  'createt2:lubrication_reflux_gland',
  'createt2:pressure_balance_brass_membrane',
  'createt2:brass_pile_driver',
  'createt2:ratchet_breach_shoulder',
  'createt2:spiral_tunnel_drill',
  'createt2:brass_constancy_star_core',
  'createt2:brass_stress_conduit',
  'createt2:brass_coolant_return_pipe',
  'createt2:counterweight_bearing',
  'createt2:brass_clutch_slide',
  'createt2:experience_etched_line'
])

let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let resourceReady = Runtime.resourceReady
let spendResource = Runtime.spendResource
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget

function createT2PredicateResult(event, value) {
  return Common.predicateResult(event, !!value)
}

function systemOnline(player) {
  return !!player && getCounter(player, RESOURCE.capacity) > 0
}

function highLoad(player) {
  if (!systemOnline(player)) {
    return false
  }
  let capacity = getCounter(player, RESOURCE.capacity)
  let current = getCounter(player, RESOURCE.current)
  return current >= Math.max(16, Math.floor(capacity * 0.75))
}

function cruiseOnline(player) {
  return !!player && getRuntimePoint(player, 'kubejs:brass_cruise_online') > 0
}

function tempoReady(player) {
  return !!player && getRuntimePoint(player, 'kubejs:brass_rhythm') >= 3
}

function fireCreateEvent(player, type, target, amount, blockState) {
  if (!player) {
    return
  }
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder = builder.target(target)
  }
  if (amount != null && Number(amount) !== 0) {
    builder = builder.amount(Number(amount))
  }
  if (blockState) {
    builder = builder.blockState(blockState)
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
}

function fireStressSpent(player, amount) {
  fireCreateEvent(player, 'createT2:stress_spent', null, amount, null)
}

function setRuntimeToken(player, pointId, durationTicks) {
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', pointId), 1, Math.max(1, durationTicks))
}

OrganKubejsEvents.predicate('createT2_system_online', event => {
  return createT2PredicateResult(event, systemOnline(event.player))
})

OrganKubejsEvents.predicate('createT2_high_load', event => {
  return createT2PredicateResult(event, highLoad(event.player))
})

OrganKubejsEvents.predicate('createT2_cruise_online', event => {
  return createT2PredicateResult(event, cruiseOnline(event.player))
})

OrganKubejsEvents.predicate('createT2_tempo_ready', event => {
  return createT2PredicateResult(event, tempoReady(event.player))
})

OrganKubejsEvents.predicate('createT2_four_resonance', event => {
  return createT2PredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    if (getCounter(player, RESOURCE.current) !== 0) {
      setCounter(player, RESOURCE.current, 0)
    }
    if (getRuntimePoint(player, 'kubejs:brass_rhythm') > 0) {
      OrganKubeJS.clearRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:brass_rhythm'))
    }
    if (getRuntimePoint(player, 'kubejs:brass_cruise_online') > 0) {
      OrganKubeJS.clearRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:brass_cruise_online'))
    }
    if (getCounter(player, 'kubejs:brass_cruise_lock') !== 0) {
      setCounter(player, 'kubejs:brass_cruise_lock', 0)
    }
    if (getCounter(player, 'kubejs:brass_breach_charge') !== 0) {
      setCounter(player, 'kubejs:brass_breach_charge', 0)
    }
    return
  }

  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  if (current !== getCounter(player, RESOURCE.current)) {
    setCounter(player, RESOURCE.current, current)
  }

  let cruiseLock = getCounter(player, 'kubejs:brass_cruise_lock')
  if (cruiseOnline(player) && cruiseLock > 0 && getCounter(player, RESOURCE.current) > cruiseLock) {
    setCounter(player, RESOURCE.current, cruiseLock)
  }
  if (!cruiseOnline(player) && cruiseLock !== 0) {
    setCounter(player, 'kubejs:brass_cruise_lock', 0)
  }
  if (getCounter(player, 'kubejs:brass_breach_charge') > 10) {
    setCounter(player, 'kubejs:brass_breach_charge', 10)
  }

  if (entityOf(player).tickCount % 20 !== 0) {
    return
  }

  if (highLoad(player)) {
    setRuntimeToken(player, 'kubejs:brass_load_high', 40)
    setRuntimeToken(player, 'kubejs:brass_running_online', 40)
  } else if (current <= Math.max(2, Math.floor(capacity * 0.25))) {
    setRuntimeToken(player, 'kubejs:brass_idle_online', 40)
    setRuntimeToken(player, 'kubejs:brass_running_online', 40)
  }

  if (cruiseOnline(player)) {
    setRuntimeToken(player, 'kubejs:brass_running_online', 40)
  }
})

OrganKubejsEvents.skillCast('brass_pile_driver_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 32)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  spendResource(player, 32)
  fireStressSpent(player, 32)
  let damage = 12 + (highLoad(player) ? 4 : 0)
  damageTarget(player, target, damage, 1.8)
  return true
})

OrganKubejsEvents.skillCast('spiral_tunnel_drill_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 24)) {
    return false
  }
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let targetPositions = []
  for (let step = 1; step <= 8; step++) {
    targetPositions.push(new BlockPos(
      Math.floor(entity.getX() + look.x() * step),
      Math.floor(entity.getY() + look.y() * step),
      Math.floor(entity.getZ() + look.z() * step)
    ))
  }
  let hasBreakable = false
  for (let i = 0; i < targetPositions.length; i++) {
    let state = player.level.getBlockState(targetPositions[i])
    if (!state.isAir()) {
      hasBreakable = true
      break
    }
  }
  if (!hasBreakable) {
    return false
  }
  spendResource(player, 24)
  fireStressSpent(player, 24)
  let mined = 0
  for (let i = 0; i < targetPositions.length; i++) {
    if (player.level.destroyBlock(targetPositions[i], true, player)) {
      mined++
    }
  }
  return mined > 0
})

OrganKubejsEvents.skillCast('ratchet_breach_shoulder_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let charge = getCounter(player, 'kubejs:brass_breach_charge')
  if (charge < 6) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  setCounter(player, 'kubejs:brass_breach_charge', 0)
  damageTarget(player, target, 8 + charge * 2, 2.2)
  return true
})

OrganKubejsEvents.skillCast('brass_constancy_star_core_cast', event => {
  let player = event.player
  if (!player || !systemOnline(player) || !resourceReady(player, 24)) {
    return false
  }
  if (getRuntimePoint(player, 'kubejs:brass_cruise_online') > 0 || getRuntimePoint(player, 'kubejs:brass_inert') > 0) {
    return false
  }
  spendResource(player, 24)
  fireStressSpent(player, 24)
  setCounter(player, 'kubejs:brass_cruise_lock', getCounter(player, RESOURCE.current))
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:brass_cruise_online'), 1, 200)
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', 'kubejs:brass_inert'), 1, 300)
  return true
})

})()
