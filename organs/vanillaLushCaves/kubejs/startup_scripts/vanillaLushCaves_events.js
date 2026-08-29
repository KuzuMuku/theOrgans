;(function () {
let PlayerClass = Java.loadClass('net.minecraft.world.entity.player.Player')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let GLOW_BED_IDS = new Set([
  'kubejs:glow_bed'
])
let FLOWERS = global.vanillaLushCavesFlowers || (global.vanillaLushCavesFlowers = {})

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function dimensionId(entity) {
  try {
    return String(entity.level.dimension().location())
  } catch (ignored) {
  }
  try {
    return String(entity.level.dimension)
  } catch (ignored2) {
  }
  return ''
}

function sameDimensionEntity(entityA, entityB) {
  return dimensionId(entityA) === dimensionId(entityB)
}

function distanceSqFromState(state, entity) {
  let dx = Number(entity.getX()) - Number(state.x)
  let dy = Number(entity.getY()) - Number(state.y)
  let dz = Number(entity.getZ()) - Number(state.z)
  return dx * dx + dy * dy + dz * dz
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

ForgeEvents.onEvent('io.redspace.ironsspellbooks.api.events.SpellDamageEvent', event => {
  let source = event.getSpellDamageSource()
  if (!source) {
    return
  }
  let caster = source.actual
  if (!(caster instanceof PlayerClass) || !hasMatching(installedSourceIds(caster), GLOW_BED_IDS)) {
    return
  }
  let spell = source.spell()
  if (!spell || !spell.getSchoolType() || String(spell.getSchoolType().getId()) !== 'irons_spellbooks:nature') {
    return
  }
  let player = caster
  let state = FLOWERS[String(entityOf(player).uuid)]
  if (!state) {
    return
  }
  let target = event.getEntity()
  if (!target || !sameDimensionEntity(target, entityOf(player)) || distanceSqFromState(state, target) > state.radius * state.radius) {
    return
  }
  event.setAmount(Number(event.getAmount()) + 2)
})

})()
