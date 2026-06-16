/**
 * 极危物种中文名对照表（按学名索引）
 */
const SPECIES_ZH = {
  "Bazzania bhutanica": "不丹绢藓",
  "Scaturiginichthys vermeilipinnis": "红鳍蓝眼鱼",
  "Magnolia wolfii": "沃尔夫木兰",
  "Rafetus swinhoei": "斑鳖",
  "Euphorbia tanaensis": "塔纳大戟",
  "Abies beshanzuensis": "百山祖冷杉",
  "Elaeocarpus bojeri": "毛柱杜英",
  "Rosa arabica": "阿拉伯蔷薇",
  "Dipterocarpus lamellatus": "片状龙脑香",
  "Phocoena sinus": "小头鼠海豚",
  "Diospyros katendei": "卡滕迪柿",
  "Nomascus hainanus": "海南长臂猿",
  "Pinus squamata": "巧家五针松",
  "Gigasiphon macrosiphon": "大管荚蒾",
  "Cavia intermedia": "圣卡塔琳娜豚鼠",
  "Ardeotis nigriceps": "大印度鸨",
  "Erythrina schliebenii": "珊瑚刺桐",
  "Ficus katendei": "卡滕迪榕",
  "Pomarea whitneyi": "法图希瓦王鹟",
  "Lithobates sevosus": "暗色穴蛙",
  "Ardea insignis": "白腹鹭",
  "Aythya innotata": "马达加斯加潜鸭",
  "Heteromirafa sidamoensis": "利本百灵",
  "Calumma tarzan": "塔赞变色龙",
  "Coleura seychellensis": "塞舌尔鞘尾蝠",
  "Dicerorhinus sumatrensis": "苏门答腊犀",
  "Diomedea amsterdamensis": "阿姆斯特丹信天翁",
  "Eurynorhyncus pygmeus": "勺嘴鹬",
  "Natalus primus": "古巴大漏斗耳蝠",
  "Parides burchellanus": "黄凤蝶",
  "Propithecus candidus": "丝光狐猴",
  "Rhinoceros sondaicus": "爪哇犀",
  "Rhizanthella gardneri": "西澳地下兰",
  "Aproteles bulmerae": "布尔默果蝠",
  "Dioscorea strydomiana": "野生薯蓣",
  "Rhinopithecus avunculus": "越南金丝猴",
  "Margaritifera marocana": "摩洛哥珍珠蚌",
  "Astrochelys yniphora": "安哥洛卡象龟",
  "Amanipodagrion gilliesi": "阿马尼扁蜻",
  "Bradypus pygmaeus": "侏儒三趾树懒",
  "Eriosyce chilensis": "智利仙人掌",
  "Moominia willii": "威利蜗牛",
  "Antilophia bokermanni": "阿拉里皮娇鹟",
  "Beatragus hunteri": "亨氏牛羚",
  "Brachyteles hypoxanthus": "北方绒毛蛛猴",
  "Lathyrus belinensis": "贝林山豌豆",
  "Neurergus kaiseri": "洛里斯坦蝾螈",
  "Geronticus eremita": "秃鹮",
  "Actinote zikani": "齐卡尼斑蝶",
  "Aipysurus foliosquama": "叶鳞海蛇",
  "Antisolabis seychellensis": "塞舌尔蠼螋",
  "Aphanius transgrediens": "跨界隐花鱼",
  "Atelopus balios": "湍流跗蟾",
  "Azurina eupalama": "加拉帕戈斯雀鲷",
  "Bahaba taipingensis": "黄唇鱼",
  "Batagur baska": "巴斯卡龟",
  "Bombus franklini": "富兰克林熊蜂",
  "Callitriche pulchra": "美丽水马齿",
  "Cercopithecus roloway": "罗洛威猴",
  "Cryptomyces maximus": "大隐真菌",
  "Cryptotis nelsoni": "纳尔逊鼩鼱",
  "Cyclura collei": "牙买加鬣蜥",
  "Daubentonia madagascariensis": "指猴",
  "Dendrophylax fawcettii": "福塞特幽灵兰",
  "Discoglossus nigriventer": "胡拉彩蛙",
  "Dombeya mauritiana": "毛里求斯梧桐",
  "Eleutherodactylus glandulifer": "拉奥泰腺蛙",
  "Eleutherodactylus thorectes": "马凯亚穴蛙",
  "Gocea ohridana": "奥赫里德蜗牛",
  "Heleophryne rosei": "桌山幽灵蛙",
  "Hemicycla paeteliana": "帕特利亚蜗牛",
  "Hibiscadelphus woodii": "伍迪芙蓉",
  "Hucho perryi": "萨哈林哲罗鲑",
  "Johora singaporensis": "新加坡淡水蟹",
  "Leiopelma archeyi": "阿奇蛙",
  "Lophura edwardsi": "爱德华雉",
  "Nepenthes attenboroughii": "亮悉尼笼草",
  "Oreocnemis phoenix": "马拉维红蜻",
  "Pangasius sanitwongsei": "暹罗巨鲶",
  "Picea neoveitchii": "太行云杉",
  "Poecilotheria metallica": "蓝宝石华丽蜘蛛",
  "Pristis pristis": "普通锯鳐",
  "Psammobates geometricus": "几何陆龟",
  "Pseudoryx nghetinhensis": "武广牛",
  "Psiadia cataractae": "瀑布菊",
  "Psorodonotus ebneri": "埃布纳螽",
  "Rhynchocyon spp.": "邦尼巨象鼩",
  "Risiocnemis seidenschwarzi": "宿务丝翅蜻",
  "Salanoia durrelli": "杜瑞尔獴",
  "Santamartamys rufodorsalis": "红背树鼠",
};

