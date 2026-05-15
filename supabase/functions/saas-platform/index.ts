import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.6";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { LOGO_BASE64 } from "./logo_base64.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    console.log(`[REQUEST] ${req.method} ${pathname}${url.search}`);

    // ── init-assets ────────────────────────────────────────────
    if (pathname.includes('init-assets')) {
      try {
        const binaryString = atob(LOGO_BASE64);
        const logoBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          logoBytes[i] = binaryString.charCodeAt(i);
        }
        
        const { data, error } = await supabaseAdmin.storage
          .from('marketplace')
          .upload('learnbeelogo.png', logoBytes, {
            contentType: 'image/png',
            upsert: true
          });
        if (error) throw error;
        
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('marketplace')
          .getPublicUrl('learnbeelogo.png');
          
        return new Response(JSON.stringify({ success: true, publicUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ── Super-admin check ──────────────────────────────────────
    let isSuperAdmin = false;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'super_admin') isSuperAdmin = true;
      }
    }

    // ── dashboard ──────────────────────────────────────────────
    if (pathname.includes('dashboard')) {
      if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [
        schoolsResult,
        studentsCountResult,
        paymentsResult,
        ticketsResult,
        totalTicketsResult,
        resolvedTicketsResult,
        created24hResult,
        resolved24hResult,
        profilesResult
      ] = await Promise.all([
        supabaseAdmin.from('schools').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('erp_students').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('subscriptions').select('*, schools(name)').order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(10),
        supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
        supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', last24h),
        supabaseAdmin.from('profiles').select('role, status'),
      ]);

      const schools = schoolsResult.data || [];
      const mrr = (await supabaseAdmin.from('subscriptions').select('amount').eq('status', 'active')).data
        ?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0;

      const resendKey = Deno.env.get('RESEND_API_KEY');
      const totalSent = (totalTicketsResult.count || 0) + (resolvedTicketsResult.count || 0);
      const sent24h = (created24hResult.count || 0) + (resolved24hResult.count || 0);

      const profiles = profilesResult.data || [];
      const activeUsersCount = profiles.filter(p => p.status === 'active').length;
      const totalUsersCount = profiles.length;
      const roleBreakdown = {
        admins: profiles.filter(p => p.role === 'super_admin' || p.role === 'admin' || p.role === 'school_admin').length,
        teachers: profiles.filter(p => p.role === 'teacher').length,
        students: profiles.filter(p => p.role === 'student').length,
        staff: profiles.filter(p => p.role === 'accountant' || p.role === 'clerk' || p.role === 'librarian').length,
      };

      return new Response(JSON.stringify({
        totalSchools: schools.length,
        activeSchools: schools.filter(s => s.status === 'active').length,
        totalStudents: studentsCountResult.count || 0,
        mrr,
        activeUsers: activeUsersCount,
        totalUsers: totalUsersCount,
        roleBreakdown,
        recentSchools: schools.slice(0, 5),
        recentPayments: paymentsResult.data || [],
        recentTickets: ticketsResult.data || [],
        resendStats: {
          isConfigured: !!resendKey,
          totalSent,
          sent24h,
          dailyLimit: 100,
          monthlyLimit: 3000,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── support-ticket (Public Support Submission) ──────────────
    if (pathname.includes('support-ticket')) {
      if (req.method === 'POST') {
        const { name, email, subject, message } = await req.json();
        
        if (!name || !email || !subject || !message) {
          return new Response(JSON.stringify({ error: 'Missing required fields: name, email, subject, or message' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Insert into database
        const { data, error } = await supabaseAdmin
          .from('support_tickets')
          .insert([{ name, email, subject, message }])
          .select()
          .single();

        if (error) throw error;

        const ticket_number = data.ticket_number;
        const formattedTicket = `LBT-${10000 + ticket_number}`;

        // Attempt to send email via Resend if API key is present
        const resendKey = Deno.env.get('RESEND_API_KEY');
        let emailSent = false;
        
        if (resendKey) {
          try {
            const emailHtml = `
              <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://ensxqeamigwifsoicdam.supabase.co/storage/v1/object/public/marketplace/learnbeelogo.png" alt="LearnBee Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 12px rgba(139,92,246,0.15);" />
                </div>
                <div style="background: linear-gradient(135deg, #4f8ef7, #8b5cf6); padding: 32px 24px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 24px;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Support Ticket Confirmed</h2>
                  <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9; color: #ffffff;">We've received your request and our team is on it!</p>
                </div>
                
                <div style="padding: 0 12px;">
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Thank you for contacting LearnBee Support. We have successfully registered your ticket and a member of our team will review and reply within 24 hours.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0; text-align: center;">
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; display: block; margin-bottom: 6px;">Your Reference Ticket Number</span>
                    <span style="font-size: 28px; font-weight: 800; color: #8b5cf6; letter-spacing: 0.5px;">${formattedTicket}</span>
                  </div>
                  
                  <h4 style="font-size: 14px; color: #1e293b; margin: 24px 0 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Details</h4>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; color: #64748b; font-weight: 500; width: 120px;">Subject</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${subject}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #64748b; font-weight: 500; vertical-align: top;">Message</td>
                      <td style="padding: 12px 0; color: #334155; line-height: 1.5; white-space: pre-line;">${message}</td>
                    </tr>
                  </table>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    This is an automated confirmation of your support ticket. Please do not reply directly to this email.<br />
                    © 2026 LearnBee ERP. All rights reserved.
                  </p>
                </div>
              </div>
            `;

            const mailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: 'LearnBee Support <onboarding@resend.dev>',
                to: [email],
                subject: `[${formattedTicket}] Support Ticket: ${subject}`,
                html: emailHtml,
              }),
            });
            
            if (mailRes.ok) {
              emailSent = true;
              console.log(`[EMAIL] Auto-confirmation email sent to ${email} for ${formattedTicket}`);
            } else {
              const mailErr = await mailRes.text();
              console.warn(`[EMAIL] Failed to send email via Resend: ${mailErr}`);
            }
          } catch (e: any) {
            console.error(`[EMAIL] Error sending email: ${e.message}`);
          }
        } else {
          console.log(`[EMAIL] RESEND_API_KEY not configured. Skipping confirmation email for ${formattedTicket}.`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          ticketNumber: formattedTicket, 
          emailSent,
          ticket: data
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // ── resolve-ticket (Mark ticket as resolved and email notification) ──
    if (pathname.includes('resolve-ticket')) {
      if (req.method === 'POST') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        
        const { ticketId } = await req.json();
        if (!ticketId) {
          return new Response(JSON.stringify({ error: 'Missing ticketId' }), { status: 400, headers: corsHeaders });
        }
        
        // Update DB
        const { data: ticket, error } = await supabaseAdmin
          .from('support_tickets')
          .update({ status: 'resolved', updated_at: new Date() })
          .eq('id', ticketId)
          .select()
          .single();
          
        if (error) throw error;
        
        // Send email
        const resendKey = Deno.env.get('RESEND_API_KEY');
        let emailSent = false;
        
        if (resendKey && ticket) {
          try {
            const formattedTicket = `LBT-${10000 + ticket.ticket_number}`;
            const emailHtml = `
              <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://ensxqeamigwifsoicdam.supabase.co/storage/v1/object/public/marketplace/learnbeelogo.png" alt="LearnBee Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 12px rgba(139,92,246,0.15);" />
                </div>
                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 24px;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Ticket Resolved</h2>
                  <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9; color: #ffffff;">Reference: ${formattedTicket}</p>
                </div>
                
                <div style="padding: 0 12px;">
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello <strong>${ticket.name}</strong>,</p>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">We are pleased to inform you that your support ticket has been marked as <strong>Resolved</strong> by our support team.</p>
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
                    <h4 style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Resolved Query</h4>
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #14532d;">${ticket.subject}</p>
                    <div style="background: #ffffff; border: 1px solid #dcfce7; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e3a1e; white-space: pre-line;">${ticket.message}</div>
                  </div>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">If you have any further questions or if you feel this ticket was resolved in error, please don't hesitate to reach back out to us at any time!</p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    Thank you for choosing LearnBee ERP.<br />
                    © 2026 LearnBee ERP. All rights reserved.
                  </p>
                </div>
              </div>
            `;
            
            const mailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: 'LearnBee Support <onboarding@resend.dev>',
                to: [ticket.email],
                subject: `[Resolved] [${formattedTicket}] Support Ticket: ${ticket.subject}`,
                html: emailHtml,
              }),
            });
            
            if (mailRes.ok) {
              emailSent = true;
              console.log(`[EMAIL] Resolution email sent to ${ticket.email} for ${formattedTicket}`);
            } else {
              const mailErr = await mailRes.text();
              console.warn(`[EMAIL] Failed to send resolution email via Resend: ${mailErr}`);
            }
          } catch (e: any) {
            console.error(`[EMAIL] Error sending resolution email: ${e.message}`);
          }
        }
        
        return new Response(JSON.stringify({ success: true, ticket, emailSent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ── plans ──────────────────────────────────────────────────
    if (pathname.includes('plans')) {
      if (req.method === 'GET') {
        const { data: plans } = await supabaseAdmin.from('subscription_plans').select('*').order('monthly_price', { ascending: true });
        return new Response(JSON.stringify({ plans }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'PUT') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const body = await req.json();
        const { id, ...updateData } = body;
        const { data, error } = await supabaseAdmin.from('subscription_plans')
          .update({ ...updateData, updated_at: new Date() }).eq('id', id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ plan: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── marketplace ────────────────────────────────────────────
    if (pathname.includes('marketplace')) {
      if (req.method === 'GET') {
        const { data: modules } = await supabaseAdmin.from('marketplace_modules').select('*').order('created_at', { ascending: false });
        return new Response(JSON.stringify({ modules }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      if (req.method === 'POST') {
        const body = await req.json();
        const { data, error } = await supabaseAdmin.from('marketplace_modules').insert([{ ...body, created_at: new Date() }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ module: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'PUT') {
        const body = await req.json();
        const { id, ...updateData } = body;
        const { data, error } = await supabaseAdmin.from('marketplace_modules').update({ ...updateData, updated_at: new Date() }).eq('id', id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ module: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        const { error } = await supabaseAdmin.from('marketplace_modules').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── transactions (super-admin only) ───────────────────────
    if (pathname.includes('transactions')) {
      if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*, schools(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ transactions: data ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── school-subscriptions (school-admin own billing history) ──
    if (pathname.includes('school-subscriptions')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      // Verify user belongs to this school
      const school_id = url.searchParams.get('school_id');
      if (!school_id) return new Response(JSON.stringify({ error: 'school_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: profile } = await supabaseAdmin.from('profiles').select('school_id').eq('id', user.id).single();
      if (profile?.school_id !== school_id) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ subscriptions: data ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pathname.includes('school-apps')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: profile } = await supabaseAdmin.from('profiles').select('school_id, role').eq('id', user.id).single();
      if (!profile?.school_id) return new Response('Unauthorized: School context missing', { status: 401, headers: corsHeaders });
      if (req.method === 'GET') {
        const [marketplace, installed] = await Promise.all([
          supabaseAdmin.from('marketplace_modules').select('*').eq('is_active', true),
          supabaseAdmin.from('school_modules').select('*').eq('school_id', profile.school_id),
        ]);
        return new Response(JSON.stringify({ marketplace: marketplace.data, installed: installed.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'POST') {
        const { module_id, action } = await req.json();
        if (action === 'install') {
          const { data, error } = await supabaseAdmin.from('school_modules').upsert({ school_id: profile.school_id, module_id, is_active: true, installed_at: new Date() }).select().single();
          if (error) throw error;
          return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (action === 'toggle') {
          const { data: existing } = await supabaseAdmin.from('school_modules').select('is_active').eq('school_id', profile.school_id).eq('module_id', module_id).single();
          const { data, error } = await supabaseAdmin.from('school_modules').update({ is_active: !existing?.is_active }).eq('school_id', profile.school_id).eq('module_id', module_id).select().single();
          if (error) throw error;
          return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      if (req.method === 'DELETE') {
        const moduleId = url.searchParams.get('moduleId');
        if (!moduleId) {
          return new Response(JSON.stringify({ error: 'moduleId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { error } = await supabaseAdmin
          .from('school_modules')
          .delete()
          .eq('school_id', profile.school_id)
          .eq('module_id', moduleId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── check-subscription  (MUST be before 'subscribe') ───────
    if (pathname.includes('check-subscription')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      const school_id = url.searchParams.get('school_id');
      if (!school_id) return new Response(JSON.stringify({ error: 'school_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const [schoolResult, subResult, plansResult] = await Promise.all([
        supabaseAdmin.from('schools').select('id,name,subscription_plan,status').eq('id', school_id).single(),
        supabaseAdmin.from('subscriptions').select('*').eq('school_id', school_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabaseAdmin.from('subscription_plans').select('*').order('monthly_price', { ascending: true }),
      ]);

      const subscription = subResult.data;
      const now = new Date();
      
      let isExpired = false;
      if (subscription) {
        if (subscription.status === 'expired') isExpired = true;
        else if (subscription.expires_at && new Date(subscription.expires_at) < now) isExpired = true;
      }

      const school = schoolResult.data;
      if (school) {
        school.subscription_plan = (subscription && !isExpired) ? subscription.plan : 'basic';
      }

      return new Response(JSON.stringify({
        school,
        subscription,
        plans: plansResult.data || [],
        hasActivePlan: !!subscription && !isExpired,
        isExpired,
        expiresAt: subscription?.expires_at ?? null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── create-order  (MUST be before 'subscribe') ─────────────
    if (pathname.includes('create-order')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      if (req.method === 'POST') {
        const { amount, currency = 'INR', school_id, plan, school_name } = await req.json();
        const keyId     = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

        if (!keyId || !keySecret) {
          return new Response(JSON.stringify({ error: 'Razorpay credentials not configured on server' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
          body: JSON.stringify({
            amount: Math.round(Number(amount) * 100),
            currency,
            receipt: `school_${school_id?.slice(0,8)}_${Date.now()}`,
            notes: { school_id, school_name: school_name ?? '', plan },
          }),
        });
        if (!rzRes.ok) {
          const e = await rzRes.json();
          return new Response(JSON.stringify({ error: e?.error?.description || 'Razorpay order failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ order: await rzRes.json(), keyId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── subscribe ──────────────────────────────────────────────
    if (pathname.includes('subscribe')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      if (req.method === 'POST') {
        const { school_id, plan, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

        // 1. Update school
        const { error: schoolError } = await supabaseAdmin.from('schools')
          .update({ subscription_plan: plan, status: 'active', updated_at: new Date() })
          .eq('id', school_id);
        if (schoolError) throw schoolError;

        // 2. Expire old active subscriptions
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'expired', updated_at: new Date() })
          .eq('school_id', school_id).eq('status', 'active');

        // 3. Insert new subscription (30 days)
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 30);
        const { data: subData, error: subError } = await supabaseAdmin.from('subscriptions')
          .insert([{ user_id: user.id, school_id, plan, amount: Number(amount), razorpay_payment_id, expires_at, status: 'active', created_at: new Date(), updated_at: new Date() }])
          .select().single();
        if (subError) throw subError;

        // 4. Invalidate Redis cache for school info
        try {
          const redis = new Redis({
            url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
            token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
          });
          await redis.del(`school:${school_id}`);
          console.log(`[REDIS] Successfully invalidated school cache for school_id: ${school_id}`);
        } catch (redisError: any) {
          console.error(`[REDIS] Failed to invalidate school cache: ${redisError.message}`);
        }

        // 5. Send Success Email
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey && user.email) {
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
              <div style="background: linear-gradient(135deg, #4F8EF7, #8B5CF6); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Payment Successful! 🎉</h1>
              </div>
              <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #374151; font-weight: 600;">Hello there,</p>
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Your subscription to the <strong style="color: #7c3aed;">${plan.toUpperCase()}</strong> plan has been successfully activated. Thank you for upgrading LearnBee!</p>
                <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
                  <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">Transaction Details</h3>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
                    <span style="color: #64748b;">Amount Paid:</span>
                    <strong style="color: #0f172a;">₹${amount}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
                    <span style="color: #64748b;">Payment ID:</span>
                    <strong style="color: #0f172a; font-family: monospace;">${razorpay_payment_id || 'N/A'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
                    <span style="color: #64748b;">Subscription Plan:</span>
                    <strong style="color: #7c3aed; text-transform: uppercase;">${plan}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b;">Valid until:</span>
                    <strong style="color: #059669;">${expires_at.toLocaleDateString()}</strong>
                  </div>
                </div>
                <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">Your school dashboard is now fully unlocked. You can view your full transaction history in your settings.</p>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 40px; font-weight: 500;">Best regards,<br/>The LearnBee Team</p>
              </div>
            </div>
          `;
          
          const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'LearnBee Support <onboarding@resend.dev>',
              to: [user.email],
              subject: 'Subscription Payment Successful - LearnBee',
              html: emailHtml,
            })
          });
          
          if (!mailRes.ok) {
            const errText = await mailRes.text();
            console.error(`[EMAIL] Resend rejected success email: ${errText}`);
          } else {
            console.log(`[EMAIL] Success email sent to ${user.email}`);
          }
        }

        return new Response(JSON.stringify({ success: true, subscription: subData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── payment-failed ─────────────────────────────────────────
    if (pathname.includes('payment-failed')) {
      const ah = req.headers.get('Authorization');
      if (!ah) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      const { data: { user } } = await supabaseAdmin.auth.getUser(ah.replace('Bearer ', ''));
      if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

      if (req.method === 'POST') {
        const { plan, amount, error_reason } = await req.json();
        
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey && user.email) {
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
              <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Payment Failed ⚠️</h1>
              </div>
              <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #374151; font-weight: 600;">Hello there,</p>
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">We attempted to process your subscription upgrade for the <strong style="color: #dc2626;">${plan?.toUpperCase() || 'PRO'}</strong> plan, but unfortunately, the payment failed.</p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 24px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">Failure Details</h3>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #fca5a5; padding-bottom: 8px;">
                    <span style="color: #7f1d1d;">Attempted Amount:</span>
                    <strong style="color: #7f1d1d;">₹${amount}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #7f1d1d;">Reason:</span>
                    <strong style="color: #991b1b; max-width: 200px; text-align: right;">${error_reason || 'Transaction declined or cancelled by user.'}</strong>
                  </div>
                </div>
                <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">No amount was deducted. Please try again with a different payment method. If you continue to face issues, our support team is here to help.</p>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 40px; font-weight: 500;">Best regards,<br/>The LearnBee Team</p>
              </div>
            </div>
          `;
          
          const mailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'LearnBee Support <onboarding@resend.dev>',
              to: [user.email],
              subject: 'Payment Failed - Action Required',
              html: emailHtml,
            })
          });
          
          if (!mailRes.ok) {
            const errText = await mailRes.text();
            console.error(`[EMAIL] Resend rejected failure email: ${errText}`);
          } else {
            console.log(`[EMAIL] Failure email sent to ${user.email}`);
          }
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── 404 ───────────────────────────────────────────────────
    return new Response(JSON.stringify({ error: 'Not Found', pathname, method: req.method }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`[ERROR] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
