import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { HttpCookieAgent, HttpsCookieAgent } from "http-cookie-agent/http";
import { CookieJar } from "tough-cookie";
import { load } from "cheerio";
import logger from "~/server/logger";
export const ciphers = [
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
  "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
  "TLS_RSA_WITH_AES_128_GCM_SHA256",
  "TLS_RSA_WITH_AES_256_GCM_SHA384",
  "TLS_RSA_WITH_AES_128_CBC_SHA",
  "TLS_RSA_WITH_AES_256_CBC_SHA",
  "SSL_RSA_WITH_3DES_EDE_CBC_SHA",
].join(":");
interface CapsolverResponse {
  errorId: number;
  errorCode: null;
  errorDescription: null;
  solution: Solution;
  status: string;
}

interface Solution {
  cookie: string;
}
const jar = new CookieJar(undefined, { allowSpecialUseDomain: true, looseMode: true, rejectPublicSuffixes: false });
const config: AxiosRequestConfig = { jar, timeout: 60_000 };
config.httpAgent = new HttpCookieAgent({ cookies: { jar }, keepAlive: true });

config.httpsAgent = new HttpsCookieAgent({
  cookies: { jar },
  keepAlive: true,
  ciphers,
});

const client = axios.create(config);
export class BaseService {
  client: AxiosInstance;
  jar: CookieJar;

  constructor() {
    this.jar = jar;
    this.client = client;
    this.client.interceptors.response.use(
      async (response) => {
        if (response.status === 202 && response.data && response.headers["x-amzn-waf-action"] === "challenge") {
          logger.info("Received WAF challenge");
          const now = new Date();
          const didSucceed = await this.refreshWafToken(response);
          if (!didSucceed) {
            logger.error("Failed to solve captcha");
            throw new Error("Failed to solve captcha");
          }
          logger.info(`Solved captcha in ${new Date().getTime() - now.getTime()}ms`);
          return this.client.request(response.config);
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          throw new Error("Unauthorized");
        }

        if (error.response?.status === 405) {
          logger.info("Received WAF challenge");
          const now = new Date();
          const didSucceed = await this.refreshWafToken(error.response);
          if (!didSucceed) {
            logger.error("Failed to solve captcha");
            throw new Error("Failed to solve captcha");
          }
          logger.info(`Solved captcha in ${new Date().getTime() - now.getTime()}ms`);
          return this.client.request(error.response.config);
        }
        throw error;
      },
    );
  }

  private refreshWafToken = async (response: AxiosResponse) => {
    /*
    the html will contain

    window.gokuProps = {
"key":"AQIDAHjcYu/GjX+QlghicBgQ/7bFaQZ+m5FKCMDnO+vTbNg96AHpDSBut/6uIEJP1wJT6m4KAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMLwxVqPwf3VJtk8M5AgEQgDsaKl/P7uu1I+EU6JRND5CYaCOqsZU3ZeOqp5kZ/AWeum5NBwzuKYlrt4A5EbXSQEAGhQ4FlzuS2oZHIg==",
          "iv":"grDd8AAAEyAABjJf",
          "context":"3Rh2O33SZyDNw7+d2HgDOiMFdGnQ+MA1EXrymR+F57GKYbDiWZG3cVq65VDJOtpl8E0n62i+kf1D6+gtpLQDCAcQin2Cpixo0xYB3BoGpf121oCYBMcESmPA3UXH2Ly0Z2EgjtKSwDekBWsXjU/lXFJnaEvvcc44OLcALX4On6DjUWwWKwCNJXarnqDfnAnQ9Ni2aLj/cDcpyL78ZhUHX9OxZmE7VJawvBvT5aDy0l4KPVbpBJk3EZGLOr2n9FhtXjy52+o3+r+yxR0Wf2/UTnR3Nbcd5ENbNSLSbLUwHsBzKvX5WkMHLDsRP/YZs97BQ967aKNbNSpQGUTygbBZlRZoAWwMq0ULtMgICIxpmtj3Mo9Wezb9vMo2YfMKJvq+BnR7ScXlzG8z0LET5ZfqsQ=="
};
we want to extract the key, iv and context
    */
    const html = response.data;
    const websiteURL = response.config.url!;
    const status = response.status;

    const jsChallenge = html.match(/<script.*?src="(.*?)".*?><\/script>/);
    let task: Record<string, string> = {
      type: "AntiAwsWafTaskProxyLess", //Required
      websiteURL,
    };
    if (jsChallenge && jsChallenge[1] && status === 202) {
      task["awsChallengeJS"] = jsChallenge[1];
    } else {
      const $ = load(html, undefined);
      const script = $("script").filter((i, el) => {
        const text = $(el).html();
        return text?.includes("window.gokuProps") || false;
      });
      const text = script.html();
      const start = text?.indexOf("{");
      const end = text?.lastIndexOf("}");
      const json = text?.substring(start!, end! + 1);
      const data = JSON.parse(json || "{}");
      if (!data.key || !data.iv || !data.context) {
        return false;
      }
      task = {
        ...task,
        awsKey: data.key,
        awsIv: data.iv,
        awsContext: data.context,
      };
    }
    const didSucceed = await this.capsolverInit(task, websiteURL);
    if (!didSucceed) {
      throw new Error("Failed to solve captcha");
    }
    return true;
  };
  private capsolverInit = async (task: Record<string, string>, websiteURL: string) => {
    const response = await this.post<{
      errorId: number;
      errorCode: string;
      errorDescription: string;
      taskId: string;
    }>(
      "https://api.capsolver.com/createTask",
      {
        clientKey: process.env.CAPTCHA_API_KEY,
        task,
      },
      {
        timeout: 30_000,
      },
    );
    const id = response.data.taskId;
    let count = 0;

    while (count < 15) {
      const capsolverResponse = await this.capsolverResponse(id);
      if (capsolverResponse.status === "ready") {
        await this.jar.setCookie(
          `aws-waf-token=${capsolverResponse.solution.cookie}`,
          `https://${new URL(websiteURL).host}`,
        );
        return capsolverResponse;
      }

      if (capsolverResponse.status === "failed") {
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      count++;
    }
    return null;
  };
  private capsolverResponse = async (id: string) => {
    const response = await this.post<CapsolverResponse>("https://api.capsolver.com/getTaskResult", {
      clientKey: process.env.CAPTCHA_API_KEY,
      taskId: id,
    });

    return response.data;
  };

  private cleanConfig = (config?: AxiosRequestConfig) => {
    if (config?.headers) {
      const headers = config.headers;
      for (const [key, value] of Object.entries(headers || {})) {
        if (value === undefined || "") {
          delete headers[key];
        }
      }
    }
    return config;
  };

  patch = async <T>(path: string, data: object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await this.client.patch(path, data, this.cleanConfig(config));
  };

  post = async <T>(path: string, data: object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await this.client.post(path, data, this.cleanConfig(config));
  };
  put = async <T>(path: string, data: object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await this.client.put(path, data, this.cleanConfig(config));
  };

  get = async <T>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return this.client.get(path, this.cleanConfig(config));
  };

  delete = async <T>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return this.client.delete(path, this.cleanConfig(config));
  };
}
