// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const players = [
  { name: "João Silva", level: 9, position: "levantador", isCaptain: true },
  { name: "Pedro Alves", level: 8, position: "ponteiro", isCaptain: false },
  { name: "Carlos Mendes", level: 7, position: "central", isCaptain: false },
  { name: "Lucas Ferreira", level: 8, position: "oposto", isCaptain: false },
  { name: "Rafael Costa", level: 6, position: "libero", isCaptain: false },
  { name: "André Santos", level: 7, position: "ponteiro", isCaptain: false },
  { name: "Marcos Lima", level: 9, position: "levantador", isCaptain: true },
  { name: "Bruno Souza", level: 8, position: "central", isCaptain: false },
  { name: "Diego Oliveira", level: 7, position: "oposto", isCaptain: false },
  { name: "Felipe Rocha", level: 6, position: "libero", isCaptain: false },
  { name: "Thiago Neves", level: 5, position: "universal", isCaptain: false },
  { name: "Rodrigo Pinto", level: 6, position: "ponteiro", isCaptain: false },
];

async function main() {
  console.log("🌱 Seeding database...");
  await prisma.player.deleteMany();
  for (const player of players) {
    await prisma.player.create({ data: player });
  }
  console.log(`✅ Created ${players.length} players`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
