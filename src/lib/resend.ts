import { Resend } from "resend";
import { Logger } from "./logger";

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
            ${params.items.map((item) => `<li>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`).join("")}
          </ul>
          <p style="font-size: 18px; font-weight: bold;">Total Paid: $${params.totalAmount.toFixed(2)}</p>
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
