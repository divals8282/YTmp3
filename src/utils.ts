import { spawn } from "node:child_process";
import { v7 } from "uuid";

export const checkIfYoutubeLinkIsValid = (link: string) => {
  const youtubeLinkPattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

  return youtubeLinkPattern.test(link);
};

export const getVideoTitle = (url: string) => {
  return new Promise((resolve, reject) => {
    const yt = spawn("yt-dlp", ["--get-title", "--no-playlist", url]);

    let title = "";

    yt.stdout.on("data", (data) => {
      title += data.toString();
    });

    yt.on("close", (code) => {
      if (code === 0) resolve(title.trim());
      else reject(new Error("Failed to get title"));
    });

    yt.on("error", reject);
  });
};

export const downloadYoutubeVideo = (url: string): Promise<string> => {
  const filePath = `./file-temp/${v7()}.mp4`;
  return new Promise((resolve, reject) => {
    const yt = spawn(
      "yt-dlp",
      [
        "--no-warnings",
        "--js-runtimes",
        "node",
        "-f",
        "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
        "--no-playlist",
        "-o",
        filePath,
        url,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    yt.stderr.on("data", (data) => {
      const text = data.toString();
      if (
        text.toLowerCase().includes("press") ||
        text.toLowerCase().includes("enter")
      ) {
        yt.stdin.write("\n");
      }
    });

    yt.on("error", (err) => {
      reject(new Error("Failed: " + err.message));
    });

    yt.on("close", (code) => {
      yt.stdin.end(); // important

      if (code === 0) resolve(filePath);
      else reject(new Error("yt-dlp exited with code " + code));
    });
  });
};

export const convertMp4ToMp3 = (mp4FilePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const mp3FilePath = mp4FilePath.replace(".mp4", ".mp3");
    const ffmpeg = spawn(
      "ffmpeg",
      ["-i", mp4FilePath, "-q:a", "0", "-map", "a", mp3FilePath],
      {
        stdio: "pipe",
      },
    );

    ffmpeg.on("error", (err) => {
      reject(new Error("Failed to convert video to audio: " + err.message));
    });
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(mp3FilePath);
      else reject(new Error("Failed to convert video to audio: " + code));
    });
  });
};
