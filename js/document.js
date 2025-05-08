document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('text-to-speech');
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    const downloadBtn = document.getElementById('download-btn');
    const voiceSelect = document.getElementById('voice-select');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    const statusDiv = document.getElementById('status');
    
    let speechSynthesis = window.speechSynthesis;
    let voices = [];
    let mediaRecorder;
    let audioChunks = [];
    let audioContext;
    let isRecording = false;
    
    // Update rate and pitch display values
    rateInput.addEventListener('input', () => {
        rateValue.textContent = rateInput.value;
    });
    
    pitchInput.addEventListener('input', () => {
        pitchValue.textContent = pitchInput.value;
    });
    
    // Load available voices
    function loadVoices() {
        voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '<option value="">Select a voice</option>';
        
        // Filter for female voices (where available)
        const femaleVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('female') ||
            voice.lang.includes('en')
        );
        
        const voicesToShow = femaleVoices.length > 0 ? femaleVoices : voices;
        
        voicesToShow.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        const defaultFemaleVoice = voicesToShow.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman')
        );
        
        if (defaultFemaleVoice) {
            voiceSelect.value = defaultFemaleVoice.name;
        }
    }
    
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Setup audio recording
    async function setupAudioRecording() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioContext.createMediaStreamDestination();
            mediaRecorder = new MediaRecorder(dest.stream);
            
            mediaRecorder.ondataavailable = (evt) => {
                audioChunks.push(evt.data);
            };
            
            mediaRecorder.onstop = async () => {
                isRecording = false;
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                
                // Convert to MP3 (simplified - in a real app you'd use a proper encoder)
                const audioUrl = URL.createObjectURL(audioBlob);
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = 'speech.mp3';
                a.click();
                
                showStatus('Audio file downloaded successfully!', 'info');
            };
            
            return dest;
        } catch (error) {
            console.error('Error setting up audio recording:', error);
            showStatus('Error setting up audio recording. Please try again.', 'error');
            return null;
        }
    }
    
    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
    
    // Speak the text
    speakBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        const text = textarea.value.trim();
        if (text === '') {
            showStatus('Please enter some text to speak.', 'error');
            return;
        }
        
        const selectedVoiceName = voiceSelect.value;
        const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = parseFloat(rateInput.value);
        utterance.pitch = parseFloat(pitchInput.value);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onend = () => {
            speakBtn.disabled = false;
            if (isRecording) {
                mediaRecorder.stop();
            }
        };
        
        speakBtn.disabled = true;
        speechSynthesis.speak(utterance);
    });
    
    // Stop speaking
    stopBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            speakBtn.disabled = false;
            if (isRecording) {
                mediaRecorder.stop();
                isRecording = false;
            }
        }
    });
    
    // Download as MP3
    downloadBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (text === '') {
            showStatus('Please enter some text to convert to speech.', 'error');
            return;
        }
        
        showStatus('Preparing audio recording...', 'info');
        
        const dest = await setupAudioRecording();
        if (!dest) return;
        
        const selectedVoiceName = voiceSelect.value;
        const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = parseFloat(rateInput.value);
        utterance.pitch = parseFloat(pitchInput.value);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Create a media stream source from the speech synthesis
        const source = audioContext.createMediaStreamSource(dest.stream);
        
        showStatus('Recording audio... Speak now.', 'info');
        
        mediaRecorder.start();
        isRecording = true;
        speechSynthesis.speak(utterance);
    });
});