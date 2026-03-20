import Iyzipay from "iyzipay";

type IyzicoCheckoutPayload = Record<string, unknown>;

function getRequiredEnv(name: "IYZICO_API_KEY" | "IYZICO_SECRET_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function createIyzicoClient() {
  return new Iyzipay({
    apiKey: getRequiredEnv("IYZICO_API_KEY"),
    secretKey: getRequiredEnv("IYZICO_SECRET_KEY"),
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  });
}

export function initializeCheckoutForm(iyzipay: any, payload: IyzicoCheckoutPayload) {
  return new Promise<any>((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(payload, (error: any, result: any) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export function retrieveCheckoutForm(iyzipay: any, token: string) {
  return new Promise<any>((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(
      {
        locale: "tr",
        conversationId: `callback-${Date.now()}`,
        token,
      },
      (error: any, result: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );
  });
}
