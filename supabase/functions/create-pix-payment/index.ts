import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePixPaymentRequest {
  appointmentId: string;
  amount: number;
  pixKey: string;
  pixLabel: string;
}

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create service role client for rate limiting
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const rateLimitKey = `create-pix-payment:${clientIp}`;

    // Check rate limit
    const { data: allowed, error: rateLimitError } = await serviceClient.rpc(
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { appointmentId, amount, pixKey, pixLabel }: CreatePixPaymentRequest =
      await req.json();

    console.log("Creating PIX payment for appointment:", appointmentId);

    // Verify appointment belongs to this priest
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("priest_id", user.id)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found or unauthorized");
    }

    // Generate PIX payment data (simulated)
    const pixCopyPaste = generatePixCopyPaste(pixKey, pixLabel, amount, appointmentId);
    const pixQrCodeData = `data:image/svg+xml;base64,${btoa(generateQrCodeSvg(pixCopyPaste))}`;

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        priest_id: user.id,
        appointment_id: appointmentId,
        amount: amount,
        status: "pending",
        payment_method: "pix",
        pix_qr_code: pixQrCodeData,
        pix_copy_paste: pixCopyPaste,
        external_id: `PIX-${Date.now()}-${appointmentId.substring(0, 8)}`,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update appointment with payment info
    await supabase
      .from("appointments")
      .update({
        payment_id: transaction.id,
        payment_status: "pending",
      })
      .eq("id", appointmentId);

    console.log("PIX payment created successfully:", transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          pix_copy_paste: transaction.pix_copy_paste,
          pix_qr_code: transaction.pix_qr_code,
          status: transaction.status,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating PIX payment:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Generate PIX Copy & Paste code (EMV format - simplified simulation)
function generatePixCopyPaste(
  pixKey: string,
  merchantName: string,
  amount: number,
  transactionId: string
): string {
  const amountStr = amount.toFixed(2);
  const timestamp = Date.now();
  
  return `00020126${pixKey.length.toString().padStart(2, '0')}${pixKey}5204000053039865802BR5913${merchantName.substring(0, 13)}6009SAO PAULO62070503***630${transactionId.substring(0, 10).toUpperCase()}`;
}

// Generate simple QR Code SVG (simulation)
function generateQrCodeSvg(data: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <text x="50%" y="50%" text-anchor="middle" fill="black" font-size="12">
        QR Code
      </text>
      <text x="50%" y="60%" text-anchor="middle" fill="gray" font-size="8">
        ${data.substring(0, 30)}...
      </text>
    </svg>
  `;
}

serve(handler);
