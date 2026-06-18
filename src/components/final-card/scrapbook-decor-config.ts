export type ScrapbookDecorAssetMobileOverrides = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: string;
  rotate?: number;
  opacity?: number;
  zIndex?: number;
  visible?: boolean;
};

export type ScrapbookComponentAssetMobileOverrides = {
  visible?: boolean;
  backgroundSize?: string;
  backgroundPositionX?: string;
  backgroundPositionY?: string;
  opacity?: number;
  width?: string;
  maxWidth?: string;
  rotate?: number;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  minHeight?: string;
};

export const SCRAPBOOK_DECOR_ANCHORS = [
  "templateRoot",
  "hero",
  "summary",
  "qualities",
  "greetings",
  "memories",
  "bestPhrases",
  "footer"
] as const;

export type ScrapbookDecorAnchor = (typeof SCRAPBOOK_DECOR_ANCHORS)[number];

export const SCRAPBOOK_VISUAL_GROUPS = [
  "All",
  "Background",
  "Paper layers",
  "Quality tags",
  "Quote cards",
  "Stickers",
  "Photo frames",
  "Flowers",
  "Notes",
  "Confetti"
] as const;

export type ScrapbookVisualGroup = Exclude<(typeof SCRAPBOOK_VISUAL_GROUPS)[number], "All">;

export type ScrapbookFloatingAsset = {
  type: "floating";
  id: string;
  label: string;
  anchor: ScrapbookDecorAnchor;
  group: Extract<ScrapbookVisualGroup, "Background" | "Stickers" | "Photo frames" | "Flowers" | "Notes" | "Confetti">;
  src: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width: string;
  rotate: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  hideOnMobile: boolean;
  kind?: "image" | "note";
  content?: string;
  mobile?: ScrapbookDecorAssetMobileOverrides;
};

export type ScrapbookComponentAsset = {
  type: "component";
  id: string;
  label: string;
  group: Extract<ScrapbookVisualGroup, "Paper layers" | "Quality tags" | "Quote cards">;
  src: string;
  visible: boolean;
  backgroundSize: string;
  backgroundPositionX: string;
  backgroundPositionY: string;
  opacity: number;
  width?: string;
  maxWidth?: string;
  rotate?: number;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  minHeight?: string;
  mobile?: ScrapbookComponentAssetMobileOverrides;
};

export type ScrapbookVisualAsset = ScrapbookFloatingAsset | ScrapbookComponentAsset;

