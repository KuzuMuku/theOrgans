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

let DIR_KEY = 'vanillaLushCaves'
let HOME = {
  "dimensions": [
    "minecraft:overworld"
  ],
  "biome_keywords": [
    "lush_caves",
    "mushroom",
    "fungal"
  ]
}
let HOME_CALLBACK = 'vanillaLushCaves_home'
let HOME_STRUCTURE_CACHE = new Map()
let RESOURCE = {
  "system": "vanillaLushCaves_system",
  "capacity": "kubejs:vanillaLushCaves_resonance_capacity",
  "current": "kubejs:vanillaLushCaves_resonance",
  "capacity_en": "Spore Resonance Capacity",
  "capacity_desc_en": "Maximum shared reserve for spore resonance.",
  "current_en": "Spore Resonance",
  "current_desc_en": "Shared lush cave spore resonance gathered by growth and cave motion.",
  "capacity_zh": "孢光共振上限",
  "capacity_desc_zh": "孢光共振可积累的最大上限。",
  "current_zh": "孢光共振",
  "current_desc_zh": "由繁茂洞穴的生长与洞穴活动共同积累的孢光共振。",
  "generated": true
}
let SYSTEM_SOURCE = RESOURCE ? RESOURCE.system : 'vanillaLushCaves_system'
let LINK_SOURCE = DIR_KEY + '_links'
let SCHOOL_POWER_ATTRIBUTE = "irons_spellbooks:nature_spell_power"
let SOURCE_IDS = new Set([
  "kubejs:mossglow_core",
  "kubejs:calcite_breastbone",
  "kubejs:sporeglow_lung",
  "kubejs:mossheal_liver",
  "kubejs:sporebud_gland",
  "kubejs:hangingroot_arm",
  "kubejs:mycelium_sole",
  "kubejs:brightpod_sac",
  "kubejs:sporebed_spleen",
  "kubejs:gloommoss_crown"
])
let CORELINE_IDS = new Set([
  "kubejs:mossglow_core"
])
let SUPPORT_IDS = new Set([
  "kubejs:sporebud_gland"
])
let SPORE_IDS = new Set([
  "kubejs:sporebud_gland",
  "kubejs:sporeglow_lung",
  "kubejs:sporebed_spleen"
])
let CAVE_IDS = new Set([
  "kubejs:mossglow_core",
  "kubejs:calcite_breastbone",
  "kubejs:mycelium_sole"
])
let GLOW_IDS = new Set([
  "kubejs:brightpod_sac",
  "kubejs:gloommoss_crown",
  "kubejs:mossheal_liver"
])
let MYCELIUM_IDS = new Set([
  "kubejs:mycelium_sole",
  "kubejs:hangingroot_arm",
  "kubejs:sporebud_gland"
])
let MANA_IDS = new Set([
  "kubejs:brightpod_sac"
])
let SPELL_IDS = new Set([
  "kubejs:sporeglow_lung"
])
let CROWN_IDS = new Set([
  "kubejs:gloommoss_crown"
])
let ARMOR_IDS = new Set([
  "kubejs:calcite_breastbone"
])
let MOVEMENT_IDS = new Set([
  "kubejs:mycelium_sole"
])
let MELEE_IDS = new Set([
  "kubejs:hangingroot_arm"
])
let RANGED_IDS = new Set([])
let RESOURCE_IDS = new Set([
  "kubejs:sporebed_spleen"
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
  let sporeCount = countMatching(installed, SPORE_IDS)
  let caveCount = countMatching(installed, CAVE_IDS)
  let glowCount = countMatching(installed, GLOW_IDS)
  let myceliumCount = countMatching(installed, MYCELIUM_IDS)
  let framePoint = armorCount > 0 ? corelineCount : 0
  let weavePoint = spellCount > 0 ? manaCount : 0
  let cadencePoint = crownCount > 0 ? spellCount : 0
  let huntPoint = supportCount > 0 ? huntCount : 0
  let chasePoint = movementCount > 0 ? huntCount : 0
  let resourcePoint = resourceCount
  let sporePoint = sporeCount > 0 ? spellCount + resourceCount : 0
  let cavePoint = caveCount > 0 ? corelineCount + armorCount + movementCount : 0
  let glowPoint = glowCount > 0 ? manaCount + crownCount + spellCount : 0
  let myceliumPoint = myceliumCount > 0 ? movementCount + huntCount : 0
  setLinkCounter(player, 'kubejs:vanillaLushCaves_frame_link', framePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_spell_weave', weavePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_crown_cadence', cadencePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_hunt_link', huntPoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_chase_link', chasePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_resource_link', resourcePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_spore_line', sporePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_cave_line', cavePoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_glow_line', glowPoint)
  setLinkCounter(player, 'kubejs:vanillaLushCaves_mycelium_line', myceliumPoint)
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

function lowLight(player) {
  let entity = entityOf(player)
  try {
    return Number(entity.level.getMaxLocalRawBrightness(entity.blockPosition())) <= 8
  } catch (ignored) {
  }
  return false
}

function hasCaveGrowth(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:moss_block',
    'minecraft:glow_berries',
    'minecraft:spore_blossom',
    'minecraft:clay',
    'minecraft:big_dripleaf',
    'minecraft:rooted_dirt'
  ], 5)
}

