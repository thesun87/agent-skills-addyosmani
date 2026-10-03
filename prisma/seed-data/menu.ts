// Starter menu for local development. The full menu from SPEC.md is added in T18.

export type SeedOption = Readonly<{ name: string; priceDelta?: number }>;
export type SeedOptionGroup = Readonly<{
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
  optionGroups: readonly SeedOptionGroup[];
}>;
export type SeedCategory = Readonly<{ id: string; name: string; products: readonly SeedProduct[] }>;

const SIZE: SeedOptionGroup = {
  name: "Size",
  isRequired: true,
  maxSelect: 1,
  options: [{ name: "M" }, { name: "L", priceDelta: 6_000 }],
};

const SUGAR: SeedOptionGroup = {
  name: "Đường",
  isRequired: true,
  maxSelect: 1,
  options: ["0%", "30%", "50%", "70%", "100%"].map((name) => ({ name })),
};

const ICE: SeedOptionGroup = {
  name: "Đá",
  isRequired: true,
  maxSelect: 1,
  options: ["Ít đá", "Đá vừa", "Nhiều đá", "Để riêng"].map((name) => ({ name })),
};

const DRINK_OPTIONS = [SIZE, SUGAR, ICE] as const;

export const SEED_MENU: readonly SeedCategory[] = [
  {
    id: "seed-cat-ca-phe-viet",
    name: "Cà phê Việt",
    products: [
      {
        id: "seed-prd-ca-phe-den-da",
        name: "Cà phê đen đá",
        description: "Robusta rang mộc, pha phin đậm đà.",
        basePrice: 25_000,
        optionGroups: DRINK_OPTIONS,
      },
      {
        id: "seed-prd-ca-phe-sua-da",
        name: "Cà phê sữa đá",
        description: "Phin truyền thống với sữa đặc.",
        basePrice: 29_000,
        optionGroups: DRINK_OPTIONS,
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
        description: "Trà đen, đào miếng, cam tươi và sả.",
        basePrice: 39_000,
        optionGroups: DRINK_OPTIONS,
      },
      {
        id: "seed-prd-croissant",
        name: "Croissant bơ",
        description: "Bánh sừng bò nướng mỗi sáng.",
        basePrice: 29_000,
        optionGroups: [],
      },
    ],
  },
];
