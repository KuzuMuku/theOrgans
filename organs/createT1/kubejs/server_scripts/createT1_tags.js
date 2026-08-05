;(function () {

let CREATE_LEVEL1_ORGANS = [
  'kubejs:andesite_alloy_heart',
  'kubejs:piston_punch',
  'kubejs:power_hammer',
  'kubejs:spring_ram',
  'kubejs:drive_chainsaw',
  'kubejs:stress_pick',
  'kubejs:crushing_gears',
  'kubejs:micro_waterwheel',
  'kubejs:micro_windmill',
  'kubejs:torque_driveshaft'
]

ServerEvents.tags('item', event => {
  Common.addItemsToTag(event, 'organapi:organs', CREATE_LEVEL1_ORGANS)
})
})()
