# 原版掠夺者实现稿

## 本轮调整结论

掠夺者不再保留“袭击热度攒满 -> 半量清仓 -> 尖牙处决”的统一循环。袭击热度应被写成**战场热度**：只有在连续战斗、袭击波次、拆旗和搜刮时才会升高，脱离战斗后会冷却；主核开启持续掠夺狂潮窗口，而不是一次性把热度清掉。

- 新增 `掠夺旗带`、`猎弩弦轴`、`战鼓皮膜`、`掠夺绳结` 四类战场辅助件。
- 辅助件不是合成材料，而是持续增强指定器官的“军需挂件 / 战场连接件”。
- `劫掠主核` 改为持续 `vanillaPillager_raid_surge` 窗口，按秒消耗热度，带标记目标被击杀时返还部分热度。

本文是 `design-vanilla-pillager.txt` 的施工图版本，并沿用 `vanillaShulk实现方案.md` 的落地原则：保留来源与面板，把每个器官的功能类特效收敛成单效果，让“袭击热度”和“掠夺标记”形成真正可产生、可消耗、可互动的资源闭环。

本方案不是把掠夺者拆成“原版野外 + 林地府邸 + Iron's Spells 唤魔者”三套平行来源，而是把它们收进同一个 **原版结构.掠夺者** 来源：

```text
原版结构.掠夺者
├─ 掠夺者前哨 / 巡逻 / 袭击 / 村庄冲突战场（基底）
├─ 原版林地府邸（高阶原版掠夺者结构）
└─ Iron's Spells.唤魔者要塞 / 高位唤魔者（魔法敌对扩展层）
```

这样既能保留掠夺者的“突袭、猎杀、旗帜、弩阵、战利品”身份，也能把模组内容作为毕业猎杀和施法层吸收，而不是让 Iron's Spells 变成新的独立来源。

## 一、来源与主场

### 来源定位

这套器官的完整来源是：

```text
原版结构.掠夺者 + Iron's Spells.唤魔者敌对扩展
```

其中：

- 原版掠夺者前哨、巡逻队、袭击波次、坏兆头、劫掠兽、旗帜和弩阵是基础层。
- 林地府邸是原版掠夺者结构中的高阶层，负责提供更密集的唤魔者、卫道士、恼鬼、村民/铁傀儡冲突和搜刮内容。
- Iron's Spells 的 `evoker_fort`、`archevoker`、`summoned_vex` 和唤魔法术学校，作为掠夺者来源的魔法敌对扩展层，不另开来源标签。
- 女巫保留在掠夺者阵营，但只作为“危险施法者 + 战利品”和村庄弱联动，不接管村庄经营体系。

### 主场条件

保留现有 `vanillaPillager_runtime.js` 的主场判定不变：

- 主世界（`minecraft:overworld`）。
- 结构：`minecraft:pillager_outpost`、`minecraft:woodland_mansion`、`irons_spellbooks:evoker_fort`，沿用现有 8 chunk 结构搜索半径。

只追加两类高层结构，不改变旧条件：

```text
structures:
  minecraft:pillager_outpost
  minecraft:woodland_mansion
  irons_spellbooks:evoker_fort
```

同时把 Iron's Spells 敌对施法者加入阵营判定：

```text
entities:
  minecraft:pillager
  minecraft:vindicator
  minecraft:evoker
  minecraft:illusioner
  minecraft:witch
  minecraft:ravager
  minecraft:vex
  irons_spellbooks:summoned_vex
  irons_spellbooks:archevoker
```

“荒原战场”由 `minecraft:pillager_outpost`、`minecraft:woodland_mansion`、`irons_spellbooks:evoker_fort` 三个结构表达，不再使用附近实体或坏兆头作为主场判定。

## 二、核心资源与状态

保留两个可交互状态，删除设计稿里的“战利品回流”作为独立状态，把它降级为资源效果的行文说明：

### 1. 袭击热度

内部 ID 保持现有实现不变：

```text
current:   kubejs:vanillaPillager_resonance
capacity:  kubejs:vanillaPillager_resonance_capacity
```

展示名统一为“袭击热度”。它代表玩家在袭击、前哨、营地、林地府邸或唤魔者要塞战场中积累的战斗势能，不是被动攒满的储能池。

