# 原版海洋实现稿（vanillaOcean）

## 本轮调整结论

海洋保留“海压储能”循环。原因是海洋本身最接近水压、潮汐和泄压阀，储能到释放符合来源身份。

本轮不做换皮式重写，只补两件事：

1. 加入洋流导管、盐析阀、潮汐浮标这类“血管/管路”辅助件，让海压不是从孤立器官凭空进技能，而是被管路和阀门接管。
2. 把 `冰渊主核` 从“半量清仓放一个 Iron 法术”改成“压差泄压”，保留部分海压作为潮汐底压，和沙漠、雪原的主核不再同构。

## 一、文档定位与取舍标准

本文是 `theOrgans/organs/vanillaOcean/design-vanilla-ocean.txt` 的下游取舍稿，对标幽匿 `vanillaShulk实现方案.md` 和繁茂洞穴实现稿的完成度。它的职责不是把概念稿再扩写一遍，而是确定每个器官最后做成什么、从哪里获得、消耗什么、触发什么事件。

保留：

- 来源与主场：原版海洋/海滩群系、海洋神殿附近，加入玩家所在维度下雨的判断。现有 `vanillaOcean_runtime.js` 的 `HOME` 判定继续使用 `minecraft:overworld`、`ocean` / `beach` 群系关键字，加入玩家所在维度下雨时也算为主场
- 基础面板：现有 20 个器官的生命、护甲、韧性、魔力、冷却等静态属性不推倒重做。
- 功能宽度：保留当前已经落地的 20 个常规器官，不为了“精简”砍掉移动、法术、结构压制或打捞资源件。
- 视觉主题：潮汐、盐雾、珊瑚、海草、贝壳、鱼群、沉船、海晶石、寒冰迷宫、冰龙霜气。

收敛：

- 核心资源只保留 `海压储能`，运行时继续使用 `kubejs:vanillaOcean_resonance` 与 `kubejs:vanillaOcean_resonance_capacity`，不再拆出“潮汐活性 / 神殿回响 / 打捞线”等多套计数器。
- `潮汐活性`、`神殿窗口`、`打捞窗口`保留为环境条件，不当作第二资源。
- `洋流标记`保留为目标状态，使用已有 `kubejs:vanillaOcean_mark`；它不是资源，只负责被近战/远程器官施加、被爆发器官消耗。
- 每个器官只承担“面板底盘、产潮压、转生存/法力/战斗、主动出口”中的一种主要角色。静态面板可以带少量属性，但功能触发只保留一条主链。
- 不把海洋写成纯水肺工具，不写成守卫者杀手，不写成雪原冰法的复制品。

## 二、内容模块清单

以下内容来自仓库内现有器官 JSON、运行时/标签脚本、手术配方、默认解剖配置、本地 mod jar 数据与整合包配置，不额外虚构原版和模组中不存在的结构。

### 原版海洋基底地形与结构

- 群系：`ocean`、`deep_ocean`、`warm_ocean`、`lukewarm_ocean`、`cold_ocean`、`frozen_ocean` 及深海变体；`beach`、`stony_shore`、`snowy_beach`。
- 地形：海底沙/砂砾/黏土、海草/高海草、海带、珊瑚礁、水下洞穴与峡谷、含水层、冰山、蓝冰、水下岩浆。
- 结构：`minecraft:ocean_monument`、`minecraft:shipwreck`（补给/宝藏/地图）、`minecraft:buried_treasure`、`minecraft:underwater_ruin_big` / `underwater_ruin_small`。
- 生物：守卫者、远古守卫者、海豚、海龟、鱿鱼、发光鱿鱼、鳕鱼、鲑鱼、河豚、热带鱼、溺尸。
- 当前已确认解剖映射：海豚腹部落点 `foam_kidney`，守卫者胸口落点 `saltgill_lung` / `wetgill_jowl`，海龟脊柱落点 `kelp_spinal_cord`，Cataclysm Leviathan 落点 `tidepressure_crown` / `coraltide_tail`。
- 当前已确认结构掉落：`minecraft:chests/shipwreck_map` 给 `farvoyage_flipper`，`shipwreck_supply` 给 `countercurrent_arm`，`shipwreck_treasure` 给 `deeptide_scavenger_hand` / `tidesound_fork_wrist`，`underwater_ruin_big` 给 `monument_refraction_eye`。

