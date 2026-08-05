;(function () {
let CREATE_INCOMPLETE_ITEMS = [
  "incomplete_andesite_alloy_heart",
  "incomplete_crushing_gears",
  "incomplete_drive_chainsaw",
  "incomplete_micro_waterwheel",
  "incomplete_micro_windmill",
  "incomplete_piston_punch",
  "incomplete_power_hammer",
  "incomplete_spring_ram",
  "incomplete_stress_pick",
  "incomplete_torque_driveshaft",
  "incomplete_brass_clutch_spine",
  "incomplete_brass_pile_driver",
  "incomplete_brass_pressure_ventricle",
  "incomplete_lubrication_reflux_gland",
  "incomplete_overpressure_forge_lung",
  "incomplete_pressure_balance_brass_membrane",
  "incomplete_ratchet_breach_shoulder",
  "incomplete_spiral_tunnel_drill",
  "incomplete_tempo_calibration_cochlea",
  "incomplete_weighted_flywheel_sac"
]
let CUSTOM_INTERMEDIATES = {
  "annealed_copper_plate": {
    "name": "退火铜板",
    "texture": "kubejs:item/annealed_copper_plate"
  },
  "sterile_suture": {
    "name": "灭菌缝合线",
    "texture": "kubejs:item/sterile_suture"
  },
  "quenched_brass_plate": {
    "name": "淬火黄铜板",
    "texture": "kubejs:item/quenched_brass_plate"
  },
  "precision_suture": {
    "name": "精密缝合线",
    "texture": "kubejs:item/precision_suture"
  },
  "pressurized_sterile_suture": {
    "name": "高压灭菌缝合线",
    "texture": "kubejs:item/pressurized_sterile_suture"
  },
  "industrial_encapsulation_membrane": {
    "name": "工业封装膜",
    "texture": "kubejs:item/industrial_encapsulation_membrane"
  },
  "nano_suture": {
    "name": "纳米缝合线",
    "texture": "kubejs:item/nano_suture"
  },
  "quantum_encapsulation_membrane": {
    "name": "量子封装膜",
    "texture": "kubejs:item/quantum_encapsulation_membrane"
  },
  "cast_redsand_glass": {
    "name": "熔铸红砂玻璃",
    "texture": "kubejs:item/cast_redsand_glass"
  },
  "sunfire_distillate": {
    "name": "烈阳蒸馏液",
    "texture": "kubejs:item/sunfire_distillate"
  },
  "sintered_sand_core": {
    "name": "烧结砂芯",
    "texture": "kubejs:item/sintered_sand_core"
  },
  "annealed_purpur_crystal_plate": {
    "name": "退火紫珀晶板",
    "texture": "kubejs:item/annealed_purpur_crystal_plate"
  },
  "terminal_distillate": {
    "name": "终界蒸馏液",
    "texture": "kubejs:item/terminal_distillate"
  },
  "warp_crystal": {
    "name": "折跃结晶",
    "texture": "kubejs:item/warp_crystal"
  },
  "charred_vine_membrane": {
    "name": "炭化藤膜",
    "texture": "kubejs:item/charred_vine_membrane"
  },
  "jungle_salve": {
    "name": "丛林药膏",
    "texture": "kubejs:item/jungle_salve"
  },
  "active_sporebud": {
    "name": "活性孢芽",
    "texture": "kubejs:item/active_sporebud"
  },
  "annealed_calcite_chip": {
    "name": "退火方解晶片",
    "texture": "kubejs:item/annealed_calcite_chip"
  },
  "sporeglow_paste": {
    "name": "孢荧药浆",
    "texture": "kubejs:item/sporeglow_paste"
  },
  "caveglow_mycocore": {
    "name": "洞辉菌核",
    "texture": "kubejs:item/caveglow_mycocore"
  },
  "calcined_nether_bone_shard": {
    "name": "煅烧下界骨片",
    "texture": "kubejs:item/calcined_nether_bone_shard"
  },
  "fireward_distillate": {
    "name": "抗火蒸馏液",
    "texture": "kubejs:item/fireward_distillate"
  },
  "scorch_crystal": {
    "name": "灼热结晶",
    "texture": "kubejs:item/scorch_crystal"
  },
  "salted_prismarine_chip": {
    "name": "盐析海晶片",
    "texture": "kubejs:item/salted_prismarine_chip"
  },
  "tidal_paste": {
    "name": "海潮药浆",
    "texture": "kubejs:item/tidal_paste"
  },
  "deepwater_membrane": {
    "name": "深水胶膜",
    "texture": "kubejs:item/deepwater_membrane"
  },
  "quenched_armory_plate": {
    "name": "淬火军械板",
    "texture": "kubejs:item/quenched_armory_plate"
  },
  "raid_stimulant": {
    "name": "袭击兴奋剂",
    "texture": "kubejs:item/raid_stimulant"
  },
  "captured_springworks": {
    "name": "缴获机簧",
    "texture": "kubejs:item/captured_springworks"
  },
  "quenched_ice_shard": {
    "name": "淬寒冰片",
    "texture": "kubejs:item/quenched_ice_shard"
  },
  "coldward_paste": {
    "name": "抗寒药浆",
    "texture": "kubejs:item/coldward_paste"
  },
  "frozen_fiber": {
    "name": "冻土纤维",
    "texture": "kubejs:item/frozen_fiber"
  },
  "dried_mucosa": {
    "name": "干燥黏膜",
    "texture": "kubejs:item/dried_mucosa"
  },
  "bogtoxin_distillate": {
    "name": "沼毒蒸馏液",
    "texture": "kubejs:item/bogtoxin_distillate"
  },
  "humus_filter_block": {
    "name": "腐殖滤块",
    "texture": "kubejs:item/humus_filter_block"
  },
  "refined_golem_plating": {
    "name": "精炼铁傀残板",
    "texture": "kubejs:item/refined_golem_plating"
  },
  "mending_salve": {
    "name": "修补药膏",
    "texture": "kubejs:item/mending_salve"
  },
  "bell_chime_axle": {
    "name": "钟鸣轴芯",
    "texture": "kubejs:item/bell_chime_axle"
  }
}

StartupEvents.registry('item', event => {
  event.create('failed_surgical_mass')
    .displayName('Failed Surgical Mass')
    .texture('minecraft:item/slime_ball')
  Object.entries(CUSTOM_INTERMEDIATES).forEach(([id, def]) => {
    event.create(id)
      .displayName(def.name)
      .texture(def.texture)
  })
  CREATE_INCOMPLETE_ITEMS.forEach(id => {
    event.create(id)
      .displayName(id)
      .texture('minecraft:item/barrier')
      .maxStackSize(1)
  })
})
})()
