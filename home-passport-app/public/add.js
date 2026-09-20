(function () {
  const form = document.getElementById('add-form');
  const categoryInput = document.getElementById('category-input');
  const chips = document.querySelectorAll('#category-chips .chip');
  const photoInput = document.getElementById('photo-input');
  const photoLabel = document.getElementById('photo-label');
  const voiceBtn = document.getElementById('voice-btn');
  const voiceTitle = document.getElementById('voice-title');
  const voiceSubtitle = document.getElementById('voice-subtitle');
  const voicePreview = document.getElementById('voice-preview');
  const errorMsg = document.getElementById('error-msg');
  const saveBtn = document.getElementById('save-btn');

  let voiceBlob = null;
  let mediaRecorder = null;
  let chunks = [];
  let recording = false;
  let recordStart = 0;
  let timerHandle = null;

  // --- Category chips ---
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      categoryInput.value = chip.dataset.slug;
    });
  });

  // --- Photo/document picker ---
  photoInput.addEventListener('change', () => {
    if (photoInput.files[0]) {
      photoLabel.textContent = photoInput.files[0].name;
    }
  });

  // --- Voice note recording ---
  function formatSeconds(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      showError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        voiceBlob = new Blob(chunks, { type: 'audio/webm' });
        voicePreview.src = URL.createObjectURL(voiceBlob);
        voicePreview.style.display = 'block';
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      recording = true;
      recordStart = Date.now();
      voiceTitle.textContent = 'Recording... tap to stop';
      voiceBtn.style.background = '#FFE7D6';
      timerHandle = setInterval(() => {
        voiceSubtitle.textContent = formatSeconds((Date.now() - recordStart) / 1000);
      }, 250);
    } catch (err) {
      showError('Microphone access was denied or unavailable.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      recording = false;
      clearInterval(timerHandle);
      voiceTitle.textContent = 'Voice note recorded';
      voiceSubtitle.textContent = 'Tap to re-record';
      voiceBtn.style.background = '#ffffff';
    }
  }

  voiceBtn.addEventListener('click', () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // --- Errors ---
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }
  function clearError() {
    errorMsg.style.display = 'none';
  }

  // --- Submit ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const title = document.getElementById('title-input').value.trim();
    if (!title) {
      showError('Give the record a title first.');
      return;
    }

    const fd = new FormData();
    fd.append('category', categoryInput.value);
    fd.append('title', title);
    fd.append('notes', document.getElementById('notes-field').value.trim());
    if (photoInput.files[0]) fd.append('photo', photoInput.files[0]);
    if (voiceBlob) fd.append('voiceNote', voiceBlob, 'voice-note.webm');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const res = await fetch('/records', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Save failed');
      window.location.href = res.url;
    } catch (err) {
      showError('Could not save that record — check your connection and try again.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save record';
    }
  });
})();
