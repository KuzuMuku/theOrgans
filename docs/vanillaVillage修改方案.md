# 原版村庄实现稿（vanillaVillage）

## 本轮调整结论

村庄不再把 `村落声望` 当成“攒满 -> 半量敲钟 -> 再攒”的能量池。村落声望应被写成**村约与秩序余量**：交易、修补、守备和圣法支援不断维持它，村钟主核开启持续守钟窗口，按秒消耗声望，并在窗口内强化守护和支援，而不是半量清空换一次 `fortify`。

- 新增 `村账簿`、`钟绳绞盘`、`圣光导路`、`修补绷带` 四类村镇辅助件。
- 辅助件必须实际增强指定器官，不能只作为合成材料或任务奖励。
- `村钟主核` 改为持续 `vanillaVillage_bell_ward` 窗口，按秒消耗声望，提升铁傀肩甲和圣法支援。

本文是 `theOrgans/organs/vanillaVillage/design-vanilla-village.txt` 的下游施工图，对标幽匿 `vanillaShulk实现方案.md` 的完成度。它的职责不是把设计稿再扩写一遍，而是确定每个器官最后到底做成什么、从哪里获得、消耗什么、触发什么事件。

保留：

- 来源与主场：原版村庄 / 聚落 / 钟声 / 农田 / 工作站 / 村民与铁傀儡，不把村庄写成掠夺者或纯后勤。
- 基础面板：现有 JSON 的生命、护甲、韧性、魔力、冷却缩减、圣抗等基础属性不改。
- 功能宽度：保留已经落地的 15 个常规器官，不为了“精简”删掉职业件、补给件或守护件。
- 视觉主题：钟声、账本、村庄道路、工作站、农田、铁傀儡、牧师屋、村灯、补给路线。

收敛：

- 核心资源只保留 `村落声望`，运行时继续使用 `kubejs:vanillaVillage_resonance` + `kubejs:vanillaVillage_resonance_capacity`，不再拆出“订单储备 / 职业秩序 / 补给回流”三套平行文案；它定位为村约与秩序余量，不是半量清仓的储能池。
- 每个器官只承担“面板底盘、产声望、转化补给、守备反击、持续窗口”中的一种主要角色，删除同一器官里的多个替代写法。
- 不把村庄写成纯奶妈、不写成城镇管理器、不写成掠夺者附庸。村庄要强化交易、修补、守护和圣法支援，而不是复制村民经济模拟。

## 一、来源与主场

来源定位是：

```text
原版结构.村庄 + ChoiceTheorem's Overhauled Village + Iron's Spells.中立法师牧师
```

原版村庄负责身份、地形和结构；CTOV 负责整合包内已确认的大型村庄风貌扩展；Iron's Spells 牧师负责把“村庄圣法 / 中立施法者 / 牧师屋 / 圣典交易”接进教堂与支援链。它不单独成为新来源，而是作为村庄来源的高阶法师层。

### 主场条件

保持现有 `vanillaVillage_runtime.js` 的判定不变：

- 主世界（`minecraft:overworld`）。
- 附近存在 `minecraft:village_plains`、`minecraft:village_desert`、`minecraft:village_savanna`、`minecraft:village_snowy`、`minecraft:village_taiga`，沿用现有 8 chunk 结构搜索半径。

实现时只做两处扩展：

1. 把 `irons_spellbooks:priest` 保留为守备线 / 存在度统计单位，不再作为 `homeMatch` 的附近实体条件。
2. 把 Iron's Spells 的 `irons_spellbooks:priest_house` / `priest_house_taiga` 以及它自己的聚落变体结构作为“牧师屋在场”来源；不新增独立结构关键字，不虚构专属建筑。

## 二、内容模块清单

以下内容来自本地现有实现、Iron's Spellbooks 源码与整合包已有掉落配置，不额外猜测模组没有的结构或机制。

### 原版村庄基底地形与结构内容

- 结构层：平原村、沙漠村、热带草原村、雪原村、针叶林村，村庄道路、集会点、钟、水井、灯柱、房屋与职业工作站。
- 地形层：村庄周围的平原、农田、路径、耕地、干草捆、堆肥桶等村庄作物语义。
- 生态层：村民、流浪商人、铁傀儡、猫；夜间的僵尸 / 僵尸村民 / 尸壳 / 骷髅 / 蜘蛛，以及袭击的掠夺者 / 卫道士 / 女巫 / 劫掠兽。
- 方块语义：`minecraft:bell`、`farmland`、`smithing_table`、`lectern`、`cartography_table`、`stonecutter` 等，是现有主场和补给线判定使用的真实方块。
- 箱体来源：`minecraft:chests/village/village_cartographer`、`village_fletcher`、`village_library`、`village_plains_house`、`village_temple`、`village_toolsmith` 已用于器官掉落。

