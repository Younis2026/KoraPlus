// Comprehensive Arabic mock data for Sports Match Prediction App

export const leagues = [
  { id: "ucl", name: "دوري أبطال أوروبا", logo: "UCL", country: "أوروبا", season: "2024/25" },
  { id: "laliga", name: "الدوري الإسباني", logo: "ESP", country: "إسبانيا", season: "2024/25" },
  { id: "pl", name: "الدوري الإنجليزي", logo: "ENG", country: "إنجلترا", season: "2024/25" },
  { id: "bundesliga", name: "الدوري الألماني", logo: "GER", country: "ألمانيا", season: "2024/25" },
  { id: "seriea", name: "الدوري الإيطالي", logo: "ITA", country: "إيطاليا", season: "2024/25" },
  { id: "rospl", name: "دوري روشن السعودي", logo: "KSA", country: "السعودية", season: "2024/25" },
  { id: "uaepro", name: "دوري الخليج العربي", logo: "UAE", country: "الإمارات", season: "2024/25" },
];

export const teams = [
  { id: "rm", name: "ريال مدريد", logo: "RM", country: "إسبانيا" },
  { id: "barca", name: "برشلونة", logo: "FCB", country: "إسبانيا" },
  { id: "mancity", name: "مانشستر سيتي", logo: "MCI", country: "إنجلترا" },
  { id: "manutd", name: "مانشستر يونايتد", logo: "MUN", country: "إنجلترا" },
  { id: "liverpool", name: "ليفربول", logo: "LIV", country: "إنجلترا" },
  { id: "arsenal", name: "أرسنال", logo: "ARS", country: "إنجلترا" },
  { id: "chelsea", name: "تشيلسي", logo: "CHE", country: "إنجلترا" },
  { id: "psg", name: "باريس سان جيرمان", logo: "PSG", country: "فرنسا" },
  { id: "bayern", name: "بايرن ميونخ", logo: "FCB", country: "ألمانيا" },
  { id: "dortmund", name: "بوروسيا دورتموند", logo: "BVB", country: "ألمانيا" },
  { id: "inter", name: "إنتر ميلان", logo: "INT", country: "إيطاليا" },
  { id: "juventus", name: "يوفنتوس", logo: "JUV", country: "إيطاليا" },
  { id: "alhilal", name: "الهلال", logo: "HLL", country: "السعودية" },
  { id: "alnassr", name: "النصر", logo: "NSR", country: "السعودية" },
  { id: "alahly", name: "الأهلي", logo: "AHL", country: "السعودية" },
  { id: "alittihad", name: "الاتحاد", logo: "ITH", country: "السعودية" },
  { id: "ajax", name: "أياكس", logo: "AJX", country: "هولندا" },
  { id: "atletico", name: "أتلتيكو مدريد", logo: "ATM", country: "إسبانيا" },
];

const now = new Date();
const todayStr = now.toISOString();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

