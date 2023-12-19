import { BaseService } from "../BaseService";
import aws from "@aws-sdk/client-s3";
const { S3 } = aws;
import * as process from "process";
import { load } from "cheerio";
import { prisma } from "../../db";
import pMap from "p-map";
import type { RestructuringCase } from "@prisma/client";
import { KrollCase } from "./kroll-case";
import { uniqBy } from "lodash-es";
import logger from "~/server/logger";
import dayjs from "dayjs";
import { ProxyClient } from "~/server/clients/ProxyClient";

function caseLinkExtractor(html: string) {
  const $ = load(html);

  const links: { name: string; url: string }[] = [];

  $(".case-directory_listItem").each((i, node) => {
    const link = $(node).find("a")?.attr("href");
    const text = $(node).text();
    if (text && link) {
      const url = new URL(link);
      url.protocol = "https:";
      url.pathname;
      if (url.host.includes("primeclerk")) {
        url.host = url.host.replace("primeclerk", "ra.kroll");
      }
      links.push({
        name: text.trim(),
        url: url.toString(),
      });
    }
  });

  return uniqBy(links, (links) => links.url);
}

const proxyClient = new ProxyClient();
export class KrollClient extends BaseService {
  s3client = new S3({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    region: process.env.AWS_REGION || "",
  });
  S3_BUCKET = "claim-docs";

  constructor() {
    super(proxyClient);
  }

  private sharedHeaders = () => {
    return {
      authority: "restructuring.ra.kroll.com",
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://restructuring.ra.kroll.com",
      pragma: "no-cache",
      referer: "https://restructuring.ra.kroll.com/FTX/Home-ClaimInfo",
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    };
  };

  loadRestructuringCases = async () => {
    await this.proxyClient.fetchProxies();
    logger.info("Loading restructuring cases");
    const response = await this.get<string>("https://www.kroll.com/en/restructuring-administration-cases", {
      headers: this.sharedHeaders(),
    });
    // const tempDirListing = await fs.readFile(
    //   "/Volumes/ImpDoc/Backup/helicograph/server/clients/Kroll/temp.html",
    //   "utf-8",
    // );
    const tempDirListing = response.data;
    const links = caseLinkExtractor(tempDirListing);
    logger.info(`Found ${links.length} cases`);
    const existing = await prisma.restructuringCase.findMany({
      where: {
        url: {
          in: links.map((l) => l.url),
        },
      },
    });

    const existingIds = existing.map((l) => l.id);
    const existingUrls = new Set<string>(existing.map((l) => l.url));
    await prisma.restructuringCase.updateMany({
      where: {
        id: { in: existingIds },
      },
      data: {
        lastSeen: new Date(),
      },
    });

    const missing = links.filter((l) => !existingUrls.has(l.url));
    if (missing.length) {
      const toCreate = missing.map((restructuringCase) => {
        return {
          url: restructuringCase.url,
          name: restructuringCase.name,
          lastFetched: dayjs().subtract(1, "day").toDate(),
        };
      });
      if (toCreate.length) {
        await prisma.restructuringCase.createMany({ data: toCreate });
      }
    }
    logger.info(`Finished loading restructuring cases`);
  };

  refreshCase = async (restructuringCase: RestructuringCase) => {
    const krollCase = new KrollCase(this.proxyClient, restructuringCase);
    try {
      await krollCase.refreshCase();
      await prisma.restructuringCase.update({
        where: {
          id: restructuringCase.id,
        },
        data: {
          lastFetched: new Date(),
        },
      });
    } catch (e) {
      logger.error(e);
    }
  };

  refreshCases = async () => {
    await this.proxyClient.fetchProxies();
    const cases = await prisma.restructuringCase.findMany({
      where: {
        isDeleted: false,
        OR: [
          {
            lastFetched: null,
          },
          {
            lastFetched: {
              lt: dayjs().subtract(4, "hour").toDate(), // 1 hour ago
            },
          },
        ],
      },
    });
    await pMap(cases, this.refreshCase, {
      concurrency: 10,
    });
  };
}