### ChoiceTheorem's Overhauled Village

- 整合包任务文档已把 CTOV 列入“强化村庄与聚落风貌”。
- 现有器官掉落脚本已经使用 `ctov:chests/village/village_library` 和 `ctov:chests/village/village_smith`。
- 本方案只吸收 CTOV 的村庄形态和箱体来源，不复制其原生村庄结构管理，也不把 CTOV 当成独立流派。

### Iron's Spells 中立法师单位内容

精确使用 Iron's Spellbooks 中与村庄最贴近的中立施法者：`irons_spellbooks:priest`。

- 实体：`PriestEntity` 是 `MobCategory.CREATURE` 的 `NeutralWizard`，实现 `SupportMob`、`HomeOwner`、`IMerchantWizard`，属于 Iron's Spellbooks 的 `village_allies` tag。
- 行为：会在村庄内游走、夜间回家、帮受伤的村民 / 玩家 / 村庄盟友上增益和治疗、对接近村庄的敌对生物还击；被玩家伤害或触发中立怒气后才会敌对。
- 法术：实际使用 `blessing_of_life`、`healing_circle`、`fortify`、`wisp`、`guiding_bolt`、`gust`、`heal`。其中 `fortify` 是半径 8 的范围吸收 / 守护增益，`healing_circle` 是范围治疗，`guiding_bolt` 是即时圣光投射物。
- 牧师屋：`VillageAddition.java` 把 `irons_spellbooks:priest_house` 和 `priest_house_taiga` 加入原版平原 / 针叶林村庄房池，配置项 `priestHouseWeight` 默认 4；本地还有 `badlands / bamboo / birch / cherry / dark_forest / giant_taiga / jungle / mountains / mushroom / oak / swamp` 的聚落变体数据和 `rs_pieces_spawn_counts`。
- 牧师屋战利品：治疗药水、强治疗药水、圣系随机卷轴、`irons_spellbooks:divine_pearl`、`irons_spellbooks:arcane_essence`、绿宝石、纸。
- 牧师实体掉落：`irons_spellbooks:arcane_essence`、圣系随机卷轴、`irons_spellbooks:magic_items/good_ink`。
- 交易：出售唤魔者要塞地图、治疗药水；`translated_archevoker_logbook` 可换到 `irons_spellbooks:villager_spell_book`，构成“赎回 / 启蒙”的村庄圣法语义。

其他 Iron's Spells 非村庄绑定的 `NeutralWizard` 商人（火法、冰法等）不进入本来源，避免把村庄变成火 / 冰 / 自然冒险站。只在弱联动掠夺者段落保留“从唤魔者要塞救回村民 / 牧师系资源”的跨界语义。

### 村镇辅助件

村庄辅助件是“账本、钟绳、圣光路和修补线”，必须实际增强对应器官：

| 辅助件 | 增强对象 | 具体作用 |
|---|---|---|
| `村账簿` `kubejs:village_ledger` | `交易脊轮`、`交易拾荒手`、`牧田脾囊` | 交易脊轮交易流周期声望 +1；交易拾荒手额外箱体/交易 roll 消耗从 3 点降至 2 点；牧田脾囊补给 roll 多 1 次 |
| `钟绳绞盘` `kubejs:bell_rope_winder` | `村钟主核`、`铁傀肩甲` | 村钟主核守钟窗口持续时间 +2 秒；铁傀肩甲在钟声窗口内的范围反击从 4 点提升到 6 点 |
| `圣光导路` `kubejs:holy_path_relay` | `职业肝囊`、`账册肺叶`、`声望冠脑` | 职业肝囊圣法施放回蓝 +1；账册肺叶圣法命中回响半径 +1 格；声望冠脑主场施法移速 +1 |
| `修补绷带` `kubejs:mending_suture` | `修补回流腺`、`赶路腿板` | 修补回流腺真实修补额外耐久从 +2 提升到 +4；赶路腿板每移动 2 格声望 +1，并在远征链中获得额外 1 点击退抗性 |

