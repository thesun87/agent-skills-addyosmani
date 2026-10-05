// Full 21-item menu from SPEC.md with standard option groups and licensed images.

export type SeedOption = Readonly<{ name: string; priceDelta?: number }>;
export type SeedOptionGroup = Readonly<{
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: readonly SeedOption[];
}>;
export type SeedProduct = Readonly<{
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageFile?: string;
  optionGroups: readonly SeedOptionGroup[];
}>;
export type SeedCategory = Readonly<{ id: string; name: string; products: readonly SeedProduct[] }>;

export const SEED_OPTION_GROUPS = {
  SIZE: {
    id: "seed-optgrp-size",
    name: "Size",
    isRequired: true,
    maxSelect: 1,
    options: [{ name: "Size M" }, { name: "Size L", priceDelta: 6_000 }],
  },
  SUGAR: {
    id: "seed-optgrp-sugar",
    name: "Đường",
    isRequired: true,
    maxSelect: 1,
    options: ["100% đường", "70% đường", "50% đường", "30% đường", "Không đường"].map((name) => ({
      name,
    })),
  },
  ICE: {
    id: "seed-optgrp-ice",
    name: "Đá",
    isRequired: true,
    maxSelect: 1,
    options: ["Đá vừa", "Ít đá", "Nhiều đá", "Để riêng"].map((name) => ({ name })),
  },
  TOPPING: {
    id: "seed-optgrp-topping",
    name: "Topping",
    isRequired: false,
    maxSelect: 3,
    options: [
      { name: "Trân châu đen", priceDelta: 8_000 },
      { name: "Thạch củ năng", priceDelta: 8_000 },
      { name: "Kem cheese", priceDelta: 8_000 },
    ],
  },
} as const satisfies Record<string, SeedOptionGroup>;

const FULL_DRINK_OPTIONS = [
  SEED_OPTION_GROUPS.SIZE,
  SEED_OPTION_GROUPS.SUGAR,
  SEED_OPTION_GROUPS.ICE,
  SEED_OPTION_GROUPS.TOPPING,
] as const;

const HOT_OR_ICED_OPTIONS = [
  SEED_OPTION_GROUPS.SIZE,
  SEED_OPTION_GROUPS.SUGAR,
  SEED_OPTION_GROUPS.ICE,
] as const;

