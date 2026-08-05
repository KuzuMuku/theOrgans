;(function () {
let LivingEntityClass = Java.loadClass('net.minecraft.world.entity.LivingEntity')
let MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
let MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
let BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
let Registries = Java.loadClass('net.minecraft.core.registries.Registries')
let HolderSet = Java.loadClass('net.minecraft.core.HolderSet')
let ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
let ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
let OrganQueryService = Java.loadClass('cn.kuzuanpa.organapi.api.query.OrganQueryService')

let DIR_KEY = 'vanillaSculk'
let HOME = {
  "dimensions": [
    "deeperdarker:otherside"
  ],
  "dimension_home": true,
  "biome_keywords": [
    "deep_dark",
    "deepdark",
    "sculk"
  ],
  "structures": [
    "minecraft:ancient_city"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaSculk_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaSculk_system",
  "capacity": "kubejs:vanillaSculk_resonance_capacity",
  "current": "kubejs:vanillaSculk_resonance",
  "capacity_en": "Echo Reserve Capacity",
  "capacity_desc_en": "Maximum shared reserve for echo reserve.",
  "current_en": "Echo Reserve",
  "current_desc_en": "Shared echo reserve gathered by silence, vibration and deep-dark pressure.",
  "capacity_zh": "回响储能上限",
  "capacity_desc_zh": "回响储能可积累的最大上限。",
  "current_zh": "回响储能",
  "current_desc_zh": "由静默、震动与深暗压力共同积累的回响储能。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaSculk_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:ender_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:echo_core",
  "kubejs:listening_lung",
  "kubejs:gloomvein_liver",
  "kubejs:warden_boneplate",
  "kubejs:silence_crown",
  "kubejs:echo_cochlea",
  "kubejs:darkvision_iris",
  "kubejs:stealthshock_sole",
  "kubejs:sensor_subbrain",
  "kubejs:resonance_spine",
  "kubejs:gloomshell_spleen",
  "kubejs:echo_marrow",
  "kubejs:resonant_kidneysheath",
  "kubejs:otherdeep_float_membrane",
  "kubejs:deepchamber_sac",
  "kubejs:latentwave_arm",
  "kubejs:sensor_throat_sac",
  "kubejs:silent_arrow_gland",
  "kubejs:tremor_tail",
  "kubejs:ancient_city_step_leg",
  "kubejs:wavefront_forehead",
  "kubejs:conduction_fork_joint",
  "kubejs:deepheart_remnant",
  "kubejs:ancient_jar_hand",
  "kubejs:abyss_hunter_membrane"
])
let CORELINE_IDS = new Set([
  "kubejs:echo_core",
  "kubejs:resonance_spine"
])
let SUPPORT_IDS = new Set([
  "kubejs:echo_cochlea",
  "kubejs:sensor_subbrain",
  "kubejs:otherdeep_float_membrane",
  "kubejs:tremor_tail",
  "kubejs:abyss_hunter_membrane"
])
let SILENCE_IDS = new Set([
  "kubejs:echo_core",
  "kubejs:listening_lung",
  "kubejs:stealthshock_sole",
  "kubejs:ancient_city_step_leg"
])
let MARK_IDS = new Set([
  "kubejs:echo_cochlea",
  "kubejs:darkvision_iris",
  "kubejs:silent_arrow_gland",
  "kubejs:wavefront_forehead",
  "kubejs:conduction_fork_joint"
])
let OTHERDEEP_IDS = new Set([
  "kubejs:otherdeep_float_membrane",
  "kubejs:deepheart_remnant",
  "kubejs:abyss_hunter_membrane",
  "kubejs:deepchamber_sac"
])
let MANA_IDS = new Set([
  "kubejs:gloomvein_liver",
  "kubejs:deepchamber_sac"
])
let SPELL_IDS = new Set([
  "kubejs:listening_lung"
])
let CROWN_IDS = new Set([
  "kubejs:silence_crown",
  "kubejs:wavefront_forehead"
])
let ARMOR_IDS = new Set([
  "kubejs:warden_boneplate",
  "kubejs:resonant_kidneysheath"
])
let MOVEMENT_IDS = new Set([
  "kubejs:stealthshock_sole",
  "kubejs:ancient_city_step_leg"
])
let MELEE_IDS = new Set([
  "kubejs:latentwave_arm",
  "kubejs:conduction_fork_joint"
])
let RANGED_IDS = new Set([
  "kubejs:darkvision_iris",
  "kubejs:silent_arrow_gland",
  "kubejs:sensor_throat_sac"
])
let RESOURCE_IDS = new Set([
  "kubejs:gloomshell_spleen",
  "kubejs:ancient_jar_hand"
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

function setSourcePointValue(player, sourceTag, key, value) {
  OrganKubeJS.setSourcePoint(entityOf(player), sourceTag, key, Math.max(0, Math.floor(value)))
}

function getCounter(player, pointId) {
  return getTypedPoint(player, 'counter', pointId)
}

function getRuntimePoint(player, pointId) {
  return getTypedPoint(player, 'runtime', pointId)
}

function getLinkCounter(player, pointId) {
  return Number(OrganKubeJS.getTypedPoint(entityOf(player), 'counter', pointId))
}

function setCounter(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('counter', pointId), value)
}

function setRuntimePoint(player, pointId, value) {
  setSourcePointValue(player, SYSTEM_SOURCE, pointKey('runtime', pointId), value)
}

function setLinkCounter(player, pointId, value) {
  setSourcePointValue(player, LINK_SOURCE, pointKey('counter', pointId), value)
}

function setLinkAttribute(player, attributeId, value) {
  setSourcePointValue(player, LINK_SOURCE, 'attribute:' + attributeId, value)
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
  let silenceCount = countMatching(installed, SILENCE_IDS)
  let markCount = countMatching(installed, MARK_IDS)
  let otherdeepCount = countMatching(installed, OTHERDEEP_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let silencePoint = silenceCount
  let markPoint = markCount
  let otherdeepPoint = otherdeepCount
  setLinkCounter(player, 'kubejs:vanillaSculk_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_silence_line', silencePoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_mark_line', markPoint)
  setLinkCounter(player, 'kubejs:vanillaSculk_otherdeep_line', otherdeepPoint)
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
  let state = homeState(player)
  let entity = entityOf(player)
  return state.final || entity.isShiftKeyDown() || lightLevel(entity) <= 7
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

function lightLevel(entity) {
  try {
    return Number(entity.level.getMaxLocalRawBrightness(entity.blockPosition()))
  } catch (ignored) {
    return 15
  }
}

function isSilentZone(player) {
  return homeMatch(player)
}

function vanillaSculkPredicateResult(event, value) {
  return event.success(!!value)
}

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaSculkPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaSculk_set_major', event => {
  return vanillaSculkPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaSculk_resource_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaSculk_has_coreline', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_support', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_mana', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_spell', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_crown', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_armor', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_movement', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_resource', event => {
  return vanillaSculkPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_hunt', event => {
  if (!event.player) {
    return vanillaSculkPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSculkPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaSculk_has_chase', event => {
  if (!event.player) {
    return vanillaSculkPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaSculkPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaSculk_silence_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && isSilentZone(event.player))
})

OrganKubejsEvents.predicate('vanillaSculk_mark_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaSculk_mark_window') > 0)
})

OrganKubejsEvents.predicate('vanillaSculk_echo_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && getCounter(event.player, RESOURCE.current) >= 8)
})

OrganKubejsEvents.predicate('vanillaSculk_otherdeep_online', event => {
  return vanillaSculkPredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  if (countMatching(installedSourceIds(player), SOURCE_IDS) > 0) {
    homeMatch(player)
  }
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaSculk_silence_cycle', 0)
    setRuntimePoint(player, 'kubejs:vanillaSculk_mark_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  setRuntimePoint(player, 'kubejs:vanillaSculk_silence_cycle', isSilentZone(player) ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('sensor_throat_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 80 + getLinkCounter(player, 'kubejs:vanillaSculk_spell_weave') * 20 + getLinkCounter(player, 'kubejs:vanillaSculk_mark_line') * 10
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.DARKNESS, scaledDuration, 0)
  }
  return true
})

})()
