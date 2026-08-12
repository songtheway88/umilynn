(function() {
  // 1. Mobile Check (Width <= 768px)
  if (window.innerWidth > 768) {
    return;
  }

  // 2. Check LocalStorage for "오늘 하루 열지 않기" (Do not show today)
  const hideUntil = localStorage.getItem('hideRouletteUntil');
  if (hideUntil && Date.now() < parseInt(hideUntil, 10)) {
    return;
  }

  // 3. Determine base path relative to this script
  let basePath = './';
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].getAttribute('src');
    if (src && src.includes('roulette.js')) {
      const idx = src.indexOf('js/roulette.js');
      if (idx !== -1) {
        basePath = src.substring(0, idx);
      }
      break;
    }
  }

  // 4. HTML structure creation
  const overlay = document.createElement('div');
  overlay.className = 'roulette-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.id = 'rouletteEventPopup';

  const prizeImgSrc = basePath + 'img/roulette-prize.jpg';

  overlay.innerHTML = `
    <div class="roulette-modal">
      <button type="button" class="roulette-close-btn" aria-label="닫기">&times;</button>
      <div class="roulette-header">
        <div class="limited-event">LIMITED EVENT</div>
        <div class="divider">
          <div class="divider-line"></div>
          <div class="divider-diamond"></div>
          <div class="divider-line"></div>
        </div>
        <div class="subtitle">룰렛을 돌리고 특별 혜택을 확인해보세요</div>
      </div>
      <div class="roulette-body">
        <!-- Roulette Game Screen -->
        <div class="roulette-game-container">
          <div class="roulette-pointer"></div>
          <canvas class="roulette-wheel"></canvas>
          <div class="roulette-spin-btn">START<br>EVENT</div>
        </div>
        
        <!-- Winning Result Screen -->
        <div class="roulette-result-container">
          <img src="${prizeImgSrc}" alt="관심고객 등록 이벤트 3만원 상품권 당첨!" class="roulette-prize-img">
          <button type="button" class="roulette-cta-btn">방문예약하기</button>
          <button type="button" class="roulette-home-btn">홈페이지 보러가기</button>
        </div>
      </div>
      <div class="roulette-footer">
        <button type="button" class="roulette-footer-btn hide-today-btn">오늘 하루 열지 않기</button>
        <button type="button" class="roulette-footer-btn close-btn">닫기</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger browser paint then make active
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // 5. Canvas Drawing for Roulette
  const canvas = overlay.querySelector('.roulette-wheel');
  const size = 260;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = ['#1d2d50', '#13503c', '#7c191e', '#1f4068', '#075e54', '#5c1d30'];
  const numSegments = 6;
  const center = size / 2;
  const radius = size / 2 - 8;

  function drawWheel() {
    ctx.clearRect(0, 0, size, size);

    // Draw background outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#090e1a';
    ctx.fill();

    // Draw slices
    for (let i = 0; i < numSegments; i++) {
      const startAngle = (i * 2 * Math.PI) / numSegments;
      const endAngle = ((i + 1) * 2 * Math.PI) / numSegments;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      // Gold dividers
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw "?" in segment
      ctx.save();
      ctx.translate(center, center);
      const textAngle = startAngle + (endAngle - startAngle) / 2;
      ctx.rotate(textAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Font style for "?"
      ctx.font = 'bold 36px Pretendard, sans-serif';
      ctx.fillStyle = '#dfba53';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText('?', radius * 0.58, 0);
      ctx.restore();
    }

    // Outer Gold border
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#dfba53';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Outer rim bulb dots (Alternating gold & white)
    for (let i = 0; i < 24; i++) {
      const dotAngle = (i * 2 * Math.PI) / 24;
      const dotX = center + (radius - 2) * Math.cos(dotAngle);
      const dotY = center + (radius - 2) * Math.sin(dotAngle);

      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#dfba53' : '#ffffff';
      ctx.fill();
    }
  }

  drawWheel();

  // 6. Spin Action
  const spinBtn = overlay.querySelector('.roulette-spin-btn');
  const gameContainer = overlay.querySelector('.roulette-game-container');
  const resultContainer = overlay.querySelector('.roulette-result-container');
  let isSpinning = false;

  spinBtn.addEventListener('click', function() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.classList.add('disabled');

    // Add extra spin rotations + random angle
    const minRotations = 5;
    const maxRotations = 8;
    const rotations = minRotations + Math.random() * (maxRotations - minRotations);
    const targetDeg = rotations * 360;

    canvas.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
    canvas.style.transform = `rotate(${targetDeg}deg)`;

    // Once rotation completes
    canvas.addEventListener('transitionend', function onTransitionEnd() {
      canvas.removeEventListener('transitionend', onTransitionEnd);
      
      // Celebrate with confetti
      triggerConfetti(overlay.querySelector('.roulette-body'));

      setTimeout(() => {
        // Switch views with fading transition
        gameContainer.classList.add('fade-out');
        
        setTimeout(() => {
          gameContainer.style.display = 'none';
          resultContainer.classList.add('active');
        }, 400);

      }, 600);
    });
  });

  // Confetti particles generator
  function triggerConfetti(parent) {
    const confettiColors = ['#dfba53', '#ffffff', '#10b981', '#ef4444', '#f59e0b', '#3b82f6'];
    for (let i = 0; i < 45; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      
      // Scatter metrics
      particle.style.left = `${40 + Math.random() * 180}px`;
      particle.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      particle.style.setProperty('--scatter-x', `${(Math.random() - 0.5) * 160}px`);
      particle.style.animationDelay = `${Math.random() * 0.4}s`;
      particle.style.width = `${5 + Math.random() * 5}px`;
      particle.style.height = `${5 + Math.random() * 6}px`;

      parent.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 3000);
    }
  }

  // 7. Modal Close Logic
  function closePopup() {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }

  overlay.querySelector('.roulette-close-btn').addEventListener('click', closePopup);
  overlay.querySelector('.close-btn').addEventListener('click', closePopup);
  const homeBtn = overlay.querySelector('.roulette-home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', closePopup);
  }

  overlay.querySelector('.hide-today-btn').addEventListener('click', function() {
    // Set cookie/localStorage to expire at today's midnight (23:59:59)
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    localStorage.setItem('hideRouletteUntil', midnight.getTime());
    closePopup();
  });

  // 8. CTA Click Logic - Scroll and Focus
  overlay.querySelector('.roulette-cta-btn').addEventListener('click', function() {
    closePopup();
    
    // Find target form box/lead
    const target = document.getElementById('lead') || document.getElementById('visit-reserve');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Focus the name input if exists
      const userNameInput = document.getElementById('userName');
      if (userNameInput) {
        setTimeout(() => {
          userNameInput.focus();
        }, 600); // delay to align with scroll finish
      }
    }
  });

})();
