import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePixRequest {
  appointmentId: string;
  priestId: string;
}

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_SECONDS = 60;

interface MercadoPagoPixResponse {
  id: number;
  status: string;
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
}

/**
 * Creates a PIX payment via Mercado Pago API
 */
async function createMercadoPagoPix(
  accessToken: string,
  amount: number,
  description: string,
  externalReference: string,
  payerEmail?: string
): Promise<MercadoPagoPixResponse> {
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": externalReference,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description: description,
      payment_method_id: "pix",
      external_reference: externalReference,
      payer: {
        email: payerEmail || "cliente@exemplo.com",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mercado Pago API error:", errorText);
    throw new Error(`Mercado Pago API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generates a valid PIX BRCode (EMV QR Code) string - Fallback when MP not configured
 * Following Banco Central do Brasil specifications
 */
function generatePixBRCode(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  transactionId: string
): string {
  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  // Merchant Account Information (ID 26) - PIX
  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKeyField = formatField('01', pixKey);
  const merchantAccountInfo = formatField('26', gui + pixKeyField);

  // Payload Format Indicator (ID 00)
  const payloadFormat = formatField('00', '01');

  // Merchant Category Code (ID 52)
  const mcc = formatField('52', '0000');

  // Transaction Currency (ID 53) - BRL = 986
  const currency = formatField('53', '986');

  // Transaction Amount (ID 54)
  const amountField = formatField('54', amount.toFixed(2));

  // Country Code (ID 58)
  const country = formatField('58', 'BR');

  // Merchant Name (ID 59) - max 25 chars
  const cleanName = merchantName.substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const name = formatField('59', cleanName);

  // Merchant City (ID 60) - max 15 chars
  const cleanCity = merchantCity.substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const city = formatField('60', cleanCity);

  // Additional Data Field Template (ID 62)
  const txId = formatField('05', transactionId.substring(0, 25).replace(/[^a-zA-Z0-9]/g, ''));
  const additionalData = formatField('62', txId);

  // Build payload without CRC
  const payloadWithoutCRC = 
    payloadFormat +
    merchantAccountInfo +
    mcc +
    currency +
    amountField +
    country +
    name +
    city +
    additionalData +
    '6304';

  // Calculate CRC16-CCITT
  const crc = calculateCRC16(payloadWithoutCRC);
  
  return payloadWithoutCRC + crc;
}

/**
 * CRC16-CCITT calculation (polynomial 0x1021)
 */
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const rateLimitKey = `generate-pix:${clientIp}`;

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

    const { appointmentId, priestId }: GeneratePixRequest = await req.json();

    if (!appointmentId || !priestId) {
      throw new Error("Missing required fields: appointmentId and priestId");
    }

    console.log("Generating PIX for appointment:", appointmentId);

    // Load priest config for PIX details
    const { data: priestConfig, error: configError } = await supabase
      .from("priest_config")
      .select("pix_key, pix_label")
      .eq("priest_id", priestId)
      .single();

    if (configError || !priestConfig) {
      throw new Error("Priest configuration not found");
    }

    // Load appointment to get amount and client info
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, valor, client_name, client_email, game_type_name")
      .eq("id", appointmentId)
      .eq("priest_id", priestId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    // Generate transaction ID
    const transactionId = `PIX${Date.now()}${appointmentId.substring(0, 8).toUpperCase()}`;
    
    let pixCopyPaste: string;
    let pixQrCodeBase64: string | null = null;
    let mercadoPagoPaymentId: string | null = null;

    // Try Mercado Pago first if configured
    if (mercadoPagoToken) {
      try {
        console.log("Creating PIX via Mercado Pago API...");
        
        const mpResponse = await createMercadoPagoPix(
          mercadoPagoToken,
          Number(appointment.valor),
          `Consulta: ${appointment.game_type_name || 'Espiritual'} - ${appointment.client_name}`,
          transactionId,
          appointment.client_email || undefined
        );

        pixCopyPaste = mpResponse.point_of_interaction.transaction_data.qr_code;
        pixQrCodeBase64 = mpResponse.point_of_interaction.transaction_data.qr_code_base64;
        mercadoPagoPaymentId = String(mpResponse.id);

        console.log("Mercado Pago PIX created:", {
          mp_payment_id: mercadoPagoPaymentId,
          status: mpResponse.status,
        });

      } catch (mpError) {
        console.error("Mercado Pago API failed, using fallback:", mpError);
        
        // Fallback to manual PIX if MP fails
        if (!priestConfig.pix_key) {
          throw new Error("PIX key not configured and Mercado Pago unavailable");
        }
        
        pixCopyPaste = generatePixBRCode(
          priestConfig.pix_key,
          priestConfig.pix_label || "CONSULTA ESPIRITUAL",
          "BRASIL",
          Number(appointment.valor),
          transactionId
        );
      }
    } else {
      // No Mercado Pago token, use manual PIX
      if (!priestConfig.pix_key) {
        throw new Error("PIX key not configured for this priest");
      }

      console.log("Using manual PIX generation (no Mercado Pago token)");
      
      pixCopyPaste = generatePixBRCode(
        priestConfig.pix_key,
        priestConfig.pix_label || "CONSULTA ESPIRITUAL",
        "BRASIL",
        Number(appointment.valor),
        transactionId
      );
    }

    // Update or create payment transaction
    const { data: existingTransaction } = await supabase
      .from("payment_transactions")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    const transactionData = {
      pix_copy_paste: pixCopyPaste,
      pix_qr_code: pixQrCodeBase64 ? `data:image/png;base64,${pixQrCodeBase64}` : null,
      external_id: mercadoPagoPaymentId || transactionId,
    };

    if (existingTransaction) {
      await supabase
        .from("payment_transactions")
        .update(transactionData)
        .eq("id", existingTransaction.id);
    } else {
      await supabase
        .from("payment_transactions")
        .insert({
          priest_id: priestId,
          appointment_id: appointmentId,
          amount: appointment.valor,
          status: "pending",
          payment_method: "pix",
          ...transactionData,
        });
    }

    console.log("PIX generated successfully:", {
      transaction_id: transactionId,
      mercadopago_id: mercadoPagoPaymentId,
      has_qr_base64: !!pixQrCodeBase64,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pix_copy_paste: pixCopyPaste,
        pix_qr_code_base64: pixQrCodeBase64,
        transaction_id: transactionId,
        mercadopago_payment_id: mercadoPagoPaymentId,
        amount: appointment.valor,
        provider: mercadoPagoPaymentId ? "mercadopago" : "manual",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating PIX:", errorMessage);

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
