;(function () {

let MEKANISMT1_ORGAN_IDS = [
  "mekanismt1:industrial_energy_core",
  "mekanismt1:heat_pump_lung",
  "mekanismt1:gas_reflux_sac",
  "mekanismt1:high_frequency_phase_cochlea",
  "mekanismt1:heat_conductive_boneplate",
  "mekanismt1:capacitor_rhythm_gland",
  "mekanismt1:distillation_filter_bladder",
  "mekanismt1:calibration_lens_eye",
  "mekanismt1:heat_blade_arm",
  "mekanismt1:magnet_rail_fist",
  "mekanismt1:overheat_diffusion_shoulder",
  "mekanismt1:cracking_mine_sac",
  "mekanismt1:refining_recovery_gland",
  "mekanismt1:magnet_rail_leg_bolt",
  "mekanismt1:energy_loop_core"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', MEKANISMT1_ORGAN_IDS)
})
})()
