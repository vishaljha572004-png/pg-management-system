/**
 * SMS Service for OTP Delivery
 * Utilizes Fast2SMS API which is optimized for Indian (+91) numbers.
 * The API requires the FAST2SMS_API_KEY environment variable.
 */
export const sendSMS = async (phone, message) => {
  // If we are in development and no key is provided, we simulate the OTP sending.
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    console.warn(`[SMS Service Warning] FAST2SMS_API_KEY is not set.`);
    console.log(`[SMS Service Mock] Sending to ${phone}: ${message}`);
    // Simulate successful API response if no key is found
    return { success: true, message: 'Mock SMS sent' };
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phone,
      }),
    });

    const data = await response.json();
    
    if (data.return === true) {
      return { success: true, data };
    } else {
      console.error('[SMS Service Error]', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    console.error('[SMS Service Exception]', error);
    return { success: false, error: error.message };
  }
};
