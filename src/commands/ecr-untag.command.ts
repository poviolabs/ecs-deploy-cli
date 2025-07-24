import yargs from "yargs";
import { YargOption, YargsOptions, getBuilder } from "../helpers/yargs.helper";
import { safeLoadConfig } from "../helpers/ze-config";
import { untagUnusedImages } from "./ecr-untag";
import { EcrDeployConfig } from "./ecs-deploy";

class UntagOptions implements YargsOptions {
  @YargOption({ envAlias: "PWD", demandOption: true })
  pwd!: string;

  @YargOption({ envAlias: "STAGE", demandOption: true })
  stage!: string;

  @YargOption({ envAlias: "DAYS", type: "number", default: 30 })
  days!: number;

  @YargOption({ envAlias: "UNTAG_PREFIX", type: "string" })
  untagPrefix?: string;

  @YargOption({ envAlias: "RELEASE", demandOption: true })
  release!: string;
}

export const command: yargs.CommandModule = {
  command: "untag",
  describe: "Untag unused ECR images",
  builder: getBuilder(UntagOptions),
  handler: async (_argv) => {
    const argv = (await _argv) as unknown as UntagOptions;
    const config = await safeLoadConfig(
      "ecs-deploy",
      argv.pwd,
      argv.stage,
      EcrDeployConfig,
    );
    // Use the first task definition for context
    const taskDefinition = config.taskDefinition[0];
    const accountId = taskDefinition.accountId || config.accountId;
    const region = taskDefinition.region || config.region;
    const clusterName = taskDefinition.clusterName || config.clusterName;
    const serviceName = taskDefinition.serviceName || config.serviceName;
    if (!accountId) throw new Error("accountId not defined");
    if (!region) throw new Error("region not defined");
    if (!clusterName) throw new Error("clusterName not defined");
    if (!serviceName) throw new Error("serviceName not defined");
    await untagUnusedImages({
      region,
      accountId,
      clusterName,
      serviceName,
      config,
      release: argv.release,
      days: argv.days,
      untagPrefix: argv.untagPrefix,
    });
  },
};
