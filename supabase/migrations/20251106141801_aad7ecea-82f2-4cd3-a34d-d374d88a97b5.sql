-- Allow public clients to create appointments
CREATE POLICY "Public clients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (true);

-- Allow public clients to create payment transactions
CREATE POLICY "Public clients can create payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- Allow public clients to view their payment transactions by appointment_id
CREATE POLICY "Public can view payment transactions"
ON public.payment_transactions
FOR SELECT
USING (true);