;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

let Runtime = Common.createRuntimeTools('kubejs_mek_system', 'mekanismT1_links', 'kubejs:mek_energy')

let DIR_KEY = 'mekanismT1'
let RESOURCE = {
  "system": "kubejs_mek_system",
  "capacity": "kubejs:mek_energy_capacity",
  "current": "kubejs:mek_energy",
  "capacity_en": "Mekanism Energy Capacity",
  "capacity_desc_en": "Maximum shared Mekanism energy reserve.",
  "current_en": "Stored Mekanism Energy",
  "current_desc_en": "Current shared Mekanism energy reserve.",
  "capacity_zh": "Mek 能量上限",
  "capacity_desc_zh": "Mekanism 体系共用的最大能量上限。",
  "current_zh": "当前 Mek 能量",
  "current_desc_zh": "Mekanism 体系当前可消耗的能量储备。"
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'mekanismT1_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = null
let SOURCE_IDS = new Set([
  "kubejs:industrial_energy_core",
  "kubejs:heat_pump_lung",
  "kubejs:gas_reflux_sac",
  "kubejs:high_frequency_phase_cochlea",
  "kubejs:heat_conductive_boneplate",
  "kubejs:capacitor_rhythm_gland",
  "kubejs:distillation_filter_bladder",
  "kubejs:calibration_lens_eye",
  "kubejs:heat_blade_arm",
  "kubejs:magnet_rail_fist",
  "kubejs:overheat_diffusion_shoulder",
  "kubejs:cracking_mine_sac",
  "kubejs:refining_recovery_gland",
  "kubejs:magnet_rail_leg_bolt"
])
let CORELINE_IDS = new Set([
  "kubejs:industrial_energy_core",
  "kubejs:heat_pump_lung",
  "kubejs:capacitor_rhythm_gland"
])
let SUPPORT_IDS = new Set([
  "kubejs:high_frequency_phase_cochlea"
])
let HEAT_IDS = new Set([
  "kubejs:heat_pump_lung",
  "kubejs:heat_conductive_boneplate",
  "kubejs:heat_blade_arm",
  "kubejs:overheat_diffusion_shoulder"
])
let RHYTHM_IDS = new Set([
  "kubejs:high_frequency_phase_cochlea",
  "kubejs:capacitor_rhythm_gland",
  "kubejs:calibration_lens_eye",
  "kubejs:magnet_rail_leg_bolt"
])
let REFINERY_IDS = new Set([
  "kubejs:gas_reflux_sac",
  "kubejs:distillation_filter_bladder",
  "kubejs:cracking_mine_sac",
  "kubejs:refining_recovery_gland"
])
let MANA_IDS = new Set([])
let SPELL_IDS = new Set([])
let CROWN_IDS = new Set([])
let ARMOR_IDS = new Set([
  "kubejs:heat_conductive_boneplate"
])
let MOVEMENT_IDS = new Set([
  "kubejs:magnet_rail_leg_bolt"
])
let MELEE_IDS = new Set([
  "kubejs:heat_blade_arm",
  "kubejs:overheat_diffusion_shoulder",
  "kubejs:magnet_rail_fist"
])
let RANGED_IDS = new Set([
  "kubejs:calibration_lens_eye"
])
let RESOURCE_IDS = new Set([
  "kubejs:distillation_filter_bladder",
  "kubejs:refining_recovery_gland",
  "kubejs:cracking_mine_sac"
])

let entityOf = Common.entityOf
let pointKey = Common.pointKey
let setSourcePointValue = Common.setSourcePointValue
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
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
  let heatCount = countMatching(installed, HEAT_IDS)
  let rhythmCount = countMatching(installed, RHYTHM_IDS)
  let refineryCount = countMatching(installed, REFINERY_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let heatPoint = heatCount
  let rhythmPoint = rhythmCount
  let refineryPoint = refineryCount
  let pressurePoint = Math.max(0, huntCount + Math.min(1, movementCount))
  setLinkCounter(player, 'kubejs:mekanismT1_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:mekanismT1_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:mekanismT1_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:mekanismT1_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:mekanismT1_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:mekanismT1_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:mekanismT1_heat_line', heatPoint)
  setLinkCounter(player, 'kubejs:mekanismT1_rhythm_line', rhythmPoint)
  setLinkCounter(player, 'kubejs:mekanismT1_refinery_line', refineryPoint)
  setLinkCounter(player, 'kubejs:mekanismT1_pressure_line', pressurePoint)
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

let mekanismT1PredicateResult = Common.predicateResult

OrganKubejsEvents.predicate('mekanismT1_set_major', event => {
  return mekanismT1PredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('mekanismT1_resource_online', event => {
  return mekanismT1PredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('mekanismT1_has_coreline', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_support', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_mana', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_spell', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_crown', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_armor', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_movement', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_resource', event => {
  return mekanismT1PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_hunt', event => {
  if (!event.player) {
    return mekanismT1PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return mekanismT1PredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('mekanismT1_has_chase', event => {
  if (!event.player) {
    return mekanismT1PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return mekanismT1PredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('mekanismT1_heat_online', event => {
  return mekanismT1PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t1_heat_cycle') > 0)
})

OrganKubejsEvents.predicate('mekanismT1_rhythm_online', event => {
  return mekanismT1PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t1_rhythm_cycle') > 0)
})

OrganKubejsEvents.predicate('mekanismT1_refinery_online', event => {
  return mekanismT1PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t1_refinery_cycle') > 0)
})

OrganKubejsEvents.predicate('mekanismT1_discharge_ready', event => {
  return mekanismT1PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t1_discharge_window') > 0)
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


OrganKubejsEvents.skillCast('magnet_rail_fist_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 28)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  let scaledDamage = 10 + getLinkCounter(player, 'kubejs:mekanismT1_pressure_line') + getLinkCounter(player, 'kubejs:mekanismT1_rhythm_line')
  spendResource(player, 28)
  damageTarget(player, target, scaledDamage, 1.1)
  return true
})

OrganKubejsEvents.skillCast('cracking_mine_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 22)) {
    return false
  }
  spendResource(player, 22)
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let scaledLength = 4 + getLinkCounter(player, 'kubejs:mekanismT1_resource_link') + Math.min(2, getLinkCounter(player, 'kubejs:mekanismT1_refinery_line'))
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
