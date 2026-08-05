;(function () {
let BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
let HolderSet = Java.loadClass('net.minecraft.core.HolderSet')
let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let DIR_KEY = 'vanillaNether'
let HOME = {
  "dimensions": [
    "minecraft:the_nether"
  ],
  "dimension_home": true,
  "biome_keywords": [
    "nether",
    "basalt",
    "soul",
    "crimson",
    "warped"
  ],
  "structures": [
    "minecraft:fortress",
    "minecraft:bastion_remnant"
  ],
  "structure_radius": 10
}
let HOME_CALLBACK = 'vanillaNether_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaNether_system",
  "capacity": "kubejs:vanillaNether_resonance_capacity",
  "current": "kubejs:vanillaNether_resonance",
  "capacity_en": "Sacrifice Embers Capacity",
  "capacity_desc_en": "Maximum shared reserve for sacrifice embers.",
  "current_en": "Sacrifice Embers",
  "current_desc_en": "Shared infernal sacrifice gathered by heat, injury and burning pressure.",
  "capacity_zh": "献祭余烬上限",
  "capacity_desc_zh": "献祭余烬可积累的最大上限。",
  "current_zh": "献祭余烬",
  "current_desc_zh": "由高热、受击与燃烧压力共同积累的献祭余烬。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaNether_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:fire_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:infernal_hearth",
  "kubejs:sacrifice_spine_furnace",
  "kubejs:obsidian_chest_cavity",
  "kubejs:ember_liver",
  "kubejs:spiritflame_lung",
  "kubejs:overload_crown",
  "kubejs:ash_spleen",
  "kubejs:slag_reflux_gland",
  "kubejs:soulsand_lung_sac",
  "kubejs:netherwart_liver",
  "kubejs:furnaceslag_kidneysheath",
  "kubejs:blackstone_spleen_membrane",
  "kubejs:blazefire_arm",
  "kubejs:scorch_throat_sac",
  "kubejs:lava_tendon",
  "kubejs:emberstride_ankle",
  "kubejs:ash_iris",
  "kubejs:sacrifice_fire_fist",
  "kubejs:inferno_shoulderplate",
  "kubejs:hellfire_tailbone",
  "kubejs:furnace_kneering",
  "kubejs:blackflame_throat_pipe",
  "kubejs:fortress_bone_key",
  "kubejs:bastion_hoof_lock",
  "kubejs:ancient_relic_hand",
  "kubejs:gilded_recovery_claw",
  "kubejs:smeltfist_subcore",
  "kubejs:cataclysm_magma_core",
  "kubejs:piglin_contract_liver",
  "kubejs:ashvale_lung"
])
let CORELINE_IDS = new Set([
  "kubejs:infernal_hearth",
  "kubejs:cataclysm_magma_core",
  "kubejs:sacrifice_spine_furnace"
])
let SUPPORT_IDS = new Set([
  "kubejs:soulsand_lung_sac",
  "kubejs:hellfire_tailbone",
  "kubejs:furnace_kneering",
  "kubejs:smeltfist_subcore"
])
let HEAT_IDS = new Set([
  "kubejs:infernal_hearth",
  "kubejs:obsidian_chest_cavity",
  "kubejs:spiritflame_lung",
  "kubejs:blazefire_arm",
  "kubejs:inferno_shoulderplate",
  "kubejs:blackflame_throat_pipe"
])
let SACRIFICE_IDS = new Set([
  "kubejs:sacrifice_spine_furnace",
  "kubejs:slag_reflux_gland",
  "kubejs:sacrifice_fire_fist",
  "kubejs:overload_crown",
  "kubejs:smeltfist_subcore"
])
let FORTRESS_IDS = new Set([
  "kubejs:fortress_bone_key",
  "kubejs:bastion_hoof_lock",
  "kubejs:ancient_relic_hand",
  "kubejs:gilded_recovery_claw"
])
let MANA_IDS = new Set([
  "kubejs:ember_liver",
  "kubejs:netherwart_liver",
  "kubejs:piglin_contract_liver"
])
let SPELL_IDS = new Set([
  "kubejs:spiritflame_lung",
  "kubejs:ashvale_lung"
])
let CROWN_IDS = new Set([
  "kubejs:overload_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:obsidian_chest_cavity",
  "kubejs:furnaceslag_kidneysheath"
])
let MOVEMENT_IDS = new Set([
  "kubejs:lava_tendon",
  "kubejs:emberstride_ankle",
  "kubejs:bastion_hoof_lock"
])
let MELEE_IDS = new Set([
  "kubejs:blazefire_arm",
  "kubejs:inferno_shoulderplate",
  "kubejs:sacrifice_fire_fist"
])
let RANGED_IDS = new Set([
  "kubejs:ash_iris",
  "kubejs:scorch_throat_sac",
  "kubejs:blackflame_throat_pipe"
])
let RESOURCE_IDS = new Set([
  "kubejs:ash_spleen",
  "kubejs:blackstone_spleen_membrane",
  "kubejs:fortress_bone_key",
  "kubejs:ancient_relic_hand",
  "kubejs:gilded_recovery_claw"
])

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE ? RESOURCE.current : null)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
let getTypedPoint = Common.getTypedPoint
let setSourcePointValue = Common.setSourcePointValue
let getCounter = Runtime.getCounter
let getRuntimePoint = Runtime.getRuntimePoint
let getLinkCounter = Runtime.getLinkCounter
let setCounter = Runtime.setCounter
let setRuntimePoint = Runtime.setRuntimePoint
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
  let sacrificeCount = countMatching(installed, SACRIFICE_IDS)
  let fortressCount = countMatching(installed, FORTRESS_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let heatPoint = heatCount
  let sacrificePoint = sacrificeCount
  let fortressPoint = fortressCount
  setLinkCounter(player, 'kubejs:vanillaNether_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaNether_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_heat_line', heatPoint)
  setLinkCounter(player, 'kubejs:vanillaNether_sacrifice_line', sacrificePoint)
  setLinkCounter(player, 'kubejs:vanillaNether_fortress_line', fortressPoint)
  setLinkAttribute(player, 'minecraft:armor_toughness', framePoint)
  setLinkAttribute(player, 'minecraft:attack_damage', huntPoint)
  setLinkAttribute(player, 'irons_spellbooks:cooldown_reduction', cadencePoint)
  setLinkAttribute(player, 'irons_spellbooks:max_mana', weavePoint * 10)
  if (SCHOOL_POWER_ATTRIBUTE) {
    setLinkAttribute(player, SCHOOL_POWER_ATTRIBUTE, weavePoint)
  }
}

