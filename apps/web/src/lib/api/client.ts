import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";

import type { paths } from "./schema";

export const api = createFetchClient<paths>({ baseUrl: "/api" });
export const $api = createQueryClient(api);
