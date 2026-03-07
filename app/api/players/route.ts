// app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const playerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  level: z.number().int().min(0).max(10),
  position: z.string().min(1, "Posição é obrigatória"),
  isCaptain: z.boolean().default(false),
});

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar jogadores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = playerSchema.parse(body);

    const existingPlayer = await prisma.player.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });

    if (existingPlayer) {
      return NextResponse.json({ error: "Já existe um jogador com este nome." }, { status: 409 });
    }

    const player = await prisma.player.create({ data });
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar jogador" }, { status: 500 });
  }
}