- 生产端：旗帜脊轮（击杀/连杀/袭击）、战鼓耳蜗（附近战场压力）、袭击波次推进。
- 战场辅助件：`掠夺旗带`、`战鼓皮膜` 分别增强旗帜脊轮和战鼓耳蜗的生产效率。
- 小量消耗端：暗箭喉囊的压制弹、袭击拾荒手的额外搜刮。
- 终局消耗端：劫掠主核开启持续 `vanillaPillager_raid_surge`，按秒消耗热度，不再半量清仓。
- 冷却端：脱离战斗 15 秒后，热度每 3 秒损失 1 点；它只在真正的掠夺节奏中保持高位。

### 2. 掠夺标记

内部 ID 保持现有实现不变：

```text
mark:kubejs:vanillaPillager_mark
```

它只代表目标已被掠夺者体系锁定。

- 上标记：斥候臂束（近战）、侦掠虹膜（远程命中）、破阵腺团（唤魔法术命中）。
- 吃标记：劫掠主核在掠夺狂潮窗口内强化带标记目标的处决与战利品回收。

这样“上标记”按攻击方式分三个落点，“吃标记”集中在核心主动，不会出现同一行为散落多个器官的问题。

## 三、内容模块清单

| 模块 | 实际内容 | 本方案的吸收方式 |
|---|---|---|
| 原版林地府邸 | `minecraft:woodland_mansion`、`minecraft:evoker`、`minecraft:vindicator`、`minecraft:vex`、`minecraft:allay`、林地府邸箱、唤魔者掉落的图腾 | 主场结构扩展；府邸中的唤魔者/卫道士/恼鬼作为阵营压力和猎杀来源；战利脾囊、袭击拾荒手处理府邸搜刮；劫掠主核承载“唤魔尖牙”这一府邸风格主动 |
| 掠夺者前哨与袭击基底 | `minecraft:pillager_outpost`、掠夺者巡逻、袭击波次、坏兆头、灾厄旗帜、弩、箭、绿宝石、劫掠兽、村庄冲突战场 | 保留现有主场；劫掠心室、前哨胸甲、旗帜脊轮承担站场、压力和热度；战利脾囊与袭击拾荒手处理袭击/前哨资源回流 |
| Iron's Spells 敌对法师 | `irons_spellbooks:evoker_fort`、`irons_spellbooks:archevoker`、`irons_spellbooks:summoned_vex`、`irons_spellbooks:evoker_spell_book`、`irons_spellbooks:arcane_essence`、`irons_spellbooks:evocation_rune`、`irons_spellbooks:scroll`、`irons_spellbooks:chests/evoker_fort`、`irons_spellbooks:chests/evoker_fort/guard_tower` | 追加主场结构；唤魔法术使用 `irons_spellbooks:evocation` 学校属性；破阵腺团负责法术上标记；号角冠脑保留唤魔法术抗性；劫掠主核由解剖高位唤魔者获得的素材支撑，主动释放 `irons_spellbooks:fang_swirl` |
| 女巫 / 村庄弱联动 | `minecraft:witch`、被抓村民、坏兆头与村庄袭击冲突 | 保留女巫的掠夺者阵营语义；只做弱联动，不把村庄交易、秩序或守护做成掠夺者主轴 |

高位唤魔者的原生行为按仓库源码确认：

```text
Archevoker:
  summon_vex / fang_strike / firecracker / fang_ward / shield / invisibility
  GustDefenseGoal 作为近距离防御
```

本方案不复制完整 AI，只把其中的 `fang_swirl` 提取为劫掠主核主动，把唤魔法术学校用作法系标记与抗性字段。

### 战场辅助件

掠夺者的辅助件是“军需挂件”，必须实际增强某个或某几个器官，而不是只当配方材料：