这些辅助件必须进入 runtime 谓词，并由对应器官词条实际读取。它们不是替代器官，而是像机械系的导线和管道一样把村庄的秩序、圣法和修补线路串起来。

## 三、村落声望闭环

村落声望是整套体系唯一可积累、可消耗的资源。

- 实现：`kubejs:vanillaVillage_resonance`，英文展示名从现有 `Order Reserve` 收敛为 `Village Prestige`。
- 上限：钟鸣心室 +50，交易脊轮 +20，职业肝囊 +8；新增村钟主核 +20。
- 最低可用阈值：保留 `vanillaVillage_resource_online`，当前声望不低于 8 才算可用储备。

### 产声望

| 来源 | 触发 | 产出 |
|---|---|---|
| 玩家 tick 的交易流 | 村民在场且绿宝石数量变化 | 每秒基础 +1；工作站在场 +1；铁傀儡或牧师同时在附近 +1；上限 +4 |
| 玩家 tick 的守备线 | 敌人在场且有村民 / 铁傀儡 | 每秒最多 +3 |
| 玩家 tick 的补给线 | 工作站 + 村民在场 | 每秒 +1 |
| 交易脊轮 | 交易流激活，40 tick 周期 | +3 |
| 职业肝囊 | 圣系法术施放 | +2 |
| 账册肺叶 | 圣系法术命中 | +2 |
| 村纹虹膜 | 投射物命中 | +1 |
| 铁傀肩甲 | 近战命中 | +1 |
| 修补回流腺 | 近战命中 / 受击 | +1 / +2 |
| 牧田脾囊 | 补给线激活，80 tick 周期 | +2 |
| 交易拾荒手 | 交易流激活，100 tick 周期 | +2 |
| 哨铃耳蜗 | 守备线激活，40 tick 周期 | +1 |
| 灯塔肾鞘 | 补给线激活，60 tick 周期 | +1 |
| 供奉腺团 | 交易流激活，60 tick 周期 | +1 |
| 赶路腿板 | 每移动 2 格 | +1 |

### 耗声望

- `村钟主核`：开启持续 `vanillaVillage_bell_ward` 守钟窗口，按秒消耗声望，不再半量清仓。
- `牧田脾囊`：交易窗口的额外补给 roll 消耗 3 点；`村账簿` 在线时降至 2 点。
- `交易拾荒手`：补给窗口的额外箱体 / 交易 roll 消耗 3 点；`村账簿` 在线时降至 2 点。
- `村纹虹膜 / 冠脑联动`：冠脑链延长发光标记时消耗 2 点。
- `修补回流腺`：真实 `item_repair` 额外修理消耗 2 点。

这保证声望不是只进不出的日志：资源件有少量消费端，最终主动件有持续消耗端。

## 四、器官落地清单

保持现有 15 个器官，新增 1 个村钟主核，共 16 个。