function speciesNameZh(s) {
  if (!s) return "";
  if (typeof s === "string") return SPECIES_ZH[s] || s;
  const sci = s.species_name;
  if (sci && SPECIES_ZH[sci]) return SPECIES_ZH[sci];
  return sci || "";
}

window.SPECIES_ZH = SPECIES_ZH;
window.speciesNameZh = speciesNameZh;

function normThreat(t) {
  const s = (t || "").toLowerCase();
  if (/hunt|poach|trap/.test(s)) return "狩猎";
  if (/habitat|forest|clearance|deforest/.test(s)) return "栖息地丧失";
  if (/climate|warming|drought/.test(s)) return "气候变化";
  if (/agri|graz|crop|farm/.test(s)) return "农业扩张";
  if (/invasive|introduced/.test(s)) return "入侵物种";
  if (/pollut|contamin|oil|plastic/.test(s)) return "污染";
  if (/fire/.test(s)) return "火灾";
  if (/fish|bycatch|net/.test(s)) return "渔业误捕";
  if (/chytrid/.test(s)) return "壶菌病";
  if (/overgraz/.test(s)) return "过度放牧";
  if (/develop/.test(s)) return "开发建设";
  if (/small population/.test(s)) return "种群过小";
  return "其他威胁";
}

const THREAT_ZH = {
  hunting: "狩猎", Hunting: "狩猎",
  "climate change": "气候变化", "Climate change": "气候变化",
  Agriculture: "农业扩张", agriculture: "农业扩张",
  "agricultural expansion": "农业扩张",
  "Habitat loss": "栖息地丧失", "habitat loss": "栖息地丧失",
  fire: "火灾", "Invasive species": "入侵物种",
  overgrazing: "过度放牧", development: "开发建设",
  Chytridiomycosis: "壶菌病", "small population": "种群过小",
};

function threatLabel(t) {
  return THREAT_ZH[t] || normThreat(t);
}

function aggregateThreats(threats) {
  const map = new Map();
  (threats || []).forEach(t => {
    const label = threatLabel(t.threat);
    map.set(label, (map.get(label) || 0) + t.count);
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([threat, count]) => ({ threat, count }));
}

window.threatLabel = threatLabel;
window.aggregateThreats = aggregateThreats;