| 辅助件 | 增强对象 | 具体作用 |
|---|---|---|
| `掠夺旗带` `kubejs:raider_banner_sash` | `旗帜脊轮`、`劫掠心室` | 让旗帜脊轮在袭击/连杀时额外 +1 热度；劫掠心室在前哨/林地府邸/唤魔者要塞获得额外 1 点护甲韧性 |
| `猎弩弦轴` `kubejs:crossbow_string_winder` | `侦掠虹膜`、`暗箭喉囊`、`斥候臂束` | 侦掠虹膜远程命中发光时间 +1 秒；暗箭喉囊固定消耗由 12 点降至 10 点；斥候臂束命中后上标概率提高 |
| `战鼓皮膜` `kubejs:wardrum_head` | `战鼓耳蜗`、`号角冠脑` | 战鼓耳蜗战场压力积热周期从 40 tick 缩短到 30 tick；号角冠脑进入高热度/战场窗口所需热度阈值降低 4 点 |
| `掠夺绳结` `kubejs:plunder_knot` | `战利脾囊`、`袭击拾荒手`、`绿宝肝囊` | 战利脾囊击杀/清波 roll +1 次；袭击拾荒手结构搜刮额外 roll 消耗由 3 点降至 2 点；绿宝肝囊获得 2 秒额外回蓝窗口 |

这些辅助件可以在 runtime 中作为“辅助件在线”的谓词存在，也必须让对应器官词条实际读取它们，不能只写进配方或任务。

## 四、器官列表

保留现有 15 个器官，新增 1 个劫掠主核。基础静态面板不动，只收敛功能落点。

| 器官 | ID | 面板 | 唯一功能落点 | 触发 / 消耗 | 限制 / 代价 |
|---|---|---|---|---|---|
| 劫掠心室 | `kubejs:raider_ventricle` | 生命、护甲、护甲韧性、暗亲和、袭击热度上限 | 主场承载底板：前哨/林地府邸/唤魔者要塞附近提高生命与护甲 | 静态 + `vanillaPillager_home` | 不做主动输出，离开主场只保留基础面板 |
| 旗帜脊轮 | `kubejs:banner_spinewheel` | 护甲、击退抗性、暗亲和、热度上限 | 袭击、连杀或目标击杀积累袭击热度 | `raid` / `kill` / 波次推进 | 不产战利品、不产蓝，是热度主生产端 |
| 前哨胸甲 | `kubejs:outpost_chestplate` | 护甲、护甲韧性、暗亲和 | 前哨/旗帜/袭击主场站场稳定：更多击退抗性与承压 | `vanillaPillager_home` / 袭击线 | 不叠血量功能，不产热度 |
| 绿宝肝囊 | `kubejs:emerald_liver` | `max_mana`、`mana_regen`、暗亲和 | 击杀、袭击或掠夺回流后获得短时回蓝 | `kill` / `raid` / 资源回流 | 只做蓝量续航，不额外给战利品 |
| 号角冠脑 | `kubejs:horn_crown` | `cooldown_reduction +2`、`evocation_magic_resist +3`、暗亲和 | 高袭击热度或唤魔者战场中施法移速 +1、施法时间缩减 +1 | 热度阈值 / 主场 | 不回蓝、不叠额外法术强度 |
| 战利脾囊 | `kubejs:loot_spleen` | 暗亲和 | 掠夺者战利品回流：击杀/清波后 roll 箭、弩、绿宝石、旗帜 | `kill` / 袭击波次 | 只做战斗掉落，不做箱体搜刮 |
| 侦掠虹膜 | `kubejs:scout_iris` | `cooldown_reduction`、暗亲和 | 远程命中给目标上掠夺标记并短暂发光 | `projectile_hit` | 不做范围伤害，不给全员免费虚弱 |
| 袭击拾荒手 | `kubejs:raid_scavenger_hand` | 暗亲和 | 前哨、林地府邸、唤魔者要塞的结构搜刮与拆旗收益 | 开箱 / 拆旗 / 结构环境 | 不做击杀掉落，使用真实结构战利品表 |
| 破阵腺团 | `kubejs:breach_gland` | `evocation_spell_power`、`cast_time_reduction`、暗亲和 | 唤魔法术命中时给目标上掠夺标记并短时虚弱 | `spell_hit`，school 为 `irons_spellbooks:evocation` | 只负责法系上标，不额外直接伤害 |
| 流亡肾鞘 | `kubejs:exile_kidneysheath` | 暗亲和 | 长距离奔袭、夜袭或战后撤离时，脱离战斗后 5 秒内每 2 秒恢复 1 点生命，击退抗性 +1 | 远距移动 / 脱离战斗 / 受击窗口 | 不做无条件持续回血 |
| 战鼓耳蜗 | `kubejs:war_drum_cochlea` | 护甲、攻击伤害、暗亲和 | 附近每有一个掠夺者/恼鬼/高位唤魔者，每 2 秒 +1 袭击热度，上限 +3 | 附近实体 / 袭击线 | 不做主动伤害，是感知型热度副生产端 |
| 暗箭喉囊 | `kubejs:dark_arrow_throat` | 主动技能槽、暗亲和 | 主动消耗 12 点袭击热度射出暗箭，命中造成伤害并施加虚弱 | 主动技能 | 必须持有热度才能施放，不免费压制 |
| 斥候臂束 | `kubejs:skirmish_arm` | 攻击伤害、暗亲和 | 近战命中给目标上掠夺标记 | `deal_damage` / 近战命中 | 不再额外造成固定伤害，只负责近战上标 |
| 旗刺肩甲 | `kubejs:banner_spike_shoulder` | 攻击伤害、暗亲和 | 受击或击杀后 5 秒内攻击 +2、投射物伤害 +2 | `attacked` / `kill` | 短时窗口，不做高额持续伤害 |
| 夜袭足腱 | `kubejs:nightraid_tendon` | 移动速度、暗亲和 | 夜间、前哨/营地/林地府邸和袭击战场中提高追击、转身与撤离速度 | 夜间 / 主场 / 移动 | 不产热度，不无条件永久加速 |
| 劫掠主核 | `kubejs:plunder_core` | 袭击热度容量 +25、暗亲和 5、生命上限 +2 | 主动开启持续掠夺狂潮窗口，按秒消耗热度，并强化带标记目标的尖牙处决与战利品回收 | 主动技能 | 启动需 20 热度，持续消耗；没有标记目标时窗口收益较低 |

