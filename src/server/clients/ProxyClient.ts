import axios from "axios";
import { cloneDeep } from "lodash-es";
import logger from "~/server/logger";

interface ProxyEntry {
  host: string;
  port: string;
}
const wait = async (time: number) => {
  return new Promise((resolve) => setTimeout(() => resolve(true), time * 100));
};
export type ProxyList = ProxyEntry[];

const url =
  "https://api.proxyscrape.com/v2/account/datacenter_shared/proxy-list?auth=3vwiuptr337xpjmqww1w&type=getproxies&country[]=all&protocol=http&format=json&status=online";

export interface ProxyResponse {
  data: Array<[string, string, string, string]>;
  recordsTotal: number;
  recordsFiltered: number;
  draw: number;
}

const fiftenMinMs = 1000 * 60 * 15;
export class ProxyClient {
  static proxyList: { updateTime?: Date; list: ProxyList } = {
    list: [],
  };
  fetchProxies = async (opts?: { quiet?: boolean; forceFetch?: boolean }): Promise<ProxyList> => {
    // remove this in the future

    const { quiet = false, forceFetch = false } = opts || {};
    if (ProxyClient.proxyList.list.length && ProxyClient.proxyList.updateTime && !forceFetch) {
      const now = new Date();
      const then = ProxyClient.proxyList.updateTime;
      const msPassed = now.getTime() - then.getTime();
      // if it's within the last 15 minutes reuse the saved one
      if (msPassed < fiftenMinMs) {
        return cloneDeep(ProxyClient.proxyList.list);
      }
    }

    for (let i = 0; i < 3; i++) {
      try {
        if (!quiet) {
          logger.debug("Fetching proxies");
        }
        const resp = await axios.get<ProxyResponse>(url);

        const objects = resp.data.data;
        const proxyList = objects
          .map((entry): ProxyEntry | undefined => {
            const [ip] = entry;
            if (!ip) {
              return;
            }
            const [host, port] = String(ip).trim().split(":");
            if (!host || !port) {
              return;
            }
            return {
              host,
              port,
            };
          })
          .filter(Boolean) as ProxyList;
        if (proxyList.length === 0) {
          logger.error("Found no valid proxies");
          throw new Error("Found no valid proxies");
        }
        if (!quiet) {
          logger.debug(`Fetched ${proxyList.length} valid proxies`);
        }
        // https://github.com/microsoft/TypeScript/issues/16655
        ProxyClient.proxyList = {
          list: cloneDeep(proxyList),
          updateTime: new Date(),
        };
        return proxyList;
      } catch (e) {
        logger.error(`Failed to fetch proxy list`);

        await wait(2 ** (i + 1) * 30);
        // wait 30s between calls if they fail
      }
    }
    return [];
  };
}