### Ice and Fire：冰龙

- 当前配置 `ice_dragon_biomes.json` 与 `ice_dragon_cave_biomes.json` 使用 `forge:is_cold/overworld` 及若干寒带群系；`iaf-common.json` 同时开启冰龙洞、冰龙巢与骸骨生成。
- 冰龙具有阶段性成长：幼龙咬击，二阶段冰息，三阶段后出现龙霜弹，四/五阶段占据雪下大型洞穴；攻击方式还包括甩动、尾击与翼击。
- 掉落/材料：冰龙鳞、冰龙肉（食用减速）、冰龙骨、冰龙心、冰龙血、冰龙头骨、龙蛋；后续可进入龙霜钢线与 `Frost` 冷冻附魔线。
- 当前雪原线已经把 `iceandfire:ice_dragon_male` 作为 `frostseal_ventricle` / `frostlight_crown` 的解剖来源。为避免海洋变成第二个雪原，本稿只从冰龙取“寒潮抗性材料 + 毕业主动核心”，不复制雪原的冰法增幅路线。

### Aquamirae（本地 jar 数据核验）

- 主场：`minecraft:deep_frozen_ocean` 被模组写进 `#aquamirae:ice_maze`，寒冰迷宫生成在该群系下方。
- 结构：`aquamirae:ice_maze/common|arch|spiral`、`aquamirae:ship`、`aquamirae:outpost`、`aquamirae:shelter`；船骸/前哨内有掠夺者与卫道士，冰迷宫内有深渊巨口。
- 生物：`aquamirae:captain_cornelia`、`spinefish`、`maw`、`anglerfish`、`eel`、`maze_mother`、`golden_moth`、`tortured_soul`。
- 材料/战利品：`fin`、`sharp_bones`、`anglers_fang`、`esca`、`ship_graveyard_echo`、`shell_horn`、`frozen_key`、`treasure_pouch`、`dead_sea_scroll`、`frozen_chest` 战利品。
- 当前已确认映射：`aquamirae:captain_cornelia` 给 `seamirror_iris` / `tidal_ventricle` / `coralspike_fist`，`aquamirae:spinefish` 给 `bubblewave_throat`，`aquamirae:chests/maze_common_chest` 给 `monument_refraction_eye`。
- 深渊巨口、鳗鱼、鮟鱇鱼的 `fin` / `sharp_bones` / `ship_graveyard_echo` 作为本系打捞资源与骨件材料，不单独拆成第二套海怪器官。
- 本稿只纳入“船骸打捞、寒冰迷宫结构压制、深渊巨口/鳗/鮟鱇鱼材料、船长亡灵毕业源”这些与原版海洋贴合的部分；不把金蛾、可怖盔甲、晦暗深海盔甲的独立系统硬塞成海洋器官。

## 三、海压储能闭环

海压储能是整套体系唯一可积累、可消耗的资源。它负责把“在水里活动、施法、打捞、命中、承伤”统一成压力储备，再转成两种真实出口：常规技能和冰渊主核爆发。

- 上限：潮汐心室 +50，深海肝囊 +8，海藻脊髓 +20，珊潮尾椎 +20，新增龙霜气囊 +10。合计 108。
- 产源：盐鳃肺叶（自然法命中 +2）、深海肝囊（自然法施法 +2）、海流脾囊（渔获/鱼类击杀 +2）、湿鳃颊囊（受击/水生击杀 +1）、海藻脊髓（移动/受击 +2）、贝鸣耳蜗（受击/击杀 +1）、潮涌腿鳍（水中移动距离 +1）、深潮拾荒手（打捞/挖掘 +2）、珊潮尾椎（近战命中 +3）。
- 消耗端：
  - `泡浪喉囊`主动技能消耗 12 点。
  - `潮声叉腕`主动技能消耗 12 点。
  - `海镜虹膜`在潮湿状态下命中已标记目标时消耗 2 点并追加减速。
  - `深潮拾荒手`的船骸/冰迷宫额外 roll 消耗 3 点。
  - `冰渊主核`按“20 + 当前海压 20%”压差泄压，且最多只清掉当前海压的一半。
