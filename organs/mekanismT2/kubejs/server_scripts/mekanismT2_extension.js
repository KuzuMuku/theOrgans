// priority: 900
;(function () {
let Common = global.Common || (global.Common = {})

let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let StringTag = Java.loadClass('net.minecraft.nbt.StringTag')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let DIR_KEY = 'mekanismT2'
let RESOURCE = {
  system: 'kubejs_mek_system',
  capacity: 'kubejs:mek_energy_capacity',
  current: 'kubejs:mek_energy'
}
let SYSTEM_SOURCE = RESOURCE.system
let LINK_SOURCE = DIR_KEY + '_links'
let SHIELD_SOURCE = 'mekanismT2_shield'
let SHIELD_KEY = Common.pointKey('shield', 'kubejs:mekanismT2_barrier')
let SHIELD_ID = 'kubejs:mekanismT2_barrier'
let RADIATION_KEY = 'kubejs:mek_t2_radiation_layer'
let PLASMA_KEY = 'kubejs:mek_t2_plasma_window'
let PROTOCOL_KEY = 'kubejs:mek_t2_protocol_window'
let LOCK_KEY = 'kubejs:mek_t2_lock_window'
let NANO_KEY = 'kubejs:mek_t2_nano_cycle'
let PLASMA_COOLDOWN_KEY = 'kubejs:mek_t2_plasma_cooldown'
let PROTOCOL_COOLDOWN_KEY = 'kubejs:mek_t2_protocol_cooldown'
let FUEL_ITEM = 'mekanism:reprocessed_fissile_fragment'
let FUEL_COUNTER_KEY = 'kubejs:mek_t2_fuel'

let SOURCE_IDS = new Set([
  "mekanismt2:quantum_shield_core",
  "mekanismt2:plasma_membrane_lung",
  "mekanismt2:nano_recharge_nest",
  "mekanismt2:overload_phase_spine",
  "mekanismt2:shield_weave_membrane",
  "mekanismt2:vector_lock_eye",
  "mekanismt2:nano_repair_mesh",
  "mekanismt2:prism_compute_brain",
  "mekanismt2:phase_cut_arm",
  "mekanismt2:light_spear_tendon",
  "mekanismt2:deflection_prism_shoulder",
  "mekanismt2:nano_copy_gland",
  "mekanismt2:energy_harvest_step_foot",
  "mekanismt2:zero_loss_sampler_claw",
  "mekanismt2:radiation_diffusion_core",
  "mekanismt2:fission_plasma_chamber",
  "mekanismt2:plasma_state_wiring",
  "mekanismt2:radiation_deflection_armor",
  "mekanismt2:quantum_mecha_protocol",
  "mekanismt2:quantum_wire",
  "mekanismt2:phase_coil",
  "mekanismt2:nano_repair_line",
  "mekanismt2:lockon_sensor_array",
  "mekanismt2:fission_fuel_rod",
  "mekanismt2:radiation_filter"
])
let CORE_IDS = new Set([
  "mekanismt2:quantum_shield_core",
  "mekanismt2:plasma_membrane_lung",
  "mekanismt2:overload_phase_spine"
])
let SHIELD_WEAVE_IDS = new Set([
  "mekanismt2:shield_weave_membrane"
])
let RADIATION_IDS = new Set([
  "mekanismt2:radiation_diffusion_core",
  "mekanismt2:radiation_filter"
])
let PLASMA_IDS = new Set([
  "mekanismt2:fission_plasma_chamber",
  "mekanismt2:plasma_state_wiring"
])
let FISSION_FUEL_IDS = new Set([
  "mekanismt2:fission_fuel_rod"
])
let PROTOCOL_IDS = new Set([
  "mekanismt2:quantum_mecha_protocol"
])
let RADIATION_BLOCKS = [
  "mekanism:radioactive_waste_barrel",
  "mekanismgenerators:fission_reactor_casing",
  "mekanismgenerators:fission_fuel_assembly",
  "mekanismgenerators:fission_reactor_logic_adapter",
  "mekanismgenerators:fission_reactor_port"
]

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE.current)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
function entityCacheId(entity) {
  return String(entity.uuid)
}
let getCounter = Runtime.getCounter
let setCounter = Runtime.setCounter
let getLinkCounter = Runtime.getLinkCounter
let setLinkCounter = Runtime.setLinkCounter
let spendResource = Runtime.spendResource
let resourceReady = Runtime.resourceReady
let addResource = Runtime.addResource
let consumeCounter = Runtime.consumeCounter
let getShieldPoint = Common.getShieldPoint
let getRuntimePoint = Common.getRuntimePoint
let installedSourceIds = Common.installedSourceIds
let hasMatching = Common.hasMatching
let countMatching = Common.countMatching
let inventoryCount = Common.inventoryCount
let hasNearbyBlock = Common.hasNearbyBlock
let targetInFront = Common.targetInFront
let damageTarget = Common.damageTarget
let addEffect = Common.addEffect

function getOepRuntime(player, pointId) {
  return getRuntimePoint(player, pointId)
}

function setOepRuntime(player, pointId, value, ticks) {
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', pointId), value, ticks)
}

function refreshPlayerState(player) {
  if (player) {
    OrganKubeJS.recompute(entityOf(player))
  }
}

function stateReady(player) {
  return !!player && hasMatching(installedSourceIds(player), SOURCE_IDS)
}

function syncOnline(player) {
  // The quantum sync cube is now a standalone Java block (organmekanism) that feeds
  // counter:organmekanism:mek_energy directly. "Sync online" therefore just means the
  // player carries a Mekanism core organ; energy availability is enforced separately by
  // resourceReady(player, cost) against the Java-fed energy pool.
  return !!player && hasMatching(installedSourceIds(player), CORE_IDS)
}

function shieldReady(player, amount) {
  return getShieldPoint(player, SHIELD_ID) >= amount
}

function spendShield(player, amount) {
  let used = OrganKubeJS.consumePoint(entityOf(player), SHIELD_KEY, Math.max(0, Math.floor(amount)))
  return used > 0
}

function plasmaOnline(player) {
  return !!player && getOepRuntime(player, PLASMA_KEY) > 0
}

function protocolOnline(player) {
  return !!player && getOepRuntime(player, PROTOCOL_KEY) > 0
}

function adjustedEnergyCost(player, baseCost) {
  if (plasmaOnline(player) && hasMatching(installedSourceIds(player), PLASMA_IDS)) {
    return Math.max(0, baseCost - 2)
  }
  return baseCost
}

function addRadiation(player, amount) {
  if (!player || amount <= 0) {
    return
  }
  let installed = installedSourceIds(player)
  let coreCount = countMatching(installed, RADIATION_IDS)
  let plasmaCount = countMatching(installed, PLASMA_IDS)
  let cap = Math.max(2, coreCount * 8 + plasmaCount * 4)
  let next = Math.min(cap, getCounter(player, RADIATION_KEY) + amount)
  setCounter(player, RADIATION_KEY, next)
  refreshPlayerState(player)
}

function consumeRadiation(player, amount) {
  let used = consumeCounter(player, RADIATION_KEY, amount)
  if (used > 0) {
    refreshPlayerState(player)
  }
  return used
}

function getBarrierCap(player) {
  let installed = installedSourceIds(player)
  return countMatching(installed, CORE_IDS) * 18 + countMatching(installed, SHIELD_WEAVE_IDS) * 12
}

function addShield(player, amount) {
  if (!player || amount <= 0) {
    return
  }
  let cap = getBarrierCap(player)
  let current = getShieldPoint(player, SHIELD_ID)
  let added = Math.min(amount, Math.max(0, cap - current))
  if (added > 0) {
    OrganKubeJS.addSourcePoint(entityOf(player), SHIELD_SOURCE, SHIELD_KEY, added)
    refreshPlayerState(player)
  }
}

function fuelReady(player) {
  return !!player && (inventoryCount(player, [FUEL_ITEM]) > 0 || getCounter(player, FUEL_COUNTER_KEY) > 0)
}

function consumeFuel(player) {
  if (consumeInventoryItem(player, FUEL_ITEM, 1)) {
    return true
  }
  return OrganKubeJS.consumePoint(entityOf(player), pointKey('counter', FUEL_COUNTER_KEY), 1) > 0
}

function fireMekEvent(player, type, target, amount) {
  let entity = entityOf(player)
  if (!entity) {
    return
  }
  let builder = RuntimeEvent.builder(type, entity)
  if (target) {
    builder.target(target)
  }
  if (amount != null) {
    builder.amount(Number(amount))
  }
  RuntimeEffectService.fireEvent(entity, builder.build())
}

function consumeInventoryItem(player, itemId, amount) {
  let inventory = entityOf(player).getInventory()
  for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
    let stack = inventory.getItem(slot)
    if (!stack || stack.isEmpty()) {
      continue
    }
    let id = String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
    if (id !== itemId) {
      continue
    }
    let used = Math.min(amount, stack.getCount())
    stack.shrink(used)
    if (stack.getCount() <= 0) {
      inventory.setItem(slot, ItemStack.EMPTY)
    }
    return true
  }
  return false
}

