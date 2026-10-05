import React from "react";
import { ShopHeader, type ShopHeaderProps } from "@/components/ui/ShopHeader";

export type SiteHeaderProps = ShopHeaderProps;

export function SiteHeader(props: SiteHeaderProps) {
  return <ShopHeader {...props} />;
}
