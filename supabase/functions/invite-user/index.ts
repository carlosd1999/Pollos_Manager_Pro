import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODULE_KEYS = [
  'dashboard',
  'ventas',
  'gastos',
  'mortalidad',
  'clientes',
  'ciclos',
  'reportes',
] as const;

function expectedAdminRole(): string {
  return (Deno.env.get('ADMIN_APP_ROLE') || 'admin').trim().toLowerCase();
}

function isAppAdmin(user: { app_metadata?: { role?: string } }): boolean {
  const r = user.app_metadata?.role;
  return typeof r === 'string' && r.trim().toLowerCase() === expectedAdminRole();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Función mal configurada (faltan variables de entorno)' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAppAdmin(user)) {
      return new Response(JSON.stringify({ error: 'Solo un usuario con rol admin en App Metadata puede invitar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const full_name = String(body.full_name || '').trim();
    const redirect_to = String(body.redirect_to || '').trim() || undefined;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Correo requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo: redirect_to,
    });

    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = invited.user?.id;
    if (userId) {
      const rows = MODULE_KEYS.map((module_key) => ({
        user_id: userId,
        module_key,
        enabled: module_key === 'dashboard',
      }));
      const { error: modErr } = await supabaseAdmin.from('user_module_access').upsert(rows, {
        onConflict: 'user_id,module_key',
      });
      if (modErr) {
        return new Response(JSON.stringify({ error: modErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
