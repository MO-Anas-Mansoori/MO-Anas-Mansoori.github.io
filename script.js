let currentSong = new Audio();
let songs;
let currFolder;
function formatMMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];

  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      // Decode URL (%20, %5C, etc.)
      let decoded = decodeURIComponent(element.href);

      // Replace backslashes with forward slashes (Windows-style paths → normal URLs)
      decoded = decoded.replace(/\\/g, "/");

      // Extract only the file name
      let fileName = decoded.substring(decoded.lastIndexOf("/") + 1);

      songs.push(fileName);
    }
  }

  // show all the song in the playlist
  let songUL = document
    .querySelector(".songlist")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML =
      songUL.innerHTML +
      `<li>
    <img class="invert" src="music.svg" alt="" />
                <div class="info">
                  <div>${song.replaceAll("%20", " ")}</div>
                  <div>harry</div>
                </div>
                <div class="playnow">
                  <span>Play Now</span>
                  <img class="invert" src="play.svg" alt="" />
                </div>
                </li>`;
  }

  // attach an event listener to each song
  Array.from(
    document.querySelector(".songlist").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      playmusic(e.querySelector(".info").firstElementChild.innerHTML);
    });
  });
}

const playmusic = (track, pause = false) => {
  // Build correct URL
  currentSong.src = `http://127.0.0.1:3000/${currFolder}/${track}`;

  if (!pause) currentSong.play();

  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function DisplayAlbums() {
  let a = await fetch("http://127.0.0.1:3000/songs/");
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = Array.from(div.getElementsByTagName("a"));
  let cardContainer = document.querySelector(".cardContainer");

  cardContainer.innerHTML = ""; // clear old cards

  for (let e of anchors) {
    let rawPath = e.getAttribute("href");

    if (!rawPath || rawPath === "../" || !rawPath.endsWith("/")) continue;

    let normalized = decodeURIComponent(rawPath).replace(/\\/g, "/");
    let parts = normalized.split("/").filter(Boolean);
    let folder = parts[parts.length - 1];

    try {
      let res = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
      let info = await res.json();

      let card = document.createElement("div");
      card.classList.add("card");
      card.dataset.folder = folder;

      card.innerHTML = `
        <div class="play">
          <img src="play1.svg" alt="play" />
        </div>
        <img src="/songs/${folder}/cover.jpg" />
        <h2>${info.title}</h2>
        <p>${info.description}</p>
      `;

      card.addEventListener("click", async () => {
        await getSongs(`songs/${folder}`);
        // playmusic(songs[0]);
      });

      cardContainer.appendChild(card);
    } catch (err) {
      console.error("Album load error:", folder, err);
    }
  }
}

async function main() {
  // get the list of all the songs
  await getSongs("songs/cs");
  playmusic(songs[0], true);

  //Display all the album on the page
  DisplayAlbums();

  //Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "pause.svg";
    } else {
      currentSong.pause();
      play.src = "play.svg";
    }
  });

  //listen for time update event
  currentSong.addEventListener("timeupdate", () => {
    let current = formatMMSS(currentSong.currentTime);
    let total = formatMMSS(currentSong.duration || 0);
    document.querySelector(".songtime").innerHTML = `${current} / ${total}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  //Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  //add an event listerner for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  //add an event listerner for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-110%";
  });

  //add an eveny listener to previous and next
  previous.addEventListener("click", () => {
    currentSong.pause();
    let file = decodeURIComponent(currentSong.src).split("/").pop();
    let index = songs.findIndex((s) => s.endsWith(file));
    if (index > 0) {
      playmusic(songs[index - 1]);
    }
  });

  next.addEventListener("click", () => {
    currentSong.pause();
    let file = decodeURIComponent(currentSong.src).split("/").pop();
    let index = songs.findIndex((s) => s.endsWith(file));
    if (index + 1 < songs.length) {
      playmusic(songs[index + 1]);
    }
  });

  //add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
    });

  // load the playlist  whenever  card is clicked

  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      // console.log(item.target, item.currentTarget.dataset);
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
    });
  });

  //add  event listener to mute the track
  document.querySelector(".volume>img ").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;

      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 30;
    }
  });
}

main();
