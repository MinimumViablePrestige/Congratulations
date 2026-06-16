import { notFound } from "next/navigation";
import { listCardDrafts, listCardMediaAssetsByCardId, listContributionsByCardId } from "@/lib/cards/repository";
import { FinalCard } from "@/components/final-card/final-card";
import { buildFinalCardViewModel } from "@/lib/final-card/view-model";

type Props = {
  params: Promise<{
    finalSlug: string;
  }>;
  searchParams: Promise<{
    debugAssets?: string;
  }>;
};

export default async function GiftPage({ params, searchParams }: Props) {
  const [{ finalSlug }, { debugAssets }] = await Promise.all([params, searchParams]);
  const cards = await listCardDrafts();
  const card = cards.find((item) => item.finalSlug === finalSlug);

  if (!card) {
    notFound();
  }

  const contributions = await listContributionsByCardId(card.id);
  const mediaAssets = await listCardMediaAssetsByCardId(card.id);
  const model = buildFinalCardViewModel(card, contributions, mediaAssets);
  const isAssetDebugEnabled = process.env.NODE_ENV === "development" && debugAssets === "1";

  return <FinalCard model={model} debugAssets={isAssetDebugEnabled} />;
}