- 最低启动阈值：保留现有 `vanillaOcean_resource_online` 的“至少 8 点才算可用储备”约定，避免低储量空转和误触技能。

### 洋流辅助件（血管 / 管路）

海洋循环继续保留，但必须有管路承载海压。以下三件不是器官，也不占用生物器官槽位；它们负责把产压件、转化件和泄压件连成真实的水路。

| 辅助件 | 定位 | 设计作用 |
|---|---|---|
| `洋流导管` `kubejs:current_conduit` | 管路 | 连接产压与耗压器官；4 件海洋器官在线时每次产压额外 +1，主动泄压后返还 1 点海压，自身不提供战斗属性 |
| `盐析阀` `kubejs:salt_exchange_valve` | 调节阀 | 海压不低于 35 时，每 5 秒消耗 2 点海压，获得击退抗性 +2，持续 5 秒 |
| `潮汐浮标` `kubejs:tidal_buoy` | 定位件 | 在海洋神殿、船骸、寒冰迷宫等结构窗口标记泄压方向，让 `冰渊主核` 和 `潮声叉腕` 有明确落点；无独立输出 |

这些辅助件采用“导线/管道”式的非器官命名，不继续套 `<原版海洋> + <器官名>`。它们可以在手术配方、固定装配或 runtime 谓词中落地，不必做成战斗器官。

`洋流标记`的定义：

- 上标记：`海镜虹膜`远程命中、`珊刺拳峰`水中近战命中、`海神殿折光眼`神殿/冰迷宫内命中。
- 吃标记：`潮声叉腕`主动突刺若命中带标记目标，则消耗标记并追加减速/击退。
- 标记本身不进入海压资源循环，避免两套资源互相套娃。

## 四、常规器官实现清单