function biomeId(entity) {
  try {
    let holder = entity.level.getBiome(entity.blockPosition())
    let key = holder.unwrapKey()
    if (key.isPresent()) {
      return String(key.get().location())
    }
  } catch (ignored) {
  }
  return String(entity.level.getBiome(entity.blockPosition()))
}

function cleanDimensionId(value) {
  if (value == null) {
    return ''
  }
  let text = String(value)
  let matches = text.match(/[a-z0-9_.-]+:[a-z0-9_./-]+/g)
  return matches && matches.length > 0 ? matches[matches.length - 1] : text
}

function dimensionId(entity) {
  try {
    let id = cleanDimensionId(entity.level.dimension().location())
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.dimension)
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.dimensionKey)
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  try {
    let id = cleanDimensionId(entity.level.getDimension())
    if (id) {
      return id
    }
  } catch (ignored) {
  }
  return ''
}

function structureCacheKey(entity, structureIds, radiusChunks) {
  let pos = entity.blockPosition()
  return dimensionId(entity) + '@' + (pos.getX() >> 4) + ',' + (pos.getZ() >> 4) + '/' + structureIds.join('|') + '/' + radiusChunks
}

function hasNearbyStructure(entity, structureIds, radiusChunks) {
  if (!structureIds || structureIds.length === 0) {
    return false
  }
  let tick = Number(entity.tickCount)
  let cacheKey = structureCacheKey(entity, structureIds, radiusChunks)
  let cached = HOME_STRUCTURE_CACHE.get(cacheKey)
  if (cached && cached.expireAt > tick) {
    return cached.value
  }
  let matched = false
  try {
    let registry = entity.level.registryAccess().registryOrThrow(Registries.STRUCTURE)
    for (let i = 0; i < structureIds.length; i++) {
      let location = ResourceLocation.tryParse(structureIds[i])
      if (!location) {
        continue
      }
      let key = ResourceKey.create(Registries.STRUCTURE, location)
      let holder = registry.getHolder(key)
      if (!holder.isPresent()) {
        continue
      }
      let pair = entity.level.getChunkSource().getGenerator().findNearestMapStructure(entity.level, HolderSet.direct(holder.get()), entity.blockPosition(), radiusChunks, false)
      if (pair != null) {
        matched = true
        break
      }
    }
  } catch (ignored) {
  }
  HOME_STRUCTURE_CACHE.set(cacheKey, { expireAt: tick + 100, value: matched })
  return matched
}

