import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { createWalletClient, custom, Hex } from "viem";
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
import { usePrivy, useWallets } from "@privy-io/react-auth";

function App() {
  const { connectWallet } = usePrivy();
  const [data, setData] = useState<FeeData | undefined>(undefined);
  const [overrideChain, setOverrideChain] = useState<number>(1);

  useEffect(() => {
    try {
      connectWallet();
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    const fetchLiQuest = async () => {
      try {
        const response = await fetch(
          "https://li.quest/v1/integrators/nestwallet"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as FeeData;

        const test = data.feeBalances.map((feeBalance) => {
          const test1 = feeBalance.tokenBalances
            .map((tokenBalance) => parseFloat(tokenBalance.amountUsd))
            .reduce((prev, cur) => prev + cur);
          return [feeBalance.chainId, test1];
        });
        console.log("here", test);

        setData(data);
        console.log("li.quest response:", data);
      } catch (error) {
        console.error("Error fetching li.quest:", error);
      }
    };

    fetchLiQuest();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {!data ? (
          <p>loading...</p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* <button
              className="bg-slate-400"
              onClick={() => {
                claim(overrideChain);
              }}
            >
              Click here for override ({getChain(overrideChain)?.name}
              )! (if chain doesn't show up)
            </button> */}
            {/* <input
              type="number"
              step="1"
              min="0"
              pattern="[0-9]*"
              inputMode="numeric"
              className="text-black p-1 rounded"
              onKeyDown={(e) => {
                // Prevent entering e, +, -, . etc.
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                // Save the input value to state
                setOverrideChain(parseInt(e.target.value));
              }}
            /> */}
            {data!.feeBalances.map((item: FeeBalance, idx: number) => (
              <FeeDataItem feeBalance={item} />
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

function FeeDataItem(props: { feeBalance: FeeBalance }) {
  const { feeBalance } = props;
  const { wallets } = useWallets();
  const tokenBalances = feeBalance.tokenBalances;
  const [enabled, setEnabled] = useState<boolean>(true);

  async function claim(item: FeeBalance) {
    const wallet = wallets[0];
    await wallet.switchChain(item.chainId);
    const url = `https://li.quest/v1/integrators/nestwallet/withdraw/${item.chainId}`;
    const response = await fetch(url);
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch: ${(await response.json()).message!}`);
    // }
    const resp = (await response.json()) as WithDrawResp;

    // const txnData = resp.transactionRequest.to;

    const prefix0 = "0xe5d64766";
    const prefix1 =
      "0000000000000000000000000000000000000000000000000000000000000020";
    // let txnDataWithoutPrefix: string;
    // if (txnData.startsWith(prefix)) {
    //   txnDataWithoutPrefix = txnData.slice(prefix.length);
    // } else {
    //   txnDataWithoutPrefix = txnData;
    // }

    var tokens: string[] = [];
    for (let i = 0; i < item.tokenBalances.length; i++) {
      if (tokens.length >= 38) {
        break;
      }
      let tokenBalance = item.tokenBalances[i];
      let token = item.tokenBalances[i].token;
      if (parseFloat(tokenBalance.amountUsd) < 1) {
        continue;
      }
      console.log(tokenBalance.amountUsd);
      tokens.push(token.address.substring(2).padStart(64, "0"));
    }
    if (tokens.length == 0) {
      console.log("no tokens to withdraw");
      return;
    }

    // var txnDataChunks = [];
    // for (let i = 0; i < txnDataWithoutPrefix.length; i += 64) {
    //   txnDataChunks.push(txnDataWithoutPrefix.slice(i, i + 64));
    // }
    // console.log(txnDataChunks);

    // txnDataChunks = txnDataChunks.slice(0, 3);

    const numTokens = tokens.length.toString(16);
    // if (txnDataChunks.length - 2 <= 0) {
    //   console.log("NO TOKENS");
    //   return;
    // }
    // Pad numTokens with leading zeros until it is 64 characters long
    const paddedNumTokens = numTokens.padStart(64, "0");
    // txnDataChunks[1] = paddedNumTokens;
    // var joinedChunks = "0xe5d64766" + txnDataChunks.join("");

    const data = prefix0 + prefix1 + paddedNumTokens + tokens.join("");
    const provider = await wallet.getEthereumProvider();

    const chain = getChain(item.chainId);
    const walletClient = createWalletClient({
      account: wallet.address as Hex,
      chain,
      transport: custom(provider),
    });
    await walletClient.switchChain({
      id: item.chainId,
    });
    const txHash = await walletClient.sendTransaction({
      chain,
      to: resp.transactionRequest.to as Hex,
      data: data as Hex,
    });
    console.log(txHash);
  }

  const usdAmount = tokenBalances
    .map((tokenBalance) => parseFloat(tokenBalance.amountUsd))
    .reduce((prev, cur) => prev + cur);

  const chain = getChain(feeBalance.chainId);
  return (
    <button
      className="flex flex-col rounded-md bg-slate-700 p-3"
      onClick={async () => {
        setEnabled(false);
        try {
          await claim(feeBalance);
        } catch (e) {
          console.log("THERE WAS AN ERROR", e);
        } finally {
          setEnabled(true);
        }
      }}
      disabled={!enabled}
    >
      <span className="flex-1 text-[16px]">
        Chain: {chain ? chain.name : feeBalance.chainId}
      </span>
      <span className="flex-1 text-[16px]">Expected Amount : ${usdAmount}</span>
      <span className="flex-1 text-[14px]">
        #Tokens: {feeBalance.tokenBalances.length}
      </span>
    </button>
  );
}

function getChain(id: number) {
  if (id === mainnet.id) return mainnet;
  if (id === base.id) return base;
  if (id === arbitrum.id) return arbitrum;
  if (id === gnosis.id) return gnosis;
  if (id === scroll.id) return scroll;
  if (id === blast.id) return blast;
  if (id === polygon.id) return polygon;
  if (id === bsc.id) return bsc;
  if (id === avalanche.id) return avalanche;
  if (id === optimism.id) return optimism;
  if (id === linea.id) return linea;
  if (id === zksync.id) return zksync;
  return undefined;
}

type FeeData = {
  integratorId: string;
  feeBalances: FeeBalance[];
};

type FeeBalance = {
  chainId: number;
  tokenBalances: TokenBalance[];
};

type TokenBalance = {
  amount: string;
  amountUsd: string;
  token: Token;
};

type Token = {
  address: string;
  chainId: number;
  coinKey: string;
  logoURI: string;
  name: string;
  priceUSD: string;
  symbol: string;
};

// function balances

type WithDrawResp = {
  transactionRequest: {
    to: string;
    data: string;
  };
};

export default App;
