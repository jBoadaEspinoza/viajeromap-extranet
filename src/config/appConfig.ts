export interface AppConfig {
  business: {
    ruc: string;
    name: string;
    website: string;
    phone: string;
    address: string;
    email: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  pricing: {
    defaultCommissionPercentage: number;
  };
}

export const appConfig: AppConfig = {
  business: {
    ruc: "10430391564",
    name: "Peru Trips And Adventures",
    website: "perutripsadventures.com",
    phone: "+51919026082",
    address: "Av Paracas Mz Lot 05 Paracas, Ica, Perú",
    email: "info@perutripsadventures.com"
  },
  colors: {
    primary: "#FF4500",
    secondary: "#2C3E50",
    accent: "#FFC107"
  },
  api: {
    baseUrl: "https://tg4jd2gc-8080.brs.devtunnels.ms",
    timeout: 10000
  },
  pricing: {
    defaultCommissionPercentage: 0
  }
};

export default appConfig; 