export const matches = [
  {
    id: "m1",
    homeTeam: teams.find(t => t.id === "rm")!,
    awayTeam: teams.find(t => t.id === "barca")!,
    league: leagues.find(l => l.id === "laliga")!,
    scheduledAt: twoHoursAgo,
    status: "live",
    homeScore: 2,
    awayScore: 1,
    minute: 67,
    venue: "ملعب سانتياغو برنابيو، مدريد",
  },
  {
    id: "m2",
    homeTeam: teams.find(t => t.id === "alhilal")!,
    awayTeam: teams.find(t => t.id === "alnassr")!,
    league: leagues.find(l => l.id === "rospl")!,
    scheduledAt: in3Hours,
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    venue: "الملعب الدولي الجديد، الرياض",
  },
  {
    id: "m3",
    homeTeam: teams.find(t => t.id === "liverpool")!,
    awayTeam: teams.find(t => t.id === "arsenal")!,
    league: leagues.find(l => l.id === "pl")!,
    scheduledAt: in6Hours,
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    venue: "ملعب أنفيلد، ليفربول",
  },
  {
    id: "m4",
    homeTeam: teams.find(t => t.id === "mancity")!,
    awayTeam: teams.find(t => t.id === "chelsea")!,
    league: leagues.find(l => l.id === "pl")!,
    scheduledAt: tomorrow,
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    venue: "ملعب الاتحاد، مانشستر",
  },
  {
    id: "m5",
    homeTeam: teams.find(t => t.id === "bayern")!,
    awayTeam: teams.find(t => t.id === "dortmund")!,
    league: leagues.find(l => l.id === "bundesliga")!,
    scheduledAt: yesterday,
    status: "finished",
    homeScore: 3,
    awayScore: 1,
    minute: 90,
    venue: "ملعب أليانز أرينا، ميونخ",
  },
  {
    id: "m6",
    homeTeam: teams.find(t => t.id === "inter")!,
    awayTeam: teams.find(t => t.id === "juventus")!,
    league: leagues.find(l => l.id === "seriea")!,
    scheduledAt: yesterday,
    status: "finished",
    homeScore: 1,
    awayScore: 1,
    minute: 90,
    venue: "ملعب سان سيرو، ميلان",
  },
  {
    id: "m7",
    homeTeam: teams.find(t => t.id === "alahly")!,
    awayTeam: teams.find(t => t.id === "alittihad")!,
    league: leagues.find(l => l.id === "rospl")!,
    scheduledAt: twoHoursAgo,
    status: "live",
    homeScore: 0,
    awayScore: 0,
    minute: 34,
    venue: "ملعب الأمير عبدالله الفيصل، جدة",
  },
  {
    id: "m8",
    homeTeam: teams.find(t => t.id === "psg")!,
    awayTeam: teams.find(t => t.id === "atletico")!,
    league: leagues.find(l => l.id === "ucl")!,
    scheduledAt: tomorrow,
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    venue: "ملعب باريس الدفاع، باريس",
  },
];

const players: Record<string, any[]> = {
  rm: [
    { id: "rm1", name: "تيبو كورتوا", number: 1, position: "حارس مرمى", photo: "" },
    { id: "rm2", name: "دانييل كارفاخال", number: 2, position: "مدافع", photo: "" },
    { id: "rm3", name: "إيدر ميليتاو", number: 3, position: "مدافع", photo: "" },
    { id: "rm4", name: "أنطونيو رودايجر", number: 22, position: "مدافع", photo: "" },
    { id: "rm5", name: "فيران توريس", number: 19, position: "مهاجم", photo: "" },
    { id: "rm6", name: "توني كروس", number: 8, position: "وسط", photo: "" },
    { id: "rm7", name: "لوكا مودريتش", number: 10, position: "وسط", photo: "" },
    { id: "rm8", name: "جود بيلينغهام", number: 5, position: "وسط", photo: "" },
    { id: "rm9", name: "رودريغو", number: 11, position: "جناح", photo: "" },
    { id: "rm10", name: "كيليان مبابي", number: 9, position: "مهاجم", photo: "" },
    { id: "rm11", name: "فينيسيوس جونيور", number: 7, position: "جناح", photo: "" },
  ],
  barca: [
    { id: "fcb1", name: "مارك أندريه تير ستيغن", number: 1, position: "حارس مرمى", photo: "" },
    { id: "fcb2", name: "يوليوس كوندي", number: 23, position: "مدافع", photo: "" },
    { id: "fcb3", name: "رونالد أراوخو", number: 4, position: "مدافع", photo: "" },
    { id: "fcb4", name: "أندرياس كريستنسن", number: 15, position: "مدافع", photo: "" },
    { id: "fcb5", name: "أليخاندرو بالدي", number: 3, position: "مدافع", photo: "" },
    { id: "fcb6", name: "فرينكي دي يونغ", number: 21, position: "وسط", photo: "" },
    { id: "fcb7", name: "غافي", number: 6, position: "وسط", photo: "" },
    { id: "fcb8", name: "بيدري", number: 8, position: "وسط", photo: "" },
    { id: "fcb9", name: "ليفاندوفسكي", number: 9, position: "مهاجم", photo: "" },
    { id: "fcb10", name: "لامين يامال", number: 19, position: "جناح", photo: "" },
    { id: "fcb11", name: "رافينيا", number: 11, position: "جناح", photo: "" },
  ],
};

