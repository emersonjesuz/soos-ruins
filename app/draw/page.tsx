// app/draw/page.tsx
import { prisma } from "@/lib/prisma";
import DrawClient from "@/components/DrawClient";

export const revalidate = 0;

export default async function DrawPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ isCaptain: "desc" }, { level: "desc" }],
  });

  return <DrawClient players={JSON.parse(JSON.stringify(players))} />;
}
