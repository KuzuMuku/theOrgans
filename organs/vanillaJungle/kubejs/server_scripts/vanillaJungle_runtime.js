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

let DIR_KEY = 'vanillaJungle'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "jungle",
    "bamboo"
  ],
  "structures": [
    "minecraft:jungle_temple"
  ],
  "structure_radius": 8
}
let HOME_CALLBACK = 'vanillaJungle_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaJungle_system",
  "capacity": "kubejs:vanillaJungle_resonance_capacity",
  "current": "kubejs:vanillaJungle_resonance",
  "capacity_en": "Canopy Sap Capacity",
  "capacity_desc_en": "Maximum shared reserve for canopy sap.",
  "current_en": "Canopy Sap",
  "current_desc_en": "Shared jungle sap gathered by stalking, spores and wet growth.",
  "capacity_zh": "冠层树液上限",
  "capacity_desc_zh": "冠层树液可积累的最大上限。",
  "current_zh": "冠层树液",
  "current_desc_zh": "由伏击、孢子与湿热生长共同积累的雨林树液。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaJungle_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:nature_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:buttress_ventricle",
  "kubejs:mossbark_carapace",
  "kubejs:rainforest_water_sac",
  "kubejs:temple_moss_spine",
  "kubejs:stranglevine_arm",
  "kubejs:flytrap_throat_sac",
  "kubejs:jaguar_crouch_tendon",
  "kubejs:orchid_spellbud_lung",
  "kubejs:cocoa_marow_liver",
  "kubejs:sporeweb_crown"
])
let CORELINE_IDS = new Set([
  "kubejs:buttress_ventricle",
  "kubejs:temple_moss_spine"
])
let SUPPORT_IDS = new Set([
  "kubejs:temple_moss_spine"
])
let ROOT_IDS = new Set([
  "kubejs:buttress_ventricle",
  "kubejs:mossbark_carapace",
  "kubejs:temple_moss_spine"
])
let RAINFOREST_IDS = new Set([
  "kubejs:rainforest_water_sac",
  "kubejs:cocoa_marow_liver",
  "kubejs:orchid_spellbud_lung"
])
let SNARE_IDS = new Set([
  "kubejs:stranglevine_arm",
  "kubejs:flytrap_throat_sac",
  "kubejs:jaguar_crouch_tendon"
])
let CANOPY_IDS = new Set([
  "kubejs:sporeweb_crown",
  "kubejs:orchid_spellbud_lung",
  "kubejs:mossbark_carapace"
])
let MANA_IDS = new Set([
  "kubejs:rainforest_water_sac"
])
let SPELL_IDS = new Set([
  "kubejs:orchid_spellbud_lung"
])
let CROWN_IDS = new Set([
  "kubejs:sporeweb_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:mossbark_carapace"
])
let MOVEMENT_IDS = new Set([
  "kubejs:jaguar_crouch_tendon"
])
let MELEE_IDS = new Set([
  "kubejs:stranglevine_arm"
])
let RANGED_IDS = new Set([
  "kubejs:flytrap_throat_sac"
])
let RESOURCE_IDS = new Set([])

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
  let rootCount = countMatching(installed, ROOT_IDS)
  let rainforestCount = countMatching(installed, RAINFOREST_IDS)
  let snareCount = countMatching(installed, SNARE_IDS)
  let canopyCount = countMatching(installed, CANOPY_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let barkPoint = rootCount > 0 ? armorCount + corelineCount : 0
  let rainforestPoint = rainforestCount > 0 ? manaCount + spellCount : 0
  let snarePoint = snareCount > 0 ? huntCount + movementCount : 0
  let canopyPoint = canopyCount > 0 ? spellCount + crownCount + manaCount : 0
  setLinkCounter(player, 'kubejs:vanillaJungle_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_bark_line', barkPoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_rainforest_line', rainforestPoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_snare_line', snarePoint)
  setLinkCounter(player, 'kubejs:vanillaJungle_canopy_line', canopyPoint)
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
    return !!entity.isInWaterOrRain()
  } catch (ignored) {
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

function isStill(player) {
  let entity = entityOf(player)
  try {
    let movement = entity.getDeltaMovement()
    return Math.abs(Number(movement.x())) + Math.abs(Number(movement.z())) < 0.04
  } catch (ignored) {
  }
  return false
}

function countNearbyLiving(player, radius) {
  let entity = entityOf(player)
  let total = 0
  let list = entity.level.getEntities(entity, entity.getBoundingBox().inflate(radius))
  let iterator = list.iterator()
  while (iterator.hasNext()) {
    let target = iterator.next()
    if (!target || !(target instanceof LivingEntityClass) || target === entity || !target.isAlive()) {
      continue
    }
    total++
  }
  return total
}

function hasCanopyGrowth(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:jungle_log',
    'minecraft:jungle_leaves',
    'minecraft:vine',
    'minecraft:cocoa',
    'minecraft:moss_block',
    'minecraft:mossy_cobblestone'
  ], 5)
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return isWet(player) || hasCanopyGrowth(player)
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

let vanillaJunglePredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaJunglePredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_set_major', event => {
  return vanillaJunglePredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaJungle_resource_online', event => {
  return vanillaJunglePredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaJungle_has_coreline', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_support', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_mana', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_spell', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_crown', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_armor', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_movement', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_resource', event => {
  return vanillaJunglePredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_hunt', event => {
  if (!event.player) {
    return vanillaJunglePredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaJunglePredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaJungle_has_chase', event => {
  if (!event.player) {
    return vanillaJunglePredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaJunglePredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaJungle_rooted_online', event => {
  return vanillaJunglePredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaJungle_rooted_window') > 0)
})

OrganKubejsEvents.predicate('vanillaJungle_rainforest_online', event => {
  return vanillaJunglePredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaJungle_snare_ready', event => {
  return vanillaJunglePredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaJungle_snare_window') > 0)
})

OrganKubejsEvents.predicate('vanillaJungle_canopy_online', event => {
  return vanillaJunglePredicateResult(event, !!event.player && homeMatch(event.player))
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaJungle_rooted_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaJungle_rainforest_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaJungle_snare_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaJungle_canopy_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let rainforest = homeMatch(player) || isWet(player) || isRainingHere(player)
  let rooted = (homeMatch(player) && isStill(player)) || hasCanopyGrowth(player)
  let snare = homeMatch(player) || countNearbyLiving(player, 5) >= 2
  let canopy = homeMatch(player) && hasCanopyGrowth(player)
  setRuntimePoint(player, 'kubejs:vanillaJungle_rooted_window', rooted ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_rainforest_window', rainforest ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_snare_window', snare ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaJungle_canopy_window', canopy ? 1 : 0)
  applyLinearLinks(player)
})


OrganKubejsEvents.skillCast('flytrap_throat_sac_cast', event => {
  let player = event.player
  if (!player || !resourceReady(player, 12)) {
    return false
  }
  let scaledDuration = 80 + getLinkCounter(player, 'kubejs:vanillaJungle_snare_line') * 20
  spendResource(player, 12)
  let targets = targetsSortedByDistance(player, 4.5)
  for (let i = 0; i < targets.length; i++) {
    addEffect(targets[i], MobEffects.WEAKNESS, scaledDuration, 0)
    addEffect(targets[i], MobEffects.MOVEMENT_SLOWDOWN, scaledDuration, 0)
  }
  return true
})

})()
