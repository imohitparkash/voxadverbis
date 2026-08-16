const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const convertBtn = document.getElementById("convertBtn");
const stopBtn = document.getElementById("stopBtn");
const statusLight = document.getElementById("statusLight");
const statusLabel = document.getElementById("statusLabel");
const hintText = document.getElementById("hintText");
const playbackPanel = document.getElementById("playbackPanel");
const playToggle = document.getElementById("playToggle");
const downloadTab = document.getElementById("downloadTab");
const audioPlayer = document.getElementById("audioPlayer");
const gaugeNeedle = document.getElementById("gaugeNeedle");
const loopSwitch = document.getElementById("loopSwitch");
const filterSwitch = document.getElementById("filterSwitch");
const pitchKnob = document.getElementById("pitchKnob");
const toneKnob = document.getElementById("toneKnob");

let currentAudioUrl = null;
let needleInterval = null;

textInput.addEventListener("input", () => {
  const len = textInput.value.length;
  charCount.textContent = String(len).padStart(3, "0");
});

function setStatus(state, label) {
  statusLight.className = `light light--${state}`;
  statusLabel.textContent = label;
}

async function convert() {
  const text = textInput.value.trim();
  if (!text) {
    hintText.textContent = "Nothing to convert. Enter text first.";
    return;
  }

  convertBtn.classList.add("is-busy");
  convertBtn.disabled = true;
  setStatus("busy", "CONVERTING");
  hintText.textContent = "Synthesizing audio...";

  try {
    const res = await fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Conversion failed");
    }

    const blob = await res.blob();

    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = URL.createObjectURL(blob);

    audioPlayer.src = currentAudioUrl;
    downloadTab.href = currentAudioUrl;

    playbackPanel.hidden = false;
    setStatus("active", "READY");
    hintText.textContent = "Audio ready. Press play.";
    stopBtn.disabled = false;

    playToggle.classList.remove("is-on");
    playbackPanel.classList.remove("is-playing");
  } catch (e) {
    setStatus("standby", "ERROR");
    hintText.textContent = e.message || "Conversion failed. Try again.";
  } finally {
    convertBtn.classList.remove("is-busy");
    convertBtn.disabled = false;
  }
}

function togglePlayback() {
  if (!audioPlayer.src) return;
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

function animateNeedle() {
  const angle = -50 + Math.random() * 100; // sweep between -50deg and 50deg
  gaugeNeedle.setAttribute(
    "transform",
    `rotate(${angle} 50 50)`
  );
}

audioPlayer.addEventListener("play", () => {
  playToggle.classList.add("is-on");
  playbackPanel.classList.add("is-playing");
  setStatus("active", "PLAYING");
  needleInterval = setInterval(animateNeedle, 180);
});

audioPlayer.addEventListener("pause", () => {
  playToggle.classList.remove("is-on");
  playbackPanel.classList.remove("is-playing");
  setStatus("active", "READY");
  clearInterval(needleInterval);
  gaugeNeedle.setAttribute("transform", "rotate(0 50 50)");
});

audioPlayer.addEventListener("ended", () => {
  playToggle.classList.remove("is-on");
  playbackPanel.classList.remove("is-playing");
  setStatus("active", "READY");
  clearInterval(needleInterval);
  gaugeNeedle.setAttribute("transform", "rotate(0 50 50)");

  if (loopSwitch.getAttribute("aria-pressed") === "true") {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  }
});

function stopPlayback() {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
}

function toggleSwitch(el) {
  const pressed = el.getAttribute("aria-pressed") === "true";
  el.setAttribute("aria-pressed", String(!pressed));
}

// Decorative knobs - just a satisfying click, no functional effect yet
function nudgeKnob(el) {
  el.style.transform = "rotate(35deg)";
  setTimeout(() => { el.style.transform = ""; }, 150);
}

convertBtn.addEventListener("click", convert);
playToggle.addEventListener("click", togglePlayback);
stopBtn.addEventListener("click", stopPlayback);
loopSwitch.addEventListener("click", () => toggleSwitch(loopSwitch));
filterSwitch.addEventListener("click", () => toggleSwitch(filterSwitch));
pitchKnob.addEventListener("click", () => nudgeKnob(pitchKnob));
toneKnob.addEventListener("click", () => nudgeKnob(toneKnob));