const injuredPlayers: Record<string, any[]> = {
  rm: [
    { id: "rmInj1", name: "إدواردو كامافينغا", number: 12, position: "وسط", photo: "" },
  ],
  barca: [
    { id: "fcbInj1", name: "مارك كاسادو", number: 16, position: "وسط", photo: "" },
    { id: "fcbInj2", name: "مارك بارنا", number: 25, position: "مدافع", photo: "" },
  ],
};

export const matchDetails: Record<string, any> = {
  m1: {
    ...matches[0],
    homeLineup: players.rm,
    awayLineup: players.barca,
    homeInjured: injuredPlayers.rm,
    awayInjured: injuredPlayers.barca,
    events: [
      { id: "e1", minute: 15, type: "goal", team: "home", player: players.rm[9], assistPlayer: { id: "rm11", name: "فينيسيوس جونيور" }, description: "هدف رائع من مبابي بعد تمريرة مؤازرة من فينيسيوس" },
      { id: "e2", minute: 32, type: "yellow_card", team: "away", player: players.barca[6], assistPlayer: null, description: "بطاقة صفراء لغافي بسبب احتجاج على قرار الحكم" },
      { id: "e3", minute: 45, type: "goal", team: "away", player: players.barca[8], assistPlayer: { id: "fcb10", name: "لامين يامال" }, description: "تعديل الليفاندوفسكي بعد ركلة ركنية ذكية" },
      { id: "e4", minute: 58, type: "goal", team: "home", player: players.rm[7], assistPlayer: { id: "rm7", name: "لوكا مودريتش" }, description: "قاطرة بيلينغهام من خارج منطقة الجزاء" },
      { id: "e5", minute: 63, type: "substitution", team: "away", player: players.barca[5], assistPlayer: null, description: "استبدال دي يونغ بـ بيدري" },
    ],
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 11, away: 9 },
      shotsOnTarget: { home: 5, away: 4 },
      corners: { home: 6, away: 5 },
      fouls: { home: 8, away: 12 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 },
    },
  },
  m5: {
    ...matches[4],
    homeLineup: players.rm.map(p => ({ ...p, id: "bav" + p.id })),
    awayLineup: players.barca.map(p => ({ ...p, id: "drt" + p.id })),
    homeInjured: [],
    awayInjured: [],
    events: [
      { id: "e10", minute: 12, type: "goal", team: "home", player: { id: "h1", name: "هاري كين", number: 9, position: "مهاجم", photo: "" }, assistPlayer: null, description: "هاري كين يفتتح التسجيل" },
      { id: "e11", minute: 34, type: "goal", team: "home", player: { id: "h2", name: "جمال موسيالا", number: 42, position: "وسط", photo: "" }, assistPlayer: null, description: "موسيالا يضاعف التقدم" },
      { id: "e12", minute: 55, type: "goal", team: "away", player: { id: "a1", name: "نيكلاس فولكروغ", number: 14, position: "مهاجم", photo: "" }, assistPlayer: null, description: "دورتموند يُعيد الأمل" },
      { id: "e13", minute: 78, type: "goal", team: "home", player: { id: "h3", name: "توماس مولر", number: 25, position: "وسط", photo: "" }, assistPlayer: null, description: "مولر يُحكم القفل" },
    ],
    stats: {
      possession: { home: 61, away: 39 },
      shots: { home: 18, away: 7 },
      shotsOnTarget: { home: 8, away: 3 },
      corners: { home: 9, away: 3 },
      fouls: { home: 9, away: 14 },
      yellowCards: { home: 1, away: 3 },
      redCards: { home: 0, away: 0 },
    },
  },
};