Common.mekanismT2SyncOnline = syncOnline
Common.mekanismT2ShieldReady = shieldReady
Common.mekanismT2SpendShield = spendShield
Common.mekanismT2PlasmaOnline = plasmaOnline
Common.mekanismT2ProtocolOnline = protocolOnline
Common.mekanismT2AdjustedEnergyCost = adjustedEnergyCost
Common.mekanismT2ConsumeInventoryItem = consumeInventoryItem

OrganKubejsEvents.predicate('mekanismT2_sync_online', event => {
  return Common.predicateResult(event, syncOnline(event.player))
})

OrganKubejsEvents.predicate('mekanismT2_radiation_online', event => {
  return Common.predicateResult(event, !!event.player && getCounter(event.player, RADIATION_KEY) > 0)
})

OrganKubejsEvents.predicate('mekanismT2_radiation_source_nearby', event => {
  return Common.predicateResult(event, !!event.player && syncOnline(event.player) && hasNearbyBlock(entityOf(event.player), RADIATION_BLOCKS, 8))
})

OrganKubejsEvents.predicate('mekanismT2_plasma_online', event => {
  return Common.predicateResult(event, plasmaOnline(event.player))
})

OrganKubejsEvents.predicate('mekanismT2_protocol_online', event => {
  return Common.predicateResult(event, protocolOnline(event.player))
})

