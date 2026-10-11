# 原版地狱实现稿

## 本轮调整结论

地狱内容量大，不再只保留一个“蓄能 -> 半量释放 -> 再蓄能”的单调主核。本稿把下界分成两条互相交叉的核心循环：

1. **蓄能爆发链**：献祭余烬继续由受击、掉血、燃烧、火法命中和下界猎杀积累，并用于 `灼喉囊`、`献火拳峰`、`黑焰喉管` 和 `灾厄熔核` 的高压释放。
2. **高热维持链**：高热不是第二个资源条，而是由余烬量、下界环境、燃烧状态和结构窗口共同形成的维持状态。玩家要持续战斗、踩热区和维持燃烧，才能进入并保持高热窗口。

- 新增 `灰烬导管`、`熔渣泵`、`魂火节律器`、`炽金回收带` 四类非器官辅助件。
- 辅助件不是合成材料，而是增强特定器官的“灰烬管路 / 熔渣泵路 / 魂火节律 / 回收带”。
- `灾厄熔核` 同时拥有“献祭爆发”和“灾厄高热”两个释放模式，玩家可根据战斗场景选择蓄能清仓或持续高热。

本文对应 [design-vanilla-nether.txt](/home/kuzuanpa/projects/1.20.1/theOrgans/organs/vanillaNether/design-vanilla-nether.txt:1) 的施工图版本。上游概念稿负责给出“原版结构.地狱 + Cataclysm 下界遗迹 + Alex's Mobs 绯红森林生态”的身份、流派方向与候选效果；本文负责回答每个器官最后到底装什么、触发什么事件、消耗什么资源。

实现稿沿用 vanillaShulk 的取舍原则：

- 保持来源与主场条件，不把地狱写成纯“火系模组合集”。
- 保留已有 30 个器官的基础面板，只收敛功能类特效，删除多余堆叠。
- 核心资源只保留 `献祭余烬`，再保留 `下界标记` 作为战斗锁定状态，不做“炉温 + 献祭 + 灰烬 + 契约”多套平行计数。
- 用 `灾厄熔核` 做整套体系的高辨识度主动出口，让献祭余烬从“只进不出”变成真正可消耗的循环资源。
- 本稿不再“暂缓 / 不纳入第一版”：原版下界、YUNG 强化要塞、Cataclysm 下界遗迹、Alex's Mobs 绯红蚊子/诡异蚊鬼都有明确落点。

## 一、来源与主场

来源定位是：

```text
原版群系/结构.下界 + YUNG 强化下界要塞 + Cataclysm 下界遗迹 + Alex's Mobs 绯红森林生态
```

YUNG、Cataclysm、Alex's Mobs 都不单独成为新来源。它们作为下界生态、结构或高压毕业层，继续归入 `原版结构.下界`，避免来源表碎片化，也避免整套器官变成“Boss 掉落套 + 模组材料套”。

### 主场条件

简化现有 `vanillaNether_home` 判定：

- 维度：`minecraft:the_nether`。
- 玩家状态：玩家正在燃烧
- `heat_online` 只要在下界维度、或玩家正在燃烧，即算作主场激活

需要保证基础能力离开下界仍可用；主场只提供额外强度，不让器官离场即废。

## 二、内容模块清单

以下内容来自本地 mod jar、整合包配置、现有 KubeJS 脚本和 vanillaNether 设计方案，不虚构不存在的实体、战利品或结构。

