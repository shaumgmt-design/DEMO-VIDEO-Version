// Load Interviewer Image From Local File
document.getElementById("interviewerImg").src =
    "AI Interviewer.jpg";

// UI Elements
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const landing = document.getElementById("landing");
const ui = document.getElementById("interviewUI");
const statusMsg = document.getElementById("statusMsg");

// ElevenLabs Agent ID (yours)
const agentId = "agent_1701k9hdnqk1f338decvmmbsxfsa";

// Start Interview
startBtn.onclick = () => {
    landing.classList.add("hidden");
    ui.classList.remove("hidden");

    statusMsg.innerText = "Connecting to interviewer...";

    // Start ElevenLabs Call
    window.ElevenLabs.convai.startSession({
        agentId: agentId,
        onConnect: () => {
            statusMsg.innerText = "Interview in progress. Speak when ready.";
        },
        onError: (e) => {
            statusMsg.innerText = "Microphone error. Please refresh and enable microphone.";
            console.error(e);
        }
    });
};

// End Interview
endBtn.onclick = () => {
    window.ElevenLabs.convai.endSession();
    statusMsg.innerText = "Interview ended.";
};
