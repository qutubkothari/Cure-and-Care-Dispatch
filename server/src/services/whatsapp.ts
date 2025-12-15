import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface WhatsAppMessage {
  to: string;
  message: string;
  deliveryId?: string;
  type?: string;
}

export async function sendWhatsAppNotification({
  to,
  message,
  deliveryId,
  type = 'GENERAL'
}: WhatsAppMessage) {
  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = to.startsWith('+') ? to : `+91${to}`;

    // Log notification attempt
    const notification = await prisma.notification.create({
      data: {
        recipient: formattedPhone,
        message,
        deliveryId,
        type,
        status: 'pending'
      }
    });

    // Send via Twilio WhatsApp API
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: `whatsapp:${formattedPhone}`,
      body: message
    });

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });

    console.log('WhatsApp sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('WhatsApp error:', error);

    // Log error
    if (deliveryId) {
      await prisma.notification.updateMany({
        where: {
          deliveryId,
          status: 'pending'
        },
        data: {
          status: 'failed',
          error: error.message
        }
      });
    }

    return { success: false, error: error.message };
  }
}

// Send bulk notifications
export async function sendBulkWhatsAppNotifications(messages: WhatsAppMessage[]) {
  const results = await Promise.allSettled(
    messages.map(msg => sendWhatsAppNotification(msg))
  );

  return results.map((result, index) => ({
    recipient: messages[index].to,
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