| 模块 | 实际内容 | 本方案的吸收方式 |
|---|---|---|
| 原版下界基底地形 | 下界荒地、灵魂沙谷、绯红森林、诡异森林、玄武岩三角洲；地狱岩、灵魂沙/灵魂土、黑石、玄武岩、熔岩海、荧石、远古残骸、下界金矿、石英矿、基岩天花 | 高热/低光/黑石/玄武岩环境条件、挖掘资源、结构战场 |
| 原版下界结构 | 下界要塞、猪灵堡垒、废弃传送门、下界传送门；烈焰人刷怪笼、恶魂塔、凋灵骷髅走廊、猪灵/疣猪兽营区、藏宝室 | 要塞骨钥、堡垒蹄锁、古残拾取手、灼金回收爪的结构与搜刮落点 |
| 原版下界生态 | 烈焰人、恶魂、凋灵骷髅、岩浆怪、疣猪兽、猪灵/猪灵蛮兵、僵尸猪灵、末影人、炽足兽、骷髅、下界疣、荧石、菌光体 | 灰烬脾囊猎杀资源、下界疣肝补给、熔岩跟腱机动、献祭产源 |
| YUNG's Better Nether Fortresses | 已确认的 `betterfortresses:chests/beacon`、`keep`、`obsidian`、`storage` 宝箱 | 要塞骨钥继续作为“强化要塞战斗与搜刮”的器官落点；现有宝箱 LootJS 并入最终稿 |
| Cataclysm | `cataclysm:burning_arena`（烈焰祭坛、炽燃遗魂、焰魔路线）、`cataclysm:soul_black_smith`（下界合金巨兽/幼兽路线）、`cataclysm:flame_eye`、`cataclysm:monstrous_eye`、`cataclysm:ignitium_ingot`、`cataclysm:infernal_forge`、`cataclysm:monstrous_horn`、`cataclysm:lava_power_cell`、`cataclysm:netherite_effigy`、`cataclysm:burning_ashes`、`cataclysm:blackstone_pillar` 等 | 黑石脾膜做黑石/下界砖结构资源；灾厄熔核做核心主动；Cataclysm Boss 作为毕业解剖来源与高压验证 |
| Alex's Mobs | 绯红蚊子（下界绯红森林宿主；猛扑、吸附吸血、吸满后喷血；吸满时掉血囊，单独掉口器）；诡异蚊鬼（绯红蚊子吸食 Mungus 类真菌生物后突变；身体猛撞、拳击、拍地、吸血回血；掉诡异肌和血淋巴囊）；`blood_sac`、`mosquito_proboscis`、`hemolymph_sac`、`warped_muscle`、`blood_sprayer`、`hemolymph_blaster`、`mosquito_larva`、`mosquito_repellent_stew` | 灰烬脾囊负责猎杀绯红蚊子/诡异蚊鬼与真实材料收益；绯红孑孓和驱蚊炖菜沿用 Alex's Mobs 原生配方/贸易体系，不接管；也不接管原生 AI、喷血、吸满状态或 Mungus 转化 |

### 非器官辅助件（灰烬管路 / 熔渣泵路）

地狱的器官多，必须用辅助件把“蓄能爆发”和“高热维持”两条链分开：

| 辅助件 | 增强对象 | 具体作用 |
|---|---|---|
| `灰烬导管` `kubejs:ash_conduit` | `献血脊炉`、`灵焰肺叶` | 献血脊炉受击/掉血/燃烧时额外 +1 余烬；灵焰肺叶火法命中时额外 +1 余烬，但不增加点燃伤害 |
| `熔渣泵` `kubejs:slag_pump` | `熔渣回流腺`、`炉渣肾鞘`、`黑曜胸腔` | 熔渣回流腺短再生消耗从 4 点降至 3 点；炉渣肾鞘灼烧/凋灵负面持续时间额外缩短 1 秒；黑曜胸腔熔岩承压时击退抗性 +1 |
| `魂火节律器` `kubejs:soulfire_rhythm` | `过载冠脑`、`灾厄熔核` | 过载冠脑过载窗口持续时间 +1 秒；灾厄熔核高热维持模式每秒消耗降低 1 点 |
| `炽金回收带` `kubejs:gilded_recovery_belt` | `古残拾取手`、`灼金回收爪`、`灰烬脾囊` | 古残拾取手矿物 roll +1 次；灼金回收爪交易回收 +1 次；灰烬脾囊下界生物猎获额外 +1 余烬 |

这些辅助件进入 runtime 谓词，并由对应器官词条实际读取，不能只作为手术配方。

