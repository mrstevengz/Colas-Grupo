let mediaRecorder;
let audioChunks = [];
let textoReconocido = "";
let cola = [];

const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const transcription = document.getElementById('transcription');
const colaLista = document.getElementById('colaLista');

async function actualizarColaHTML() {
    const response = await fetch('/cola');
    const data = await response.json();
    const cola = data.cola;
    colaLista.innerHTML = '';
    cola.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}: ${item}`;
        colaLista.appendChild(li);
    });
}


recordButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        transcription.value = result.text;

        if (result.text && result.text.trim() !== "") {
            await fetch('/cola', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item: result.text })
            });
            await actualizarColaHTML();
        }

        stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    recordButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;
});

let recognition;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert("Tu navegador no soporta reconocimiento de voz en tiempo real.");
}

if (recognition) {
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recordButton.onclick = () => {
        transcription.value = '';
        recognition.start();
        textoReconocido = '';
        recordButton.disabled = true;
        stopButton.disabled = false;
    };

    stopButton.onclick = () => {
        recognition.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
        if (textoReconocido.trim() !== '') {
            cola.push(textoReconocido);
            actualizarColaHTML();
        }
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            finalTranscript += event.results[i][0].transcript;
        }
        transcription.value = finalTranscript;
        textoReconocido = finalTranscript;
    };
}