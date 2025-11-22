import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "@dkg/plugins/helpers";

extendZodWithOpenApi(z);
export { z };