| 器官 | 来源 | 唯一生态位 | 最终效果 / 触发 / 代价 |
|---|---|---|---|
| 潮汐心室 `tidal_ventricle` | 原版海洋 / Aquamirae 船长亡灵 | 面板底盘与储量上限 | 常驻 `max_health +4`、`armor +1`、海压上限 +50；主场生命 +2、护甲 +1；4 件同源时生命 +2。无消耗。 |
| 盐鳃肺叶 `saltgill_lung` | 原版守卫者 | 水法产压 | 常驻 `nature_spell_power +4`、施法时间缩减 +1；自然法命中产海压 +2；主场施法移速 +1。 |
| 深海肝囊 `deepsea_liver` | 原版深海鱼/海洋法系 | 法力续航 | 常驻 `max_mana +40`、`mana_regen +1`、海压上限 +8；自然法施法回蓝 4 并产海压 +2；主场额外 `max_mana +20`、`mana_regen +1`。 |
| 珊瑚骨板 `coral_boneplate` | 海洋神殿/珊瑚手术 | 站桩承压 | 常驻 `armor +3`、`armor_toughness +1`；主场抗退 +1，海晶石/海晶灯附近窗口再抗退 +1。 |
| 海流脾囊 `seacurrent_spleen` | 原版海洋渔获 | 海面打捞资源 | 钓鱼、捕捞或击杀鱼类时 roll 鱼/海带/海晶材料并产海压 +2；不负责船骸宝藏，避免与拾荒手共用同一张 loot。 |
| 潮压冠脑 `tidepressure_crown` | 原版守卫者 / Cataclysm Leviathan | 施法节律 | 常驻冷却缩减 +2、自然法抗 +3；自然法术进入冷却时回蓝 3；主场施法移速 +1。 |
| 湿鳃颊囊 `wetgill_jowl` | 原版守卫者 | 水下追击/脱身 | 受击或水生击杀产海压 +1；进入水域/雨天后获得海豚恩惠 1 级 4 秒、移动速度 +1；主场生命 +2。 |
| 海镜虹膜 `seamirror_iris` | Aquamirae 鮟鱇鱼/海离精华 | 远程锁定与标记 | 投射物命中给目标发光 5 秒并上洋流标记；潮湿状态命中已标记目标时消耗 2 海压并减速 4 秒。 |
| 浮沫肾囊 `foam_kidney` | 原版海豚 | 潜航恢复 | 命中或受击时回复 1 点生命；潮湿/雨天主场受击后再给 4 秒海豚恩惠。不产海压。 |
| 远航脚蹼 `farvoyage_flipper` | 原版沉船宝藏 | 海面/浅海机动 | 常驻移动速度 +1；主场移动速度 +1、击退抗性 +1；追猎链在线时移动速度再 +1。 |
| 海藻脊髓 `kelp_spinal_cord` | 原版海龟 | 潮压中继 | 常驻护甲 +1、击退抗性 +1、海压上限 +20；移动或受击产海压 +2；主场韧性 +1，湿润窗口攻击 +1。 |
| 贝鸣耳蜗 `shellbell_cochlea` | Aquamirae 贝壳号角/船骸回响 | 受击/击杀回压 | 受击或击杀产海压 +1；常驻护甲 +1、攻击 +1；主场生命 +2。 |
| 逆流臂束 `countercurrent_arm` | 原版海流/偏转水流 | 近战推压 | 常驻攻击 +1；近战命中给目标 4 秒减速；潮湿状态命中造成半径 3 格推涌，不产海压。 |
| 潮涌腿鳍 `tidefin_leg` | 原版海流/船骸机动 | 水下冲刺节奏 | 水中每移动 2 格产海压 +1；常驻移动速度 +1；追猎链路与湿润线各使移动速度 +1、击退抗性 +1。 |
| 泡浪喉囊 `bubblewave_throat` | Aquamirae 棘鱼 | 主动范围控场 | 主动技能冷却 100 tick，海压不低于 12，消耗 12；喷出泡浪，对 4.5 格内敌人施加 4 秒缓慢；潮汐线每 1 点延长 0.2 秒，上限 6 秒。 |
| 珊刺拳峰 `coralspike_fist` | Aquamirae 船长亡灵/珊瑚 | 近战刮伤与标记 | 常驻攻击 +1；每次近战命中追加 2 点碎礁伤害；潮湿状态命中上洋流标记并减速 3 秒，主场攻击 +1。 |
| 海神殿折光眼 `monument_refraction_eye` | 海洋神殿/Aquamirae 冰迷宫 | 结构专精压制 | 常驻冷却缩减 +1；投射物命中给目标 4 秒发光；神殿或冰迷宫窗口命中再给 4 秒虚弱并攻击 +1。 |
| 潮声叉腕 `tidesound_fork_wrist` | Aquamirae 珊瑚矛/残骨军刀 | 主动突刺输出 | 主动技能冷却 90 tick，海压不低于 12，消耗 12；对正前方 5 格目标突刺，伤害 = 10 + 湿润线 + 神殿线；目标带洋流标记时消耗标记并追加 2 秒减速、3 格击退。 |
| 深潮拾荒手 `deeptide_scavenger_hand` | 原版沉船/Aquamirae 船骸与冰迷宫 | 结构打捞资源 | 在打捞窗口内挖掘或开箱 roll 1 次海带/海晶/鹦鹉螺并产海压 +2；船骸/冰迷宫额外 roll 消耗 3 海压。 |
| 珊潮尾椎 `coraltide_tail` | Cataclysm Leviathan | 近战反打/产压 | 常驻护甲 +1、抗退 +1、海压上限 +20；近战命中产海压 +3；湿润线派生攻击，主场派生韧性。 |

## 五、新增寒潮与毕业核心

### 龙霜气囊 `dragonfrost_sac`

- 来源：解剖 `iceandfire:ice_dragon_male` / `ice_dragon_female` 的呼吸/气囊部件，手术中再混入寒冰迷宫产出的冰块、蓝冰与 `aquamirae:ship_graveyard_echo`。
- 定位：冰龙与 Aquamirae 进入海洋线后的“负面抑制”件，不是雪原冰法增幅件。
- 面板：常驻 `max_health +2`、`ice_magic_resist +2`、海压上限 +10、`organsynergia:water_affinity +2`。
- 效果：处于 `deep_frozen_ocean` 群系或 Aquamirae Ice Maze 结构时，自身寒冰减速与龙霜持续伤时长 -50%；不提供直接免疫，不提供 `ice_spell_power`。
- 触发：静态面板常驻，寒潮抑制仅在冷海/冰面窗口生效。
- 联动：和 `冰渊主核`构成弱联动；只与海洋线连接，不跨到雪原冰法构筑。