## 三、核心资源与状态

### 1. 献祭余烬

保留现有 `kubejs:vanillaNether_resonance`，展示名叫“献祭余烬”。它代表下界的危险、燃烧、受击、猎杀和结构活动共同积累的热能，是整套体系唯一可积累、可消耗的资源。

- 上限：现有 `vanillaNether_resonance_capacity` 不变，底盘由地狱心炉等器官提供。
- 生产端：受击 / 掉血 / 燃烧、火法命中、下界猎杀、矿物挖掘与结构搜刮。
- 转化端：转法力、转短时治疗、远程压制、主动技能。
- 阶段消耗端：余烬肝囊、熔渣回流腺、灰烬虹膜、灼喉囊、献火拳峰、黑焰喉管。
- 爆发消耗端：灾厄熔核的“献祭爆发”模式按固定高额余烬释放 `heat_surge`，保留蓄能 -> 释放链。
- 高热维持端：地狱心炉、黑曜胸腔、过载冠脑和灾厄熔核共同维持 `vanillaNether_inferno_upkeep`，每秒消耗 2 点余烬，不半量清仓。

两个循环共用同一个 `kubejs:vanillaNether_resonance`，但玩法节奏不同：

```text
蓄能爆发链：受击/掉血/燃烧/火法命中 -> 献祭余烬 -> 固定消耗技能 -> heat_surge / 黑焰 / 灼喉
高热维持链：下界环境 + 燃烧状态 + 结构窗口 -> inferno_upkeep -> 熔岩承压 / 过载 / 回收
```

高热维持窗口只读取余烬是否足够和是否仍处于高热条件；不会把余烬变成第二个温度条。

### 2. 下界标记

保留现有 `kubejs:vanillaNether_mark`，展示名叫“下界标记”。它只表示目标已被近战火脉锁定，不承担经济资源功能。

- 上标记：烈焰臂束近战命中。
- 吃标记：灰烬虹膜远程命中、献火拳峰正面重击。
- 明确边界：不做“全敌人自动上标记”，也不让多个器官同时免费给所有目标挂标记。

## 四、器官实现清单

以下 30 个器官沿用现有 ID、槽位与基础面板。功能类特效收敛成每个器官一个主落点；除 `灾厄熔核` 外，不再额外改面板。

### 献祭底盘与生产

| 器官 | 唯一功能落点 | 触发 / 消耗 |
|---|---|---|
| 地狱心炉 `kubejs:infernal_hearth` | 提供生命、护甲与献祭余烬容量底盘；下界/燃烧环境中获得额外生命、护甲与韧性 | 静态 + `heat_online`；无消耗 |
| 献血脊炉 `kubejs:sacrifice_spine_furnace` | 受击、掉血或燃烧时叠献祭余烬，是主要生产件 | `attacked` / `health_loss` / 燃烧状态；每次 +2 到 +3 |
| 灵焰肺叶 `kubejs:spiritflame_lung` | 火系法术命中时 +2 献祭，并给目标 2 秒点燃 | 事件 `spell_hit`，school `irons_spellbooks:fire` |
| 烈行脚踝 `kubejs:emberstride_ankle` | 在高热环境冲刺/越过黑石或玄武岩后短时加速，并 +1 献祭 | 移动事件 + 热区；无独立冷却 |

### 承压、恢复与负面抑制

