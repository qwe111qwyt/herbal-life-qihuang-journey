# 素材重命名映射

原目录 `素材/交付素材` 保持不变。下表所列文件已复制到 `renamed-assets` 并按完整方案第七部分命名；全屏背景同时转换为方案要求的 WebP。

| 原文件 | 新文件 | 对应内容 |
| --- | --- | --- |
| 背景/BG01.png | bg_00_cabinet.webp | 序章药柜 |
| 背景/BG02.png | bg_01_spring_mountain.webp | 春日青岩山 |
| 背景/BG03.png | bg_02_pharmacy.webp | 夏日济世堂药房 |
| 背景/BG04.png | bg_03_processing.webp | 秋日炮制房 |
| 背景/BG05.png | bg_04_clinic.webp | 冬夜医馆 |
| 背景/BG06.png | bg_05_modern.webp | 当代中药铺 |
| 背景/97ccfa91d835443da62be18fced9f3fd.png | poster_key_visual.png | 海报主视觉 |
| 人物/d19b72735bb64d7b8d59d0a5c508bd1d.png | hero_apprentice_turnaround.png | 学徒三视图 |
| 人物/ab654f40cc204f9ea42a65daf3b49ded.png | hero_master_idle.png | 师父立姿 |
| 人物/walk-1.png | hero_apprentice_walk_01.png | 学徒行走帧 01 |
| 人物/walk-2.png | hero_apprentice_walk_02.png | 学徒行走帧 02 |
| 人物/walk-3.png | hero_apprentice_walk_03.png | 学徒行走帧 03 |
| 人物/19eb622497204fdba299d8f1b3479ba3.png | patient_01.png | 患者一背影 |
| 人物/f96fc03f9adf474c93893830429d70a4.png | patient_02.png | 患者二背影 |
| 物件/0fc1477c125d46838ac4ad9e946a261e.png | herb_basket.png | 药篓 |
| 物件/29f75600a7144369af2dbacf0e26b0bf.png | cabinet_drawer.png | 药屉特写 |
| 物件/4ec8718af2274398a7939e138f907fc6.png | medicine_furnace.png | 药炉 |
| 物件/82f688aff25a401bbe4ec0ebb0780565.png | medicine_pot.png | 药臼与杵 |
| 6种药材/黄芪.png | herb_01.png | 黄芪鲜株 |
| 6种药材/黄连.png | herb_02.png | 黄连鲜株 |
| 6种药材/薄荷.png | herb_03.png | 薄荷鲜株 |
| 6种药材/甘草.png | herb_04.png | 甘草鲜株 |
| 6种药材/当归.png | herb_05.png | 当归鲜株 |
| 6种药材/金银花.png | herb_06.png | 金银花鲜株 |
| 6种药材/干黄芪.png | herb_01_dried.png | 黄芪干材 |
| 6种药材/干黄连.png | herb_02_dried.png | 黄连干材 |
| 6种药材/干薄荷.png | herb_03_dried.png | 薄荷干材 |
| 6种药材/干甘草.png | herb_04_dried.png | 甘草干材 |
| 6种药材/干当归.png | herb_05_dried.png | 当归干材 |
| 6种药材/干金银花.png | herb_06_dried.png | 金银花干材 |

## 缺项说明

方案要求六张行走帧，当前交付素材只有三张。项目真实使用现有三张循环，不通过镜像、插帧或复制文件冒充缺失帧。

## V2.0 布局说明

秋章的药杵与药炉在同一 `.processing-bench` 容器中统一下移 56.7 CSS px。封面右上角的体验说明和春章居中复习弹框由页面代码渲染。

## 优化素材替换

`素材/替换素材` 中的三张优化素材转换为 WebP 后替换了运行时文件，原始交付素材和替换素材均未修改：

| 优化素材 | 运行时文件 | 用途 |
| --- | --- | --- |
| 图层 1.png | public/assets/medicine_furnace.webp | 第二章配伍、第三章炮制的药炉 |
| BG04.png | public/assets/bg_03_processing.webp | 第三章炮制房背景 |
| ab654f40cc204f9ea42a65daf3b49ded.png | public/assets/hero_master_idle.webp | 各章节师傅立姿 |