## 五、核心器官：劫掠主核

### 来源

`kubejs:plunder_core` 来自解剖 `irons_spellbooks:archevoker`。若该实体或加载顺序不可用时，降级来源为林地府邸中的 `minecraft:evoker`，但掉落概率和面板需求应更高。

### 效果

```text
主动开启 vanillaPillager_raid_surge，持续 8 秒。
窗口期间每秒消耗 2 点袭击热度。
窗口内，对带掠夺标记的目标使用尖牙处决时：
  - 处决更容易命中；
  - 每名被处决的带标记目标返还 3 点袭击热度；
  - 处决击杀目标额外 roll 一次战利脾囊或袭击拾荒手的战利品回收。
```

`fang_swirl` 只作为尖牙处决的视觉/命中落点，不再由 `spend = floor(current / 2)` 决定等级。玩家需要在窗口开启前建立标记线，并在窗口内持续收割；没有标记目标时窗口只提供移动速度 +1 和施法时间缩减 +1，但不会半量清空资源。

## 六、联动链

### 1. 标记锁定链

```text
斥候臂束（近战上标）
侦掠虹膜（远程上标 + 发光）
破阵腺团（唤魔法术上标 + 虚弱）
→ 劫掠主核（吃标记处决）
```

这套链让三种攻击方式都有自己的上标入口，但最终消费端只有一个，避免标记被到处乱吃。

### 2. 袭击热度链

```text
掠夺旗带 -> 旗帜脊轮（击杀/袭击产热）
战鼓皮膜 -> 战鼓耳蜗（战场压力产热）
→ 暗箭喉囊 / 劫掠主核（持续窗口消耗热度）
```

热度不是全局白送资源。没有旗帜脊轮或战鼓耳蜗时，仅凭普通战斗不会积累可用的袭击热度；辅助件只增强生产，不替代生产件。

### 3. 战利品回流链

```text
掠夺绳结 -> 战利脾囊（战斗掉落）
掠夺绳结 -> 袭击拾荒手（结构搜刮）
掠夺绳结 -> 绿宝肝囊（击杀/搜刮后回蓝）
```

脾囊负责“打完拿”，拾荒手负责“拆完拿”，肝囊只把回流转成法术续航，三种行为不重复。

