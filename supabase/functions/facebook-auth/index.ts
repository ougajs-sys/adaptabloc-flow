import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FACEBOOK_APP_ID = "210441536707008";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
    if (!appSecret) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Exchange code for access_token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // 2. Get Facebook profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    const fbProfile = await profileRes.json();

    if (!fbProfile.id) {
      return new Response(JSON.stringify({ error: "Failed to fetch Facebook profile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = fbProfile.email || `fb_${fbProfile.id}@intramate.app`;
    const name = fbProfile.name || "Utilisateur Facebook";
    const avatarUrl = fbProfile.picture?.data?.url || "";

    // 3. Use service role to manage users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;

      // Update user metadata with Facebook info
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: existingUser.user_metadata?.full_name || name,
          avatar_url: existingUser.user_metadata?.avatar_url || avatarUrl,
          facebook_id: fbProfile.id,
        },
      });
    } else {
      // Create new user
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          avatar_url: avatarUrl,
          facebook_id: fbProfile.id,
          provider: "facebook",
        },
      });

      if (createError || !newUser.user) {
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
      isNewUser = true;
    }

    // 4. Update facebook_id in profiles (if user has a store)
    await supabaseAdmin
      .from("profiles")
      .update({ facebook_id: fbProfile.id })
      .eq("user_id", userId);

    // 5. Generate a session token via magic link workaround
    // We use generateLink to create a magic link, then extract the token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: "Failed to generate session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract token properties from the generated link
    const tokenHash = linkData.properties?.hashed_token;
    const verifyType = "magiclink";

    return new Response(
      JSON.stringify({
        token_hash: tokenHash,
        type: verifyType,
        email,
        isNewUser,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