export const SEED_MENU: readonly SeedCategory[] = [
  {
    id: "seed-cat-ca-phe-viet",
    name: "Cà phê Việt",
    products: [
      {
        id: "seed-prd-ca-phe-den-da",
        name: "Cà phê đen đá",
        description: "Robusta rang mộc pha phin đậm đà vị truyền thống, đánh thức sự tỉnh táo.",
        basePrice: 25_000,
        imageFile: "ca-phe-den-da.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-ca-phe-sua-da",
        name: "Cà phê sữa đá",
        description: "Cà phê đậm vị hòa cùng sữa đặc béo ngậy, thức uống quốc dân người Việt.",
        basePrice: 29_000,
        imageFile: "ca-phe-sua-da.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-bac-xiu",
        name: "Bạc xỉu",
        description: "Nhiều sữa ít cà phê, béo dịu thơm lừng, dễ uống cho mọi người.",
        basePrice: 32_000,
        imageFile: "bac-xiu.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-ca-phe-muoi",
        name: "Cà phê muối",
        description: "Lớp kem muối béo mặn độc đáo hòa quyện cùng cà phê phin đậm đà.",
        basePrice: 35_000,
        imageFile: "ca-phe-muoi.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-ca-phe-cot-dua",
        name: "Cà phê cốt dừa",
        description: "Cốt dừa thơm béo xay mịn cùng đá, quyện lớp cà phê phin nguyên chất.",
        basePrice: 39_000,
        imageFile: "ca-phe-cot-dua.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
    ],
  },
  {
    id: "seed-cat-ca-phe-y",
    name: "Cà phê Ý",
    products: [
      {
        id: "seed-prd-espresso",
        name: "Espresso",
        description: "Chiết xuất hạt Arabica nguyên chất pha máy, lớp crema dày mịn màu nâu hạt dẻ.",
        basePrice: 35_000,
        imageFile: "espresso.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
      {
        id: "seed-prd-americano",
        name: "Americano",
        description: "Espresso pha loãng với nước thanh nhẹ, hậu vị êm dịu, không gắt.",
        basePrice: 39_000,
        imageFile: "americano.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
      {
        id: "seed-prd-cappuccino",
        name: "Cappuccino",
        description: "Espresso cùng lớp bọt sữa dày mịn rắc bột cacao thơm phức trên bề mặt.",
        basePrice: 45_000,
        imageFile: "cappuccino.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
      {
        id: "seed-prd-latte",
        name: "Latte",
        description: "Vị sữa tươi thanh trùng êm dịu hòa quyện hài hòa cùng một shot espresso.",
        basePrice: 45_000,
        imageFile: "latte.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
    ],
  },
  {
    id: "seed-cat-tra",
    name: "Trà",
    products: [
      {
        id: "seed-prd-tra-dao-cam-sa",
        name: "Trà đào cam sả",
        description: "Trà thanh mát, đào miếng giòn ngọt kết hợp hương cam sả thơm dịu.",
        basePrice: 39_000,
        imageFile: "tra-dao-cam-sa.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-tra-vai",
        name: "Trà vải",
        description: "Trà hoa thanh nhẹ kết hợp trái vải tươi mọng nước ngọt mát tự nhiên.",
        basePrice: 39_000,
        imageFile: "tra-vai.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-tra-sen-vang",
        name: "Trà sen vàng",
        description: "Trà Ô Long thượng hạng kết hợp hạt sen bùi ngậy và củ năng giòn tan.",
        basePrice: 42_000,
        imageFile: "tra-sen-vang.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-tra-sua-tran-chau",
        name: "Trà sữa trân châu",
        description: "Trà sữa đậm vị hồng trà truyền thống cùng trân châu đen dẻo dai.",
        basePrice: 39_000,
        imageFile: "tra-sua-tran-chau.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
    ],
  },
  {
    id: "seed-cat-da-xay-matcha",
    name: "Đá xay & Matcha",
    products: [
      {
        id: "seed-prd-matcha-latte",
        name: "Matcha latte",
        description: "Bột trà xanh Nhật Bản nguyên chất hòa cùng sữa tươi thanh trùng thơm mát.",
        basePrice: 45_000,
        imageFile: "matcha-latte.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-cookie-da-xay",
        name: "Cookie đá xay",
        description: "Bánh quy Oreo xay nhuyễn cùng sữa đặc và lớp kem tươi whipping béo mịn.",
        basePrice: 49_000,
        imageFile: "cookie-da-xay.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
      {
        id: "seed-prd-chocolate-da-xay",
        name: "Chocolate đá xay",
        description: "Chocolate nguyên chất đậm đà xay tuyết mát lạnh, ngập tràn năng lượng.",
        basePrice: 49_000,
        imageFile: "chocolate-da-xay.webp",
        optionGroups: FULL_DRINK_OPTIONS,
      },
    ],
  },
  {
    id: "seed-cat-nuoc-ep-sinh-to",
    name: "Nước ép & Sinh tố",
    products: [
      {
        id: "seed-prd-nuoc-cam",
        name: "Nước cam",
        description: "Cam tươi mọng nước vắt tại chỗ nguyên chất, dồi dào vitamin C tự nhiên.",
        basePrice: 39_000,
        imageFile: "nuoc-cam.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
      {
        id: "seed-prd-sinh-to-bo",
        name: "Sinh tố bơ",
        description: "Bơ sáp Đắk Lắk dẻo quánh xay cùng sữa đặc tạo vị béo ngậy cuốn hút.",
        basePrice: 45_000,
        imageFile: "sinh-to-bo.webp",
        optionGroups: HOT_OR_ICED_OPTIONS,
      },
    ],
  },
  {
    id: "seed-cat-banh",
    name: "Bánh",
    products: [
      {
        id: "seed-prd-croissant",
        name: "Croissant",
        description: "Bánh sừng bò ngàn lớp thơm lừng mùi bơ Pháp, vỏ giòn ruột xốp mềm.",
        basePrice: 29_000,
        imageFile: "croissant.webp",
        optionGroups: [],
      },
      {
        id: "seed-prd-banh-mi-que",
        name: "Bánh mì que",
        description: "Bánh mì que giòn rụm nhân pate béo ngậy kèm chút tương ớt cay nhẹ.",
        basePrice: 15_000,
        imageFile: "banh-mi-que.webp",
        optionGroups: [],
      },
      {
        id: "seed-prd-tiramisu",
        name: "Tiramisu",
        description: "Bánh ngọt Ý mềm mịn, phô mai Mascarpone thơm béo quyện vị cà phê đậm đà.",
        basePrice: 39_000,
        imageFile: "tiramisu.webp",
        optionGroups: [],
      },
    ],
  },
];
