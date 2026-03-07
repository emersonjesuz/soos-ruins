// app/api/players/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  level: z.number().int().min(0).max(10).optional(),
  position: z.string().min(1).optional(),
  isCaptain: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await prisma.player.findUnique({ where: { id: params.id } });
    if (!player)
      return NextResponse.json(
        { error: "Jogador não encontrado" },
        { status: 404 }
      );
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar jogador" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const player = await prisma.player.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: "Erro ao atualizar jogador" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.player.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir jogador" },
      { status: 500 }
    );
  }
}
