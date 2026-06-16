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

export type ScrapbookDecorAsset = {
  id: string;
  label: string;
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

export const scrapbookDecorAssets: ScrapbookDecorAsset[] = [
  {
    id: "confettiTop",
    label: "Confetti Top",
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
    id: "heartStickerTopLeft",
    label: "Heart Sticker Top Left",
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
    id: "polaroidCakeLeft",
    label: "Polaroid Cake Left",
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
    id: "goldHeartLeft",
    label: "Gold Heart Left",
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
    id: "polaroidFlowersTopRight",
    label: "Polaroid Flowers Top Right",
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
    id: "stickyNoteToday",
    label: "Sticky Note Today",
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
    id: "watercolorStainPink",
    label: "Watercolor Pink",
    src: "/templates/scrapbook-clean/watercolor-stain-pink.png",
    top: "820px",
    left: "-26px",
    width: "260px",
    rotate: -8,
    opacity: 0.32,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    id: "watercolorStainBeige",
    label: "Watercolor Beige",
    src: "/templates/scrapbook-clean/watercolor-stain-beige.png",
    top: "1260px",
    right: "-34px",
    width: "260px",
    rotate: 12,
    opacity: 0.32,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  },
  {
    id: "rightConfettiScatter",
    label: "Confetti Right",
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
    id: "driedFlowersRight",
    label: "Dried Flowers Right",
    src: "/templates/scrapbook-clean/dried-flowers-right.png",
    top: "560px",
    right: "-24px",
    width: "152px",
    rotate: 17,
    opacity: 0.9,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    id: "pinkHeartMidRight",
    label: "Pink Heart Mid Right",
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
    id: "goldHeartBottomRight",
    label: "Gold Heart Bottom Right",
    src: "/templates/scrapbook-clean/heart-sticker-puffy-gold.png",
    bottom: "310px",
    right: "72px",
    width: "56px",
    rotate: -18,
    opacity: 1,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    id: "driedFlowersBottomLeft",
    label: "Dried Flowers Bottom Left",
    src: "/templates/scrapbook-clean/dried-flowers-bottom-left.png",
    bottom: "140px",
    left: "-24px",
    width: "152px",
    rotate: -22,
    opacity: 0.9,
    zIndex: 2,
    visible: true,
    hideOnMobile: true
  },
  {
    id: "footerFloralCluster",
    label: "Footer Floral Cluster",
    src: "/templates/scrapbook-clean/footer-floral-cluster.png",
    bottom: "64px",
    right: "32px",
    width: "300px",
    rotate: -2,
    opacity: 0.42,
    zIndex: 1,
    visible: true,
    hideOnMobile: true
  }
];