| 器官 | 唯一功能落点 | 触发 / 消耗 |
|---|---|---|
| 黑曜胸腔 `kubejs:obsidian_chest_cavity` | 高热点/熔岩环境击退抗性 +2，火焰与熔岩伤害 -20% | `heat_online` + 受击；不额外叠攻击 |
| 熔渣回流腺 `kubejs:slag_reflux_gland` | 受击或燃烧时消耗 4 献祭，触发 4 秒短再生 | `attacked` / 燃烧；消耗献祭 |
| 炉渣肾鞘 `kubejs:furnaceslag_kidneysheath` | 缩短自身灼烧和凋灵类负面持续时间，并降低持续伤害节奏损失 | 负面效果发生时；无消耗 |
| 余烬肝囊 `kubejs:ember_liver` | 献祭 ≥ 10 时每 2 秒消耗 1 献祭恢复 2 点法力 | 持续判定 + 消耗献祭 |
| 下界疣肝 `kubejs:netherwart_liver` | 使用下界疣、蘑菇类食物或药水补给时恢复法力，并保留炼金补给身份 | `use_item` / 药水完成；无消耗 |
| 猪灵契约肝 `kubejs:piglin_contract_liver` | 猪灵交易或金锭行为后，下一次火系施法恢复 8 点法力 | 交易/金锭事件 + 6 秒窗口；无额外消耗 |
| 灵魂沙囊肺 `kubejs:soulsand_lung_sac` | 位于灵魂沙、灵魂土或下界要塞时击退抗性 +2；灵魂沙减速和凋灵效果时长 -1 秒 | `soul_online` / `fortress_online`；无消耗 |
| 灰谷囊肺 `kubejs:ashvale_lung` | 灵魂沙谷、灰烬地貌或低光环境中 `fire_spell_power +2`、施法移速 +1；自身凋灵效果时长 -1 秒 | `biome` / 低光 / 结构条件；无消耗 |

### 战斗与压制

| 器官 | 唯一功能落点 | 触发 / 消耗 |
|---|---|---|
| 过载冠脑 `kubejs:overload_crown` | 低血或献祭 ≥ 16 时进入 5 秒过载窗口，获得施法时间缩减和施法移速 | 血量/献祭阈值；无消耗 |
| 烈焰臂束 `kubejs:blazefire_arm` | 近战命中给目标上下界标记并点燃 2 秒 | `deal_damage`；无消耗 |
| 灰烬虹膜 `kubejs:ash_iris` | 远程命中带下界标记的目标时，消耗 4 献祭并施加 3 秒点燃与 2 秒虚弱 | `projectile_hit` + 标记 + 消耗献祭 |
| 灼喉囊 `kubejs:scorch_throat_sac` | 主动技能：消耗 12 献祭，对 4.5 格内目标喷出短时枯萎/灼烧气体 | 主动施放；消耗献祭 |
| 献火拳峰 `kubejs:sacrifice_fire_fist` | 主动技能：消耗 12 献祭，正面重拳；命中带下界标记目标时追加点燃 | 主动施放；消耗献祭 |
| 烈狱肩甲 `kubejs:inferno_shoulderplate` | 受击后对近身目标施加 3 秒点燃并轻微击退 | `attacked`；短窗口 |
| 狱火尾椎 `kubejs:hellfire_tailbone` | 受击后 5 秒内下一次近战/火法命中提高伤害并点燃目标 | `attacked` + 短窗口 |
| 黑焰喉管 `kubejs:blackflame_throat_pipe` | 主动技能：消耗 12 献祭，朝面向方向射出黑焰压制射流，伤害并施加枯萎 | 主动施放；消耗献祭 |
| 熔拳副心 `kubejs:smeltfist_subcore` | 贴身近战或连续受击时叠 1 到 3 层熔拳；满层后下一次近战附带范围点燃 | 贴身命中/受击；层数窗口 |
| 灾厄熔核 `kubejs:cataclysm_magma_core` | 核心主动双模式：蓄能爆发释放 `heat_surge`；高热维持开启 `vanillaNether_inferno_upkeep` 持续窗口 | 主动施放；爆发固定消耗 18 点余烬，高热每秒消耗 2 点余烬 |

### 机动

| 器官 | 唯一功能落点 | 触发 / 消耗 |
|---|---|---|
| 熔岩跟腱 `kubejs:lava_tendon` | 熔岩、岩浆边缘、黑石或玄武岩三角洲中提升移动与熔岩游动能力 | `stepon` / 群系条件；无消耗 |
| 炉火膝环 `kubejs:furnace_kneering` | 连续跳跃、冲刺与爬坡时获得移动速度 +1、击退抗性 +1，持续 4 秒 | 移动事件；层数窗口 |
| 堡垒蹄锁 `kubejs:bastion_hoof_lock` | 在堡垒遗迹、猪灵/疣猪兽环境获得机动与击退抗性，缩短疣猪兽冲击节奏 | `fortress_online` / `bastion` 结构；无消耗 |

