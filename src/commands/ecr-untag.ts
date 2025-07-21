import { ecrListImages, ecrUntagImages, ecsListRunningTaskArns, ecsDescribeTasks } from "../helpers/aws-ecs.helper";
import { logBanner, logInfo, logNotice, logSuccess, logVariable } from "../helpers/cli.helper";

export type UntagArgs = {
  region: string;
  accountId: string;
  clusterName: string;
  serviceName: string;
  config: any;
  release: string;
  days?: number;
  untagPrefix?: string;
};

export async function untagUnusedImages(args: UntagArgs) {
  logBanner("Untagging unused images");
  logVariable("days", args.days);

  // Get all running task ARNs for the service
  const runningTaskArns = await ecsListRunningTaskArns({
    region: args.region,
    cluster: args.clusterName,
    service: args.serviceName,
  });

  // Describe running tasks to get their images
  const runningTasks = await ecsDescribeTasks({
    region: args.region,
    cluster: args.clusterName,
    taskArns: runningTaskArns,
  });

  // Extract image tags from running tasks
  const runningImageTags = new Set<string>();
  for (const task of runningTasks) {
    if (task.containers) {
      for (const container of task.containers) {
        if (container.image) {
          const imageTag = container.image.split(":").pop();
          if (imageTag) {
            runningImageTags.add(imageTag);
          }
        }
      }
    }
  }

  // Add the new release tag(s) to the protected tags
  for (const buildContainer of args.config.build) {
    const tag = buildContainer.prefix ? `${buildContainer.prefix}${args.release}` : args.release;
    runningImageTags.add(tag);
  }

  logInfo(`Protected tags (from running tasks): ${Array.from(runningImageTags).join(", ")}`);

  // Process each build container
  for (const buildContainer of args.config.build) {
    logBanner(`Processing repository: ${buildContainer.repoName}`);

    // Get all images in the repository
    const images = await ecrListImages({
      region: args.region,
      repositoryName: buildContainer.repoName,
    });

    if (images.length === 0) {
      logInfo(`No images found in repository ${buildContainer.repoName}`);
      continue;
    }

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (args.days || 30));

    // Filter images that are older than the cutoff date, not protected, and (if untagPrefix is set) match the prefix
    const imagesToUntag = images.filter((image) => {
      // Skip if no image tags
      if (!image.imageTags || image.imageTags.length === 0) {
        return false;
      }

      // Skip if image is newer than cutoff date
      if (image.imagePushedAt && image.imagePushedAt > cutoffDate) {
        return false;
      }

      // Skip if any tag is protected
      const hasProtectedTag = image.imageTags.some((tag) =>
        runningImageTags.has(tag),
      );
      if (hasProtectedTag) {
        return false;
      }

      // If untagPrefix is set, only untag images whose tags start with the prefix
      if (args.untagPrefix) {
        const hasMatchingPrefix = image.imageTags.some((tag) => tag.startsWith(args.untagPrefix!));
        if (!hasMatchingPrefix) {
          return false;
        }
      }

      return true;
    });

    if (imagesToUntag.length === 0) {
      logInfo(`No images to untag in repository ${buildContainer.repoName}`);
      continue;
    }

    logInfo(
      `Found ${imagesToUntag.length} images to untag in repository ${buildContainer.repoName}`,
    );

    // Prepare image IDs for untagging
    const imageIds = imagesToUntag.flatMap((image) =>
      (image.imageTags || []).map((tag) => ({ imageTag: tag })),
    );

    if (imageIds.length === 0) {
      logInfo(`No image tags to untag in repository ${buildContainer.repoName}`);
      continue;
    }

    logInfo(
      `Untagging ${imageIds.length} tags from repository ${buildContainer.repoName}`,
    );

    // Untag the images
    try {
      await ecrUntagImages({
        region: args.region,
        repositoryName: buildContainer.repoName,
        imageIds,
      });
      logSuccess(
        `Successfully untagged ${imageIds.length} tags from repository ${buildContainer.repoName}`,
      );
    } catch (error) {
      logNotice(
        `Failed to untag some images in repository ${buildContainer.repoName}: ${error}`,
      );
    }
  }
}
