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

let DIR_KEY = 'vanillaSnow'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "snow",
    "frozen",
    "ice_spikes",
    "grove"
  ],
  "structures": [
    "minecraft:igloo"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaSnow_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaSnow_system",
  "capacity": "kubejs:vanillaSnow_resonance_capacity",
  "current": "kubejs:vanillaSnow_resonance",
  "capacity_en": "Frost Pressure Capacity",
  "capacity_desc_en": "Maximum shared reserve for frost pressure.",
  "current_en": "Frost Pressure",
  "current_desc_en": "Shared frost pressure gathered by cold contact and delayed retaliation.",
  "capacity_zh": "霜压上限",
  "capacity_desc_zh": "霜压可积累的最大上限。",
  "current_zh": "霜压",
  "current_desc_zh": "由寒冷接触与迟滞反击共同积累的霜压。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaSnow_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:ice_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:frostseal_ventricle",
  "kubejs:frozensoil_chest_membrane",
  "kubejs:birchmarrow_liver",
  "kubejs:icecrystal_lung",
  "kubejs:frostlight_crown",
  "kubejs:snowhide_spleen",
  "kubejs:icechip_arm",
  "kubejs:snowblind_iris",
  "kubejs:frosthoof_tendon",
  "kubejs:freezebreak_sheath"
])
let CORELINE_IDS = new Set([
  "kubejs:frostseal_ventricle"
])
let SUPPORT_IDS = new Set([
  "kubejs:freezebreak_sheath"
])
let FROST_IDS = new Set([
  "kubejs:frostseal_ventricle",
  "kubejs:frozensoil_chest_membrane",
  "kubejs:frostlight_crown"
])
let SHELL_IDS = new Set([
  "kubejs:frostseal_ventricle",
  "kubejs:frozensoil_chest_membrane",
  "kubejs:freezebreak_sheath"
])
let CRACK_IDS = new Set([
  "kubejs:icechip_arm",
  "kubejs:freezebreak_sheath",
  "kubejs:frosthoof_tendon"
])
let WHITEOUT_IDS = new Set([
  "kubejs:snowblind_iris",
  "kubejs:icecrystal_lung",
  "kubejs:frostlight_crown"
])
let MANA_IDS = new Set([
  "kubejs:birchmarrow_liver"
])
let SPELL_IDS = new Set([
  "kubejs:icecrystal_lung"
])
let CROWN_IDS = new Set([
  "kubejs:frostlight_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:frozensoil_chest_membrane"
])
let MOVEMENT_IDS = new Set([
  "kubejs:frosthoof_tendon"
])
let MELEE_IDS = new Set([
  "kubejs:icechip_arm"
])
let RANGED_IDS = new Set([
  "kubejs:snowblind_iris"
])
let RESOURCE_IDS = new Set([
  "kubejs:snowhide_spleen"
])

let Runtime = Common.createRuntimeTools(SYSTEM_SOURCE, LINK_SOURCE, RESOURCE ? RESOURCE.current : null)
let entityOf = Common.entityOf
let pointKey = Common.pointKey
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
  let frostCount = countMatching(installed, FROST_IDS)
  let shellCount = countMatching(installed, SHELL_IDS)
  let crackCount = countMatching(installed, CRACK_IDS)
  let whiteoutCount = countMatching(installed, WHITEOUT_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let frostPoint = frostCount > 0 ? corelineCount + armorCount + crownCount : 0
  let shellPoint = shellCount > 0 ? armorCount + corelineCount : 0
  let crackPoint = crackCount > 0 ? huntCount + movementCount : 0
  let whiteoutPoint = whiteoutCount > 0 ? spellCount + crownCount + huntCount : 0
  setLinkCounter(player, 'kubejs:vanillaSnow_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_frost_line', frostPoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_shell_line', shellPoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_crack_line', crackPoint)
  setLinkCounter(player, 'kubejs:vanillaSnow_whiteout_line', whiteoutPoint)
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

function isSnowingHere(player) {
  let entity = entityOf(player)
  try {
    return !!entity.level.isRainingAt(entity.blockPosition())
  } catch (ignored) {
  }
  return false
}

function hasSnowGround(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:snow_block',
    'minecraft:powder_snow',
    'minecraft:ice',
    'minecraft:packed_ice',
    'minecraft:blue_ice'
  ], 5)
}

function lowMotion(player) {
  let entity = entityOf(player)
  try {
    let movement = entity.getDeltaMovement()
    return Math.abs(Number(movement.x())) + Math.abs(Number(movement.z())) < 0.04
  } catch (ignored) {
  }
  return false
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
  let state = homeState(player)
  return state.final || isSnowingHere(player) || hasSnowGround(player)
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

function vanillaSnowPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaSnowPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_set_major', event => {
  return vanillaSnowPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaSnow_resource_online', event => {
  return vanillaSnowPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaSnow_has_coreline', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_support', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_mana', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_spell', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_crown', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_armor', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_movement', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_resource', event => {
  return vanillaSnowPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_hunt', event => {
  if (!event.player) {
    return vanillaSnowPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSnowPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaSnow_has_chase', event => {
  if (!event.player) {
    return vanillaSnowPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSnowPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaSnow_frost_online', event => {
  return vanillaSnowPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_shell_online', event => {
  return vanillaSnowPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSnow_crack_ready', event => {
  return vanillaSnowPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSnow_crack_window') > 0)
})

OrganKubejsEvents.predicate('vanillaSnow_whiteout_online', event => {
  return vanillaSnowPredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaSnow_frost_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSnow_shell_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSnow_crack_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaSnow_whiteout_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let frost = homeMatch(player) || isSnowingHere(player)
  let shell = (homeMatch(player) && lowMotion(player)) || hasSnowGround(player)
  let crack = hasSnowGround(player)
  let whiteout = frost && hasSnowGround(player)
  setRuntimePoint(player, 'kubejs:vanillaSnow_frost_window', frost ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSnow_shell_window', shell ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSnow_crack_window', crack ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaSnow_whiteout_window', whiteout ? 1 : 0)
  applyLinearLinks(player)
})


})()