export const scrapbookFloatingAssets: ScrapbookFloatingAsset[] = [
  {
    type: "floating",
    id: "confettiTop",
    label: "Confetti Top",
    anchor: "hero",
    group: "Confetti",
    src: "/templates/scrapbook-clean/confetti-top.svg",
    top: "10px",
    left: "7%",
    width: "86%",
    rotate: 0,
    opacity: 0.9,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "heartStickerTopLeft",
    label: "Heart Sticker Top Left",
    anchor: "hero",
    group: "Stickers",
    src: "/templates/scrapbook-clean/heart-sticker-puffy-pink.png",
    top: "28px",
    left: "28px",
    width: "56px",
    rotate: -12,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "polaroidCakeLeft",
    label: "Polaroid Cake Left",
    anchor: "hero",
    group: "Photo frames",
    src: "/templates/scrapbook-clean/top-polaroid-cake.png",
    top: "108px",
    left: "-18px",
    width: "196px",
    rotate: -10,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "goldHeartLeft",
    label: "Gold Heart Left",
    anchor: "hero",
    group: "Stickers",
    src: "/templates/scrapbook-clean/heart-sticker-puffy-gold.png",
    top: "360px",
    left: "64px",
    width: "56px",
    rotate: 18,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "polaroidFlowersTopRight",
    label: "Polaroid Flowers Top Right",
    anchor: "hero",
    group: "Photo frames",
    src: "/templates/scrapbook-clean/top-polaroid-bouquet.png",
    top: "34px",
    right: "26px",
    width: "196px",
    rotate: 7,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "stickyNoteToday",
    label: "Sticky Note Today",
    anchor: "hero",
    group: "Notes",
    src: "/templates/scrapbook-clean/sticky-note-irregular.png",
    top: "220px",
    right: "54px",
    width: "124px",
    rotate: -7,
    opacity: 1,
    zIndex: 3,
    visible: true,
    hideOnMobile: true,
    kind: "note",
    content: "Сегодня твой день!"
  },
  {
    type: "floating",
    id: "watercolorStainPink",
    label: "Watercolor Pink",
    anchor: "bestPhrases",
    group: "Background",
    src: "/templates/scrapbook-clean/watercolor-stain-pink.png",
    top: "-12px",
    left: "-28px",
    width: "220px",
    rotate: -8,
    opacity: 0.32,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "watercolorStainBeige",
    label: "Watercolor Beige",
    anchor: "greetings",
    group: "Background",
    src: "/templates/scrapbook-clean/watercolor-stain-beige.png",
    top: "210px",
    right: "-34px",
    width: "260px",
    rotate: 12,
    opacity: 0.32,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "rightConfettiScatter",
    label: "Confetti Right",
    anchor: "templateRoot",
    group: "Confetti",
    src: "/templates/scrapbook-clean/confetti-right.svg",
    top: "310px",
    right: "10px",
    width: "72px",
    rotate: 0,
    opacity: 0.9,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "driedFlowersRight",
    label: "Dried Flowers Right",
    anchor: "summary",
    group: "Flowers",
    src: "/templates/scrapbook-clean/dried-flowers-right.png",
    top: "36px",
    right: "-26px",
    width: "152px",
    rotate: 17,
    opacity: 0.9,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "pinkHeartMidRight",
    label: "Pink Heart Mid Right",
    anchor: "memories",
    group: "Stickers",
    src: "/templates/scrapbook-clean/heart-sticker-puffy-pink.png",
    top: "59%",
    right: "52px",
    width: "56px",
    rotate: 14,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "goldHeartBottomRight",
    label: "Gold Heart Bottom Right",
    anchor: "memories",
    group: "Stickers",
    src: "/templates/scrapbook-clean/heart-sticker-puffy-gold.png",
    bottom: "22px",
    right: "72px",
    width: "56px",
    rotate: -18,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "driedFlowersBottomLeft",
    label: "Dried Flowers Bottom Left",
    anchor: "footer",
    group: "Flowers",
    src: "/templates/scrapbook-clean/dried-flowers-bottom-left.png",
    bottom: "16px",
    left: "-24px",
    width: "152px",
    rotate: -22,
    opacity: 0.9,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    type: "floating",
    id: "footerFloralCluster",
    label: "Footer Floral Cluster",
    anchor: "footer",
    group: "Flowers",
    src: "/templates/scrapbook-clean/footer-floral-cluster.png",
    bottom: "18px",
    right: "32px",
    width: "300px",
    rotate: -2,
    opacity: 0.42,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  }
];

