import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      throw new Error('Unauthorized');
    }

    // Check if calling user is owner or admin
    const { data: callingUserData } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role')
      .eq('id', callingUser.id)
      .single();

    if (!callingUserData || !['admin', 'owner'].includes(callingUserData.role || '')) {
      throw new Error('Unauthorized - only owners and admins can create barber accounts');
    }

    const { email, password, nome, professionalId, tenantId } = await req.json();

    // Validate required fields
    if (!email || !password || !nome || !professionalId || !tenantId) {
      throw new Error('Missing required fields: email, password, nome, professionalId, tenantId');
    }

    // Verify tenant matches
    if (tenantId !== callingUserData.tenant_id) {
      throw new Error('Unauthorized - tenant mismatch');
    }

    console.log(`Creating barber user for email: ${email}, professional: ${professionalId}`);

    // Create the user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        is_barber: true,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`User created with ID: ${newUser.user.id}`);

    // Create user record in public.users table
    const { error: userRecordError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        nome,
        tenant_id: tenantId,
        role: 'barber',
      });

    if (userRecordError) {
      console.error('Error creating user record:', userRecordError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to create user record: ${userRecordError.message}`);
    }

    // Add barber role to user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'barber',
      });

    if (roleError) {
      console.error('Error assigning barber role:', roleError);
      // Rollback: delete the user record and auth user
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to assign barber role: ${roleError.message}`);
    }

    // Update the professional record with the user_id
    const { error: updateError } = await supabaseAdmin
      .from('professionals')
      .update({ 
        user_id: newUser.user.id,
        email: email,
      })
      .eq('id', professionalId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Error updating professional:', updateError);
      // Rollback: delete everything
      await supabaseAdmin.from('user_roles').delete().eq('user_id', newUser.user.id);
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to update professional: ${updateError.message}`);
    }

    console.log(`Successfully created barber user and linked to professional ${professionalId}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        message: 'Barber user created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-barber-user:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
