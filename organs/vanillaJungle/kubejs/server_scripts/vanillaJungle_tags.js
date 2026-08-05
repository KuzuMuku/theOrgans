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
  "kubejs:sporeweb_crown"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', VANILLAJUNGLE_ORGAN_IDS)
})
})()
