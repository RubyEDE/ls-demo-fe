import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo";

export const config = getDefaultConfig({
  appName: "Demo App",
  projectId,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});