function glowNearby(player) {
  let entity = entityOf(player)
  return hasNearbyBlock(entity, [
    'minecraft:glow_berries',
    'minecraft:spore_blossom',
    'minecraft:shroomlight'
  ], 5)
}

function homeState(player) {
  return Common.homeState(player, HOME)
}

function homeMatch(player) {
  return Common.homeMatch(player, HOME, function (player) {
    return lowLight(player) || hasCaveGrowth(player)
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

let vanillaLushCavesPredicateResult = Common.predicateResult

OrganKubejsEvents.predicate(HOME_CALLBACK, event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaLushCaves_set_major', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && countMatching(installedSourceIds(event.player), SOURCE_IDS) >= 4)
})

OrganKubejsEvents.predicate('vanillaLushCaves_resource_online', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && (!RESOURCE || getCounter(event.player, RESOURCE.current) >= 8))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_coreline', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CORELINE_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_support', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SUPPORT_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_mana', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MANA_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_spell', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), SPELL_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_crown', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), CROWN_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_armor', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), ARMOR_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_movement', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), MOVEMENT_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_resource', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && hasMatching(installedSourceIds(event.player), RESOURCE_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_hunt', event => {
  if (!event.player) {
    return vanillaLushCavesPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaLushCavesPredicateResult(event, hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS))
})

OrganKubejsEvents.predicate('vanillaLushCaves_has_chase', event => {
  if (!event.player) {
    return vanillaLushCavesPredicateResult(event, false)
  }
  let installed = installedSourceIds(event.player)
  return vanillaLushCavesPredicateResult(event, hasMatching(installed, MOVEMENT_IDS) && (hasMatching(installed, MELEE_IDS) || hasMatching(installed, RANGED_IDS)))
})

OrganKubejsEvents.predicate('vanillaLushCaves_cave_online', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaLushCaves_spore_online', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaLushCaves_glow_online', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && homeMatch(event.player))
})

OrganKubejsEvents.predicate('vanillaLushCaves_mycelium_ready', event => {
  return vanillaLushCavesPredicateResult(event, !!event.player && getRuntimePoint(event.player, 'kubejs:vanillaLushCaves_mycelium_window') > 0)
})




PlayerEvents.tick(event => {
  let player = event.player
  let capacity = getCounter(player, RESOURCE.capacity)
  if (capacity <= 0) {
    setCounter(player, RESOURCE.current, 0)
    setRuntimePoint(player, 'kubejs:vanillaLushCaves_cave_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaLushCaves_spore_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaLushCaves_glow_window', 0)
    setRuntimePoint(player, 'kubejs:vanillaLushCaves_mycelium_window', 0)
    applyLinearLinks(player)
    return
  }
  let current = Math.min(capacity, getCounter(player, RESOURCE.current))
  setCounter(player, RESOURCE.current, current)
  let cave = homeMatch(player) && lowLight(player)
  let spore = hasCaveGrowth(player) && lowLight(player)
  let glow = glowNearby(player)
  let mycelium = hasCaveGrowth(player) || homeMatch(player)
  setRuntimePoint(player, 'kubejs:vanillaLushCaves_cave_window', cave ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaLushCaves_spore_window', spore ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaLushCaves_glow_window', glow ? 1 : 0)
  setRuntimePoint(player, 'kubejs:vanillaLushCaves_mycelium_window', mycelium ? 1 : 0)
  applyLinearLinks(player)
})


})()