| 器官 | 来源 / 采集 | 唯一生态位 | 主要效果 / 触发 / 代价 |
|---|---|---|---|
| 钟鸣心室 | `village_plains_house` 箱；村民胸腔 loadout | 聚落底盘与声望上限 | 常驻 `max_health +4`、`armor +1`、声望上限 +50；主场 +2 生命 / +1 护甲；4 件同源 +2 生命；声望可用 +1 韧性。无消耗。 |
| 交易脊轮 | 手术配方：绿宝石、钟、制图台 | 交易账本与收益 | 常驻 `armor +1`、`knockback_resistance +1`、声望上限 +20；交易流每 2 秒 +3 声望并 roll 绿宝石 / 纸 / 书；守备线 +1 韧性。 |
| 秩序胸骨 | `village_smith` / `village_toolsmith` 箱 | 站场与防守底盘 | 常驻 `armor +3`、`armor_toughness +1`；主场与声望可用各 +1 击退抗性；支援链 +2 生命。 |
| 职业肝囊 | 村民腹部 loadout | 法力盘与圣法回蓝 | 常驻 `max_mana +40`、`mana_regen +1`、声望上限 +8；主场 +20 蓝 / +1 回蓝；圣法施放回 4 蓝并 +2 声望。 |
| 声望冠脑 | `village_plains_house` 箱 | 圣法冷却与节律 | 常驻 `cooldown_reduction +2`、`holy_magic_resist +3`；圣法进入冷却回 3 蓝；主场施法移速 +1。 |
| 账册肺叶 | 村庄图书馆 / CTOV 图书馆箱 | 圣法增幅与命中回响 | 常驻 `holy_spell_power +4`、`cast_time_reduction +1`；圣法命中 +2 声望，并对半径 4 内目标造成 2 点账册回响与 4 秒发光；主场施法移速 +1。 |
| 牧田脾囊 | 村民腹部 loadout | 农务补给 | 补给线每 4 秒 roll 面包 / 小麦 / 胡萝卜并 +2 声望；交易窗口额外 roll 消耗 3 声望。需要工作站与村民，不做全局种植掉落。 |
| 修补回流腺 | 手术配方：经验流体、铁粒、修补药膏 | 修补与耐久回流 | 近战命中 / 受击回 1 点生命并产声望；声望可用时受击触发短再生；新增 `item_repair -> repair_item`，真实修补时消耗 2 声望多修 2 点耐久。 |
| 灯塔肾鞘 | `village_temple` 箱 | 据点夜护与补给 | 常驻 `armor +1`、`max_health +1`；守备线 +2 生命 / +1 击退抗性；补给线每 3 秒 +1 声望。 |
| 哨铃耳蜗 | `village_plains_house` 箱 | 预警与守备压力 | 常驻 `armor +1`、`knockback_resistance +1`；守备线 +2 生命 / +1 护甲；守备线每 2 秒 +1 声望。 |
| 村纹虹膜 | `village_cartographer` 箱 | 远程 / 圣法瞄准 | 常驻 `cooldown_reduction +1`；投射物命中施加 4 秒发光并 +1 声望；冠脑存在时消耗 2 声望延长到 6 秒。 |
| 供奉腺团 | `village_temple` 箱 | 交易供奉转法力 | 常驻 `armor +1`、`mana_regen +1`；交易流 +20 蓝 / +1 回蓝，并每 3 秒 +1 声望。 |
| 铁傀肩甲 | 手术配方：铁锭、铁板、精炼傀儡板 | 守护反击 | 常驻 `attack_damage +1`；近战命中造成半径 4 内 2 点铁拳冲击并 +1 声望；追猎链命中给目标发光；钟声窗口内范围反击提升到 4 点。 |
| 赶路腿板 | 手术配方：皮革靴、地图、绿宝石 | 远征机动 | 常驻 `movement_speed +1`；每移动 2 格 +1 声望；追猎链、主场再各 +1 移速；主场 +1 击退抗性。 |
| 交易拾荒手 | `village_fletcher` 箱 | 交易箱体拾荒 | 交易流每 5 秒 +2 声望并 roll 绿宝石 / 纸 / 书 / 灯笼；补给窗口额外 roll 消耗 3 声望。 |
| 村钟主核 | `irons_spellbooks:priest` 高阶来源 / 牧师屋手术材料 | 最终主动出口：持续守钟窗口 | 见下方独立说明；`钟绳绞盘` 在线时窗口 +2 秒。 |

### 村钟主核

- 物品 ID：`kubejs:village_bell_core`
- 来源：新增 `organ_source_irons_spellbooks_priest.json`，把 `village_bell_core` 放入牧师胸腔槽位；同时保留手术配方替代路线，材料锚定 `irons_spellbooks:villager_spell_book`、`irons_spellbooks:divine_pearl`、`kubejs:bell_chime_axle`、`kubejs:mending_salve`。
- 定位：村庄守护终端，不是单体输出。它把长期积累的声望转成持续守钟窗口，让守护和圣法支援稳定运行，而不是一次性敲钟。
- 面板：常驻 `max_health +4`、`armor +2`、`holy_spell_power +2`、`light_affinity +4`、村落声望上限 +20；提供主动技能 `kubejs:village_bell_core`。
- 技能：冷却 600 tick，`castEvent` 使用 `village_bell_core_cast`，最低要求声望不低于 24。
- 释放流程：
  1. 开启 `vanillaVillage_bell_ward`，持续 10 秒，期间每秒消耗 2 点村落声望；不足时窗口提前结束。
  2. 窗口内以 `irons_spellbooks:fortify` 的 1 级基础效果作为吸收/守护表现，但不再用 `floor(spend / 8)` 决定等级。
  3. 窗口内玩家和盟友获得 `armor_toughness +1` 与 `knockback_resistance +1`，并每 2 秒恢复 1 点生命。
  4. `铁傀肩甲` 在守钟窗口内的范围反击从 2 点提升到 4 点；`钟绳绞盘` 在线时窗口 +2 秒，且范围反击提升到 6 点。

