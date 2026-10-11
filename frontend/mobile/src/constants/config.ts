// IMPORTANT: localhost yahan kaam nahi karega kyunki phone/emulator
// alag device hai. Apni machine ki LAN IP daalo (same WiFi pe honi chahiye).
// Read from .env file (EXPO_PUBLIC_API_URL) or fallback to default
export const API_BASE_URL: string = 
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.5:3000/api";

export const MULTAN_AREAS: string[] = [
 "Cantt",
  "Gulgasht Colony",
  "Shah Rukn-e-Alam Colony",
  "Bosan Road",
  "Model Town",
  "Chowk Kumharanwala",
  "Vehari Road",
  "Nawa Shehar",
];


export const DELIVERY_FEE = 100;

// TODO: Replace with your actual JazzCash account details
export const JAZZCASH_ACCOUNT = {
  number: "0328-7635726",
  title: "Tasty Garden Restaurant | Multan",
};
