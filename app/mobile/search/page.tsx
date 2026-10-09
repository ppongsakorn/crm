import type { Metadata } from "next";
import { MSearch } from "@/components/mobile/MSearch";
import { topics } from "@/lib/data";
import { searchDocs } from "@/lib/searchDocs";

export const metadata: Metadata = { title: "ค้นหา" };

export default function MobileSearchPage() {
  return <MSearch topics={topics} docs={searchDocs} />;
}