function entityTypeId(entity) {
  try {
    return String(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()))
  } catch (ignored) {
    return ''
  }
}

function hasNearbyBlock(entity, ids, radius) {
  if (!ids || ids.length === 0) {
    return false
  }
  let pos = entity.blockPosition()
  for (let x = -radius; x <= radius; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -radius; z <= radius; z++) {
        let state = entity.level.getBlockState(new BlockPos(pos.getX() + x, pos.getY() + y, pos.getZ() + z))
        let blockId = String(BuiltInRegistries.BLOCK.getKey(state.getBlock()))
        if (ids.indexOf(blockId) >= 0) {
          return true
        }
      }
    }
  }
  return false
}

function countNearbyEntityTypes(entity, ids, radius) {
  if (!ids || ids.length === 0) {
    return 0
  }
  let total = 0
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || target === entity) {
      continue
    }
    if (ids.indexOf(entityTypeId(target)) >= 0) {
      total++
    }
  }
  return total
}

function inventoryCount(player, ids) {
  if (!ids || ids.length === 0) {
    return 0
  }
  let total = 0
  let inventory = entityOf(player).getInventory()
  for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
    let stack = inventory.getItem(slot)
    if (!stack || stack.isEmpty()) {
      continue
    }
    let itemId = String(BuiltInRegistries.ITEM.getKey(stack.getItem()))
    if (ids.indexOf(itemId) >= 0) {
      total += Number(stack.getCount())
    }
  }
  return total
}

function homeState(player) {
  let entity = entityOf(player)
  let dim = dimensionId(entity)
  let dimensionMatch = !!HOME.dimension_home && HOME.dimensions && HOME.dimensions.indexOf(dim) >= 0
  let biomeMatch = false
  let structureMatch = false
  let biome = biomeId(entity)
  if (HOME.biome_keywords) {
    for (let i = 0; i < HOME.biome_keywords.length; i++) {
      if (biome.indexOf(HOME.biome_keywords[i]) >= 0) {
        biomeMatch = true
        break
      }
    }
  }
  structureMatch = hasNearbyStructure(entity, HOME.structures || [], HOME.structure_radius || 8)
  return {
    dimension: dimensionMatch,
    biome: biomeMatch,
    structure: structureMatch,
    final: dimensionMatch || biomeMatch || structureMatch
  }
}

function homeMatch(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:the_nether' || entity.isOnFire()
}

function sqDistanceBetween(a, b) {
  let dx = Number(a.getX()) - Number(b.getX())
  let dy = Number(a.getY()) - Number(b.getY())
  let dz = Number(a.getZ()) - Number(b.getZ())
  return dx * dx + dy * dy + dz * dz
}

function targetsSortedByDistance(player, radius) {
  let entity = entityOf(player)
  let targets = []
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || !(target instanceof LivingEntityClass) || target === entity || !target.isAlive()) {
      continue
    }
    targets.push(target)
  }
  return targets.sort((a, b) => sqDistanceBetween(entity, a) - sqDistanceBetween(entity, b))
}

function targetInFront(player, radius) {
  let entity = entityOf(player)
  let look = entity.getLookAngle()
  let targets = targetsSortedByDistance(player, radius)
  let best = null
  let score = -1000
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    let dx = Number(target.getX()) - Number(entity.getX())
    let dz = Number(target.getZ()) - Number(entity.getZ())
    let length = Math.max(0.01, Math.sqrt(dx * dx + dz * dz))
    let dot = dx / length * Number(look.x()) + dz / length * Number(look.z())
    if (dot > score) {
      score = dot
      best = target
    }
  }
  return score > -0.15 ? best : null
}

