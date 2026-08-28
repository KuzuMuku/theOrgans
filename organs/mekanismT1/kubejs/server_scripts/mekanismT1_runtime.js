;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')

let Runtime = Common.createRuntimeTools('kubejs_mek_system', 'mekanismT1_links', 'kubejs:mek_energy')

let DIR_KEY = 'mekanismT1'
let RESOURCE = {
  system: 'kubejs_mek_system',
  capacity: 'kubejs:mek_energy_capacity',
  current: 'kubejs:mek_energy',
  flow: 'kubejs:mek_t1_flow_cycle',
  heat: 'kubejs:mek_t1_heat_cycle',
  rhythm: 'kubejs:mek_t1_rhythm_cycle',
  refinery: 'kubejs:mek_t1_refinery_cycle',
  discharge: 'kubejs:mek_t1_discharge_window',
  overload: 'kubejs:mek_t1_overload_window'
}
let SYSTEM_SOURCE = RESOURCE.system

let SOURCE_IDS = new Set([
  'kubejs:industrial_energy_core',
  'kubejs:heat_pump_lung',
  'kubejs:gas_reflux_sac',
  'kubejs:high_frequency_phase_cochlea',
  'kubejs:heat_conductive_boneplate',
  'kubejs:capacitor_rhythm_gland',
  'kubejs:distillation_filter_bladder',
  'kubejs:calibration_lens_eye',
  'kubejs:heat_blade_arm',
  'kubejs:magnet_rail_fist',
  'kubejs:overheat_diffusion_shoulder',
  'kubejs:cracking_mine_sac',
  'kubejs:refining_recovery_gland',
  'kubejs:magnet_rail_leg_bolt',
  'kubejs:energy_loop_core'
])

let HEAT_IDS = new Set([
  'kubejs:heat_pump_lung',
  'kubejs:heat_conductive_boneplate',
  'kubejs:heat_blade_arm',
  'kubejs:overheat_diffusion_shoulder'
])

let RHYTHM_IDS = new Set([
  'kubejs:high_frequency_phase_cochlea',
  'kubejs:capacitor_rhythm_gland',
  'kubejs:calibration_lens_eye',
  'kubejs:magnet_rail_leg_bolt'
])

let REFINERY_IDS = new Set([
  'kubejs:gas_reflux_sac',
  'kubejs:distillation_filter_bladder',
  'kubejs:cracking_mine_sac',
  'kubejs:refining_recovery_gland'
])

let OVERHEAT_IDS = new Set([
  'kubejs:overheat_diffusion_shoulder',
  'kubejs:heat_conductive_boneplate'
])

let INFRASTRUCTURE_IDS = [
  'kubejs:basic_energy_wire',
  'kubejs:heat_exchange_pipe',
  'kubejs:chemical_gas_pipe',
  'kubejs:capacitor_bus_bar',
  'kubejs:mineral_transport_rail'
]

let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let setCounter = Runtime.setCounter
let consumeCounter = Runtime.consumeCounter
let addResource = Runtime.addResource
let spendResource = Runtime.spendResource
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let hasMatching = Common.hasMatching
let inventoryCount = Common.inventoryCount
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget
let swingMainHand = Common.swingMainHand

function setRuntime(player, pointId, value, durationTicks) {
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', pointId), Math.max(0, value), Math.max(1, durationTicks))
}

function addRuntime(player, pointId, amount, durationTicks) {
  OrganKubeJS.addRuntimePoint(entityOf(player), pointKey('runtime', pointId), Math.max(0, amount), Math.max(1, durationTicks))
}

function flowActive(player) {
  return getRuntimePoint(player, RESOURCE.flow) > 0
}

function energyReady(player, amount) {
  let capacity = getCounter(player, RESOURCE.capacity)
  let current = getCounter(player, RESOURCE.current)
  return current >= Math.min(capacity, Math.floor(amount))
}

function addEnergy(player, amount) {
  let bonus = flowActive(player) ? 1.5 : 1.0
  addResource(player, Math.max(0, Math.floor(amount * bonus)))
}

