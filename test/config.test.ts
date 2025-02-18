import { test } from "node:test";
import { getSha } from "../src/helpers/git.helper";
import { dirname } from "node:path";
import { fileURLToPath } from "url";
import { bootstrap } from "../src/commands/bootstrap";
import { loadConfig, merge } from "../src/helpers/ze-config";
import assert from "assert";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Test multiple destinations from a single ECR image
 */
test("config", async () => {
  // prepare image
  await bootstrap({
    pwd: __dirname,
    stage: "myapp-dev",
    release: await getSha(__dirname),
    verbose: true,
    target: "backend",
  });
});

test("config-env", async () => {
  // prepare image
  await bootstrap({
    pwd: __dirname,
    stage: "myapp-dev",
    release: await getSha(__dirname),
    verbose: true,
    target: "backend-ini",
  });
});

test("config-2", async () => {
  // prepare image
  await bootstrap({
    pwd: __dirname,
    stage: "myapp-dev",
    release: await getSha(__dirname),
    verbose: true,
    target: "backend-2",
  });
});

test("config-3", async () => {
  process.env.MYAPP_RECORD1 = "value 1";

  await bootstrap({
    pwd: __dirname,
    stage: "myapp-dev",
    release: await getSha(__dirname),
    verbose: true,
    target: "backend-3",
  });

  // merge myapp-dev.backend.template.yml and myapp-dev.backend.yml
  const template = await loadConfig(
    "backend-3.template",
    __dirname,
    "myapp-dev",
  );
  const diff = await loadConfig("backend-3", __dirname, "myapp-dev");

  assert.deepStrictEqual(diff, {
    database: {
      // template variables
      from_env: "value 1",
      stage: "myapp-dev",
      // from ecs-deploy-yml
      host: "localhost",
      deep: { item: { five: "six" } },
      items_with_template: [
        { name: "static", value: "value2" },
        { name: "thing", value: "value 1" },
      ],
    },

    // template variable
    a_string: "value 1",
  });

  assert.deepStrictEqual(merge(template, diff), {
    database: {
      username: "myapp2",
      from_env: "value 1",
      stage: "myapp-dev",
      host: "localhost",
      deep: { item: { five: "six", two: 1 } },
      items: [
        {
          object1: {
            record: "value 2",
          },
        },
        "value 3",
      ],
      items_with_template: [
        { name: "static", value: "value2" },
        { name: "thing", value: "value 1" },
      ],
    },
    a_string: "value 1",
    single_line_string: "this should\nremain a single string\nwith new lines\n",
  });
});
