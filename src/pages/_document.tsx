import * as React from "react";
import { ssrCssRenderCaches } from "~/data/emotionCache";

import theme, { poppins } from "~/components/theme";
import type { DocumentProps } from "next/document";
import { Html, Head, Main, NextScript } from "next/document";

interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: JSX.Element[];
}
const MyDocument = (props: MyDocumentProps) => {
  const { locale = "en", dangerousAsPath } = props;
  const cache = ssrCssRenderCaches[dangerousAsPath];
  let emotionStyleTags: JSX.Element[] = [];
  if (cache) {
    // Generate style tags for the styles coming from Emotion
    // This is important. It prevents Emotion from rendering invalid HTML.
    // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153

    const emotionStyles = [] as Array<{ key: string; ids: Array<string>; css: string }>;
    const regularCssIds: string[] = [];
    let regularCss = "";

    Object.keys(cache.inserted).forEach((id) => {
      if (cache.inserted[id] !== true) {
        if (cache.registered[`${cache.key}-${id}`]) {
          // regular css can be added in one style tag
          regularCssIds.push(id);
          regularCss += cache.inserted[id];
        } else {
          // each global styles require a new entry so it can be independently flushed
          emotionStyles.push({
            key: `${cache.key}-global`,
            ids: [id],
            css: cache.inserted[id] as string,
          });
        }
      }
    });

    // make sure that regular css is added after the global styles
    emotionStyles.push({ key: cache.key, ids: regularCssIds, css: regularCss });

    emotionStyleTags = emotionStyles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(" ")}`}
        key={style.key}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));
  }

  return (
    <Html id={"__root"} className={poppins.className} lang={locale}>
      <Head>
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content={theme.palette.primary.main} />
        {emotionStyleTags}
        <meta name="emotion-insertion-point" content="" />
      </Head>
      <body className={"main-bg dark:bg-[#2c2c2c]"}>
        <Main />
      </body>

      <NextScript />
    </Html>
  );
};

export default MyDocument;
