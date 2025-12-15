interface WhatsAppMessage {
    to: string;
    message: string;
    deliveryId?: string;
    type?: string;
}
export declare function sendWhatsAppNotification({ to, message, deliveryId, type }: WhatsAppMessage): Promise<{
    success: boolean;
    sid: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    sid?: undefined;
}>;
export declare function sendBulkWhatsAppNotifications(messages: WhatsAppMessage[]): Promise<{
    recipient: string;
    status: "rejected" | "fulfilled";
    data: {
        success: boolean;
        sid: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        sid?: undefined;
    } | null;
    error: any;
}[]>;
export {};
//# sourceMappingURL=whatsapp.d.ts.map