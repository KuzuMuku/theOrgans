;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let SYSTEM_SOURCE = 'kubejs_mek_system'
let RESOURCE_CURRENT = 'kubejs:mek_energy'
let SHIELD_ID = 'kubejs:mekanismT2_barrier'
let RADIATION_KEY = 'kubejs:mek_t2_radiation_layer'
let CORE_IDS = new Set([
  'mekanismt2:quantum_shield_core',
  'mekanismt2:plasma_membrane_lung',
  'mekanismt2:overload_phase_spine'
])
let DEFLECTION_IDS = new Set([
  'mekanismt2:radiation_deflection_armor'
])

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function getTypedPoint(player, pointType, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), pointType, pointId))
}

function getCounter(player, pointId) {
  return getTypedPoint(player, 'counter', pointId)
}

function getShieldPoint(player, pointId) {
  return getTypedPoint(player, 'shield', pointId)
}

function installedSourceIds(player) {
  let found = []
  try {
    let positions = OrganQueryService.getInstalledOrganPositions(entityOf(player))
    let iterator = positions.iterator()
    while (iterator.hasNext()) {
      let position = iterator.next()
      let stack = position.organ()
      if (!stack || stack.isEmpty()) {
        continue
      }
      found.push(String(BuiltInRegistries.ITEM.getKey(stack.getItem())))
    }
  } catch (ignored) {
  }
  return found
}

function hasMatching(installed, wanted) {
  for (let i = 0; i < installed.length; i++) {
    if (wanted.has(installed[i])) {
      return true
    }
  }
  return false
}

function syncOnline(player) {
  // Sync power now comes from the standalone organMekanism cube (energy pool); the
  // link-counter world-scan is gone. Require only a core organ here; energy sufficiency
  // is enforced by resourceReady below.
  return !!player && hasMatching(installedSourceIds(player), CORE_IDS)
}

function resourceReady(player, amount) {
  return getCounter(player, RESOURCE_CURRENT) >= amount
}

function spendResource(player, amount) {
  return Number(OrganKubeJS.consumeSourcePoint(
    entityOf(player),
    SYSTEM_SOURCE,
    pointKey('counter', RESOURCE_CURRENT),
    Math.floor(amount)
  ))
}

function setOepRuntime(player, pointId, value, ticks) {
  OrganKubeJS.setRuntimePoint(entityOf(player), pointKey('runtime', pointId), value, ticks)
}

function addEffect(entity, effect, duration, amplifier) {
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let target = event.getEntity()
  if (!(target instanceof PlayerClass) || target.getLevel().isClientSide()) {
    return
  }
  if (!hasMatching(installedSourceIds(target), DEFLECTION_IDS)) {
    return
  }
  let layers = getCounter(target, RADIATION_KEY)
  let shieldTotal = getShieldPoint(target, SHIELD_ID)
  if (layers <= 0 || shieldTotal <= 0 || !syncOnline(target) || !resourceReady(target, 2)) {
    return
  }
  let damaged = Number(event.getAmount())
  let absorbed = Math.max(1, Math.min(damaged * 0.25, layers * 1.5))
  event.setAmount(Math.max(0, damaged - absorbed))
  spendResource(target, 2)
  setOepRuntime(target, 'kubejs:mek_t2_deflection_burn', 1, 80)
  let source = event.getSource()
  let attackerEntity = source ? source.getDirectEntity() : null
  if (attackerEntity && attackerEntity instanceof LivingEntityClass && attackerEntity !== target) {
    addEffect(attackerEntity, MobEffects.WITHER, 50, 0)
  }
})

})()
