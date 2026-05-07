import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
Deno.serve(async () => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await res.json();
  const names = data.models?.map((m: any) => m.name) || [];
  return new Response(JSON.stringify(names, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
});
