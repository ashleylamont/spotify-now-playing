import "./style.css";
import { Episode, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import appConfig from "../app.config.ts";
import { createElementOrReplace, deleteElementWithId } from "./html-helpers.ts";
import playFill from "/play-fill.svg";
import pauseFill from "/pause-fill.svg";
import skipBackFill from "/skip-back-fill.svg";
import skipForwardFill from "/skip-forward-fill.svg";
import SwipeListener from "swipe-listener";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="centred-vertical-container">
    <h1 id="loading">Loading</h1>
  </div>
`;

const appContainer = document.querySelector<HTMLDivElement>(
  "#app > .centred-vertical-container",
)!;

const sdk = SpotifyApi.withUserAuthorization(
  appConfig.spotifyClientId,
  appConfig.appRoot,
  ["user-read-playback-state", "user-modify-playback-state"],
);

let deviceId: string;

SwipeListener(appContainer);
appContainer.addEventListener("swipe", (event) => {
  if (event.detail.direction === "left") {
    sdk.player
      .skipToNext(deviceId)
      .then(refreshPlayback)
      .catch((error) => {
        console.error(error);
      });
  } else if (event.detail.direction === "right") {
    sdk.player
      .skipToPrevious(deviceId)
      .then(refreshPlayback)
      .catch((error) => {
        console.error(error);
      });
  }
});

let progressBarTimeout: number | undefined;
let isPlaying = false;
function updateProgressBar(currentMs: number, totalMs: number) {
  let progressBar = document.getElementById("progress-bar");
  if (!progressBar) {
    progressBar = document.createElement("div");
    progressBar.id = "progress-bar";
    appContainer.appendChild(progressBar);
  }
  let progressBarFill = document.getElementById("progress-bar-fill");
  if (!progressBarFill) {
    progressBarFill = document.createElement("div");
    progressBarFill.id = "progress-bar-fill";
    progressBar.appendChild(progressBarFill);
  }
  progressBarFill.style.width = `${(currentMs / totalMs) * 100}%`;

  if (progressBarTimeout) {
    clearTimeout(progressBarTimeout);
  }
  if (isPlaying) {
    const currentTimestamp = Date.now();
    progressBarTimeout = setTimeout(() => {
      updateProgressBar(currentMs + (Date.now() - currentTimestamp), totalMs);
    }, 50);
  }
}

function refreshPlayback() {
  sdk.player
    .getPlaybackState()
    .then((playbackState) => {
      // Clear loading state
      deleteElementWithId("loading");

      // Update playing state
      isPlaying = playbackState.is_playing;
      deviceId = playbackState.device.id ?? "";
      const title = document.querySelector("title")!;
      const favicon =
        document.querySelector<HTMLLinkElement>("link[rel='icon']")!;
      if (isPlaying) {
        title.innerText = "Playing " + playbackState.item.name;
        favicon.href = "./play-fill.svg";
      } else {
        title.innerText = "Paused";
        favicon.href = "./pause-fill.svg";
      }

      // Update title
      createElementOrReplace(
        "h1",
        "item-name",
        appContainer,
        playbackState.item.name,
      );

      // Update subtitle
      if (playbackState.currently_playing_type === "track") {
        const track = playbackState.item as Track;

        createElementOrReplace(
          "h2",
          "item-subtitle",
          appContainer,
          track.artists.map((artist) => artist.name).join(", "),
        );
      } else if (playbackState.currently_playing_type === "episode") {
        const episode = playbackState.item as Episode;

        createElementOrReplace(
          "h2",
          "item-subtitle",
          appContainer,
          episode.show.name,
        );
      }

      // Update album and album art
      if (playbackState.currently_playing_type === "track") {
        const track = playbackState.item as Track;
        createElementOrReplace(
          "h3",
          "item-album",
          appContainer,
          track.album.name,
        );

        let albumArt =
          document.querySelector<HTMLImageElement>("#item-album-art");
        if (!albumArt) {
          albumArt = document.createElement("img");
          albumArt.id = "item-album-art";
          document.body.appendChild(albumArt);
        }
        albumArt.src = track.album.images[0].url;
      } else {
        deleteElementWithId("item-album");
        deleteElementWithId("item-album-art");
      }

      // Update progress bar
      updateProgressBar(
        playbackState.progress_ms,
        playbackState.item.duration_ms,
      );
      if (playbackState.is_playing) {
        document
          .getElementById("progress-bar-fill")!
          .classList.remove("paused");
      } else {
        document.getElementById("progress-bar-fill")!.classList.add("paused");
      }

      // Update controls bar
      const controlsBar = createElementOrReplace(
        "div",
        "controls-bar",
        appContainer,
      );
      const previousButton = createElementOrReplace(
        "button",
        "previous-button",
        controlsBar,
        undefined,
        ["button"],
      );
      previousButton.innerHTML = `<img src="${skipBackFill}"  alt="Back button" width="24"/>`;
      const playPauseButton = createElementOrReplace(
        "button",
        "play-pause-button",
        controlsBar,
        undefined,
        ["button"],
      );
      playPauseButton.innerHTML = playbackState.is_playing
        ? `<img src="${pauseFill}" alt="Pause button"  width="24"/>`
        : `<img src="${playFill}" alt="Play button" width="24"/>`;
      const nextButton = createElementOrReplace(
        "button",
        "next-button",
        controlsBar,
        undefined,
        ["button"],
      );
      nextButton.innerHTML = `<img src="${skipForwardFill}" alt="Forward button" width="24"/>`;

      // Update controls bar event listeners
      previousButton.onclick = () => {
        sdk.player.skipToPrevious(deviceId).then(refreshPlayback);
      };
      playPauseButton.onclick = () => {
        if (playbackState.is_playing) {
          sdk.player.pausePlayback(deviceId).then(refreshPlayback);
        } else {
          sdk.player.startResumePlayback(deviceId).then(refreshPlayback);
        }
      };
      nextButton.onclick = () => {
        sdk.player.skipToNext(deviceId).then(refreshPlayback);
      };
    })
    .catch((error) => {
      console.error(error);
    });
}

window.setInterval(refreshPlayback, 3000);
refreshPlayback();