OrganKubejsEvents.predicate('mekanismT2_has_fuel', event => {
  return Common.predicateResult(event, fuelReady(event.player))
})

OrganKubejsEvents.pointAction('mekanismT2_radiation_harvest', event => {
  let player = event.player
  if (!player || !syncOnline(player) || !resourceReady(player, 2)) {
    return 0
  }
  spendResource(player, 2)
  addRadiation(player, 2)
  return 1
})

OrganKubejsEvents.pointAction('mekanismT2_radiation_environment', event => {
  let player = event.player
  if (!player || !syncOnline(player) || !hasNearbyBlock(entityOf(player), RADIATION_BLOCKS, 8) || !resourceReady(player, 2)) {
    return 0
  }
  spendResource(player, 2)
  addRadiation(player, 1)
  return 1
})

OrganKubejsEvents.pointAction('mekanismT2_nano_repair', event => {
  let player = event.player
  if (!player || !syncOnline(player) || !resourceReady(player, 3)) {
    return 0
  }
  spendResource(player, 3)
  addShield(player, 2)
  return 1
})

OrganKubejsEvents.targetAction('mekanismT2_plasma_strike', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target) {
    return 0
  }
  if (!plasmaOnline(player)) {
    return 0
  }
  let bonus = 3 + countMatching(installedSourceIds(player), PLASMA_IDS)
  damageTarget(player, target, bonus, 0.3)
  return 1
})

OrganKubejsEvents.targetAction('mekanismT2_protocol_strike', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target) {
    return 0
  }
  if (!protocolOnline(player)) {
    return 0
  }
  let bonus = 2 + countMatching(installedSourceIds(player), PROTOCOL_IDS)
  damageTarget(player, target, bonus, 0.2)
  addEffect(target, MobEffects.GLOWING, 80, 0)
  return 1
})

OrganKubejsEvents.targetAction('mekanismT2_lockon_focus', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || !resourceReady(player, 2)) {
    return 0
  }
  spendResource(player, 2)
  setOepRuntime(player, LOCK_KEY, 1, 120)
  addEffect(target, MobEffects.GLOWING, 80, 0)
  return 1
})

OrganKubejsEvents.targetAction('mekanismT2_deflection_burn', event => {
  let player = event.player
  let target = entityOf(event.target)
  if (!player || !target || getCounter(player, RADIATION_KEY) <= 0) {
    return 0
  }
  consumeRadiation(player, 1)
  addEffect(target, MobEffects.WITHER, 50, 0)
  return 1
})

