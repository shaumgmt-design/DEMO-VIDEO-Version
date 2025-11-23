// ---------------------------
// IMPORTANT: add your ElevenLabs API key here on your local copy ONLY
// ---------------------------
const ELEVEN_API_KEY = "198db46669f877302e471689ba61ca0e77c1b4f9d153dd8574d53c5fbdcc81e6"; // <-- replace locally, do NOT paste publicly
const AGENT_ID = "agent_1701k9hdnqk1f338decvmmbsxfsa"; // your agent id (safe to keep in repo)

// basic DOM
const startBtn = document.getElementById("startInterviewBtn");
const endBtn = document.getElementById("endInterviewBtn");
const stage = document.getElementById("interviewStage");
const providerEmbed = document.getElementById("providerEmbed");
const transcriptBox = document.getElementById("transcriptBox");
const avatarMouth = document.getElementById("mouth"); // ellipse used for mouth animation
let audioAnalyser = null;
let visualLipInterval = null;

function showStage() {
  stage.classList.remove("hidden");
  stage.setAttribute("aria-hidden","false");
  startProvider(); // launch agent embed and audio handling
}

function hideStage() {
  stage.classList.add("hidden");
  stage.setAttribute("aria-hidden","true");
  stopProvider();
}

/* ---------- provider embed logic (hidden) ----------
   We inject the ElevenLabs convai widget into providerEmbed but visually hide it.
   We then attempt to find the audio element the widget creates and analyze it with WebAudio for real-time
   amplitude to animate the avatar mouth. If not possible, fallback to a procedural animation while "speech" occurs.
-----------------------------------------------------*/
function startProvider(){
  // clear transcript area
  transcriptBox.innerHTML = `<div class="hint">Connecting to interviewer… Please allow microphone access if prompted.</div>`;

  // Inject the convai custom element — we keep it hidden in CSS & DOM but it runs audio.
  providerEmbed.innerHTML = `
    <elevenlabs-convai
      agent-id="${AGENT_ID}"
      api-key="${ELEVEN_API_KEY}"
      style="display:block; width:320px; height:240px; visibility:hidden; position:absolute; right:-9999px;"
    ></elevenlabs-convai>
  `;

  // Wait for audio elements to appear and try to attach analyzer
  attemptAttachAudioAnalyser();

  // As a UX touch, start a subtle "listening" mouth animation while connecting
  startFallbackLipAnimation();
}

function stopProvider(){
  // remove embed and stop any visual animations
  providerEmbed.innerHTML = "";
  stopAudioAnalyser();
  stopFallbackLipAnimation();
  transcriptBox.innerHTML = `<div class="hint">Session ended. You can start another mock interview.</div>`;
}

/* Repeatedly look for an audio element the widget might create.
   If found, hook it into WebAudio API to read amplitude and animate mouth.
*/
function attemptAttachAudioAnalyser(retries = 0){
  // limit retries to avoid infinite loops
  if(retries > 20) return;
  // find any audio elements on the page (the widget often creates them)
  const aud = document.querySelector("audio");
  if(aud){
    try{
      setupAudioAnalyser(aud);
      console.log("Attached to audio element for lip-sync.");
      // stop fallback once connected
      stopFallbackLipAnimation();
    }catch(e){
      console.warn("Audio analyser attach error:", e);
      setTimeout(()=>attemptAttachAudioAnalyser(retries+1), 600);
    }
  } else {
    setTimeout(()=>attemptAttachAudioAnalyser(retries+1), 600);
  }
}

function setupAudioAnalyser(audioElement){
  // Create AudioContext and analyser node
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioElement);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  audioAnalyser = analyser;

  // start reading amplitude
  readAudioLoop();
}

function readAudioLoop(){
  if(!audioAnalyser) return;
  const data = new Uint8Array(audioAnalyser.frequencyBinCount);
  audioAnalyser.getByteFrequencyData(data);

  // compute a rough amplitude (average of lower bins)
  let sum = 0;
  for(let i=0;i<20;i++){ sum += data[i]; }
  const avg = sum / 20;
  // map avg (0-255) to mouth scale (0.6 - 1.6)
  const scale = Math.min(1.6, Math.max(0.6, 0.6 + avg / 140));
  animateMouth(scale);

  // loop
  requestAnimationFrame(readAudioLoop);
}

function stopAudioAnalyser(){
  audioAnalyser = null;
}

/* ---------- mouth animation ----------
   We animate the SVG mouth ellipse's ry (vertical radius) by scaling
   the group containing it. This creates the lip-sync effect.
-----------------------------------------------------*/
function animateMouth(scaleY){
  // mouthGroup is translated at (150,170); we scale on Y
  const mouthGroup = document.getElementById("mouthGroup");
  if(!mouthGroup) return;
  mouthGroup.setAttribute("transform", `translate(150,170) scale(1, ${scaleY})`);
}

/* ---------- fallback procedural animation while connecting ----------
   Produces natural mouth movement even if we can't attach to audio immediately.
-----------------------------------------------------*/
function startFallbackLipAnimation(){
  if(visualLipInterval) return;
  let t = 0;
  visualLipInterval = setInterval(()=>{
    t += 0.18;
    // Perlin-like gentle pseudo-random wave to look natural
    const s = 0.95 + (Math.abs(Math.sin(t)) * 0.6);
    animateMouth(s);
  }, 80);
}

function stopFallbackLipAnimation(){
  if(visualLipInterval){
    clearInterval(visualLipInterval);
    visualLipInterval = null;
    // reset mouth
    animateMouth(1);
  }
}

/* Buttons */
startBtn.addEventListener("click", () => {
  // Ask for microphone permission early so the embedded agent can use it
  navigator.mediaDevices.getUserMedia({ audio:true }).then(stream=>{
    // good to go — show stage and init provider
    showStage();
    // stop the dummy local stream immediately (we just required permission prompt)
    stream.getTracks().forEach(t=>t.stop());
  }).catch(err=>{
    alert("Microphone access is required for voice interviews. Please allow microphone access and try again.");
  });
});

endBtn.addEventListener("click", () => {
  hideStage();
});
