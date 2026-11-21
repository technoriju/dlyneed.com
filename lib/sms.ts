// SMS Provider interface (spec §1, §6, §7)
// Uses mock SMS provider in development and logs OTP to the console.
// Production can be configured with MSG91, Twilio or Firebase Auth.

export interface SendSmsParams {
  phone: string;
  code: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  mockCode?: string;
}

export async function sendOtpSms({ phone, code }: SendSmsParams): Promise<SendSmsResult> {
  const isDev = process.env.NODE_ENV !== "production";
  const msg91Key = process.env.MSG91_AUTH_KEY;

  if (msg91Key && !isDev) {
    // Production MSG91 integration placeholder
    try {
      const templateId = process.env.MSG91_OTP_TEMPLATE_ID || "";
      const res = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${phone.replace(/\D/g, "")}&otp=${code}`, {
        headers: { authkey: msg91Key },
      });
      const data = await res.json();
      return { success: data.type === "success", messageId: data.request_id };
    } catch (err) {
      console.error("MSG91 SMS send error:", err);
      return { success: false };
    }
  }

  // Development Mock SMS Provider
  console.log(`\n========================================`);
  console.log(`📱 [SMS SIMULATOR]`);
  console.log(`   To: ${phone}`);
  console.log(`   Code: ${code}`);
  console.log(`   Valid for: 5 minutes`);
  console.log(`========================================\n`);

  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    mockCode: isDev ? code : undefined,
  };
}
