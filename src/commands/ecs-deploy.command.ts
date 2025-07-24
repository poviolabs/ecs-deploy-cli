/*
 Deploy an image from ECR to ECS Fargate
 */

import yargs from "yargs";

import { YargOption, YargsOptions, getBuilder } from "../helpers/yargs.helper";
import { ecsDeploy } from "./ecs-deploy";

class EcsDeployOptions implements YargsOptions {
  @YargOption({ envAlias: "PWD", demandOption: true })
  pwd!: string;

  @YargOption({ envAlias: "STAGE", demandOption: true })
  stage!: string;

  @YargOption({ envAlias: "TARGET" })
  target!: string;

  @YargOption({ envAlias: "RELEASE", demandOption: true })
  release!: string;

  @YargOption({ envAlias: "CI" })
  ci!: boolean;

  @YargOption({ envAlias: "WATCH" })
  watch!: boolean;

  @YargOption({ envAlias: "SKIP_ECR_EXISTS_CHECK" })
  skipEcrExistsCheck!: boolean;

  @YargOption({ envAlias: "VERBOSE", default: false })
  verbose!: boolean;

  @YargOption({ envAlias: "VERSION", type: "string", alias: "ecsVersion" })
  appVersion!: string;

  @YargOption({ envAlias: "UNTAG_UNUSED", type: "boolean", default: false })
  untagUnused!: boolean;

  @YargOption({ envAlias: "DAYS", type: "number", default: 30 })
  days!: number;

  @YargOption({ envAlias: "UNTAG_PREFIX", type: "string" })
  untagPrefix?: string;
}

export const command: yargs.CommandModule = {
  command: "deploy [target]",
  describe: "Deploy the ECR Image to ECS",
  builder: getBuilder(EcsDeployOptions),
  handler: async (_argv) => {
    const argv = (await _argv) as unknown as EcsDeployOptions;

    await ecsDeploy(argv);
  },
};
