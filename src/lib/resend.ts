import { Resend } from "resend";
import { Logger } from "./logger";
import { formatCurrency } from "./currency";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  bankReference: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}) {
  if (!resend) {
    Logger.warn("Resend API key missing. Email sending skipped in dev mode.", {
      to: params.to,
      orderNumber: params.orderNumber,
    });
    return { success: false, reason: "resend_not_configured" };
  }

  try {
    const from = process.env.EMAIL_FROM || "LUXORA <orders@luxora-store.com>";
    const response = await resend.emails.send({
      from,
      to: params.to,
      subject: `Order Confirmed - #${params.orderNumber} | LUXORA`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h1 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">LUXORA</h1>
          <h2>Order Payment Confirmed!</h2>
          <p>Thank you for shopping with Luxora. Your bank transfer payment has been verified, and your order is now being processed.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>Order Reference:</strong> #${params.orderNumber}</p>
          <p><strong>Bank Reference:</strong> ${params.bankReference}</p>
          <h3>Order Items</h3>
          <ul>
            ${params.items.map((item) => `<li>${item.quantity}x ${item.name} - ${formatCurrency(item.price)}</li>`).join("")}
          </ul>
          <p style="font-size: 18px; font-weight: bold;">Total Paid: ${formatCurrency(params.totalAmount)}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">If you have any questions, reply to this email or visit our Help Center.</p>
        </div>
      `,
    });
    Logger.info("Order confirmation email sent", { orderNumber: params.orderNumber, id: response.data?.id });
    return { success: true, id: response.data?.id };
  } catch (err) {
    Logger.error("Failed to send order confirmation email", err, { orderNumber: params.orderNumber });
    return { success: false, error: err };
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  token: string;
}) {
  const domain =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_STORE_URL ||
    "http://localhost:3000";
  const confirmLink = `${domain}/auth/verify-email?token=${params.token}&email=${encodeURIComponent(params.to)}`;

  if (!resend) {
    Logger.warn(
      "Resend API key missing. Email verification link generated (dev mode):",
      { to: params.to, link: confirmLink }
    );
    console.log(`\n========================================\n[DEV VERIFICATION LINK] (${params.to}):\n${confirmLink}\n========================================\n`);
    return { success: false, reason: "resend_not_configured", link: confirmLink };
  }

  try {
    const from = process.env.EMAIL_FROM || "LUXORA <auth@luxora-store.com>";
    const response = await resend.emails.send({
      from,
      to: params.to,
      subject: "Verify Your Email Address | LUXORA",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111; background-color: #FAFAFA;">
          <div style="background-color: #FFFFFF; padding: 40px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000; text-transform: uppercase; letter-spacing: 3px; font-size: 24px; font-weight: 800; margin: 0;">LUXORA</h1>
              <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Luxury Redefined</p>
            </div>
            
            <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px;">Verify Your Email Address</h2>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Thank you for registering with LUXORA. Please click the button below to verify your email address and activate your account. This link will expire in 24 hours.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmLink}" style="background-color: #000000; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #6B7280; font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
              If the button doesn't work, copy and paste the following link into your browser:
            </p>
            <p style="color: #4F46E5; font-size: 12px; word-break: break-all; margin-bottom: 32px;">
              <a href="${confirmLink}" style="color: #4F46E5;">${confirmLink}</a>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #F3F4F6; margin: 24px 0;" />
            <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin: 0;">
              If you did not request this email, you can safely ignore it.
            </p>
          </div>
        </div>
      `,
    });
    Logger.info("Verification email sent", { to: params.to, id: response.data?.id });
    return { success: true, id: response.data?.id };
  } catch (err) {
    Logger.error("Failed to send verification email", err, { to: params.to });
    return { success: false, error: err };
  }
}

