# 叙事文案与图表绑定（v7 文案版）

## 标题
**One物生灵**（万物 → One物：万不再万，只剩个位）  
**副标题：** 从1970到今天，一部正在归零的种群档案

## 第一幕 · 半世纪坠落
- **导语**：Living Planet Index 把 29,625 条监测压缩成一条曲线。1970 年，一切从 100 开始；2020 年，全球中位数停在 13——不是某个物种的悲剧，是半个地球的脉搏在离场。
- **图表**：`#chart-global`
- **数据**：`lpi.json → global_index, direction_counts, class_summary`

## 第二幕 · 大洋洲去了哪里
- **导语**：全球均值是统计学上的安慰剂。大洋洲五十年跌去 88.9%，亚洲、非洲各走各路；唯一逆势上扬的，是国际水域的 +33.2%——同一张地球，写着不同的命运。
- **图表**：`#chart-regions`
- **数据**：`lpi.json → region_change`

## 第三幕 · 名字后面，只剩个位数
- **导语**：曲线尽头是名字。Bazzania bhutanica 只剩 2 个亚种群，斑鳖只剩 3 个个体——栖息地丧失、偷猎、气候变化，威胁的名字不同，结局都是计数归零。
- **图表**：`#chart-threats` + 物种墙
- **数据**：`endangered.json → lowest_population, threat_counts`

## 第四幕 · 从「无危」到极危
- **导语**：205 份动物档案铺开一道 IUCN 光谱：68 种无危，88 种已踩在 CR/EN/VU 的红线上。保护等级不是标签，是距离灭绝还有几步。
- **图表**：`#chart-status`
- **数据**：`animals.json → status_distribution`

## 第五幕 · 南极的身体在报警
- **导语**：宏观在跌，微观在喘。Palmer 群岛 3,430 只企鹅的身体不会说谎——巴布亚企鹅 40.9% 超重，帽带、阿德利也在改写体重曲线。生态系统的问题，先写在脂肪里。
- **图表**：`#chart-penguin`
- **数据**：`penguins.json → health_distribution, overweight_rate`

## 尾声
- 数据来源、方法论、人机协作
