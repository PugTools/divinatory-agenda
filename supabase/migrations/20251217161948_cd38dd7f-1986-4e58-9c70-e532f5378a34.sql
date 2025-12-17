-- Add UPDATE policy for payment_transactions so priests can update their own transactions
CREATE POLICY "Priests can update their own transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (auth.uid() = priest_id);

-- Also add UPDATE policy for appointments payment_status updates via payment_id
-- This is already covered by existing policy, but let's ensure the query works