// priority: 1000
let Common = global.Common || (global.Common = {})

function normalizeItemId(id) {
  let text = String(id)
  return text.indexOf(':') >= 0 ? text : 'kubejs:' + text
}

function registerItems(event, ids) {
  for (let i = 0; i < ids.length; i++) {
    event.create(normalizeItemId(ids[i])).maxStackSize(1)
  }
}

function registerSkills(skills) {
  for (let i = 0; i < skills.length; i++) {
    let skill = skills[i]
    OrganKubeJS.registerSkill(skill.id, skill.nameKey, skill.descKey, skill.cooldown, skill.level, skill.castEvent)
  }
}
Common.registerItems = registerItems
Common.registerSkills = registerSkills
Common.normalizeItemId = normalizeItemId