选择 `fortify` 而不是自定义 AOE 的原因：它是 Iron's Spells 牧师真实支援法术，原生提供吸收、半径 8、长持续，已有法力消耗、冷却和施法动画；守钟窗口只把它作为持续守护的表现，不需要把声望换算成法术等级。

## 五、负面抑制与综合增强

### 负面抑制

- 袭击与夜间作战不白吃：`哨铃耳蜗` 把敌袭压力转成守备线与声望，`铁傀肩甲` 把命中转成范围反击，`灯塔肾鞘` 在守备 / 补给窗口提供生存底盘。
- 耐久损耗不是纯惩罚：`修补回流腺` 用真实 `item_repair` 事件转成额外修理；手术配方里的经验流体和修补药膏作为村庄修补语义的落地材料，不额外做自定义锻造流程。
- 长途远征的节奏损失有补偿：`赶路腿板` 提供移动与移动产声望，`交易拾荒手` 和 `牧田脾囊` 把沿途补给 / 交易窗口转成资源。
- 牧师中立法则不误触：把 `irons_spellbooks:priest` 当作村庄盟友和主场单位，不模仿“攻击牧师 / 偷牧师屋箱子触发怒气”作为战斗力来源；器官只消耗交易、修理、守护和圣法事件。
- 不新增经济 debuff：不做贷款、税收、村民破产、商店涨跌或复杂好感模拟。

### 综合增强

- 圣法：`holy_spell_power`、`max_mana`、`mana_regen`、`cooldown_reduction`、`cast_time_reduction`、`casting_movespeed`、圣法命中回响。
- 生存：`max_health`、`armor`、`armor_toughness`、`knockback_resistance`、短治疗与再生。
- 战斗：近战范围冲击、发光标记、守备线反击、远程命中标记。
- 资源：绿宝石、纸、书、灯笼、面包、小麦、胡萝卜、圣法卷轴 / 材料、村庄箱体与交易收益。

## 六、联动链

### 1. 秩序经营链

```text
村账簿 -> 交易脊轮 -> 秩序胸骨 -> 声望冠脑
```

村账簿增强交易生产，脊轮经营交易，胸骨负责站场，冠脑把秩序转成圣法节奏。

### 2. 村庄补给链

```text
圣光导路 -> 职业肝囊 -> 账册肺叶
修补绷带 -> 修补回流腺
村账簿 -> 牧田脾囊 -> 交易拾荒手
```

肝囊给蓝量，肺叶给圣法命中回声，回流腺处理耐久与回复，脾囊和拾荒手负责农田 / 箱体补给。补给 extra roll 消耗声望，避免免费印钱。

### 3. 村庄守护链

```text
秩序胸骨 -> 灯塔肾鞘 -> 哨铃耳蜗 -> 铁傀肩甲 -> 钟绳绞盘 -> 村钟主核
```

胸骨站住、肾鞘在守备 / 补给窗口兜底、耳蜗把袭击转成守备压力、肩甲做范围反击、主核敲钟触发团队守护与增强反击。

### 4. 远征支援链

```text
村纹虹膜 -> 修补绷带 -> 赶路腿板 -> 村账簿 -> 交易拾荒手
```

虹膜负责远程 / 圣法瞄准，腿板负责长途移动与移动产声望，拾荒手把交易 / 补给点转成远征成本。

### 5. 铁魔法牧师链

```text
圣光导路 -> 职业肝囊 -> 账册肺叶 -> 声望冠脑 -> 村钟主核
```

这套链把 Iron's Spells 牧师的圣法内容完整吸收：圣法施放回蓝、圣法命中回响、圣法冷却节律、最终范围守护主动。

### 6. 弱联动掠夺者

```text
哨铃耳蜗 -> 铁傀肩甲 -> 交易拾荒手
```

掠夺者袭击只作为守备线触发；唤魔者要塞里的村民笼 / 村民法师救援语义不直接抬高掠夺者来源，而是通过“守备、救回、交易拾荒”变成村庄收益。

## 七、Synergia 元素点

现有 15 件全部使用 `organsynergia:light_affinity`：