### 冰渊主核 `frostabyss_core`

- 来源：解剖 `iceandfire:ice_dragon_male` / `ice_dragon_female` 心腔，手术材料加入 Aquamirae 船长亡灵与寒冰迷宫毕业战利品。
- 定位：整套海洋体系的毕业主动核心，对应原稿“潮汐主核”的位置。
- 面板：常驻 `max_health +4`、`armor +2`、`organsynergia:water_affinity +4`；提供主动技能 `kubejs:frostabyss_core`。
- 技能：冷却 200 tick，`castEvent` 使用 `frostabyss_core_cast`，最低要求当前海压不低于 20。
- 释放流程：
  1. 读取当前海压，`spend = min(20 + floor(current * 0.2), floor(current * 0.5))`。
  2. 消耗 `spend`，但保留至少 5 点海压作为潮汐底压。
  3. 对 `潮汐浮标` 指定方向或自身前方释放 Iron's Spells 现有冰法 `irons_spellbooks:frostwave`，等级为 `max(1, min(5, floor(spend / 8)))`。
  4. 在寒冷/冰面窗口额外使受击者冰冻时间 +1 秒；若 `洋流导管` 在线，则泄压后返还 1 点海压。
- 选择 `frostwave` 的原因：该法术已在 `irons-spells-n-spellbooks` 源码中确认存在，有真实等级、范围冻结和输出曲线，不需要自定义一个难维护的冷冻状态机。

## 六、负面抑制与综合增强

### 负面抑制

- 寒潮不白吃：`龙霜气囊`缩短冰龙吐息、Aquamirae 冰迷宫与龙霜附伤的冻结时长，但不做成雪原的直接冰法增幅。
- 水下不白弱：`盐鳃肺叶`保留水下呼吸与施法稳定，`浮沫肾囊`把命中/受击转成恢复，`湿鳃颊囊`与`潮涌腿鳍`保证入水后不会立刻失去追击能力。
- 深海不白溺：`海镜虹膜`解决黑暗/深水视野，`海神殿折光眼`把结构压力转成克制窗口。
- 不新增“溺水扣血、冰面滑倒、视野永久变黑”等伪负面。负面抑制使用环境窗口、短增益与抗性完成。

### 综合增强

- 法术：`nature_spell_power`、`max_mana`、`mana_regen`、冷却缩减、施法时间缩减、施法移速。
- 生存：`max_health`、`armor`、`armor_toughness`、`knockback_resistance`、短治疗、海豚恩惠。
- 战斗：近战追加伤害、减速、推涌、发光标记、虚弱、主动突刺与冰浪爆发。
- 资源：鱼/海带/海晶、鹦鹉螺、船骸打捞、冰迷宫材料与结构掉落来源。

## 七、联动链

### 潮汐生存链

`潮汐心室` + `盐鳃肺叶` + `深海肝囊` + `浮沫肾囊`

心室管生命与储量，肺叶管水法稳定和产压，肝囊管蓝量，肾囊管受击/命中后的短恢复。目标是在水里站得住，而不是靠无限水肺。

### 深海机动链

`湿鳃颊囊` + `远航脚蹼` + `潮涌腿鳍`

颊囊负责入水后追击/脱身，脚蹼负责海面与浅海速度，腿鳍负责长距离位移产压并派生追猎移速。

### 海神殿压制链

`珊瑚骨板` + `潮压冠脑` + `海神殿折光眼` + `逆流臂束`

骨板站场，冠脑压施法节奏，折光眼把海晶/冰迷宫环境转成发光与虚弱，臂束把近战转成推压。

### 打捞资源链

`海流脾囊` + `海镜虹膜` + `深潮拾荒手`

脾囊负责海面渔获，虹膜负责海底识别/标记，拾荒手负责船骸、水下废墟与冰迷宫结构打捞。三者的 loot 表和触发必须分开，不能共用同一张模板。

### 海战法斗链

`海藻脊髓` + `泡浪喉囊` + `珊潮尾椎` + `潮声叉腕`

