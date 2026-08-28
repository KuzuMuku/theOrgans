;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

function installedIds(player) {
  try {
    return Common.installedSourceIds(player)
  } catch (ignored) {
    return []
  }
}

function hasT1Organ(player, organId) {
  let ids = installedIds(player)
  return ids.indexOf('kubejs:' + organId) >= 0
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerEvent$ItemSmeltedEvent', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass) || player.level.isClientSide()) {
    return
  }
  let builder = RuntimeEvent.builder('mekanismT1:refinery', player)
    .itemStack(event.getSmelting())
    .amount(1)
  RuntimeEffectService.fireEvent(player, builder.build())
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent', event => {
  let target = event.getEntity()
  let source = event.getSource()
  let attacker = source && source.actual ? source.actual : null
  if (!(attacker instanceof PlayerClass) || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return
  }
  if (!hasT1Organ(attacker, 'heat_blade_arm')) {
    return
  }
  let heatCycle = Number(OrganKubeJS.getTypedPoint(attacker, 'runtime', 'kubejs:mek_t1_heat_cycle'))
  if (heatCycle <= 0) {
    return
  }
  let builder = RuntimeEvent.builder('mekanismT1:heat_sear', attacker)
    .target(target)
    .amount(Number(event.getAmount()))
  RuntimeEffectService.fireEvent(attacker, builder.build())
})
})()