// Default match detail for any match without specific data
export function getMatchDetail(matchId: string): any {
  if (matchDetails[matchId]) return matchDetails[matchId];
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  return {
    ...match,
    homeLineup: players.rm.map(p => ({ ...p, id: match.id + "_h" + p.id })),
    awayLineup: players.barca.map(p => ({ ...p, id: match.id + "_a" + p.id })),
    homeInjured: [],
    awayInjured: [],
    events: [],
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    },
  };
}

export const matchPolls: Record<string, any> = {
  m1: { matchId: "m1", homeWinPercent: 52, drawPercent: 23, awayWinPercent: 25, totalVotes: 18432 },
  m2: { matchId: "m2", homeWinPercent: 58, drawPercent: 22, awayWinPercent: 20, totalVotes: 9871 },
  m3: { matchId: "m3", homeWinPercent: 44, drawPercent: 28, awayWinPercent: 28, totalVotes: 12034 },
  m4: { matchId: "m4", homeWinPercent: 61, drawPercent: 20, awayWinPercent: 19, totalVotes: 7654 },
  m5: { matchId: "m5", homeWinPercent: 65, drawPercent: 18, awayWinPercent: 17, totalVotes: 11230 },
  m7: { matchId: "m7", homeWinPercent: 40, drawPercent: 30, awayWinPercent: 30, totalVotes: 8902 },
  m8: { matchId: "m8", homeWinPercent: 55, drawPercent: 22, awayWinPercent: 23, totalVotes: 6543 },
};

export const leaderboard = [
  { rank: 1, user: { id: "u1", name: "عبدالرحمن السيد", avatar: "", country: "SA" }, points: 4820, predictions: 124, accuracy: 78, change: 2 },
  { rank: 2, user: { id: "u2", name: "فيصل المطيري", avatar: "", country: "KW" }, points: 4650, predictions: 118, accuracy: 75, change: -1 },
  { rank: 3, user: { id: "u3", name: "خالد الزهراني", avatar: "", country: "SA" }, points: 4490, predictions: 132, accuracy: 72, change: 1 },
  { rank: 4, user: { id: "u4", name: "محمد العمري", avatar: "", country: "EG" }, points: 4210, predictions: 109, accuracy: 71, change: -2 },
  { rank: 5, user: { id: "u5", name: "أحمد الشمري", avatar: "", country: "SA" }, points: 3980, predictions: 98, accuracy: 69, change: 3 },
  { rank: 6, user: { id: "u6", name: "يوسف العتيبي", avatar: "", country: "KW" }, points: 3750, predictions: 115, accuracy: 67, change: 0 },
  { rank: 7, user: { id: "u7", name: "عمر القحطاني", avatar: "", country: "SA" }, points: 3520, predictions: 103, accuracy: 65, change: -1 },
  { rank: 8, user: { id: "u8", name: "نواف الحربي", avatar: "", country: "SA" }, points: 3310, predictions: 96, accuracy: 63, change: 4 },
  { rank: 9, user: { id: "u9", name: "سالم المنصور", avatar: "", country: "AE" }, points: 3120, predictions: 87, accuracy: 62, change: -3 },
  { rank: 10, user: { id: "u10", name: "طارق البدر", avatar: "", country: "QA" }, points: 2950, predictions: 82, accuracy: 61, change: 1 },
  // Current user at rank 47
  { rank: 47, user: { id: "me", name: "محمد الأحمد", avatar: "", country: "SA" }, points: 1250, predictions: 38, accuracy: 63, change: 5 },
];

