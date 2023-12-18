import "~/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

import { type Session } from "next-auth";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import React from "react";
import type { AppPropsType } from "next/dist/shared/lib/utils";

import { Providers } from "~/components/Providers";
import type { NextRouter } from "next/router";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "~/data/emotionCache";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";

interface Sess {
  session: Session | null;
}

const clientSideEmotionCache = createEmotionCache();

export type AppProps = AppPropsType<NextRouter, Sess>;

export const AppWrapper: AppType<Sess> = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <Providers>
        <main className="px-4 mx-auto h-[100dvh] w-full">
          <Component {...pageProps} />
        </main>
        <Tooltip id="app-tooltip" style={{ zIndex: 9999 }} className="hidden md:block" />
      </Providers>
    </CacheProvider>
  );
};

export default api.withTRPC(AppWrapper);