function discountedCost(player, baseAmount) {
  let cost = Math.floor(baseAmount)
  if (flowActive(player)) {
    cost = Math.max(1, Math.ceil(cost * 0.75))
  }
  if (getRuntimePoint(player, RESOURCE.discharge) > 0) {
    cost = Math.max(1, cost - 2)
  }
  return cost
}

function trySpend(player, baseAmount) {
  if (!player) {
    return 0
  }
  let cost = discountedCost(player, baseAmount)
  if (!energyReady(player, cost)) {
    return 0
  }
  spendResource(player, cost)
  return cost
}

function hotZone(player) {
  let entity = entityOf(player)
  let biome = String(Common.biomeId(entity) || '')
  let keywords = [
    'desert',
    'badlands',
    'nether',
    'basalt_deltas',
    'soul_sand_valley',
    'crimson_forest',
    'warped_forest'
  ]
  for (let i = 0; i < keywords.length; i++) {
    if (biome.indexOf(keywords[i]) >= 0) {
      return true
    }
  }
  return Common.hasNearbyBlock(entity, [
    'minecraft:lava',
    'minecraft:magma_block',
    'minecraft:campfire',
    'minecraft:soul_campfire'
  ], 5)
}

function applyInfrastructureCapacity(player) {
  let bonus = inventoryCount(player, INFRASTRUCTURE_IDS) * 10
  Common.setSourcePointValue(player, 'mekanismT1_infrastructure', pointKey('counter', RESOURCE.capacity), bonus)
}

function predicateResult(event, value) {
  return Common.predicateResult(event, !!value)
}

