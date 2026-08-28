;(function () {

let VANILLASNOW_ORGAN_IDS = [
  "kubejs:frostseal_ventricle",
  "kubejs:frozensoil_chest_membrane",
  "kubejs:birchmarrow_liver",
  "kubejs:icecrystal_lung",
  "kubejs:frostlight_crown",
  "kubejs:snowhide_spleen",
  "kubejs:icechip_arm",
  "kubejs:snowblind_iris",
  "kubejs:frosthoof_tendon",
  "kubejs:freezebreak_sheath",
  "kubejs:frozen_maze_core"
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