- 钟鸣心室 3、交易脊轮 2、秩序胸骨 2、职业肝囊 4、声望冠脑 4、账册肺叶 6。
- 牧田脾囊 2、修补回流腺 2、灯塔肾鞘 3、哨铃耳蜗 3、村纹虹膜 3、供奉腺团 3。
- 铁傀肩甲 3、赶路腿板 1、交易拾荒手 2。
- 合计 43 点；新增村钟主核 +4 后为 47 点。

不要给村庄混入火、冰、自然、暗或机械元素点，保持在圣 / 光系秩序方向。

## 八、当前 JSON 修改点

落地时对现有 `organs/vanillaVillage/` 做以下收敛和扩展：

- `vanillaVillage_runtime.js`：`RESOURCE` 展示名改为村落声望 / Village Prestige；`homeMatch` 只使用村庄结构与牧师屋结构；附近实体统计仍保留 `irons_spellbooks:priest`，但只用于守备线，不再决定主场；`SOURCE_IDS` 加入 `kubejs:village_bell_core`；新增 `vanillaVillage_bell_ward_online` 谓词和四类辅助件在线谓词。
- `startup_scripts/vanillaVillage_organs.js`：物品列表加入 `village_bell_core`，并注册 `kubejs:village_bell_core` 技能。
- `server_scripts/vanillaVillage_runtime.js`：新增 `OrganKubejsEvents.skillCast('village_bell_core_cast')`，按“持续消耗 -> 基础 Fortify 表现 -> 守钟窗口”实现。
- `server_scripts/vanillaVillage_tags.js`：把 `kubejs:village_bell_core` 加入 `organapi:organs`。
- `data/kubejs/organapi/organs/trade_scavenger_hand.json`、`field_spleen.json`：交易 / 补给窗口的额外 roll 改为消耗 3 点村落声望。
- `data/kubejs/organapi/organs/village_iris.json`：删除 `vanillaVillage_has_support -> attack_damage` 这一类旁支；冠脑延长发光改为消耗 2 点声望。
- `data/kubejs/organapi/organs/repair_reflux_gland.json`：新增 `item_repair` 事件与 `repair_item` 执行，消耗 2 点声望。
- `data/kubejs/organapi/organs/iron_guard_shoulder.json`：新增钟声窗口分支，范围反击伤害从 2 点提升到 4 点。
- `data/kubejs/organapi/organs/village_bell_core.json`：新增核心器官。
- 新增 `village_ledger`、`bell_rope_winder`、`holy_path_relay`、`mending_suture` 四类辅助件；每个辅助件都进入 runtime 谓词，并由对应器官 JSON 实际读取，不得只作为配方。
- `organ_sources/vanillaVillage/`：新增 `organ_source_irons_spellbooks_priest.json`，并把牧师屋箱来源和圣法材料挂进村庄来源。
- `assets/kubejs/lang/en_us.json` / `zh_cn.json`：补齐 `village_bell_core`、声望新旧key、钟声窗口和技能文案。

## 九、避免问题与落地限制

- 不得让 `牧田脾囊` 和 `交易拾荒手` 共用同一套 tick-loot 模板。农田补给只给作物类，交易拾荒只给绿宝石 / 纸 / 书 / 灯笼类，触发窗口和掉落表分开。
- 不得让每件都产声望。固定产源是交易流、守备线、补给线、职业肝囊、账册肺叶、村纹虹膜、铁傀肩甲、修补回流腺、牧田脾囊、交易拾荒手、哨铃耳蜗、灯塔肾鞘、供奉腺团、赶路腿板；其余只做面板、窗口或主动。
- 不得让声望变成纯日志。至少要有村钟主核的持续窗口消耗，以及其他 2 到 3 点的小额消耗端。
- 不虚构 Iron's Spells 内容。主动法术只用牧师实际使用的 `irons_spellbooks:fortify`，辅助增幅沿用 `holy` 学派；不调用不存在的“村钟法术”或“牧师技能”。
- 不接入完整村民经济模拟。交易流用现有“村民在场 + 绿宝石数量变化”实现，不做村民好感、价格折扣、职业升级或商店库存。
- 不把牧师写成可召唤 / 可奴役单位。牧师只作为主场单位、圣法来源和手术 / 战利品入口。
- 保持实现复杂度边界：全部使用 counter、runtime、mark、既有事件、Iron's Spells 法术和现有 KubeJS 主动技能模式，不引入可编程序列或跨来源强联动。