export const news = [
  {
    id: "n1",
    title: "مبابي يسجل هدفاً عالمياً في الكلاسيكو ويقود ريال مدريد للتقدم",
    summary: "سجّل النجم الفرنسي كيليان مبابي هدفاً رائعاً في مواجهة برشلونة، محرجاً الجميع بتسديدة قاتلة في الدقيقة 15 من المباراة.",
    category: "breaking",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    teamId: "rm",
    leagueId: "laliga",
    isBreaking: true,
    readTimeMinutes: 3,
  },
  {
    id: "n2",
    title: "رسمياً: النصر يتعاقد مع نجم برشلونة في صفقة تاريخية",
    summary: "أتمّ نادي النصر السعودي صفقة انتقال لاعب مميز من برشلونة مقابل 80 مليون يورو، في خطوة تُعزز الدوري السعودي.",
    category: "transfers",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    teamId: "alnassr",
    leagueId: "rospl",
    isBreaking: false,
    readTimeMinutes: 4,
  },
  {
    id: "n3",
    title: "بيلينغهام يفجر بركاناً في الكلاسيكو بقنبلة من خارج منطقة الجزاء",
    summary: "أدهش جود بيلينغهام عشاق كرة القدم بتسديدة صاروخية من 25 متراً تحولت إلى ثاني أهداف ريال مدريد في مواجهة الغريم.",
    category: "breaking",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    teamId: "rm",
    leagueId: "laliga",
    isBreaking: true,
    readTimeMinutes: 2,
  },
  {
    id: "n4",
    title: "هاري كين يغيب عن ديربي الدوري الإنجليزي بسبب الإصابة",
    summary: "كشف نادي بايرن ميونخ أن المهاجم الإنجليزي هاري كين لن يتمكن من المشاركة في مباراة الأسبوع المقبل جراء إصابة في الركبة.",
    category: "injuries",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    teamId: "bayern",
    leagueId: "bundesliga",
    isBreaking: false,
    readTimeMinutes: 3,
  },
  {
    id: "n5",
    title: "أنشيلوتي في مؤتمره الصحفي: الكلاسيكو مباراة خاصة جداً ونريد الفوز",
    summary: "أكد المدرب الإيطالي كارلو أنشيلوتي أن ريال مدريد مستعد تماماً لمواجهة برشلونة وأنه يملك أفضل لاعبين في العالم.",
    category: "press_conference",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    teamId: "rm",
    leagueId: "laliga",
    isBreaking: false,
    readTimeMinutes: 5,
  },
  {
    id: "n6",
    title: "تحليل تكتيكي: كيف يمكن للهلال أن يهزم النصر في الديربي؟",
    summary: "يُحلّل خبراء كرة القدم نقاط القوة والضعف لكلا الفريقين قبيل الديربي السعودي الكبير، ويضعون سيناريوهات الفوز لكل منهما.",
    category: "analysis",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    teamId: "alhilal",
    leagueId: "rospl",
    isBreaking: false,
    readTimeMinutes: 7,
  },
  {
    id: "n7",
    title: "هايلايت: أجمل أهداف الجولة الماضية من الدوري الإسباني",
    summary: "شاهد تجميعة لأجمل الأهداف التي تمت في الجولة الماضية من الليغا، بما فيها لؤلؤة مبابي وتسديدة بيلينغهام المدوية.",
    category: "video_highlights",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    teamId: null,
    leagueId: "laliga",
    isBreaking: false,
    readTimeMinutes: 2,
  },
  {
    id: "n8",
    title: "ليفاندوفسكي يعود للتدريبات ويؤكد استعداده للديربي الكتالوني",
    summary: "عاد المهاجم البولندي إلى التدريبات مع برشلونة بعد غياب أسبوع بسبب إصابة طفيفة، ليعزز آمال الفريق في المباريات القادمة.",
    category: "injuries",
    imageUrl: "",
    publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    teamId: "barca",
    leagueId: "laliga",
    isBreaking: false,
    readTimeMinutes: 3,
  },
];

