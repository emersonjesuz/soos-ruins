// app/players/page.tsx
import { prisma } from "@/lib/prisma";
import PlayersClient from "@/components/PlayersClient";

export const revalidate = 0;

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <PlayersClient initialPlayers={JSON.parse(JSON.stringify(players))} />;
}
