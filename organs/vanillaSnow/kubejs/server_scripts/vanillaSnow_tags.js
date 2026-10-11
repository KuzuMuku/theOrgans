;(function () {

let VANILLASNOW_ORGAN_IDS = [
  "vanillasnow:frostseal_ventricle",
  "vanillasnow:frozensoil_chest_membrane",
  "vanillasnow:birchmarrow_liver",
  "vanillasnow:icecrystal_lung",
  "vanillasnow:frostlight_crown",
  "vanillasnow:snowhide_spleen",
  "vanillasnow:icechip_arm",
  "vanillasnow:snowblind_iris",
  "vanillasnow:frosthoof_tendon",
  "vanillasnow:freezebreak_sheath",
  "vanillasnow:frozen_maze_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLASNOW_ORGAN_IDS)
  Common.addItemsToTag(event, 'kubejs:vanilla_snow_aux', [
    'kubejs:deposition_conduit',
    'kubejs:frostvein_bundle',
    'kubejs:icecore_rhythm'
  ])
})

ServerEvents.tags('block', event => {
  let blocks = [
    'minecraft:snow',
    'minecraft:snow_block',
    'minecraft:powder_snow',
    'minecraft:ice',
    'minecraft:packed_ice',
    'minecraft:blue_ice',
    'minecraft:frosted_ice'
  ]
  for (let i = 0; i < blocks.length; i++) {
    event.add('kubejs:vanilla_snow_harvestable', blocks[i])
  }
})
})()