export const achievements = [
  { id: "a1", title: "مُتنبئ البداية", description: "أجرِ توقّعك الأول بنجاح", icon: "star", isUnlocked: true, earnedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), progress: 1, target: 1, rarity: "common" },
  { id: "a2", title: "أسبوع لا يُنسى", description: "حقّق 3 توقعات صحيحة في أسبوع واحد", icon: "trophy", isUnlocked: true, earnedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), progress: 3, target: 3, rarity: "rare" },
  { id: "a3", title: "صاروخ الدوري", description: "ارتفع 10 مراتب في الترتيب خلال أسبوع", icon: "rocket", isUnlocked: true, earnedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), progress: 10, target: 10, rarity: "rare" },
  { id: "a4", title: "محلل محترف", description: "حقّق دقة 70% في 20 توقعاً متتالياً", icon: "brain", isUnlocked: true, earnedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), progress: 20, target: 20, rarity: "epic" },
  { id: "a5", title: "ملك الكلاسيكو", description: "توقّع نتيجة الكلاسيكو 5 مرات بشكل صحيح", icon: "crown", isUnlocked: false, earnedAt: null, progress: 3, target: 5, rarity: "legendary" },
  { id: "a6", title: "صيّاد الأهداف", description: "توقّع هداف المباراة في 10 مناسبات", icon: "target", isUnlocked: false, earnedAt: null, progress: 6, target: 10, rarity: "epic" },
  { id: "a7", title: "مئة نقطة", description: "اجمع 100 نقطة في يوم واحد", icon: "zap", isUnlocked: true, earnedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), progress: 100, target: 100, rarity: "rare" },
  { id: "a8", title: "أسطورة التوقعات", description: "أجرِ 100 توقع ناجح", icon: "shield", isUnlocked: false, earnedAt: null, progress: 38, target: 100, rarity: "legendary" },
];

export const rewards = [
  { id: "r1", title: "جائزة الأسبوع", description: "أعلى مستخدم في نقاط الأسبوع يحصل على بطاقة شحن 200 ريال", type: "weekly", prize: "بطاقة شحن 200 ريال", pointsRequired: 500, imageUrl: "", endsAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), rank: 1 },
  { id: "r2", title: "المركز الثاني أسبوعياً", description: "المركز الثاني يحصل على بطاقة شحن 100 ريال", type: "weekly", prize: "بطاقة شحن 100 ريال", pointsRequired: 400, imageUrl: "", endsAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), rank: 2 },
  { id: "r3", title: "جائزة الشهر الكبرى", description: "بطل الشهر يربح رحلة مشاهدة مباراة في أوروبا", type: "monthly", prize: "رحلة مشاهدة مباراة في أوروبا", pointsRequired: 3000, imageUrl: "", endsAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), rank: 1 },
  { id: "r4", title: "قميص نادي الشهر", description: "المركز الثاني شهرياً يحصل على قميص رسمي لناديه المفضل", type: "monthly", prize: "قميص نادي رسمي مُوقَّع", pointsRequired: 2500, imageUrl: "", endsAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), rank: 2 },
  { id: "r5", title: "شارة المحترف", description: "أفضل 10 توقعات في المجموع يحصلون على شارة ذهبية", type: "monthly", prize: "شارة المحترف الذهبية", pointsRequired: 2000, imageUrl: "", endsAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), rank: null },
];

export const defaultProfile = {
  id: "1",
  name: "محمد الأحمد",
  username: "mohammed_predict",
  avatar: "",
  country: "SA",
  totalPoints: 1250,
  globalRank: 47,
  totalPredictions: 38,
  accuracy: 63,
  joinedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  level: "محترف",
  badgeCount: 7,
};

export const defaultFavorites = {
  teams: [teams.find(t => t.id === "rm")!, teams.find(t => t.id === "alhilal")!],
  leagues: [leagues.find(l => l.id === "laliga")!, leagues.find(l => l.id === "rospl")!],
};
