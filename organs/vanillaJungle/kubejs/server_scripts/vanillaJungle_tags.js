;(function () {

let VANILLAJUNGLE_ORGAN_IDS = [
  "kubejs:buttress_ventricle",
  "kubejs:mossbark_carapace",
  "kubejs:rainforest_water_sac",
  "kubejs:temple_moss_spine",
  "kubejs:stranglevine_arm",
  "kubejs:flytrap_throat_sac",
  "kubejs:jaguar_crouch_tendon",
  "kubejs:orchid_spellbud_lung",
  "kubejs:cocoa_marow_liver",
  "kubejs:sporeweb_crown",
  "kubejs:ancient_resonance_core",
  "kubejs:wooden_sap_conduit",
  "kubejs:root_anchor_silk",
  "kubejs:aerial_root_breathing_tube",
  "kubejs:vine_bind_bundle"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAJUNGLE_ORGAN_IDS)
})

ServerEvents.tags('block', event => {
  let JUNGLE_SAP_MINEABLES = [
    'minecraft:jungle_log',
    'minecraft:jungle_leaves',
    'minecraft:jungle_wood',
    'minecraft:jungle_planks',
    'minecraft:jungle_sapling',
    'minecraft:vine',
    'minecraft:cocoa',
    'minecraft:moss_block',
    'minecraft:moss_carpet',
    'minecraft:mossy_cobblestone',
    'minecraft:mossy_stone_bricks',
    'minecraft:chiseled_sandstone',
    'minecraft:cut_sandstone',
    'minecraft:sandstone',
    'minecraft:chiseled_stone_bricks',
    'minecraft:stone_bricks'
  ]
  for (let i = 0; i < JUNGLE_SAP_MINEABLES.length; i++) {
    event.add('kubejs:jungle_sap_mineables', JUNGLE_SAP_MINEABLES[i])
  }
})
})()