OrganKubejsEvents.predicate('mekanismT1_set_major', event => {
  return predicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('mekanismT1_resource_online', event => {
  return predicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('mekanismT1_energy_ready', event => {
  if (!event.player) {
    return predicateResult(event, false)
  }
  let amount = Number(event.configLong('amount') || 0)
  return predicateResult(event, energyReady(event.player, amount))
})

OrganKubejsEvents.predicate('mekanismT1_hot_zone', event => {
  return predicateResult(event, !!event.player && hotZone(event.player))
})

OrganKubejsEvents.predicate('mekanismT1_passive_heat_allowed', event => {
  if (!event.player) {
    return predicateResult(event, false)
  }
  return predicateResult(event, !flowActive(event.player) && (hotZone(event.player) || getRuntimePoint(event.player, RESOURCE.heat) > 0))
})

OrganKubejsEvents.predicate('mekanismT1_heat_online', event => {
  return predicateResult(event, !!event.player && getRuntimePoint(event.player, RESOURCE.heat) > 0)
})

OrganKubejsEvents.predicate('mekanismT1_rhythm_online', event => {
  return predicateResult(event, !!event.player && getRuntimePoint(event.player, RESOURCE.rhythm) > 0)
})

OrganKubejsEvents.predicate('mekanismT1_refinery_online', event => {
  return predicateResult(event, !!event.player && getRuntimePoint(event.player, RESOURCE.refinery) > 0)
})

OrganKubejsEvents.predicate('mekanismT1_discharge_ready', event => {
  return predicateResult(event, !!event.player && getRuntimePoint(event.player, RESOURCE.discharge) > 0)
})

OrganKubejsEvents.predicate('mekanismT1_flow_ready', event => {
  return predicateResult(event, !!event.player && energyReady(event.player, 20))
})

OrganKubejsEvents.predicate('mekanismT1_flow_online', event => {
  return predicateResult(event, !!event.player && flowActive(event.player))
})

OrganKubejsEvents.predicate('mekanismT1_heat_blade_ready', event => {
  if (!event.player) {
    return predicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return predicateResult(event, hasMatching(installed, new Set(['kubejs:heat_blade_arm']))
    && getRuntimePoint(event.player, RESOURCE.heat) > 0
    && energyReady(event.player, 2))
})

OrganKubejsEvents.pointAction('mekanismT1_energy_recover', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  let amount = Number(event.configLong('amount') || 2)
  addEnergy(player, amount)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.pointAction('mekanismT1_rhythm_loop', event => {
  let player = event.player
  if (!player) {
    return 0
  }
  if (getRuntimePoint(player, 'kubejs:mekanismT1_rhythm_actions') >= 3) {
    setRuntime(player, RESOURCE.rhythm, 1, 100)
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.nearbyEntityAction('mekanismT1_overheat_buildup', event => {
  let player = event.player
  let target = Common.rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  let stacks = getCounter(player, 'kubejs:mek_t1_overheat_stacks')
  if (stacks < 4) {
    return 0
  }
  setCounter(player, 'kubejs:mek_t1_overheat_stacks', 0)
  setRuntime(player, RESOURCE.overload, 1, 60)
  setRuntime(player, RESOURCE.heat, 1, 120)
  let damage = 4 + countMatching(installedSourceIds(player), OVERHEAT_IDS)
  damageTarget(player, target, damage, 0.8)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('mekanismT1_heat_sear_apply', event => {
  let player = event.player
  let target = Common.rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  target.setSecondsOnFire(Math.max(2, 3 + countMatching(installedSourceIds(player), OVERHEAT_IDS)))
  setRuntime(player, RESOURCE.heat, 1, 100)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('mekanismT1_heat_blade_pay', event => {
  let player = event.player
  let target = Common.rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  let cost = discountedCost(player, 2)
  if (!energyReady(player, cost)) {
    return 0
  }
  spendResource(player, cost)
  setRuntime(player, RESOURCE.heat, 1, 100)
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.targetAction('mekanismT1_calibration_mark', event => {
  let player = event.player
  let target = Common.rawEntity(event.target)
  if (!player || !target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return 0
  }
  if (Math.random() < 0.15) {
    OrganKubeJS.addMarkPoint(target, 'kubejs:mekanismT1_mark', 1)
  }
  return event.pointsConsume ? 1 : 0
})

OrganKubejsEvents.skillCast('magnet_rail_fist_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  let spent = trySpend(player, 28)
  if (spent <= 0) {
    return false
  }
  let installed = installedSourceIds(player)
  let damage = 10 + spent + countMatching(installed, RHYTHM_IDS)
  swingMainHand(player)
  damageTarget(player, target, damage, 1.2)
  setRuntime(player, RESOURCE.discharge, 1, 60)
  return true
})

OrganKubejsEvents.skillCast('cracking_mine_sac_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let spent = trySpend(player, 22)
  if (spent <= 0) {
    return false
  }
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let scaledLength = 4 + countMatching(installedSourceIds(player), REFINERY_IDS)
  let mined = 0
  for (let step = 1; step <= scaledLength; step++) {
    let targetPos = new BlockPos(
      Math.floor(entity.getX() + look.x() * step),
      Math.floor(entity.getY() + look.y() * step),
      Math.floor(entity.getZ() + look.z() * step)
    )
    if (player.level.destroyBlock(targetPos, true, player)) {
      mined++
    }
  }
  if (mined > 0) {
    setRuntime(player, RESOURCE.refinery, 1, 120)
  }
  return mined > 0
})

OrganKubejsEvents.skillCast('magnet_rail_leg_bolt_cast', event => {
  let player = event.player
  if (!player) {
    return false
  }
  let spent = trySpend(player, 6)
  if (spent <= 0) {
    return false
  }
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  entity.teleportTo(
    entity.getX() + look.x() * 5,
    Math.max(-64, Math.min(320, entity.getY() + look.y() * 5)),
    entity.getZ() + look.z() * 5
  )
  setRuntime(player, RESOURCE.discharge, 1, 60)
  setRuntime(player, RESOURCE.rhythm, 1, 80)
  return true
})

OrganKubejsEvents.skillCast('energy_loop_core_cast', event => {
  let player = event.player
  if (!player || !energyReady(player, 20)) {
    return false
  }
  setRuntime(player, RESOURCE.flow, 1, 160)
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  applyInfrastructureCapacity(player)
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, Math.max(0, Math.floor(current)))
})

})()
