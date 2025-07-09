import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  arbitrum,
  avalanche,
  base,
  blast,
  bsc,
  gnosis,
  linea,
  mainnet,
  optimism,
  polygon,
  scroll,
  zksync,
} from "viem/chains";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmcwfqltd0062kz0lzksrkioa"
      config={{
        appearance: { walletChainType: "ethereum-only" },
        supportedChains: [
          arbitrum,
          avalanche,
          base,
          blast,
          bsc,
          gnosis,
          linea,
          mainnet,
          optimism,
          polygon,
          scroll,
          zksync,
        ],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
