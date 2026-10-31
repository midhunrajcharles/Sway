/** Payment environment marker, like a "Test mode" pill. Set NEXT_PUBLIC_PAYPAL_ENV=live to hide it. */
export const PAYPAL_ENV = process.env.NEXT_PUBLIC_PAYPAL_ENV ?? "sandbox";

export function EnvBadge({ className }: { className?: string }) {
  if (PAYPAL_ENV === "live") return null;
  return (
    <span className={`sw-env${className ? ` ${className}` : ""}`} title="Payments run in the PayPal sandbox. No real money moves.">
      Sandbox
    </span>
  );
}
