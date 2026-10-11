const $SpellRegistry = Java.loadClass("io.redspace.ironsspellbooks.api.registry.SpellRegistry")
const $CastSource = Java.loadClass("io.redspace.ironsspellbooks.api.spells.CastSource")
let Common = global.Common || (global.Common = {})

function castSpell(resourceLocation, spellLevel, player) {
    $SpellRegistry["getSpell(net.minecraft.resources.ResourceLocation)"](resourceLocation).attemptInitiateCast(Item.of('air'), spellLevel, player.level, player, $CastSource.MOB, false, "main_hand")
}

Common.castSpell = castSpell
