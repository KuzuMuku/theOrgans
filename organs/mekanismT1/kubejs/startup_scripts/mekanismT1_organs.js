;(function () {

let MEKANISMT1_ORGAN_IDS = [
  "industrial_energy_core",
  "heat_pump_lung",
  "gas_reflux_sac",
  "high_frequency_phase_cochlea",
  "heat_conductive_boneplate",
  "capacitor_rhythm_gland",
  "distillation_filter_bladder",
  "calibration_lens_eye",
  "heat_blade_arm",
  "magnet_rail_fist",
  "overheat_diffusion_shoulder",
  "cracking_mine_sac",
  "refining_recovery_gland",
  "magnet_rail_leg_bolt",
  "energy_loop_core"
]

let MEKANISMT1_INFRASTRUCTURE_IDS = [
  "basic_energy_wire",
  "heat_exchange_pipe",
  "chemical_gas_pipe",
  "capacitor_bus_bar",
  "mineral_transport_rail"
]

StartupEvents.registry('item', event => {
  Common.registerItems(event, MEKANISMT1_INFRASTRUCTURE_IDS)
})

})()