export const scrapbookComponentAssets: ScrapbookComponentAsset[] = [
  {
    type: "component",
    id: "heroPaper",
    label: "Hero Paper",
    group: "Paper layers",
    src: "/templates/scrapbook-clean/torn-paper-section1.png",
    visible: true,
    backgroundSize: "138% 228%",
    backgroundPositionX: "center",
    backgroundPositionY: "55%",
    opacity: 1,
    paddingTop: "58px",
    paddingRight: "86px",
    paddingBottom: "82px",
    paddingLeft: "86px",
    minHeight: "462px",
    mobile: {
      backgroundSize: "170% 186%",
      backgroundPositionY: "52%",
      paddingTop: "40px",
      paddingRight: "22px",
      paddingBottom: "52px",
      paddingLeft: "22px",
      minHeight: "360px"
    }
  },
  {
    type: "component",
    id: "summaryPaper",
    label: "Summary Paper",
    group: "Paper layers",
    src: "/templates/scrapbook-clean/torn-paper-summary.png",
    visible: true,
    backgroundSize: "104% 112%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    rotate: -0.7,
    paddingTop: "20px",
    paddingRight: "40px",
    paddingBottom: "30px",
    paddingLeft: "40px",
    minHeight: "136px",
    mobile: {
      backgroundSize: "118% 118%",
      paddingTop: "18px",
      paddingRight: "18px",
      paddingBottom: "24px",
      paddingLeft: "18px"
    }
  },
  {
    type: "component",
    id: "qualitiesTitlePaper",
    label: "Qualities Title Paper",
    group: "Paper layers",
    src: "/templates/scrapbook-clean/torn-paper-summary.png",
    visible: true,
    backgroundSize: "100% 100%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 0.92,
    paddingTop: "8px",
    paddingRight: "24px",
    paddingBottom: "12px",
    paddingLeft: "24px"
  },
  {
    type: "component",
    id: "qualityTagShort1",
    label: "Quality Tag 1",
    group: "Quality tags",
    src: "/templates/scrapbook-clean/paper-tag-short1.png",
    visible: true,
    backgroundSize: "100% 100%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    width: "188px",
    maxWidth: "188px",
    rotate: -3,
    paddingTop: "18px",
    paddingRight: "24px",
    paddingBottom: "22px",
    paddingLeft: "24px",
    minHeight: "94px"
  },
  {
    type: "component",
    id: "qualityTagShort2",
    label: "Quality Tag 2",
    group: "Quality tags",
    src: "/templates/scrapbook-clean/paper-tag-short2.png",
    visible: true,
    backgroundSize: "100% 100%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    width: "188px",
    maxWidth: "188px",
    rotate: 2,
    paddingTop: "18px",
    paddingRight: "24px",
    paddingBottom: "22px",
    paddingLeft: "24px",
    minHeight: "94px"
  },
  {
    type: "component",
    id: "qualityTagShort3",
    label: "Quality Tag 3",
    group: "Quality tags",
    src: "/templates/scrapbook-clean/paper-tag-short3.png",
    visible: true,
    backgroundSize: "100% 100%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    width: "188px",
    maxWidth: "188px",
    rotate: -1,
    paddingTop: "18px",
    paddingRight: "24px",
    paddingBottom: "22px",
    paddingLeft: "24px",
    minHeight: "94px"
  },
  {
    type: "component",
    id: "quoteCardPink",
    label: "Quote Card Pink",
    group: "Quote cards",
    src: "/templates/scrapbook-clean/quote-card-pink-v2.png",
    visible: true,
    backgroundSize: "116% 116%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    paddingTop: "26px",
    paddingRight: "28px",
    paddingBottom: "30px",
    paddingLeft: "28px",
    minHeight: "188px"
  },
  {
    type: "component",
    id: "quoteCardBeige",
    label: "Quote Card Beige",
    group: "Quote cards",
    src: "/templates/scrapbook-clean/quote-card-beige.png",
    visible: true,
    backgroundSize: "116% 116%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    paddingTop: "26px",
    paddingRight: "28px",
    paddingBottom: "30px",
    paddingLeft: "28px",
    minHeight: "188px"
  },
  {
    type: "component",
    id: "quoteCardBlue",
    label: "Quote Card Blue",
    group: "Quote cards",
    src: "/templates/scrapbook-clean/quote-card-blue.png",
    visible: true,
    backgroundSize: "116% 116%",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    opacity: 1,
    paddingTop: "26px",
    paddingRight: "28px",
    paddingBottom: "30px",
    paddingLeft: "28px",
    minHeight: "188px"
  }
];

export const scrapbookVisualAssets: ScrapbookVisualAsset[] = [
  ...scrapbookFloatingAssets,
  ...scrapbookComponentAssets
];