function damageTarget(player, target, amount, knockbackStrength) {
  let entity = entityOf(player)
  if (!target || !(target instanceof LivingEntityClass) || !target.isAlive()) {
    return false
  }
  let before = Number(target.getHealth())
  target.setHealth(Math.max(0, before - amount))
  if (target.isAlive() && knockbackStrength > 0) {
    target.knockback(knockbackStrength, entity.getX() - target.getX(), entity.getZ() - target.getZ())
  }
  return Number(target.getHealth()) < before
}

function isLowHealth(player) {
  let entity = entityOf(player)
  return Number(entity.getHealth()) <= Number(entity.getMaxHealth()) * 0.6
}

function isHeatZone(player) {
  return homeMatch(player)
}

function isFortressZone(player) {
  let entity = entityOf(player)
  if (hasNearbyBlock(entity, ["minecraft:nether_bricks", "minecraft:red_nether_bricks", "minecraft:polished_blackstone_bricks", "minecraft:gold_block", "minecraft:nether_wart_block"], 5)) {
    return true
  }
  return countNearbyEntityTypes(entity, [
    "minecraft:blaze",
    "minecraft:wither_skeleton",
    "minecraft:piglin",
    "minecraft:piglin_brute",
    "minecraft:hoglin",
    "minecraft:magma_cube"
  ], 10) > 0
}

function vanillaNetherPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaNetherPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_set_major', event => {
  return vanillaNetherPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaNether_resource_online', event => {
  return vanillaNetherPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaNether_has_coreline', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_support', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_mana', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_spell', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_crown', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_armor', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_movement', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_resource', event => {
  return vanillaNetherPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_hunt', event => {
  if (!event.player) {
    return vanillaNetherPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaNetherPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaNether_has_chase', event => {
  if (!event.player) {
    return vanillaNetherPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaNetherPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaNether_heat_online', event => {
  return vanillaNetherPredicateResult(event, !!event.player && isHeatZone(event.player))
})

OrganKubejsEvents.predicate('vanillaNether_sacrifice_ready', event => {
  return vanillaNetherPredicateResult(event, !!event.player && (isLowHealth(event.player) || getCounter(event.player, RESOURCE.current) >= 16))
})

OrganKubejsEvents.predicate('vanillaNether_ember_online', event => {
  return vanillaNetherPredicateResult(event, !!event.player && (entityOf(event.player).isOnFire() || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaNether_fortress_online', event => {
  return vanillaNetherPredicateResult(event, !!event.player && isFortressZone(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaNether_heat_cycle', 0)
    setRuntimePoint(player, 'kubejs:vanillaNether_sacrifice_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaNether_fortress_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  setRuntimePoint(player, 'kubejs:vanillaNether_heat_cycle', isHeatZone(player) ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaNether_sacrifice_window', (isLowHealth(player) || current >= 16) ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaNether_fortress_window', isFortressZone(player) ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('scorch_throat_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 80 + getLinkCounter(player, 'kubejs:vanillaNether_spell_weave') * 20 + getLinkCounter(player, 'kubejs:vanillaNether_heat_line') * 10
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WITHER, scaledDuration, 0)
  }
  return true
})

OrganKubejsEvents.skillCast('sacrifice_fire_fist_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  let scaledDamage = 12 + getLinkCounter(player, 'kubejs:vanillaNether_hunt_link') + getLinkCounter(player, 'kubejs:vanillaNether_sacrifice_line')
  spendResource(player, 12)
  damageTarget(player, target, scaledDamage, 1.2)
  return true
})

OrganKubejsEvents.skillCast('blackflame_throat_pipe_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 11.0)
  if (!target) {
    return false
  }
  let scaledDamage = 10 + getLinkCounter(player, 'kubejs:vanillaNether_spell_weave') + getLinkCounter(player, 'kubejs:vanillaNether_heat_line')
  let scaledDuration = 100 + getLinkCounter(player, 'kubejs:vanillaNether_spell_weave') * 20
  spendResource(player, 12)
  damageTarget(player, target, scaledDamage, 0.2)
  addEffect(target, MobEffects.WITHER, scaledDuration, 0)
  return true
})

})()
