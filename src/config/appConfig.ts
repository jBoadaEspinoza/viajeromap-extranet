export interface AppConfig {
  business: {
    name: string;
    website: string;
    phone: string;
    address: string;
    email: string;
    urlLogo: string;
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
    name: "viajeromap",
    website: "www.viajeromap.com",
    phone: "+51919026082",
    address: "Av Paracas Mz Lot 05 Paracas, Ica, Perú",
    email: "informes@viajeromap.com",
    urlLogo: "https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/companies%2Fffb93748-8cac-4b18-affc-2923a1806eda.png?alt=media&token=78f4283b-e92c-4a8f-ac3f-9e948a299399"
  },
  colors: {
    primary: "#DC143C",
    secondary: "#2C3E50",
    accent: "#FFC107"
  },
  api: {
    baseUrl: "https://tg4jd2gc-8080.brs.devtunnels.ms",
    timeout: 10000
  },
  pricing: {
    defaultCommissionPercentage: 20
  }
};

export default appConfig; 