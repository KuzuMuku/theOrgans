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

let DIR_KEY = 'vanillaOcean'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "ocean",
    "beach"
  ],
  "structures": [
    "minecraft:ocean_monument"
  ],
  "structure_radius": 10
}
let HOME_CALLBACK = 'vanillaOcean_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaOcean_system",
  "capacity": "kubejs:vanillaOcean_resonance_capacity",
  "current": "kubejs:vanillaOcean_resonance",
  "capacity_en": "Tide Pressure Capacity",
  "capacity_desc_en": "Maximum shared reserve for tide pressure.",
  "current_en": "Tide Pressure",
  "current_desc_en": "Shared tide pressure gathered by current, moisture and underwater pressure.",
  "capacity_zh": "潮压上限",
  "capacity_desc_zh": "潮压可积累的最大上限。",
  "current_zh": "潮压",
  "current_desc_zh": "由海流、湿润与水压共同积累的潮压。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaOcean_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:nature_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:tidal_ventricle",
  "kubejs:saltgill_lung",
  "kubejs:deepsea_liver",
  "kubejs:coral_boneplate",
  "kubejs:seacurrent_spleen",
  "kubejs:tidepressure_crown",
  "kubejs:wetgill_jowl",
  "kubejs:seamirror_iris",
  "kubejs:foam_kidney",
  "kubejs:farvoyage_flipper",
  "kubejs:kelp_spinal_cord",
  "kubejs:shellbell_cochlea",
  "kubejs:countercurrent_arm",
  "kubejs:tidefin_leg",
  "kubejs:bubblewave_throat",
  "kubejs:coralspike_fist",
  "kubejs:monument_refraction_eye",
  "kubejs:tidesound_fork_wrist",
  "kubejs:deeptide_scavenger_hand",
  "kubejs:coraltide_tail"
])
let CORELINE_IDS = new Set([
  "kubejs:tidal_ventricle",
  "kubejs:kelp_spinal_cord",
  "kubejs:coraltide_tail"
])
let SUPPORT_IDS = new Set([
  "kubejs:wetgill_jowl",
  "kubejs:shellbell_cochlea"
])
let TIDE_IDS = new Set([
  "kubejs:tidal_ventricle",
  "kubejs:saltgill_lung",
  "kubejs:foam_kidney"
])
let TEMPLE_IDS = new Set([
  "kubejs:monument_refraction_eye",
  "kubejs:coral_boneplate",
  "kubejs:seamirror_iris"
])
let SALVAGE_IDS = new Set([
  "kubejs:seacurrent_spleen",
  "kubejs:deeptide_scavenger_hand"
])
let WET_IDS = new Set([
  "kubejs:wetgill_jowl",
  "kubejs:farvoyage_flipper",
  "kubejs:tidefin_leg",
  "kubejs:foam_kidney"
])
let MANA_IDS = new Set([
  "kubejs:deepsea_liver"
])
let SPELL_IDS = new Set([
  "kubejs:saltgill_lung"
])
let CROWN_IDS = new Set([
  "kubejs:tidepressure_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:coral_boneplate"
])
let MOVEMENT_IDS = new Set([
  "kubejs:farvoyage_flipper",
  "kubejs:tidefin_leg"
])
let MELEE_IDS = new Set([
  "kubejs:countercurrent_arm",
  "kubejs:coralspike_fist",
  "kubejs:tidesound_fork_wrist"
])
let RANGED_IDS = new Set([
  "kubejs:seamirror_iris",
  "kubejs:monument_refraction_eye",
  "kubejs:bubblewave_throat"
])
let RESOURCE_IDS = new Set([
  "kubejs:seacurrent_spleen",
  "kubejs:deeptide_scavenger_hand"
])

function entityOf(player) {
  return player && player.minecraftEntity ? player.minecraftEntity : player
}

function pointKey(pointType, pointId) {
  return OrganKubeJS.pointKey(pointType, pointId)
}

function setSourcePointValue(player, sourceTag, key, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), sourceTag, key, Math.max(0, Math.floor(value)))
}

function getCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function getLinkCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function setCounter(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('counter', pointId), value)
}

function setLinkCounter(player, pointId, value) {
  setSourcePointValue(player, LINK_SOURCE, pointKey('counter', pointId), value)
}

function setLinkAttribute(player, attributeId, value) {
  setSourcePointValue(player, LINK_SOURCE, 'attribute:' + attributeId, value)
}

function getRuntimePoint(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'runtime', pointId))
}

function setRuntimePoint(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('runtime', pointId), value)
}

function consumeCounter(player, pointId, amount) {
  return Number(OrganKubeJS.consumeSourcePoint(entityOf(player), SYSTEM_SOURCE, pointKey('counter', pointId), Math.floor(amount)))
}

function resourceReady(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return true
  }
  return getCounter(player, RESOURCE.current) >= amount
}

