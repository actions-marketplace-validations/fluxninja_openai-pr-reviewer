import * as core from "@actions/core";
import { Bot } from "./bot.js";
import { Options, Prompts } from "./options.js";
import { codeReview } from "./review.js";

async function run(): Promise<void> {
  const options: Options = new Options(
    core.getBooleanInput("debug"),
    core.getBooleanInput("review_comment_lgtm"),
    core.getMultilineInput("path_filters"),
    core.getInput("system_message"),
    core.getInput("temperature"),
  );
  const prompts: Prompts = new Prompts(
    core.getInput("review_beginning"),
    core.getInput("review_file"),
    core.getInput("review_file_diff"),
    core.getInput("review_patch_begin"),
    core.getInput("review_patch"),
    core.getInput("summarize_beginning"),
    core.getInput("summarize_file_diff"),
    core.getInput("summarize"),
    core.getInput("summarize_release_notes"),
  );

  // initialize openai bot
  let bot: Bot | null = null;
  try {
    bot = new Bot(options);
  } catch (e: any) {
    core.warning(
      `Skipped: failed to create bot, please check your openai_api_key: ${e}, backtrace: ${e.stack}`,
    );
    return;
  }

  try {
    await codeReview(bot, options, prompts);
  } catch (e: any) {
    if (e instanceof Error) {
      core.setFailed(`Failed to run: ${e.message}, backtrace: ${e.stack}`);
    } else {
      core.setFailed(`Failed to run: ${e}, backtrace: ${e.stack}`);
    }
  }
}

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
    core.warning(`Unhandled Rejection at Promise: ${reason}, promise is ${p}`);
  })
  .on("uncaughtException", (e: any) => {
    console.error(e, "Uncaught Exception thrown");
    core.warning(`Uncaught Exception thrown: ${e}, backtrace: ${e.stack}`);
  });

await run();
