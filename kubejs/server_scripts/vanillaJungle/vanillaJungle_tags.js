;(function () {

let VANILLAJUNGLE_ORGAN_IDS = [
  "vanillajungle:buttress_ventricle",
  "vanillajungle:mossbark_carapace",
  "vanillajungle:rainforest_water_sac",
  "vanillajungle:temple_moss_spine",
  "vanillajungle:stranglevine_arm",
  "vanillajungle:flytrap_throat_sac",
  "vanillajungle:jaguar_crouch_tendon",
  "vanillajungle:orchid_spellbud_lung",
  "vanillajungle:cocoa_marow_liver",
  "vanillajungle:sporeweb_crown",
  "vanillajungle:ancient_resonance_core",
  "vanillajungle:wooden_sap_conduit",
  "vanillajungle:root_anchor_silk",
  "vanillajungle:aerial_root_breathing_tube",
  "vanillajungle:vine_bind_bundle"
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
