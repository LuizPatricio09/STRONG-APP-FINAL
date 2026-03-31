import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role para bypass de RLS
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://claude.ai");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { key, uid } = req.query;

  if (!key || key !== process.env.CLAUDE_API_KEY) {
    return res.status(401).json({ error: "Chave inválida" });
  }

  if (!uid || typeof uid !== "string") {
    return res.status(400).json({ error: "UID do usuário é obrigatório" });
  }

  try {
    const { data: treinos, error } = await supabase
      .from("treinos")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.status(200).json({
      usuario: uid,
      total_treinos: treinos?.length ?? 0,
      treinos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar treinos" });
  }
}

