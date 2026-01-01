"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppNotification = sendWhatsAppNotification;
exports.sendBulkWhatsAppNotifications = sendBulkWhatsAppNotifications;
const client_1 = require("@prisma/client");
const twilio_1 = __importDefault(require("twilio"));
const prisma = new client_1.PrismaClient();
// Lazy initialize Twilio client
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        // Check if credentials are configured (not placeholders)
        if (!accountSid || !authToken || accountSid.startsWith('your-')) {
            return null;
        }
        twilioClient = (0, twilio_1.default)(accountSid, authToken);
    }
    return twilioClient;
}
async function sendWhatsAppNotification({ to, message, deliveryId, type = 'GENERAL' }) {
    try {
        const rawRecipient = typeof to === 'string' ? to.trim() : '';
        if (!rawRecipient) {
            console.warn('[WhatsApp] Missing recipient, skipping notification logging');
            return { success: false, reason: 'Missing recipient' };
        }
        const client = getTwilioClient();
        // If Twilio is not configured, log and skip
        if (!client) {
            console.log('[WhatsApp] Twilio not configured, skipping notification:', message);
            // Still log to database
            await prisma.notification.create({
                data: {
                    type,
                    recipient: rawRecipient,
                    message,
                    status: 'SKIPPED',
                    deliveryId
                }
            });
            return { success: false, reason: 'Twilio not configured' };
        }
        // Format phone number (ensure it has country code)
        const formattedPhone = rawRecipient.startsWith('+') ? rawRecipient : `+91${rawRecipient}`;
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
    }
    catch (error) {
        console.error('WhatsApp error:', error);
        // Log error
        if (deliveryId) {
            try {
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
            catch (logError) {
                console.error('WhatsApp error logging failed:', logError?.message || logError);
            }
        }
        return { success: false, error: error.message };
    }
}
// Send bulk notifications
async function sendBulkWhatsAppNotifications(messages) {
    const results = await Promise.allSettled(messages.map(msg => sendWhatsAppNotification(msg)));
    return results.map((result, index) => ({
        recipient: messages[index].to,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
    }));
}
//# sourceMappingURL=whatsapp.js.map