;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')

let Runtime = Common.createRuntimeTools('kubejs_mek_system', 'mekanismT2_links', 'kubejs:mek_energy')

let DIR_KEY = 'mekanismT2'
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
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'mekanismT2_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = null
let SOURCE_IDS = new Set([
  "kubejs:quantum_shield_core",
  "kubejs:plasma_membrane_lung",
  "kubejs:nano_recharge_nest",
  "kubejs:overload_phase_spine",
  "kubejs:shield_weave_membrane",
  "kubejs:vector_lock_eye",
  "kubejs:nano_repair_mesh",
  "kubejs:prism_compute_brain",
  "kubejs:phase_cut_arm",
  "kubejs:light_spear_tendon",
  "kubejs:deflection_prism_shoulder",
  "kubejs:nano_copy_gland",
  "kubejs:energy_harvest_step_foot",
  "kubejs:zero_loss_sampler_claw"
])
let CORELINE_IDS = new Set([
  "kubejs:quantum_shield_core",
  "kubejs:plasma_membrane_lung",
  "kubejs:overload_phase_spine"
])
let SUPPORT_IDS = new Set([
  "kubejs:nano_repair_mesh"
])
let BARRIER_IDS = new Set([
  "kubejs:quantum_shield_core",
  "kubejs:shield_weave_membrane",
  "kubejs:deflection_prism_shoulder"
])
let OVERLOAD_IDS = new Set([
  "kubejs:overload_phase_spine",
  "kubejs:phase_cut_arm",
  "kubejs:vector_lock_eye",
  "kubejs:light_spear_tendon",
  "kubejs:prism_compute_brain"
])
let NANO_IDS = new Set([
  "kubejs:nano_recharge_nest",
  "kubejs:nano_repair_mesh",
  "kubejs:nano_copy_gland",
  "kubejs:energy_harvest_step_foot",
  "kubejs:zero_loss_sampler_claw"
])
let LOCK_IDS = new Set([
  "kubejs:vector_lock_eye",
  "kubejs:prism_compute_brain",
  "kubejs:light_spear_tendon"
])
let MANA_IDS = new Set([])
let SPELL_IDS = new Set([])
let CROWN_IDS = new Set([
  "kubejs:prism_compute_brain"
])
let ARMOR_IDS = new Set([
  "kubejs:shield_weave_membrane"
])
let MOVEMENT_IDS = new Set([
  "kubejs:energy_harvest_step_foot"
])
let MELEE_IDS = new Set([
  "kubejs:deflection_prism_shoulder",
  "kubejs:phase_cut_arm"
])
let RANGED_IDS = new Set([
  "kubejs:vector_lock_eye",
  "kubejs:light_spear_tendon"
])
let RESOURCE_IDS = new Set([
  "kubejs:zero_loss_sampler_claw",
  "kubejs:nano_copy_gland"
])

let entityOf = Common.entityOf
let pointKey = Common.pointKey
let setSourcePointValue = Common.setSourcePointValue
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let getShieldPoint = Runtime.getShieldPoint
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
  let barrierCount = countMatching(installed, BARRIER_IDS)
  let overloadCount = countMatching(installed, OVERLOAD_IDS)
  let nanoCount = countMatching(installed, NANO_IDS)
  let lockCount = countMatching(installed, LOCK_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let barrierPoint = barrierCount
  let overloadPoint = overloadCount
  let nanoPoint = nanoCount
  let lockPoint = lockCount
  setLinkCounter(player, 'kubejs:mekanismT2_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:mekanismT2_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:mekanismT2_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:mekanismT2_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:mekanismT2_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:mekanismT2_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:mekanismT2_barrier_line', barrierPoint)
  setLinkCounter(player, 'kubejs:mekanismT2_overload_line', overloadPoint)
  setLinkCounter(player, 'kubejs:mekanismT2_nano_line', nanoPoint)
  setLinkCounter(player, 'kubejs:mekanismT2_lock_line', lockPoint)
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

let mekanismT2PredicateResult = Common.predicateResult

OrganKubejsEvents.predicate('mekanismT2_set_major', event => {
  return mekanismT2PredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('mekanismT2_resource_online', event => {
  return mekanismT2PredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('mekanismT2_has_coreline', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_support', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_mana', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_spell', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_crown', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_armor', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_movement', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_resource', event => {
  return mekanismT2PredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_hunt', event => {
  if (!event.player) {
    return mekanismT2PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return mekanismT2PredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('mekanismT2_has_chase', event => {
  if (!event.player) {
    return mekanismT2PredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return mekanismT2PredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('mekanismT2_barrier_online', event => {
  return mekanismT2PredicateResult(event, !!event.player && getShieldPoint(event.player, 'kubejs:mekanismT2_barrier') > 0)
})

OrganKubejsEvents.predicate('mekanismT2_barrier_high', event => {
  return mekanismT2PredicateResult(event, !!event.player && getShieldPoint(event.player, 'kubejs:mekanismT2_barrier') >= 18)
})

OrganKubejsEvents.predicate('mekanismT2_overload_online', event => {
  return mekanismT2PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t2_overload_window') > 0)
})

OrganKubejsEvents.predicate('mekanismT2_lock_online', event => {
  return mekanismT2PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t2_lock_window') > 0)
})

OrganKubejsEvents.predicate('mekanismT2_nano_online', event => {
  return mekanismT2PredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:mek_t2_nano_cycle') > 0)
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


OrganKubejsEvents.skillCast('phase_cut_arm_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 36)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  let scaledDamage = 13 + getLinkCounter(player, 'kubejs:mekanismT2_hunt_link') + getLinkCounter(player, 'kubejs:mekanismT2_barrier_line')
  spendResource(player, 36)
  damageTarget(player, target, scaledDamage, 0.9)
  return true
})

OrganKubejsEvents.skillCast('light_spear_tendon_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 30)) {
    return false
  }
  let target = targetInFront(player, 12.0)
  if (!target) {
    return false
  }
  let scaledDamage = 11 + getLinkCounter(player, 'kubejs:mekanismT2_hunt_link') + getLinkCounter(player, 'kubejs:mekanismT2_lock_line')
  let scaledDuration = 120 + getLinkCounter(player, 'kubejs:mekanismT2_overload_line') * 20
  spendResource(player, 30)
  damageTarget(player, target, scaledDamage, 0.2)
  addEffect(target, MobEffects.GLOWING, scaledDuration, 0)
  return true
})

let NANO_COPY_GLAND_CAST_WHITELIST = new Set(["minecraft:diamond", "minecraft:emerald", "mekanism:ingot_osmium"])

OrganKubejsEvents.skillCast('nano_copy_gland_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 40)) {
    return false
  }
  let stack = entityOf(player).getMainHandItem()
  if (stack.isEmpty()) {
    return false
  }
  let itemId = String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
  if (!NANO_COPY_GLAND_CAST_WHITELIST.has(itemId)) {
    return false
  }
  let copies = 1 + Math.min(2, getLinkCounter(player, 'kubejs:mekanismT2_nano_line'))
  spendResource(player, 40)
  player.give(Item.of(itemId, copies))
  return true
})

})()
