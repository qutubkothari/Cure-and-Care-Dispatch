export type SendMessageInput = {
  to: string;
  text: string;
};

export type WhatsAppProvider = {
  sendMessage(input: SendMessageInput): Promise<{ providerMessageId: string }>;
};

export function createStubWhatsAppProvider(): WhatsAppProvider {
  return {
    async sendMessage(input) {
      // API integration will be dropped in here once you provide credentials/endpoint.
      return { providerMessageId: `stub_${Date.now()}_${input.to}` };
    }
  };
}