### 资源与结构

| 器官 | 唯一功能落点 | 触发 / 消耗 |
|---|---|---|
| 灰烬脾囊 `kubejs:ash_spleen` | 击杀原版下界战斗生物、绯红蚊子或诡异蚊鬼时 +1 献祭，并按实体 roll 真实材料（烈焰粉/烈焰棒、恶魂之泪、岩浆膏、凋灵骷髅头、`alexsmobs:blood_sac`、`alexsmobs:mosquito_proboscis`、`alexsmobs:hemolymph_sac`、`alexsmobs:warped_muscle` 等） | `kill` + 实体过滤；无额外消耗 |
| 黑石脾膜 `kubejs:blackstone_spleen_membrane` | 挖掘黑石、玄武岩或下界砖时额外 roll 黑石建材；在灵魂黑史密斯结构附近提供站场稳定性 | `mine` / `cataclysm:soul_black_smith`；无消耗 |
| 古残拾取手 `kubejs:ancient_relic_hand` | 挖掘远古残骸、下界金矿、下界石英或黑石时 +1 献祭并 roll 矿物/残骸材料 | `mine` + 方块过滤；无额外消耗 |
| 灼金回收爪 `kubejs:gilded_recovery_claw` | 猪灵交易或金锭消费时额外 roll 金粒/金锭/下界交易物资并 +2 献祭 | 交易/金锭事件；无额外消耗 |
| 要塞骨钥 `kubejs:fortress_bone_key` | 在下界要塞及 `betterfortresses:*` 宝箱环境中稳定战斗，并在结构开箱时 roll 1 次强化要塞战利品 | `fortress_online` + 开箱；无额外消耗 |

## 五、核心主动：灾厄熔核

- 物品 ID：保留 `kubejs:cataclysm_magma_core`，沿用现有材质、槽位与面板。
- 来源：解剖 Cataclysm `cataclysm:netherite_monstrosity` 获得；可选高阶来源为 `cataclysm:ignis`，按现有 `organ_sources` 槽位投放。
- 功能：拥有两种释放模式，玩家按战斗场景选择。
- 蓄能爆发模式：
  1. 最低需要 18 点献祭余烬。
  2. 固定消耗 18 点余烬，释放 `irons_spellbooks:heat_surge`，等级固定为 3 级。
  3. 释放后 6 秒内获得短时 `fire_spell_power` 与 `cooldown_reduction`，表现灾厄熔核过载。
- 高热维持模式：
  1. 最低需要 20 点献祭余烬。
  2. 开启 `vanillaNether_inferno_upkeep`，持续 8 秒，期间每秒消耗 2 点余烬；`魂火节律器` 在线时每秒只消耗 1 点。
  3. 窗口内 `fire_spell_power +2`，火法命中额外 +1 余烬；黑曜胸腔击退抗性再 +1，熔渣回流腺再生消耗 -1。
  4. 窗口结束时仍处于下界高温/燃烧环境则保留最多 5 点余烬作为底火，不直接清空。
- 表现参考：范围火环、点燃、护甲撕裂对应 Cataclysm/Ignis 的火焰与炽热烙印气质；不复刻 Ignis 的盾牌、地震、连段或 Boss 完整招式。

## 六、负面抑制与综合增强

### 负面抑制

- 黑曜胸腔：把熔岩/燃烧高压转成站场优势，减少持续燃烧与熔岩伤害。
- 炉渣肾鞘：针对灼烧、凋灵类负面做持续时间与节奏损失抑制。
- 灵魂沙囊肺：把灵魂沙谷、灵魂沙减速和下界要塞压迫转成击退抗性 +2。
- 灰谷囊肺：把灵魂沙谷/灰烬低光模组群系识别为火法主场，而不是只能靠火把跳过。
- Alex's Mobs：不把绯红蚊子做成玩家负面来源；它的吸血、喷血、吸满掉落作为猎杀资源层。