### 4. 战场站桩链

```text
劫掠心室 → 前哨胸甲 → 号角冠脑 → 旗刺肩甲
```

心室提供热度和基础生存，胸甲负责承压，冠脑负责战场节奏，肩甲负责受击/击杀后的短时反压。

### 5. 女巫 / 村庄弱联动

- 女巫继续计入掠夺者阵营存在度，参与诅咒线。
- 号角冠脑的 `evocation_magic_resist` 只压魔法敌对伤害，不给村庄体系强联动。
- 唤魔者要塞中被抓村民只作为 Iron's Spells 原生解救内容和村庄侧弱联动素材，不进入掠夺者主轴。

## 七、当前 JSON 修改点

落地时对现有 `organs/vanillaPillager/` 做以下收敛：

1. `vanillaPillager_runtime.js`
   - `HOME.structures` 加入 `minecraft:woodland_mansion`、`irons_spellbooks:evoker_fort`。
   - `PILLAGER_FACTION_IDS` 加入 `minecraft:vex`、`irons_spellbooks:summoned_vex`、`irons_spellbooks:archevoker`。
   - 删除 `PlayerEvents.tick` 中无器官也全局产热的逻辑，热度生产改由旗帜脊轮、战鼓耳蜗判定。
   - 删除 `applyLinearLinks` 对攻击、法强、蓝量、韧性的隐藏全局堆叠；基础属性留在各器官 JSON 的静态面板中。
2. 各器官 JSON
   - 保留静态面板和暗亲和。
   - 删除设计中“又产热 / 又回蓝 / 又掉战利品 / 又加伤害”的多效果堆叠。
   - 每个器官只保留表格中的唯一功能落点。
3. `startup_scripts/vanillaPillager_organs.js`
   - 注册 `plunder_core`，并注册 `plunder_core_cast` 主动技能；技能开启 `vanillaPillager_raid_surge` 窗口，不再使用半量清仓公式。
4. `server_scripts/vanillaPillager_tags.js` 与 `vanillaPillager_runtime.js`
   - 把 `kubejs:plunder_core` 加入器官标签、来源集合与技能判定。
5. 战利品来源
   - `organ_sources/vanillaPillager/kubejs/server_scripts/vanillaPillager_organ_chest_loot.js` 除 `minecraft:chests/pillager_outpost` 外，追加 `minecraft:chests/woodland_mansion` 与 `irons_spellbooks:chests/evoker_fort`。
   - 高层结构掉落优先放新核心或高阶器官，原版前哨保持现有低概率。
6. 手术来源
   - 新增 `organ_source_irons_spellbooks_archevoker.json`，让 `irons_spellbooks:archevoker` 可产出 `kubejs:plunder_core`、`kubejs:breach_gland`、`kubejs:horn_crown` 等法系器官。
   - 保留现有 `minecraft:evoker` 与 `minecraft:ravager` 来源表，不删除旧解剖路线。
7. 战场辅助件
   - 新增 `raider_banner_sash`、`crossbow_string_winder`、`wardrum_head`、`plunder_knot`。
   - 每个辅助件都进入 runtime 谓词，并由 `旗帜脊轮`、`战鼓耳蜗`、`暗箭喉囊`、`战利脾囊`、`袭击拾荒手`、`绿宝肝囊` 等词条实际读取；不得只作为合成材料。

## 八、数值与可实现性边界

- 袭击热度默认上限维持现有 50 点。
- 生产类器官按周期性 +1 到 +3 控制；小量消耗 10 到 12 点；终局主动窗口按每秒 2 点持续消耗，不再半量清仓。
- 脱离战斗 15 秒后热度开始冷却，避免无战事囤积。
- `fang_swirl` 只作为尖牙处决视觉/命中，不重写尖牙实体或 AI。
- `spell_hit` 只绑定 `irons_spellbooks:evocation` 学校，不强化全法系。
- 不做复杂袭击脚本、行为树或自定义多阶段状态机；袭击压力继续由 `raid`、`kill`、`nearby_entity`、坏兆头和结构条件表达。
- 不新增独立来源标签；林地府邸与 Iron's Spells 唤魔者内容都属于原版结构.掠夺者。
