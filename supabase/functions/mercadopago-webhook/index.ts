import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

interface MercadoPagoNotification {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

interface PaymentDetails {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  date_approved: string;
  payment_method_id: string;
  payer: {
    email: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

  if (!accessToken) {
    console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
    return new Response(
      JSON.stringify({ error: "Payment gateway not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Parse the notification
    const notification: MercadoPagoNotification = await req.json();
    
    console.log("Received Mercado Pago notification:", {
      type: notification.type,
      action: notification.action,
      data_id: notification.data?.id,
    });

    // Only process payment notifications
    if (notification.type !== "payment") {
      console.log("Ignoring non-payment notification:", notification.type);
      return new Response(
        JSON.stringify({ received: true, processed: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch payment details from Mercado Pago API
    const paymentId = notification.data.id;
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("Error fetching payment details:", errorText);
      throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
    }

    const payment: PaymentDetails = await paymentResponse.json();
    
    console.log("Payment details:", {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      amount: payment.transaction_amount,
    });

    // external_reference contains our transaction ID
    const transactionExternalId = payment.external_reference;
    
    if (!transactionExternalId) {
      console.warn("Payment without external_reference, skipping");
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: "no_external_reference" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find our transaction
    const { data: transaction, error: findError } = await supabase
      .from("payment_transactions")
      .select("id, appointment_id, status, priest_id")
      .eq("external_id", transactionExternalId)
      .maybeSingle();

    if (findError) {
      console.error("Error finding transaction:", findError);
      throw findError;
    }

    if (!transaction) {
      console.warn("Transaction not found for external_id:", transactionExternalId);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: "transaction_not_found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Map Mercado Pago status to our status
    let newStatus: string;
    switch (payment.status) {
      case "approved":
        newStatus = "paid";
        break;
      case "cancelled":
      case "refunded":
      case "charged_back":
        newStatus = "cancelled";
        break;
      case "pending":
      case "in_process":
      case "authorized":
      default:
        newStatus = "pending";
    }

    // Only update if status changed
    if (transaction.status !== newStatus) {
      console.log(`Updating transaction ${transaction.id} from ${transaction.status} to ${newStatus}`);

      // Update payment transaction
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          paid_at: newStatus === "paid" ? payment.date_approved || new Date().toISOString() : null,
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        throw updateError;
      }

      // Update appointment payment status
      if (transaction.appointment_id) {
        const { error: appointmentError } = await supabase
          .from("appointments")
          .update({
            payment_status: newStatus,
          })
          .eq("id", transaction.appointment_id);

        if (appointmentError) {
          console.error("Error updating appointment:", appointmentError);
          // Don't throw - transaction was updated successfully
        }
      }

      // Log the notification
      await supabase.from("notifications_log").insert({
        priest_id: transaction.priest_id,
        appointment_id: transaction.appointment_id,
        type: "payment_webhook",
        status: "success",
      });

      console.log("Transaction updated successfully");
    } else {
      console.log("Status unchanged, no update needed");
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        processed: true,
        transaction_id: transaction.id,
        new_status: newStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