### 综合增强

- 法术：`fire_spell_power`、`max_mana`、`mana_regen`、`cast_time_reduction`、`cooldown_reduction`、`casting_movespeed`。
- 生存：`max_health`、`armor`、`armor_toughness`、`knockback_resistance`、短治疗、短再生。
- 战斗：下界标记、点燃、枯萎、虚弱、范围灼烧、主动爆发。
- 机动：熔岩游动、冲刺、跳跃、堡垒/高温地表移动。
- 资源：下界矿物、强化要塞宝箱、堡垒金堆、猪灵交易、绯红蚊子/诡异蚊鬼材料、Cataclysm 下界材料。

## 七、联动链

### 献祭爆发链

```text
灰烬导管 -> 献血脊炉 / 灵焰肺叶 -> 过载冠脑 -> 灾厄熔核（蓄能爆发模式）
```

灰烬导管增强生产，脊炉负责受击与燃烧产余烬，肺叶负责火法命中产余烬，冠脑把高余烬/低血转成法系窗口，灾厄熔核按固定高额余烬释放 Heat Surge。这条链保留蓄能 -> 释放。

### 火脉标记链

```text
烈焰臂束 -> 灰烬虹膜 -> 献火拳峰
```

臂束近战上标记，虹膜远程吃标记并消耗余烬，拳峰对带标记目标完成正面重击收尾。

### 熔核熔渣承压链

```text
熔渣泵 -> 地狱心炉 + 黑曜胸腔 + 熔渣回流腺 + 炉渣肾鞘
```

熔渣泵降低承压和再生成本，心炉给生命与容量，胸腔和肾鞘负责抗熔岩/灼烧/凋灵，回流腺把积累的余烬转成短再生。这条链负责高热维持。

### 下界结构与资源链

```text
炽金回收带 -> 要塞骨钥 + 堡垒蹄锁 + 古残拾取手 + 灼金回收爪
```

炽金回收带增强矿物与交易回收，骨钥管强化要塞战斗与宝箱，蹄锁管堡垒机动与搜刮，拾取手管远古残骸和矿物，回收爪管金锭/猪灵交易循环。

### 绯红猎获链

```text
灰烬脾囊 -> 灰谷囊肺 -> 黑焰喉管
```

脾囊负责绯红森林/诡异蚊鬼猎杀材料，灰谷囊肺提供灵魂沙谷和低光火法节奏，黑焰喉管把材料经济转成射界压制。

### 高热维持链

```text
魂火节律器 -> 地狱心炉 + 黑曜胸腔 + 过载冠脑 + 灾厄熔核（高热维持模式）
```

心炉和胸腔把下界高温/熔岩转成站场，冠脑读取低血/高余烬进入短过载，魂火节律器降低维持成本，灾厄熔核每秒消耗 2 点余烬保持高热窗口。这条链不是蓄能爆发，而是长时间火线作战。

### 跨来源弱联动

- Cataclysm 的 `ignitium_ingot`、`lava_power_cell`、`monstrous_horn`、`infernal_forge` 只作为手术材料/毕业解剖收益，不复刻装备效果。
- Alex's Mobs 的血液喷射器/血淋巴喷射器仍由 Alex's Mobs 原生配方负责；地狱器官只把 `blood_sac`、`mosquito_proboscis`、`hemolymph_sac`、`warped_muscle` 作为猎获与手术辅料来源。

## 八、当前 JSON 修改点

落地时对现有 `organs/vanillaNether/kubejs/data/kubejs/organapi/organs/*.json` 做以下收敛：

