import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  appointmentId: string;
  priestEmail: string;
  clientName: string;
  clientEmail?: string;
  clientWhatsapp: string;
  gameType: string;
  scheduledDate: string;
  scheduledTime: string;
  valor: number;
}

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create service role client for rate limiting
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const rateLimitKey = `send-booking-confirmation:${clientIp}`;

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

    const {
      appointmentId,
      priestEmail,
      clientName,
      clientEmail,
      clientWhatsapp,
      gameType,
      scheduledDate,
      scheduledTime,
      valor,
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation for appointment:", appointmentId);

    // Format date to Brazilian format
    const formattedDate = new Date(scheduledDate).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Email to priest
    const priestEmailHtml = `
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Novo Agendamento Confirmado</h1>
            </div>
            <div class="content">
              <p>Você recebeu um novo agendamento:</p>
              
              <div class="info-box">
                <p><span class="label">Cliente:</span> ${clientName}</p>
                <p><span class="label">WhatsApp:</span> ${clientWhatsapp}</p>
                <p><span class="label">Tipo de Jogo:</span> ${gameType}</p>
                <p><span class="label">Data:</span> ${formattedDate}</p>
                <p><span class="label">Horário:</span> ${scheduledTime}</p>
                <p><span class="label">Valor:</span> R$ ${valor.toFixed(2)}</p>
              </div>
              
              <p>O cliente receberá instruções de pagamento por WhatsApp/Email.</p>
            </div>
            <div class="footer">
              <p>Sistema de Agendamentos - Ifá Consultoria Espiritual</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: "Agendamentos <onboarding@resend.dev>",
      to: [priestEmail],
      subject: `🔔 Novo agendamento: ${clientName} - ${formattedDate}`,
      html: priestEmailHtml,
    });

    // Email to client (if email provided)
    if (clientEmail) {
      const clientEmailHtml = `
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
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Agendamento Confirmado</h1>
              </div>
              <div class="content">
                <p>Olá ${clientName},</p>
                <p>Seu agendamento foi confirmado com sucesso!</p>
                
                <div class="info-box">
                  <p><span class="label">Tipo de Consulta:</span> ${gameType}</p>
                  <p><span class="label">Data:</span> ${formattedDate}</p>
                  <p><span class="label">Horário:</span> ${scheduledTime}</p>
                  <p><span class="label">Valor:</span> R$ ${valor.toFixed(2)}</p>
                </div>
                
                <p><strong>Próximos Passos:</strong></p>
                <ol>
                  <li>Realize o pagamento via PIX</li>
                  <li>Você receberá uma confirmação após o pagamento</li>
                  <li>Enviaremos um lembrete 1 dia antes da consulta</li>
                </ol>
                
                <p>Qualquer dúvida, entre em contato via WhatsApp: ${clientWhatsapp}</p>
              </div>
              <div class="footer">
                <p>Ifá Consultoria Espiritual</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: "Consultoria Espiritual <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "✨ Seu agendamento foi confirmado!",
        html: clientEmailHtml,
      });
    }

    // Log notification
    await supabase.from("notifications_log").insert({
      appointment_id: appointmentId,
      type: "booking_confirmation",
      status: "sent",
    });

    console.log("Booking confirmation sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Confirmação enviada" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