脊髓负责移动/受击产压，喉囊负责近身范围控场，尾椎负责近战持续产压，叉腕负责把海压和洋流标记一次性变成突刺输出。

### 寒潮毕业链

`龙霜气囊` + `潮压冠脑` + `海神殿折光眼` + `冰渊主核`

气囊先抵消寒潮环境压力，冠脑压缩冷却，折光眼在冰迷宫内制造击杀窗口，最后由冰渊主核吃掉累计海压释放冰浪。这条链只在“寒潮打捞/冰迷宫毕业”场景成立，不做跨雪原强联动。

## 八、Synergia 元素点

现有 20 件全部使用 `organsynergia:water_affinity`，合计 53 点：

`潮汐心室 3`、`盐鳃肺叶 6`、`深海肝囊 4`、`珊瑚骨板 2`、`海流脾囊 2`、`潮压冠脑 4`、`湿鳃颊囊 3`、`海镜虹膜 3`、`浮沫肾囊 2`、`远航脚蹼 1`、`海藻脊髓 2`、`贝鸣耳蜗 3`、`逆流臂束 3`、`潮涌腿鳍 1`、`泡浪喉囊 2`、`珊刺拳峰 3`、`海神殿折光眼 3`、`潮声叉腕 2`、`深潮拾荒手 2`、`珊潮尾椎 2`。

新增 `龙霜气囊 +2`、`冰渊主核 +4`，最终合计 59 点。

不要给海洋系混入独立 `ice_affinity` 元素点。冰龙和 Aquamirae 的寒潮内容通过 `water_affinity`、抗冻结与冰浪主动技能表现，避免把海洋写成第二套雪原。

## 九、避免问题与落地限制

- 不得让 `海流脾囊` 与 `深潮拾荒手` 继续复制同一份 loot 模板。正式稿必须分开：脾囊挂渔获，拾荒手挂船骸/冰迷宫结构。
- 不得让单个器官同时承担命中产压、回血、回蓝、法强、控场和资源掉落的七合一职责。面板属性可以静态存在，但事件触发只保留一条主链。
- 不得把海压做成纯日志。至少保留 `泡浪喉囊`、`潮声叉腕`、`海镜虹膜`、`深潮拾荒手`、`冰渊主核`五个明确消耗端。
- 不得把海洋写成纯水肺工具、纯海怪杀手或纯逃跑系统。
- 不得把 Ice and Fire 冰龙整块换皮成雪原的 `ice_spell_power` 器官。冰龙在本稿中只承担寒潮抑制、毕业核心和龙霜材料来源。
- 不得虚构 Aquamirae 不存在的“海洋神殿”或“船骸专属主城”。结构语义使用本地 jar 已验证的 `deep_frozen_ocean`、Ice Maze、船骸、前哨与庇护所。
- 不得使用不存在的法术。主核落地只能用源码中确认存在的 `irons_spellbooks:frostwave`，不自定义永冻状态机。
- 保持实现复杂度边界：全部使用 counter、runtime、mark、现有事件和 Iron's Spells 主动技能，不引入可编程序列、长连招或跨来源强联动。

## 十、与现有 JSON 的落地差异

- 现有 20 个器官、`bubblewave_throat` / `tidesound_fork_wrist` 两个主动技能和 `vanillaOcean_mark` 均保留。
- 新增两个物品落点：`dragonfrost_sac` 与 `frostabyss_core`，后续需要补充 item 模型、手术配方、解剖掉落、lang 与 startup 注册。
- 新增三个非器官辅助件：`current_conduit`、`salt_exchange_valve`、`tidal_buoy`。它们进入 runtime 谓词、固定装配或手术配方，不进入普通器官 JSON。
- 新增 `vanillaOcean_cold_online` 条件：`deep_frozen_ocean` 群系或 Aquamirae Ice Maze 结构，作为龙霜气囊的窗口条件。
- `frostabyss_core` 的主动消耗改为“压差泄压”，不再使用 `spend = floor(current / 2)`。
- 现有 `vanillaOcean_tide_online`、`temple_online`、`salvage_online`、`wet_online` 继续担任环境窗口；所有窗口只给额外强度，不剥夺陆地基础面板。
