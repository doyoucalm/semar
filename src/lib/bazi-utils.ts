// ============================================================
// BaZi Utilities — Translation and Mapping
// ============================================================

export const STEMS: Record<string, { chinese: string; english: string; element: string; polarity: string }> = {
  '甲': { chinese: '甲', english: 'Jia', element: 'Wood', polarity: 'Yang' },
  '乙': { chinese: '乙', english: 'Yi', element: 'Wood', polarity: 'Yin' },
  '丙': { chinese: '丙', english: 'Bing', element: 'Fire', polarity: 'Yang' },
  '丁': { chinese: '丁', english: 'Ding', element: 'Fire', polarity: 'Yin' },
  '戊': { chinese: '戊', english: 'Wu', element: 'Earth', polarity: 'Yang' },
  '己': { chinese: '己', english: 'Ji', element: 'Earth', polarity: 'Yin' },
  '庚': { chinese: '庚', english: 'Geng', element: 'Metal', polarity: 'Yang' },
  '辛': { chinese: '辛', english: 'Xin', element: 'Metal', polarity: 'Yin' },
  '壬': { chinese: '壬', english: 'Ren', element: 'Water', polarity: 'Yang' },
  '癸': { chinese: '癸', english: 'Gui', element: 'Water', polarity: 'Yin' },
};

export const BRANCHES: Record<string, { chinese: string; english: string; element: string; animal: string }> = {
  '子': { chinese: '子', english: 'Zi', element: 'Water', animal: 'Rat' },
  '丑': { chinese: '丑', english: 'Chou', element: 'Earth', animal: 'Ox' },
  '寅': { chinese: '寅', english: 'Yin', element: 'Wood', animal: 'Tiger' },
  '卯': { chinese: '卯', english: 'Mao', element: 'Wood', animal: 'Rabbit' },
  '辰': { chinese: '辰', english: 'Chen', element: 'Earth', animal: 'Dragon' },
  '巳': { chinese: '巳', english: 'Si', element: 'Fire', animal: 'Snake' },
  '午': { chinese: '午', english: 'Wu', element: 'Fire', animal: 'Horse' },
  '未': { chinese: '未', english: 'Wei', element: 'Earth', animal: 'Goat' },
  '申': { chinese: '申', english: 'Shen', element: 'Metal', animal: 'Monkey' },
  '酉': { chinese: '酉', english: 'You', element: 'Metal', animal: 'Rooster' },
  '戌': { chinese: '戌', english: 'Xu', element: 'Earth', animal: 'Dog' },
  '亥': { chinese: '亥', english: 'Hai', element: 'Water', animal: 'Pig' },
};

export const ELEMENTS: Record<string, string> = {
  '木': 'Wood',
  '火': 'Fire',
  '土': 'Earth',
  '金': 'Metal',
  '水': 'Water',
};

export const POLARITY: Record<string, string> = {
  '阳': 'Yang',
  '阴': 'Yin',
};

export const TEN_GODS: Record<string, string> = {
  '正官': 'Direct Officer',
  '七杀': 'Seven Killings',
  '正印': 'Direct Resource',
  '偏印': 'Indirect Resource',
  '比肩': 'Friend',
  '劫财': 'Rob Wealth',
  '食神': 'Eating God',
  '伤官': 'Hurting Officer',
  '正财': 'Direct Wealth',
  '偏财': 'Indirect Wealth',
};

export const SYMBOLIC_STARS: Record<string, string> = {
  '天乙贵人': 'Heavenly Noble',
  '天德贵人': 'Heavenly Virtue',
  '月德贵人': 'Monthly Virtue',
  '天德合': 'Heavenly Virtue Combination',
  '月德合': 'Monthly Virtue Combination',
  '天赦星': 'Heaven Pardon Star',
  '禄神': 'Prosperity Star',
  '驿马': 'Traveling Horse',
  '太极贵人': 'Taiji Noble',
  '将星': 'General Star',
  '学堂': 'Academic Hall',
  '词馆': 'Hall of Eloquence',
  '国印': 'National Seal',
  '三奇贵人': 'Three Wonders Noble',
  '文昌贵人': 'Academic Star',
  '华盖': 'Star of Arts',
  '天医星': 'Sky Doctor',
  '金舆': 'Golden Carriage',
  '空亡': 'Death & Emptiness',
  '灾煞': 'Calamity Killing',
  '劫煞': 'Robbery Killing',
  '亡神': 'Death God',
  '羊刃': 'Goat Blade',
  '飞刃': 'Flying Blade',
  '血刃': 'Blood Blade',
  '流霞': 'Cascading Cloud',
  '四废': 'Four Abandoned',
  '天罗地网': 'Sky Net & Earth Mesh',
  '桃花': 'Peach Blossom',
  '孤辰': 'Solitary Star',
  '寡宿': 'Widow Star',
  '阴差阳错': 'Yin Yang Mistake',
  '魁罡': 'Leader Star',
  '孤鸾': 'Solitary Phoenix',
  '红鸾': 'Red Phoenix',
  '天喜': 'Sky Happiness',
  '勾绞煞': 'Hook & Twist Killing',
  '红艳': 'Red Beauty',
  '十恶大败': 'Ten Great Abysmal Failures',
  '元辰': 'Great Consumer',
  '金神': 'Golden Deity',
  '天转': 'Heaven Turn',
  '地转': 'Earth Turn',
  '丧门': 'Funeral Door',
  '吊客': 'Hanged Guest',
  '披麻': 'Drape Linen',
  '十灵': 'Ten Spirits',
  '六秀': 'Six Elegances',
  '八专': 'Eight Specials',
  '九丑': 'Nine Uglies',
  '童子煞': 'Child Killing',
  '天厨贵人': 'Heavenly Chef Noble',
  '福星贵人': 'Fortune Star Noble',
  '德秀贵人': 'Virtue Elegance Noble',
  '拱禄': 'Arching Lu',
  '天官贵人': 'Heavenly Officer Noble',
  '披头': 'Disheveled Hair',
  '进神': 'Advancing Deity',
  '隔角煞': 'Separation Angle Killing',
};

export function translateStem(stem: string) {
  return STEMS[stem] || { chinese: stem, english: stem, element: '', polarity: '' };
}

export function translateBranch(branch: string) {
  return BRANCHES[branch] || { chinese: branch, english: branch, element: '', animal: '' };
}

export function translateElement(element: string) {
  return ELEMENTS[element] || element;
}

export function translateTenGod(tenGod: string) {
  return TEN_GODS[tenGod] || tenGod;
}

export function translatePolarity(polarity: string) {
  return POLARITY[polarity] || polarity;
}

export function translateSymbolicStar(star: string) {
  return SYMBOLIC_STARS[star] || star;
}

export function translateLuckPillar(pillar: string) {
  if (!pillar || pillar.length < 2) return pillar;
  const stem = pillar[0];
  const branch = pillar[1];
  return `${translateStem(stem).english}${translateBranch(branch).english}`;
}
