import { MenuCatalog } from "@/features/menu/components/MenuCatalog";
import { getVisibleMenu } from "@/features/menu/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getVisibleMenu();

  return (
    <div className="bg-surface min-h-screen">
      <MenuCatalog categories={categories} />
    </div>
  );
}