function spendResource(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return 0
  }
  return consumeCounter(player, RESOURCE.current, amount)
}

function addResource(player, amount) {
  if (!RESOURCE || amount <= 0) {
    return
  }
  setCounter(player, RESOURCE.current, getCounter(player, RESOURCE.current) + amount)
}

function addEffect(entity, effect, duration, amplifier) {
  entity.addEffect(new MobEffectInstance(effect, duration, amplifier, false, false, true))
}

function installedSourceIds(player) {
  let found = []
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
  return found
}

function countMatching(installed, wanted) {
  let total = 0
  for (let i = 0; i < installed.length; i++) {
    if (wanted.has(installed[i])) {
      total++
    }
  }
  return total
}

function hasMatching(installed, wanted) {
  return countMatching(installed, wanted) > 0
}

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
  let tideCount = countMatching(installed, TIDE_IDS)
  let templeCount = countMatching(installed, TEMPLE_IDS)
  let salvageCount = countMatching(installed, SALVAGE_IDS)
  let wetCount = countMatching(installed, WET_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let tidePoint = tideCount > 0 ? manaCount + supportCount + movementCount : 0
  let templePoint = templeCount > 0 ? armorCount + countMatching(installed, RANGED_IDS) : 0
  let salvagePoint = salvageCount > 0 ? resourceCount + supportCount : 0
  let wetPoint = wetCount > 0 ? movementCount + supportCount : 0
  setLinkCounter(player, 'kubejs:vanillaOcean_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_tide_line', tidePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_temple_line', templePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_salvage_line', salvagePoint)
  setLinkCounter(player, 'kubejs:vanillaOcean_wet_line', wetPoint)
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

function isWet(player) {
  let entity = entityOf(player)
  try {
    return !!entity.isInWaterOrBubble() || !!entity.isInWaterRainOrBubble()
  } catch (ignored) {
  }
  try {
    return !!entity.isInWater()
  } catch (ignored2) {
  }
  return false
}

function isRainingHere(player) {
  let entity = entityOf(player)
  try {
    return !!entity.level.isRainingAt(entity.blockPosition())
  } catch (ignored) {
  }
  return false
}

function isTempleZone(player) {
  let entity = entityOf(player)
  return dimensionId(entity) === 'minecraft:overworld' && hasNearbyBlock(entity, [
    'minecraft:prismarine',
    'minecraft:prismarine_bricks',
    'minecraft:dark_prismarine',
    'minecraft:sea_lantern'
  ], 5)
}

function isSalvageZone(player) {
  let entity = entityOf(player)
  let biome = biomeId(entity)
  return (biome.indexOf('ocean') >= 0 || biome.indexOf('beach') >= 0) && hasNearbyBlock(entity, [
    'minecraft:chest',
    'minecraft:barrel',
    'minecraft:sand',
    'minecraft:gravel'
  ], 4)
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return isWet(player) || isRainingHere(player)
  })
}

let sqDistanceBetween = Common.sqDistanceBetween

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

let vanillaOceanPredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaOceanPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaOcean_set_major', event => {
  return vanillaOceanPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaOcean_resource_online', event => {
  return vanillaOceanPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaOcean_has_coreline', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_support', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_mana', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_spell', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_crown', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_armor', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_movement', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_resource', event => {
  return vanillaOceanPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_hunt', event => {
  if (!event.player) {
    return vanillaOceanPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaOceanPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaOcean_has_chase', event => {
  if (!event.player) {
    return vanillaOceanPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaOceanPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaOcean_tide_online', event => {
  return vanillaOceanPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaOcean_temple_online', event => {
  return vanillaOceanPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaOcean_salvage_online', event => {
  return vanillaOceanPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaOcean_salvage_window') > 0)
})

OrganKubejsEvents.predicate('vanillaOcean_wet_online', event => {
  return vanillaOceanPredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaOcean_tide_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaOcean_temple_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaOcean_salvage_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaOcean_wet_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let wet = isWet(player) || isRainingHere(player)
  let temple = isTempleZone(player)
  let salvage = isSalvageZone(player)
  setRuntimePoint(player, 'kubejs:vanillaOcean_tide_window', wet ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaOcean_temple_window', temple ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaOcean_salvage_window', salvage ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaOcean_wet_window', wet ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('bubblewave_throat_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 80 + getLinkCounter(player, 'kubejs:vanillaOcean_tide_line') * 20
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.MOVEMENT_SLOWDOWN, scaledDuration, 0)
  }
  return true
})

OrganKubejsEvents.skillCast('tidesound_fork_wrist_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let target = targetInFront(player, 5.0)
  if (!target) {
    return false
  }
  let scaledDamage = 10 + getLinkCounter(player, 'kubejs:vanillaOcean_wet_line') + getLinkCounter(player, 'kubejs:vanillaOcean_temple_line')
  spendResource(player, 12)
  damageTarget(player, target, scaledDamage, 1.0)
  return true
})

})()
