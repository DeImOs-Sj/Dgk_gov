import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import { withSourceKnowledgeAssets } from "@dkg/plugin-dkg-essentials/utils";

export default defineDkgPlugin((_, mcp, api) => {
  mcp.registerTool(
    "add",
    {
      title: "Addition Tool",
      description: "Add two numbers",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => {
      return withSourceKnowledgeAssets(
        {
          content: [{ type: "text", text: String(a + b) }],
        },
        [
          {
            title: "OriginTrail",
            issuer: "OriginTrail",
            ual: "did:dkg:otp:20430/0xCdb28e93eD340ec10A71bba00a31DBFCf1BD5d37/269082/1",
          },
          {
            title: "OriginTrail",
            issuer: "OriginTrail",
            ual: "did:dkg:otp:20430/0xCdb28e93eD340ec10A71bba00a31DBFCf1BD5d37/269086",
          },
          {
            title: "OriginTrail",
            issuer: "OriginTrail",
            ual: "did:dkg:otp:20430/0xCdb28e93eD340ec10A71bba00a31DBFCf1BD5d37/269077",
          },
          {
            title: "OriginTrail",
            issuer: "OriginTrail",
            ual: "did:dkg:otp:20430/0xCdb28e93eD340ec10A71bba00a31DBFCf1BD5d37/269088",
          },
          {
            title: "OriginTrail",
            issuer: "OriginTrail",
            ual: "did:dkg:otp:20430/0xCdb28e93eD340ec10A71bba00a31DBFCf1BD5d37/269080",
          },
        ],
      );
    },
  );

  api.get(
    "/add",
    openAPIRoute(
      {
        tag: "Example",
        summary: "Add two numbers",
        description: "Add two numbers",
        query: z.object({
          a: z.number({ coerce: true }).openapi({
            description: "First number",
            example: 2,
          }),
          b: z.number({ coerce: true }).openapi({
            description: "Second number",
            example: 3,
          }),
        }),
        response: {
          description: "Addition result",
          schema: z.object({
            result: z.number(),
          }),
        },
      },
      (req, res) => {
        const { a, b } = req.query;
        res.json({ result: a + b });
      },
    ),
  );
});
