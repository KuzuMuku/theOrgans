;(function () {

let MEKANISMT2_ORGAN_IDS = [
  "mekanismt2:quantum_shield_core",
  "mekanismt2:plasma_membrane_lung",
  "mekanismt2:nano_recharge_nest",
  "mekanismt2:overload_phase_spine",
  "mekanismt2:shield_weave_membrane",
  "mekanismt2:vector_lock_eye",
  "mekanismt2:nano_repair_mesh",
  "mekanismt2:prism_compute_brain",
  "mekanismt2:phase_cut_arm",
  "mekanismt2:light_spear_tendon",
  "mekanismt2:deflection_prism_shoulder",
  "mekanismt2:nano_copy_gland",
  "mekanismt2:energy_harvest_step_foot",
  "mekanismt2:zero_loss_sampler_claw",
  "mekanismt2:radiation_diffusion_core",
  "mekanismt2:fission_plasma_chamber",
  "mekanismt2:plasma_state_wiring",
  "mekanismt2:radiation_deflection_armor",
  "mekanismt2:quantum_mecha_protocol",
  "mekanismt2:quantum_wire",
  "mekanismt2:phase_coil",
  "mekanismt2:nano_repair_line",
  "mekanismt2:lockon_sensor_array",
  "mekanismt2:fission_fuel_rod",
  "mekanismt2:radiation_filter"
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', MEKANISMT2_ORGAN_IDS)
})
})()
