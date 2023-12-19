import { BaseService } from "../BaseService";
import type { Claim, RestructuringCase } from "@prisma/client";
import UserAgent from "user-agents";
import { load } from "cheerio";
import { chunk } from "lodash-es";
import { prisma } from "../../db";
import logger from "~/server/logger";
import type { ProxyClient } from "~/server/clients/ProxyClient";
interface ClaimsResponse {
  total: number;
  page: number;
  records: number;
  rows: {
    ClaimID: number;
    ScheduleNumber: string;
    ClaimNumber: string;
    DateFiled: string;
    CreditorName: string;
    TotalCurrentClaimAmount: string;
    DebtorName: string;
  }[];
}

const htmlStringTextMap = new Map<string, string>();

export class KrollCase extends BaseService {
  restructuringCase: RestructuringCase;
  userAgent: UserAgent;

  constructor(proxyClient: ProxyClient, restructuringCase: RestructuringCase) {
    super(proxyClient);
    this.restructuringCase = restructuringCase;
    this.userAgent = new UserAgent({
      deviceCategory: "desktop",
    });
  }

  private sharedHeaders = () => {
    return {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      pragma: "no-cache",
      referer: `${this.restructuringCase.url}/Home-ClaimInfo`,
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": this.userAgent.toString(),
      "x-requested-with": "XMLHttpRequest",
    };
  };

  refreshCase = async () => {
    await this.refreshDocket();
    await this.refreshClaims();
  };

  private getTextFromHtmlString = (html: string) => {
    if (htmlStringTextMap.has(html)) {
      return htmlStringTextMap.get(html)!;
    }
    const $ = load(html, undefined);
    const content = $(".tablesaw-cell-content")?.text()?.trim();
    if (content) {
      htmlStringTextMap.set(html, content);
      return content;
    }
    const body = $("body")?.text()?.trim();
    if (body) {
      htmlStringTextMap.set(html, body);
      return body;
    }
    htmlStringTextMap.set(html, "");
    return "";
  };

  refreshClaims = async () => {
    try {
      logger.info(`Refreshing entries for ${this.restructuringCase.name}`);
      const landingPage = await this.get<string>(`${this.restructuringCase.url}/Home-ClaimInfo`, {
        headers: {
          authority: "restructuring.ra.kroll.com",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en",
          "cache-control": "max-age=0",
          referer: `${this.restructuringCase.url}/Home-ClaimInfo`,
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "user-agent": this.userAgent.toString(),
        },
      });

      if (landingPage.status === 202 && landingPage.data && landingPage.headers["x-amzn-waf-action"] === "challenge") {
        logger.error(`Unable to fetch landing page for ${this.restructuringCase.name}`);
        return;
      }

      const landingHtml = landingPage.data;
      const $ = load(landingHtml, undefined);
      const debtorInputs = $(".chkDebtor");
      const debtors: string[] = [];
      debtorInputs.each((i, el) => {
        const debtor = $(el).attr("id");
        if (debtor) {
          debtors.push(debtor);
        }
      });

      let page = 1;
      const ROWS_LIMIT = 200_000;

      while (page) {
        const claims = await this.post<ClaimsResponse>(
          `${this.restructuringCase.url}/Home-LoadClaimData`,
          new URLSearchParams({
            ClaimNumber: "",
            ScheduleNumber: "",
            CreditorName: "",
            ConfirmationID: "",
            TotalCurrentClaimAmount: "Select an Option|Select an Option|",
            Dates: "|",
            ScopeValue: "Claims & Schedules",
            QuickSearch: "",
            Deptors: debtors.join("ê"),
            fl: "1",
            _search: "false",
            nd: new Date().getTime().toString(),
            rows: String(ROWS_LIMIT),
            page: String(page),
            sidx: "CreditorName",
            sord: "asc",
          }),
          {
            headers: this.sharedHeaders(),
            maxRedirects: 0,
            timeout: 60_000,
          },
        );

        if (claims.data && claims.data.records) {
          logger.info(
            `Found ${claims.data.rows.length}/${claims.data.records} claims for ${this.restructuringCase.name} on page ${page}`,
          );
          if (page === 1) {
            await prisma.caseClaimsDataPoint.create({
              data: {
                recordCount: claims.data.records,
                caseId: this.restructuringCase.id,
              },
            });
          }

          const processedClaims = claims.data.rows.map((claim) => {
            const totalClaimAmount = this.getTextFromHtmlString(claim.TotalCurrentClaimAmount);
            const scheduleNumber = this.getTextFromHtmlString(claim.ScheduleNumber).replace("Schedule", "");
            const dateFiled = this.getTextFromHtmlString(claim.DateFiled).replace("Filed Date", "");
            const claimNumber = this.getTextFromHtmlString(claim.ClaimNumber).replace("Claim #", "");
            const newClaim = {
              ClaimID: claim.ClaimID,
              ScheduleNumber: scheduleNumber ? parseInt(scheduleNumber) : undefined,
              ClaimNumber: claimNumber ? parseInt(claimNumber) : undefined,
              DateFiled: dateFiled ? dateFiled : undefined,
              CreditorName: this.getTextFromHtmlString(claim.CreditorName).replace("Name on File", "").trim(),
              TotalCurrentClaimAmount: totalClaimAmount,
              DebtorName: this.getTextFromHtmlString(claim.DebtorName),
              ParsedClaimAmount: totalClaimAmount ? parseFloat(totalClaimAmount.replace(/[^\d.]/gi, "")) : undefined,
              caseId: this.restructuringCase.id,
            };
            for (const key of ["ClaimNumber", "ScheduleNumber", "ParsedClaimAmount"] as const) {
              if (isNaN(newClaim[key]!)) {
                delete newClaim[key];
              }
            }

            return newClaim;
          });
          let saved = 0;
          for (const claims of chunk(processedClaims, 2500)) {
            if (claims.length) {
              const count = await prisma.claim.createMany({
                data: claims,
                skipDuplicates: true,
              });
              saved += count.count;
              logger.info(`Saved ${saved} entries for ${this.restructuringCase.name}`);
            }
          }

          //
          // await pMap(processedClaims, this.getDetailsForClaim, {
          //   concurrency: process.env.NODE_ENV === "production" ? 5 : 1,
          // });
        } else {
          if (
            typeof claims.data?.records !== "number" &&
            !String(claims.data).includes("<title>Kroll Restructuring Administration</title>")
          ) {
            logger.error(
              `Unable to fetch claims for ${this.restructuringCase.name}, got unexpected response ${JSON.stringify(
                claims.data,
              )}`,
            );
          }
          break;
        }

        if (typeof claims.data === "object" && claims.data?.rows?.length && claims.data?.rows?.length === ROWS_LIMIT) {
          page += 1;
        } else {
          page = 0; // break after the logic below is done
        }
      }
    } catch (e) {
      logger.error(e);
      throw e;
    }

    logger.info(`Done refreshing entries for ${this.restructuringCase.name}`);
  };

  private getDetailsForClaim = async (claim: { ClaimID: number }) => {
    const _response = await this.get<string>("/Home-CreditorDetailsForClaim", {
      params: {
        id: atob(String(claim.ClaimID)),
      },
      headers: this.sharedHeaders(),
    });
  };

  private getDocumentForClaim = async (claim: Claim) => {
    const _response = await this.get<string>("/Home-DonwlaodClaim", {
      params: {
        id: atob(String(claim.ClaimID)),
      },
      headers: this.sharedHeaders(),
      responseType: "arraybuffer",
    });
  };
  refreshDocket = async () => {};
}
