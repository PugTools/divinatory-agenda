import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration (more permissive for cron jobs)
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const rateLimitKey = `send-reminder:${clientIp}`;

    // Check rate limit
    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_key: rateLimitKey,
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (allowed === false) {
      console.warn(`Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS),
            ...corsHeaders 
          },
        }
      );
    }

    // Get appointments for tomorrow that haven't received reminder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        profiles:priest_id (email, display_name)
      `)
      .eq("scheduled_date", tomorrowDate)
      .eq("reminder_sent", false)
      .eq("status", "confirmed");

    if (fetchError) throw fetchError;

    if (!appointments || appointments.length === 0) {
      console.log("No reminders to send for", tomorrowDate);
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing ${appointments.length} reminders for ${tomorrowDate}`);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminders
    for (const appointment of appointments) {
      try {
        const formattedDate = new Date(appointment.scheduled_date).toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const reminderHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
                .label { font-weight: bold; color: #667eea; }
                .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 8px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Lembrete de Consulta</h1>
                </div>
                <div class="content">
                  <div class="alert">
                    <strong>🔔 Sua consulta é amanhã!</strong>
                  </div>
                  
                  <p>Olá ${appointment.client_name},</p>
                  <p>Este é um lembrete da sua consulta agendada:</p>
                  
                  <div class="info-box">
                    <p><span class="label">Tipo de Consulta:</span> ${appointment.game_type_name}</p>
                    <p><span class="label">Data:</span> ${formattedDate}</p>
                    <p><span class="label">Horário:</span> ${appointment.scheduled_time}</p>
                    <p><span class="label">Valor:</span> R$ ${Number(appointment.valor).toFixed(2)}</p>
                  </div>
                  
                  <p><strong>Preparação para a consulta:</strong></p>
                  <ul>
                    <li>Separe um momento tranquilo para a consulta</li>
                    <li>Tenha em mente suas questões principais</li>
                    <li>Esteja aberto(a) para receber as orientações</li>
                  </ul>
                  
                  <p>Aguardamos você!</p>
                </div>
                <div class="footer">
                  <p>Ifá Consultoria Espiritual</p>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email if client has email
        if (appointment.client_email) {
          const emailResponse = await resend.emails.send({
            from: "Ifá Consultoria <onboarding@resend.dev>",
            to: [appointment.client_email],
            subject: "⏰ Lembrete: Sua consulta é amanhã!",
            html: reminderHtml,
          });

          if (emailResponse.error) {
            throw new Error(emailResponse.error.message);
          }

          emailsSent++;
          console.log(`Reminder sent to ${appointment.client_email}`);
        }

        // Update reminder_sent flag
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appointment.id);

        // Log notification
        await supabase.from("notifications_log").insert({
          appointment_id: appointment.id,
          priest_id: appointment.priest_id,
          type: "reminder",
          status: appointment.client_email ? "sent" : "skipped_no_email",
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        emailsFailed++;
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, errorMessage);
        
        await supabase.from("notifications_log").insert({
          appointment_id: appointment.id,
          priest_id: appointment.priest_id,
          type: "reminder",
          status: "failed",
          error_message: errorMessage,
        });
      }
    }

    console.log(`Reminders processed: ${emailsSent} sent, ${emailsFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${appointments.length} reminders. Sent: ${emailsSent}, Failed: ${emailsFailed}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-reminder:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
