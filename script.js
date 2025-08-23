  const carousel = document.getElementById("carousel");
    const pauseBtn = document.getElementById("pauseBtn");
    const resumeBtn = document.getElementById("resumeBtn");
    const reverseBtn = document.getElementById("reverseBtn");
    const swapBtn = document.getElementById("swapBtn");
    const statusIndicator = document.getElementById("statusIndicator");
    const selectionMessage = document.getElementById("selectionMessage");
    const centerImage = document.getElementById("centerImage");
    const centerImg = document.getElementById("centerImg");
    const centerNumber = document.getElementById("centerNumber");
    const swapContainer = document.getElementById("swapContainer");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsMenu = document.getElementById("settingsMenu");

    // URLs das imagens (placehold.co)
    const imagePaths = ["img/1.jpg","img/2.jpg","img/3.jpg","img/4.jpg","img/5.jpg",
                    "img/6.jpg","img/7.jpg","img/8.jpg","img/9.jpg","img/10.jpg"];


    const items = [];
    const images = [];
    const numbers = [];

    let currentlySwapping = false;
    let enableSwapping = true;
    let selectedIndex = null;

    const radius = 200; // distância do eixo Y
    const angleStep = (2 * Math.PI) / imagePaths.length;

    // Criar elementos do carrossel
    for (let i = 0; i < imagePaths.length; i++) {
      const item = document.createElement("div");
      item.className = "carousel-item";
      item.dataset.index = i;
      item.setAttribute("role", "listitem");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `Imagen número ${i + 1} del carrusel`);

      const img = document.createElement("img");
      img.src = imagePaths[i];
      img.alt = `Imagen número ${i + 1} con fondo colorido y texto descriptivo`;
      img.width = 120; img.height = 120;

      const number = document.createElement("div");
      number.className = "image-number";
      number.textContent = i + 1;
      number.setAttribute("aria-hidden", "true");

      item.appendChild(img);
      item.appendChild(number);
      carousel.appendChild(item);

      item.addEventListener("click", () => { if (!currentlySwapping) selectCarouselItem(i); });
      item.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !currentlySwapping) {
          e.preventDefault(); selectCarouselItem(i);
        }
      });

      items.push(item);
      images.push(img);
      numbers.push(number);
    }

    /* ===== POSICIONAMENTO CORRIGIDO =====
       Usamos rotateY(angle) translateZ(radius).
       Sem translateX: o eixo do círculo fica exatamente no centro
       do .carousel (que está centralizado na tela). */
    function updateCarouselPositions() {
      items.forEach((item, index) => {
        const angle = index * angleStep; // radianos
        const deg = (angle * 180) / Math.PI;
        // Os cards permanecem angulados (como no seu layout original)
        // Se quiser que "encarem" a câmera, acrescente "rotateY(-deg)" ao final.
        item.style.transform =
          `translate(-50%, -50%) rotateY(${deg}deg) translateZ(${radius}px)`;
      });
    }
    updateCarouselPositions();

    let isAnimating = true;
    let direction = 1;
    let rotationDegree = 0;
    let swapTimeout = null;

    // Animação contínua (apenas eixo Y)
    function animate() {
      if (isAnimating && !currentlySwapping) {
        rotationDegree += 0.5 * direction;
        carousel.style.transform = `rotateY(${rotationDegree}deg)`;
      }
      requestAnimationFrame(animate);
    }

    // Selecionar item
    function selectCarouselItem(index) {
      selectedIndex = index;
      selectionMessage.textContent = `Seleccionada: Imagen ${index + 1}`;
      selectionMessage.style.opacity = "1";
      setTimeout(() => (selectionMessage.style.opacity = "0"), 2000);
      items.forEach((it) => it.classList.remove("selected"));
      items[index].classList.add("selected");
      alignToSelectedItem(index);
    }

    // Alinhar item escolhido à frente (0°)
    function alignToSelectedItem(index) {
      currentlySwapping = true;
      statusIndicator.textContent = "Estado: Alineando";

      const targetDegree = -index * (360 / items.length);
      let diffDegree = targetDegree - rotationDegree;
      while (diffDegree > 180) diffDegree -= 360;
      while (diffDegree < -180) diffDegree += 360;

      const startRotation = rotationDegree;
      const endRotation = rotationDegree + diffDegree;
      const duration = 800;
      const startTime = performance.now();

      function alignAnimation(ts) {
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
        rotationDegree = startRotation + (endRotation - startRotation) * ease;
        carousel.style.transform = `rotateY(${rotationDegree}deg)`;
        if (progress < 1) requestAnimationFrame(alignAnimation);
        else performSmoothExchange(index);
      }
      requestAnimationFrame(alignAnimation);
    }

    // Utilitários para troca visual
    function getRectRelativeToContainer(rect) {
      const containerRect = swapContainer.getBoundingClientRect();
      return {
        width: rect.width, height: rect.height,
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
      };
    }

    function createSwapItem(rect, imgSrc, numberText) {
      const div = document.createElement("div");
      div.className = "swap-item";
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;
      div.style.top = `0px`; div.style.left = `0px`;
      div.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

      const img = document.createElement("img");
      img.src = imgSrc;
      div.appendChild(img);
      const num = document.createElement("div");
      num.className = "swap-number";
      num.textContent = numberText;
      div.appendChild(num);
      return div;
    }

    function moveSwapItem(item, rect) {
      item.style.width = `${rect.width}px`;
      item.style.height = `${rect.height}px`;
      item.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    }

    // Troca suave entre item frontal e imagem central
    function performSmoothExchange(index) {
      swapContainer.innerHTML = "";
      statusIndicator.textContent = "Estado: Intercambiando";

      const selectedItem = items[index];
      const selectedRect = getRectRelativeToContainer(selectedItem.getBoundingClientRect());
      const centerRect = getRectRelativeToContainer(centerImage.getBoundingClientRect());

      const fromCarouselToCenter = createSwapItem(selectedRect, images[index].src, numbers[index].textContent);
      const fromCenterToCarousel = createSwapItem(centerRect, centerImg.src, centerNumber.textContent);

      swapContainer.appendChild(fromCarouselToCenter);
      swapContainer.appendChild(fromCenterToCarousel);

      selectedItem.style.opacity = "0";
      centerImage.style.opacity = "0";

      setTimeout(() => {
        moveSwapItem(fromCarouselToCenter, centerRect);
        moveSwapItem(fromCenterToCarousel, selectedRect);
      }, 50);

      setTimeout(() => {
        const tempSrc = centerImg.src;
        const tempNumber = centerNumber.textContent;
        centerImg.src = images[index].src;
        centerNumber.textContent = numbers[index].textContent;
        images[index].src = tempSrc;
        numbers[index].textContent = tempNumber;

        selectedItem.style.opacity = "1";
        centerImage.style.opacity = "1";
        selectedItem.classList.remove("selected");
        swapContainer.innerHTML = "";

        currentlySwapping = false;
        statusIndicator.textContent = "Estado: Girando";
        selectedIndex = null;

        if (enableSwapping) startSwapping();
      }, 1050);
    }

    // Troca automática (pega o item que está de frente)
    function swapImages() {
      if (!enableSwapping || currentlySwapping) return;
      currentlySwapping = true;
      statusIndicator.textContent = "Estado: Intercambiando";

      const stepDegree = 360 / items.length;
      const frontIndexRaw = Math.round((-rotationDegree / stepDegree)) % items.length;
      const frontIndex = frontIndexRaw < 0 ? (frontIndexRaw + items.length) % items.length : frontIndexRaw;
      alignToSelectedItem(frontIndex);
    }

    function startSwapping() {
      if (swapTimeout) clearTimeout(swapTimeout);
      swapTimeout = setTimeout(swapImages, 5000);
    }

    // Controles
    pauseBtn?.addEventListener("click", () => {
      isAnimating = false;
      statusIndicator.textContent = "Estado: Pausado";
    });
    resumeBtn?.addEventListener("click", () => {
      isAnimating = true;
      statusIndicator.textContent = "Estado: Girando";
    });
    reverseBtn?.addEventListener("click", () => {
      direction *= -1;
      statusIndicator.textContent = `Estado: Girando (${direction > 0 ? "Derecha" : "Izquierda"})`;
    });
    swapBtn?.addEventListener("click", () => {
      enableSwapping = !enableSwapping;
      swapBtn.setAttribute("aria-pressed", enableSwapping.toString());
      swapBtn.textContent = enableSwapping ? "Intercambio ON" : "Intercambio OFF";
      if (enableSwapping) startSwapping();
      else if (swapTimeout) clearTimeout(swapTimeout);
    });

    // Botão de configuração
    settingsBtn.addEventListener("click", () => {
      const isShown = settingsMenu.classList.toggle("show");
      settingsBtn.setAttribute("aria-expanded", isShown.toString());
      settingsMenu.setAttribute("aria-hidden", (!isShown).toString());
      settingsMenu.style.display = isShown ? "flex" : "none";
    });

    // Iniciar
    animate();
    if (enableSwapping) startSwapping();