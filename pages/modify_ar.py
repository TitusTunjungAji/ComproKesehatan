import re

with open('c:/Users/ilham/Documents/web/ComproKesehatan/pages/interactive-practice.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add MediaPipe scripts
content = content.replace(
    '<script src="../js/pwa.js"></script>',
    '''<script src="../js/pwa.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>'''
)

# 2. Replace Interactive Area
interactive_area_old = '''      <!-- Interactive Area -->
      <div class="interactive-area">
        <div id="viewer" class="viewer-wrapper" role="region" aria-label="Area simulasi menyikat">
          <img id="viewer-img" class="viewer-image" src="../assets/images/sikat_gigi_dan_odol.png" alt="Objek simulasi" draggable="false">
          <div id="tooth-paste-blob" class="toothpaste-blob"></div>
          <div id="success-badge" class="success-badge" aria-hidden="true">Bersih! ✨</div>
        </div>
      </div>'''

interactive_area_new = '''      <!-- Interactive Area -->
      <div class="interactive-area">
        <div id="viewer" class="viewer-wrapper" role="region" aria-label="Area simulasi menyikat">
          <video id="webcam" style="display: none;" playsinline></video>
          <canvas id="ar-canvas" class="viewer-image" width="480" height="480" style="object-fit: cover; transform: scaleX(-1);"></canvas>
          <div id="ar-instructions" class="ar-instructions">Memuat Kamera AR...</div>
          <div id="success-badge" class="success-badge" aria-hidden="true">Bersih! ✨</div>
        </div>
      </div>'''

content = content.replace(interactive_area_old, interactive_area_new)

# 3. Replace JS Scenarios and Logic
js_old = content[content.find('// ── SCENARIOS ──'):content.find('// ── Navigation ──')]

js_new = '''// ── SCENARIOS ──
      const scenarios = [
        {
          id: 'persiapan',
          title: 'Persiapan AR',
          text: 'Posisikan wajahmu di depan kamera. Kita akan menggunakan filter AR untuk praktik menyikat gigi. Buka mulutmu untuk uji coba!',
          action: 'wait',
          requiredPose: { yaw: 'straight', mouth: 'open' }
        },
        {
          id: 'regio1',
          title: 'Regio 1 — Depan Atas & Bawah',
          text: 'Hadap lurus ke depan dan buka mulutmu. Setelah posisi tepat (hijau), gosok layar untuk menyikat!',
          action: 'brush',
          requiredPose: { yaw: 'straight', mouth: 'open' }
        },
        {
          id: 'regio2',
          title: 'Regio 2 — Samping Kanan Luar',
          text: 'Palingkan wajahmu sedikit ke KIRI agar gigi kananmu terlihat. Buka mulut dan gosok layar!',
          action: 'brush',
          requiredPose: { yaw: 'left', mouth: 'open' }
        },
        {
          id: 'regio3',
          title: 'Regio 3 — Samping Kiri Luar',
          text: 'Palingkan wajahmu sedikit ke KANAN agar gigi kirimu terlihat. Buka mulut dan gosok layar!',
          action: 'brush',
          requiredPose: { yaw: 'right', mouth: 'open' }
        },
        {
          id: 'regio4',
          title: 'Regio 4 — Permukaan Kunyah',
          text: 'Tengadah (angkat dagumu sedikit ke atas) dan buka mulut lebar-lebar. Gosok layar!',
          action: 'brush',
          requiredPose: { pitch: 'up', mouth: 'open' }
        },
        {
          id: 'regio5',
          title: 'Regio 5 — Bagian Dalam',
          text: 'Tundukkan kepalamu sedikit (dagu ke bawah) dan buka mulut. Gosok layar!',
          action: 'brush',
          requiredPose: { pitch: 'down', mouth: 'open' }
        }
      ];

      let currentStep = 0;
      let isInteracting = false;
      let interactionCount = 0;
      let isPoseReady = false;
      let currentProgress = 0;
      let faceMesh;
      let camera;

      // ── DOM refs ──
      const titleEl = document.getElementById('scene-title');
      const textEl = document.getElementById('scene-text');
      const viewerEl = document.getElementById('viewer');
      const videoElement = document.getElementById('webcam');
      const canvasElement = document.getElementById('ar-canvas');
      const canvasCtx = canvasElement.getContext('2d');
      const arInstructions = document.getElementById('ar-instructions');
      const btnNext = document.getElementById('btn-next');
      const btnBack = document.getElementById('btn-back');
      const progressFill = document.getElementById('scene-progress');
      const progressText = document.getElementById('progress-text');
      const progressPct = document.getElementById('progress-pct');
      const successBadge = document.getElementById('success-badge');
      const stepIndicator = document.getElementById('step-indicator');
      const brushCursor = document.getElementById('brush-cursor');

      // ── Build step indicator dots ──
      function buildStepDots() {
        stepIndicator.innerHTML = '';
        scenarios.forEach((_, i) => {
          const dot = document.createElement('div');
          dot.className = 'step-dot';
          if (i < currentStep) dot.classList.add('step-dot--done');
          if (i === currentStep) dot.classList.add('step-dot--active');
          stepIndicator.appendChild(dot);
        });
      }

      // ── Custom Brush Cursor ──
      function showBrushCursor(x, y) {
        brushCursor.style.display = 'block';
        brushCursor.style.left = x + 'px';
        brushCursor.style.top = y + 'px';
        brushCursor.style.opacity = '1';
      }

      function hideBrushCursor() {
        brushCursor.style.opacity = '0';
        setTimeout(() => { brushCursor.style.display = 'none'; }, 150);
      }

      // ── AR & MediaPipe Init ──
      function initAR() {
        faceMesh = new FaceMesh({locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }});
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        faceMesh.onResults(onFaceMeshResults);

        camera = new Camera(videoElement, {
          onFrame: async () => {
            await faceMesh.send({image: videoElement});
          },
          width: 480,
          height: 480
        });
        camera.start().catch(err => {
          arInstructions.textContent = "Gagal mengakses kamera. Periksa izin browser.";
        });
      }

      function detectPose(landmarks) {
        const nose = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const top = landmarks[10];
        const bottom = landmarks[152];
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        
        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
        
        const faceHeight = dist(top, bottom);
        const mouthOpenness = dist(upperLip, lowerLip) / faceHeight;
        const mouthState = mouthOpenness > 0.05 ? 'open' : 'closed';
        
        const leftDistX = Math.abs(nose.x - leftCheek.x);
        const rightDistX = Math.abs(nose.x - rightCheek.x);
        let yaw = 'straight';
        if (rightDistX > leftDistX * 1.5) yaw = 'left';
        else if (leftDistX > rightDistX * 1.5) yaw = 'right';
        
        const topDistY = Math.abs(nose.y - top.y);
        const bottomDistY = Math.abs(nose.y - bottom.y);
        let pitch = 'straight';
        if (bottomDistY > topDistY * 1.5) pitch = 'down';
        else if (topDistY > bottomDistY * 1.5) pitch = 'up';
        
        return { yaw, pitch, mouth: mouthState };
      }

      function checkPoseRequirement(pose) {
        if (currentStep >= scenarios.length) return;
        const req = scenarios[currentStep].requiredPose;
        if (!req) {
          isPoseReady = true;
          return;
        }
        
        let msgs = [];
        if (req.yaw && req.yaw !== pose.yaw) {
          if (req.yaw === 'left') msgs.push('Palingkan wajah ke Kiri');
          else if (req.yaw === 'right') msgs.push('Palingkan wajah ke Kanan');
          else if (req.yaw === 'straight') msgs.push('Hadap lurus ke depan');
        }
        if (req.pitch && req.pitch !== pose.pitch) {
          if (req.pitch === 'up') msgs.push('Tengadahkan kepala ke atas');
          else if (req.pitch === 'down') msgs.push('Tundukkan kepala');
          else if (req.pitch === 'straight') msgs.push('Hadap lurus ke depan');
        }
        if (req.mouth && req.mouth !== pose.mouth) {
          if (req.mouth === 'open') msgs.push('Buka mulutmu');
          else if (req.mouth === 'closed') msgs.push('Tutup mulutmu');
        }
        
        if (msgs.length === 0) {
          isPoseReady = true;
          arInstructions.textContent = scenarios[currentStep].action === 'wait' ? 'Posisi Tepat! Bertahan...' : 'Posisi Tepat! Gosok layar!';
          arInstructions.className = 'ar-instructions ready';
          
          if (scenarios[currentStep].action === 'wait' && currentProgress < 100) {
            currentProgress += 1.5;
            updateProgress(currentProgress);
          }
        } else {
          isPoseReady = false;
          arInstructions.textContent = msgs.join(' & ');
          arInstructions.className = 'ar-instructions';
        }
      }

      function onFaceMeshResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          
          // Draw standard wireframe and glowing lips
          if (typeof drawConnectors !== 'undefined' && typeof FACEMESH_TESSELATION !== 'undefined') {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: 'rgba(255,255,255,0.15)', lineWidth: 1});
            drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: isPoseReady ? '#2BAA8E' : '#FFFFFF', lineWidth: 3});
          }
          
          const pose = detectPose(landmarks);
          checkPoseRequirement(pose);
        } else {
          arInstructions.textContent = "Wajah tidak terdeteksi";
          arInstructions.className = 'ar-instructions';
          isPoseReady = false;
        }
        canvasCtx.restore();
      }

      // ── Init a scenario ──
      function initScenario(index) {
        if (index >= scenarios.length) {
          finishSimulation();
          return;
        }

        const scene = scenarios[index];
        titleEl.textContent = scene.title;
        textEl.textContent = scene.text;

        btnNext.disabled = true;
        btnNext.textContent = 'Misi Belum Selesai';
        progressFill.style.width = '0%';
        progressPct.textContent = '0%';
        progressText.textContent = scene.action === 'wait' ? 'Tahan posisi!' : 'Gosok layar untuk membersihkan!';
        successBadge.classList.remove('success-badge--visible');

        currentProgress = 0;
        interactionCount = 0;
        isPoseReady = false;
        
        arInstructions.textContent = "Menunggu posisi...";
        arInstructions.className = 'ar-instructions';
        
        viewerEl.style.cursor = scene.action === 'brush' ? 'none' : 'default';

        buildStepDots();

        if (typeof DentaA11y !== 'undefined') {
          const mode = localStorage.getItem('dentavizion-mode');
          if (mode === 'blind') {
            DentaA11y.speak(scene.title + '. ' + scene.text, true);
          }
        }
      }

      // ── Update progress ──
      function updateProgress(percent) {
        percent = Math.min(100, Math.round(percent));
        progressFill.style.width = percent + '%';
        progressPct.textContent = percent + '%';
        if (percent >= 100 && btnNext.disabled) {
          stepCompleted();
        }
      }

      // ── Step completed ──
      function stepCompleted() {
        btnNext.disabled = false;
        btnNext.innerHTML = 'Lanjut <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
        progressText.textContent = 'Selesai! 🎉';

        successBadge.textContent = 'Selesai! ✨';
        successBadge.classList.add('success-badge--visible');

        hideBrushCursor();

        if (typeof DentaA11y !== 'undefined') {
          DentaA11y.vibrate('confirm');
        }
      }

      // ── Handle brushing interaction ──
      function handleInteraction(x, y) {
        const scene = scenarios[currentStep];
        if (scene && scene.action === 'brush' && isPoseReady && currentProgress < 100) {
          if (interactionCount % 10 === 0 && typeof navigator.vibrate === 'function') {
            navigator.vibrate(20);
          }
          interactionCount++;
          currentProgress += 1.5;
          updateProgress(currentProgress);
        }
      }

      // ── Pointer events ──
      viewerEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        isInteracting = true;
        const scene = scenarios[currentStep];
        if (scene && scene.action === 'brush') {
          showBrushCursor(e.clientX, e.clientY);
        }
        handleInteraction(e.clientX, e.clientY);
      });

      viewerEl.addEventListener('pointermove', (e) => {
        if (!isInteracting) return;
        e.preventDefault();
        const scene = scenarios[currentStep];
        if (scene && scene.action === 'brush') {
          showBrushCursor(e.clientX, e.clientY);
        }
        handleInteraction(e.clientX, e.clientY);
      });

      window.addEventListener('pointerup', () => {
        isInteracting = false;
        hideBrushCursor();
      });

      viewerEl.addEventListener('mousemove', (e) => {
        const scene = scenarios[currentStep];
        if (scene && scene.action === 'brush') {
          brushCursor.style.display = 'block';
          brushCursor.style.left = e.clientX + 'px';
          brushCursor.style.top = e.clientY + 'px';
          brushCursor.style.opacity = isInteracting ? '1' : '0.5';
        }
      });

      viewerEl.addEventListener('mouseleave', () => {
        if (!isInteracting) hideBrushCursor();
      });

      '''

content = content.replace(js_old, js_new)

# 4. Modify finishSimulation and Init logic to call initAR
init_old = '''// ── Init ──
      document.addEventListener('DOMContentLoaded', () => {
        const mode = localStorage.getItem('dentavizion-mode');
        if (!mode) { window.location.href = '../index.html'; return; }
        document.documentElement.setAttribute('data-mode', mode);

        initScenario(currentStep);
      });'''

init_new = '''// ── Init ──
      document.addEventListener('DOMContentLoaded', () => {
        const mode = localStorage.getItem('dentavizion-mode');
        if (!mode) { window.location.href = '../index.html'; return; }
        document.documentElement.setAttribute('data-mode', mode);

        initAR();
        initScenario(currentStep);
      });'''

content = content.replace(init_old, init_new)

# Stop camera on finish
finish_old = '''progressText.textContent = 'Simulasi selesai!';'''
finish_new = '''progressText.textContent = 'Simulasi selesai!';
        if (camera) camera.stop();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        arInstructions.style.display = 'none';'''

content = content.replace(finish_old, finish_new)

with open('c:/Users/ilham/Documents/web/ComproKesehatan/pages/interactive-practice.html', 'w', encoding='utf-8') as f:
    f.write(content)