- 地狱心炉：保留生命/护甲/容量与热区强化，删除与“献祭底盘”无关的多余词条。
- 献血脊炉：删除 `deal_damage` 产余烬、高余烬攻击加成和高热点护甲韧性；只保留受击/掉血/燃烧产余烬。
- 黑曜胸腔：删除静态外的重复承压，改为高热熔岩减伤与站场击退抗性。
- 余烬肝囊、下界疣肝、猪灵契约肝：三种回蓝使用三种不同触发，不再共用 `kill` + `spell_cast` + 静态回蓝模板。
- 灰烬脾囊：删除 `mine` 与熔炉/开箱通用掉落，只保留下界生物 + 绯红蚊子/诡异蚊鬼猎获。
- 黑石脾膜：删除与灰烬脾囊相同的 loot 双事件模板，改为黑石/下界砖挖掘与灵魂黑史密斯站场。
- 古残拾取手、灼金回收爪：分别锁定矿脉和交易事件，不再共用同一张 cactus/sand/gold 式掉落表思维。
- 灼喉囊、献火拳峰、黑焰喉管：按现有技能系统保留主动技能，但统一消耗 12 献祭，删除无资源门槛的旧技能触发。
- 灾厄熔核：补两个主动模式。蓄能爆发固定消耗 18 点余烬释放 3 级 `heat_surge`；高热维持开启 `vanillaNether_inferno_upkeep` 持续窗口，每秒消耗 2 点余烬。
- 新增 `ash_conduit`、`slag_pump`、`soulfire_rhythm`、`gilded_recovery_belt` 四类非器官辅助件；每个辅助件进入 runtime 谓词，并由对应器官 JSON 实际读取，不得只作为配方。

`vanillaNether_runtime.js` 的修改：

- `HOME.structures` 加入 `cataclysm:burning_arena`、`cataclysm:soul_black_smith`。
- 新增 `vanillaNether_crimson_online` 谓词，仅使用绯红森林群系与 Cataclysm 下界结构判定，不再读取方块邻近或附近实体。
- 保留 `vanillaNether_resource_online` 的“至少 8 点”最低启动约定。
- 蓄能爆发统一走 OEP 技能系统或 `organironspell:cast_spell`，法术 id 为 `irons_spellbooks:heat_surge`；高热维持走短时窗口，不再直接套用半量清仓公式。

`organ_sources` 的修改：

- 保留现有 `cataclysm:netherite_monstrosity`、`cataclysm:ignis`、`cataclysm:ignited_revenant` 等来源。
- 新增 `alexsmobs:crimson_mosquito` / `alexsmobs:warped_mosco` 的解剖来源或猎获来源时，不创立独立 `Alex's Mobs` 来源标签，仍放入 `vanillaNether`。

## 九、数值与可实现性边界

- 献祭余烬默认上限维持现有 50 点底盘；生产类 +1 到 +3，转化类 1 到 4；蓄能爆发固定 12/18 点，高热维持按每秒 1 到 2 点持续消耗。
- 下界标记只做目标锁，不做第二个可积累资源；拾取手、猪灵契约、灰烬脾囊的 `+献祭` 是同一 counter。
- 负面抑制用现有 `damage_modify` / `mob_effect` / OEP 效果完成，不自己写熔岩伤害、枯萎诅咒或 Boss 招式模拟。
- 主动技能不能无消耗：灼喉囊、献火拳峰、黑焰喉管固定 12 点；灾厄熔核蓄能爆发固定 18 点，高热维持最低 20 点后按每秒 2 点持续消耗。
- 不新增独立温度条、魂火层数、深红饥渴条或长连招自动机。
- 不接管 Cataclysm 的烈焰之眼/巨兽之眼定位结构、Ignis 召唤、Netherite Monstrosity 阶段切换；器官只消费最终击杀与真实战利品。
- 不接管 Alex's Mobs 的绯红蚊子吸血/喷血状态、苍蝇转化绯红蚊子、Mungus 转化诡异蚊鬼；器官只做实体过滤、真实 loot table 与材料收益。
- 不新增独立 `Cataclysm` / `Alex's Mobs` 来源标签；它们仍归入原版群系/结构.下界。
