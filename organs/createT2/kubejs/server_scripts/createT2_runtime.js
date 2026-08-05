;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

let Runtime = Common.createRuntimeTools('kubejs_level2_system', 'createT2_links', 'kubejs:torque')

let DIR_KEY = 'createT2'
let RESOURCE = {
  "system": "kubejs_level2_system",
  "capacity": "kubejs:torque_capacity",
  "current": "kubejs:torque",
  "capacity_en": "Stress Capacity",
  "capacity_desc_en": "Maximum stress shared by all Create pressure organs.",
  "current_en": "Stored Stress",
  "current_desc_en": "Current stress available to Create organs.",
  "capacity_zh": "应力上限",
  "capacity_desc_zh": "Create 机械器官共用的最大应力上限。",
  "current_zh": "当前应力",
  "current_desc_zh": "Create 机械器官当前可消耗的应力。"
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'createT2_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = null
let SOURCE_IDS = new Set([
  "kubejs:brass_pressure_ventricle",
  "kubejs:weighted_flywheel_sac",
  "kubejs:brass_clutch_spine",
  "kubejs:tempo_calibration_cochlea",
  "kubejs:overpressure_forge_lung",
  "kubejs:lubrication_reflux_gland",
  "kubejs:pressure_balance_brass_membrane",
  "kubejs:brass_pile_driver",
  "kubejs:ratchet_breach_shoulder",
  "kubejs:spiral_tunnel_drill"
])
let CORELINE_IDS = new Set([
  "kubejs:brass_pressure_ventricle",
  "kubejs:weighted_flywheel_sac",
  "kubejs:brass_clutch_spine"
])
let SUPPORT_IDS = new Set([
  "kubejs:tempo_calibration_cochlea"
])
let MANA_IDS = new Set([])
let SPELL_IDS = new Set([
  "kubejs:overpressure_forge_lung"
])
let CROWN_IDS = new Set([])
let ARMOR_IDS = new Set([
  "kubejs:pressure_balance_brass_membrane"
])
let MOVEMENT_IDS = new Set([])
let MELEE_IDS = new Set([
  "kubejs:ratchet_breach_shoulder",
  "kubejs:brass_pile_driver"
])
let RANGED_IDS = new Set([])
let RESOURCE_IDS = new Set([
  "kubejs:spiral_tunnel_drill"
])

let entityOf = Common.entityOf
let pointKey = Common.pointKey
let setSourcePointValue = Common.setSourcePointValue
let getCounter = Runtime.getCounter
let getLinkCounter = Runtime.getLinkCounter
let setCounter = Runtime.setCounter
let setLinkCounter = Runtime.setLinkCounter
let setLinkAttribute = Runtime.setLinkAttribute
let consumeCounter = Runtime.consumeCounter
let resourceReady = Runtime.resourceReady
let spendResource = Runtime.spendResource
let addResource = Runtime.addResource
let addEffect = Common.addEffect
let installedSourceIds = Common.installedSourceIds
let countMatching = Common.countMatching
let hasMatching = Common.hasMatching

function applyLinearLinks(player) {
  if (!player) {
    return
  }
  let installed = installedSourceIds(player)
  let corelineCount = countMatching(installed, CORELINE_IDS)
  let supportCount = countMatching(installed, SUPPORT_IDS)
  let manaCount = countMatching(installed, MANA_IDS)
  let spellCount = countMatching(installed, SPELL_IDS)
  let crownCount = countMatching(installed, CROWN_IDS)
  let armorCount = countMatching(installed, ARMOR_IDS)
  let movementCount = countMatching(installed, MOVEMENT_IDS)
  let resourceCount = countMatching(installed, RESOURCE_IDS)
  let huntCount = countMatching(installed, MELEE_IDS) + countMatching(installed, RANGED_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  setLinkCounter(player, 'kubejs:createT2_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:createT2_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:createT2_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:createT2_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:createT2_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:createT2_resource_link', resourcePoint)
  setLinkAttribute(player, 'minecraft:armor_toughness', framePoint)
  setLinkAttribute(player, 'minecraft:attack_damage', huntPoint)
  setLinkAttribute(player, 'irons_spellbooks:cooldown_reduction', cadencePoint)
  setLinkAttribute(player, 'irons_spellbooks:max_mana', weavePoint * 10)
  if (SCHOOL_POWER_ATTRIBUTE) {
    setLinkAttribute(player, SCHOOL_POWER_ATTRIBUTE, weavePoint)
  }
}

let biomeId = Common.biomeId
let entityTypeId = Common.entityTypeId
let countNearbyEntityTypes = Common.countNearbyEntityTypes
let inventoryCount = Common.inventoryCount
let sqDistanceBetween = Common.sqDistanceBetween
let targetsSortedByDistance = Common.targetsSortedByDistance
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget

let createT2PredicateResult = Common.predicateResult

OrganKubejsEvents.predicate('createT2_set_major', event => {
  return createT2PredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('createT2_resource_online', event => {
  return createT2PredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('createT2_has_coreline', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('createT2_has_support', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('createT2_has_mana', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('createT2_has_spell', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('createT2_has_crown', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('createT2_has_armor', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('createT2_has_movement', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('createT2_has_resource', event => {
  return createT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('createT2_has_hunt', event => {
  if (!event.player) {
    return createT2PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return createT2PredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('createT2_has_chase', event => {
  if (!event.player) {
    return createT2PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return createT2PredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  applyLinearLinks(player)
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
  let scaledDamage = 12 + getLinkCounter(player, 'kubejs:createT2_hunt_link')
  spendResource(player, 32)
  damageTarget(player, target, scaledDamage, 1.6)
  return true
})

OrganKubejsEvents.skillCast('spiral_tunnel_drill_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 24)) {
    return false
  }
  spendResource(player, 24)
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let scaledLength = 6 + getLinkCounter(player, 'kubejs:createT2_resource_link')
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
  return mined > 0
})

})()
