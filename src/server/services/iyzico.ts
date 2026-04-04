import Iyzipay from "iyzipay";

function getRequiredEnv(name: "IYZICO_API_KEY" | "IYZICO_SECRET_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export type IyzicoCheckoutFormInitializePayload = {
  locale: "tr";
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: "TRY";
  basketId: string;
  paymentGroup: "PRODUCT";
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    gsmNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    zipCode: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "PHYSICAL";
    price: string;
  }>;
};

export type IyzicoCheckoutFormInitializeResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
  token?: string;
  tokenExpireTime?: number;
  conversationId?: string;
};

export type IyzicoCheckoutFormRetrieveResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  conversationId?: string;
  paymentId?: string;
  basketId?: string;
  mdStatus?: number | string;
  token?: string;
};

type IyzicoClient = {
  checkoutFormInitialize: {
    create(
      payload: IyzicoCheckoutFormInitializePayload,
      callback: (error: Error | null, result: IyzicoCheckoutFormInitializeResult) => void,
    ): void;
  };
  checkoutForm: {
    retrieve(
      payload: { locale: "tr"; conversationId: string; token: string },
      callback: (error: Error | null, result: IyzicoCheckoutFormRetrieveResult) => void,
    ): void;
  };
};

export function createIyzicoClient(): IyzicoClient {
  return new Iyzipay({
    apiKey: getRequiredEnv("IYZICO_API_KEY"),
    secretKey: getRequiredEnv("IYZICO_SECRET_KEY"),
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  }) as unknown as IyzicoClient;
}

export function initializeCheckoutForm(
  iyzipay: IyzicoClient,
  payload: IyzicoCheckoutFormInitializePayload,
) {
  return new Promise<IyzicoCheckoutFormInitializeResult>((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(payload, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export function retrieveCheckoutForm(iyzipay: IyzicoClient, token: string) {
  return new Promise<IyzicoCheckoutFormRetrieveResult>((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(
      {
        locale: "tr",
        conversationId: `callback-${Date.now()}`,
        token,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );
  });
}
