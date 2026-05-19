import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.6";

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

    // ── support-ticket ──────────────────────────────────────────────
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
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello <strong>\${name}</strong>,</p>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Thank you for contacting LearnBee Support. We have successfully registered your ticket and a member of our team will review and reply within 24 hours.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0; text-align: center;">
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; display: block; margin-bottom: 6px;">Your Reference Ticket Number</span>
                    <span style="font-size: 28px; font-weight: 800; color: #8b5cf6; letter-spacing: 0.5px;">\${formattedTicket}</span>
                  </div>
                  
                  <h4 style="font-size: 14px; color: #1e293b; margin: 24px 0 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Details</h4>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; color: #64748b; font-weight: 500; width: 120px;">Subject</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">\${subject}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #64748b; font-weight: 500; vertical-align: top;">Message</td>
                      <td style="padding: 12px 0; color: #334155; line-height: 1.5; white-space: pre-line;">\${message}</td>
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
                'Authorization': `Bearer \${resendKey}`,
              },
              body: JSON.stringify({
                from: 'LearnBee Support <onboarding@resend.dev>',
                to: [email],
                subject: `[\${formattedTicket}] Support Ticket: \${subject}`,
                html: emailHtml,
              }),
            });
            
            if (mailRes.ok) {
              emailSent = true;
              console.log(`[EMAIL] Auto-confirmation email sent to \${email} for \${formattedTicket}`);
            } else {
              const mailErr = await mailRes.text();
              console.warn(`[EMAIL] Failed to send email via Resend: \${mailErr}`);
            }
          } catch (e: any) {
            console.error(`[EMAIL] Error sending email: \${e.message}`);
          }
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

    // ── book-demo ──────────────────────────────────────────────
    if (pathname.includes('book-demo')) {
      if (req.method === 'POST') {
        const { firstName, lastName, workEmail, phoneNumber, schoolName, schoolSize, preferredDate, preferredTimeSlot } = await req.json();
        
        const { data, error } = await supabaseAdmin
          .from('demo_bookings')
          .insert([{
            first_name: firstName,
            last_name: lastName,
            work_email: workEmail,
            phone_number: phoneNumber,
            school_name: schoolName,
            school_size: schoolSize,
            preferred_date: preferredDate,
            preferred_time_slot: preferredTimeSlot,
            status: 'pending'
          }])
          .select()
          .single();

        if (error) throw error;

        // Send Email via Resend
        const resendKey = Deno.env.get('RESEND_API_KEY');
        let emailSent = false;
        let mailErr = '';
        
        if (resendKey) {
          try {
            const emailHtml = `
              <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://ensxqeamigwifsoicdam.supabase.co/storage/v1/object/public/marketplace/learnbeelogo.png" alt="LearnBee Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 12px rgba(139,92,246,0.15);" />
                </div>
                <div style="background: linear-gradient(135deg, #4f8ef7, #8b5cf6); padding: 32px 24px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 24px;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Demo Scheduled! 🎉</h2>
                  <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9; color: #ffffff;">We are excited to show you LearnBee in action.</p>
                </div>
                
                <div style="padding: 0 12px;">
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello <strong>\${firstName}</strong>,</p>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Thank you for your interest in LearnBee. Your demo has been scheduled for <strong>\${preferredDate}</strong> at <strong>\${preferredTimeSlot} (IST)</strong>.</p>
                  
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">One of our product specialists will reach out to you shortly to provide the meeting details.</p>
                  
                  <h4 style="font-size: 14px; color: #1e293b; margin: 24px 0 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Details</h4>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; color: #64748b; font-weight: 500; width: 120px;">School</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">\${schoolName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 0; color: #64748b; font-weight: 500; width: 120px;">Phone</td>
                      <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">\${phoneNumber}</td>
                    </tr>
                  </table>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    © 2026 LearnBee ERP. All rights reserved.
                  </p>
                </div>
              </div>
            `;

            const mailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer \${resendKey}`,
              },
              body: JSON.stringify({
                from: 'LearnBee Team <onboarding@resend.dev>',
                to: [workEmail],
                subject: `LearnBee Demo Confirmation`,
                html: emailHtml,
              }),
            });
            
            if (mailRes.ok) {
              emailSent = true;
              console.log(`[EMAIL] Demo confirmation email sent to \${workEmail}`);
            } else {
              mailErr = await mailRes.text();
              console.warn(`[EMAIL] Failed to send email via Resend: \${mailErr}`);
            }
          } catch (e: any) {
            console.error(`[EMAIL] Error sending email: \${e.message}`);
            mailErr = e.message;
          }
        } else {
          console.log(`[EMAIL] RESEND_API_KEY not configured. Skipping demo confirmation email.`);
          mailErr = 'RESEND_API_KEY not configured';
        }

        return new Response(JSON.stringify({ success: true, emailSent, booking: data, emailError: mailErr || null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ── blogs ───────────────────────────────────────────────────
    if (pathname.includes('blogs')) {
      if (req.method === 'GET') {
        const { data: blogs } = await supabaseAdmin.from('blog_posts').select('*').order('created_at', { ascending: false });
        return new Response(JSON.stringify({ blogs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'POST') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const body = await req.json();
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const { data, error } = await supabaseAdmin.from('blog_posts')
          .insert([{ ...body, date: body.date || dateStr }])
          .select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, blog: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── positions ───────────────────────────────────────────────
    if (pathname.includes('positions')) {
      if (req.method === 'GET') {
        const { data: positions } = await supabaseAdmin.from('career_positions').select('*').order('created_at', { ascending: false });
        return new Response(JSON.stringify({ positions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'POST') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const body = await req.json();
        const { data, error } = await supabaseAdmin.from('career_positions')
          .insert([body]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, position: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── applications ────────────────────────────────────────────
    if (pathname.includes('applications')) {
      if (req.method === 'GET') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const { data: applications, error } = await supabaseAdmin.from('career_applications')
          .select('*, career_positions(title)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ applications }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'POST') {
        const body = await req.json();
        const { data, error } = await supabaseAdmin.from('career_applications')
          .insert([body]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, application: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── press ───────────────────────────────────────────────────
    if (pathname.includes('press')) {
      if (req.method === 'GET') {
        const { data: press } = await supabaseAdmin.from('press_coverage').select('*').order('created_at', { ascending: false });
        return new Response(JSON.stringify({ press }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (req.method === 'POST') {
        if (!isSuperAdmin) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        const body = await req.json();
        const { data, error } = await supabaseAdmin.from('press_coverage')
          .insert([body]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, press: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── 404 ───────────────────────────────────────────────────
    return new Response(JSON.stringify({ error: 'Not Found', pathname }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`[ERROR] \${error.message}`);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
