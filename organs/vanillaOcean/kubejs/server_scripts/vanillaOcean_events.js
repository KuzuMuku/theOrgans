;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let RuntimeEffectService = Java.loadClass('cn.kuzuanpa.organeffects.common.effect.RuntimeEffectService')
let RuntimeEvent = Java.loadClass('cn.kuzuanpa.organeffects.api.extension.OrganEffectsRuntimeEvent')

let SALVAGE_CHEST_BLOCKS = [
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:barrel',
  'aquamirae:frozen_chest'
]

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent.RightClickBlock', event => {
  let player = event.getEntity()
  if (!(player instanceof PlayerClass) || event.getLevel().isClientSide()) {
    return
  }
  let state = event.getLevel().getBlockState(event.getPos())
  let blockId = String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
  if (SALVAGE_CHEST_BLOCKS.indexOf(blockId) < 0) {
    return
  }
  let entity = entityOf(player)
  let builder = RuntimeEvent.builder('vanillaOcean:chest_interact', entity).blockState(state)
  RuntimeEffectService.fireEvent(entity, builder.build())
})
})()