OrganKubejsEvents.skillCast('fission_plasma_chamber_cast', event => {
  let player = event.player
  if (!player || !stateReady(player) || !syncOnline(player)) {
    return false
  }
  if (getOepRuntime(player, PLASMA_COOLDOWN_KEY) > 0 || getOepRuntime(player, PLASMA_KEY) > 0) {
    return false
  }
  if (!shieldReady(player, 36) || !resourceReady(player, 25)) {
    return false
  }
  if (!fuelReady(player)) {
    return false
  }
  if (!spendShield(player, 36) || !spendResource(player, 25)) {
    return false
  }
  consumeFuel(player)
  setOepRuntime(player, PLASMA_KEY, 1, 120)
  setOepRuntime(player, PLASMA_COOLDOWN_KEY, 1, 240)
  refreshPlayerState(player)
  fireMekEvent(player, 'mekanismT2:plasma_window', null, 1)
  return true
})

OrganKubejsEvents.skillCast('quantum_mecha_protocol_cast', event => {
  let player = event.player
  if (!player || !stateReady(player) || !syncOnline(player)) {
    return false
  }
  if (getOepRuntime(player, PROTOCOL_COOLDOWN_KEY) > 0 || getOepRuntime(player, PROTOCOL_KEY) > 0) {
    return false
  }
  let readyWindow = getOepRuntime(player, LOCK_KEY) > 0
      || getCounter(player, RADIATION_KEY) > 0
      || getOepRuntime(player, NANO_KEY) > 0
  if (!readyWindow) {
    return false
  }
  if (!shieldReady(player, 18) || !resourceReady(player, 20)) {
    return false
  }
  if (!spendShield(player, 18) || !spendResource(player, 20)) {
    return false
  }
  setOepRuntime(player, PROTOCOL_KEY, 1, 160)
  setOepRuntime(player, PROTOCOL_COOLDOWN_KEY, 1, 220)
  refreshPlayerState(player)
  fireMekEvent(player, 'mekanismT2:protocol_window', null, 1)
  return true
})

PlayerEvents.tick(event => {
  let player = event.player
  if (!player) {
    return
  }
  let windowCache = global.mekanismT2WindowCache || (global.mekanismT2WindowCache = new Map())
  let entity = entityOf(player)
  let windowState = [
    getOepRuntime(player, PLASMA_KEY),
    getOepRuntime(player, PROTOCOL_KEY),
    getOepRuntime(player, LOCK_KEY),
    getOepRuntime(player, NANO_KEY),
    getCounter(player, RADIATION_KEY)
  ].join('|')
  let previousWindowState = windowCache.get(entityCacheId(entity))
  if (previousWindowState !== windowState) {
    windowCache.set(entityCacheId(entity), windowState)
    refreshPlayerState(player)
  }
  if (entity.tickCount % 20 === 0) {
    let fuelCache = global.mekanismT2FuelCache || (global.mekanismT2FuelCache = new Map())
    let fuelCap = countMatching(installedSourceIds(player), FISSION_FUEL_IDS) * 2
    let previousFuelCap = fuelCache.get(entityCacheId(entity))
    if (previousFuelCap == null || fuelCap > previousFuelCap) {
      let fuelBonus = previousFuelCap == null ? fuelCap : fuelCap - previousFuelCap
      setCounter(player, FUEL_COUNTER_KEY, getCounter(player, FUEL_COUNTER_KEY) + fuelBonus)
    }
    fuelCache.set(entityCacheId(entity), fuelCap)
    setCounter(player, FUEL_COUNTER_KEY, Math.min(fuelCap, getCounter(player, FUEL_COUNTER_KEY)))
    // Energy is now produced by the standalone organMekanism quantum sync cube block
    // (counter:organmekanism:mek_energy). The KubeJS fallback no longer scans the world
    // or injects energy; it only decays radiation once the stored energy runs out.
    if (getCounter(player, RESOURCE.current) <= 0 && getCounter(player, RADIATION_KEY) > 0) {
      consumeRadiation(player, 1)
    }
  }
  if (entity.tickCount % 80 === 0) {
    if (syncOnline(player)
        && hasMatching(installedSourceIds(player), RADIATION_IDS)
        && hasNearbyBlock(entity, RADIATION_BLOCKS, 8)
        && resourceReady(player, 2)) {
      spendResource(player, 2)
      addRadiation(player, 1)
    }
  }
})

})()
