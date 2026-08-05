;(function () {

let MEKANISMT1_ORGAN_IDS = [
  "kubejs:industrial_energy_core",
  "kubejs:heat_pump_lung",
  "kubejs:gas_reflux_sac",
  "kubejs:high_frequency_phase_cochlea",
  "kubejs:heat_conductive_boneplate",
  "kubejs:capacitor_rhythm_gland",
  "kubejs:distillation_filter_bladder",
  "kubejs:calibration_lens_eye",
  "kubejs:heat_blade_arm",
  "kubejs:magnet_rail_fist",
  "kubejs:overheat_diffusion_shoulder",
  "kubejs:cracking_mine_sac",
  "kubejs:refining_recovery_gland",
  "kubejs:magnet_rail_leg_bolt"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', MEKANISMT1_ORGAN_IDS)
})
})()
