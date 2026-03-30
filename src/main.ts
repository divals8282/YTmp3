import "dotenv/config";

import fs from "fs";
import { ExecException } from "child_process";

import { bot } from "./telegram_bot";
import {
  checkIfYoutubeLinkIsValid,
  downloadYoutubeVideo,
  convertMp4ToMp3,
  getVideoTitle,
} from "./utils";

bot.start((ctx) => {
  ctx.reply("👽Welcome to TYMP3 Bot! Convert any youtube video to MP3!👽");
  ctx.reply(
    `
💀Author: https://www.amirjanyanit.info\n
🤖GitHub: https://github.com/divals8282
    `,
  );
  ctx.reply("👺Please send a YouTube link to convert it to MP3.👺");

  fs.writeFile(
    `./users/${ctx.from.id}.txt`,
    JSON.stringify(ctx.from),
    { flag: "a" },
    () => {},
  );
});

bot.on("message", async (ctx) => {
  if ("text" in ctx.message && typeof ctx.message.text === "string") {
    const messageDate = ctx.message.date;
    const now = Math.floor(Date.now() / 1000);

    if (now - messageDate > 5) return;

    const youtubeLink = ctx.message.text.trim();
    if (checkIfYoutubeLinkIsValid(youtubeLink)) {
      try {
        ctx.sendMessage("<<<...Downloading....>>> Please wait.👽");
        const title = await getVideoTitle(youtubeLink);
        const mp4FilePath = await downloadYoutubeVideo(youtubeLink);
        const mp3FilePath = await convertMp4ToMp3(mp4FilePath);

        console.log({ title });

        await ctx.sendAudio({ source: mp3FilePath, filename: `${title}.mp3` });
        ctx.sendMessage("👽Enjoy!!!, TUC! TUC! TUC!👽");
        fs.unlink(mp4FilePath, () => {});
        fs.unlink(mp3FilePath, () => {});
      } catch (error) {
        fs.writeFile(
          `./logs/error-${Date.now()}.log`,
          (error as ExecException).toString(),
          () => {},
        );
        ctx.reply("🤖An error occurred while processing your request🤖");
      }
    } else {
      ctx.reply("👺Please send a valid YouTube link.👺");
    }
  }
});

bot.launch();
