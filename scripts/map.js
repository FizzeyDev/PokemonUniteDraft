window.addEventListener("load", () => {
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const mapImage = document.getElementById("map-image");

  const colorPicker = document.getElementById("colorPicker");
  const eraseBtn = document.getElementById("eraseBtn");
  const clearBtn = document.getElementById("clearBtn");
  const brushButtons = document.querySelectorAll(".brush-size");

  let drawing = false;
  let erasing = false;
  let currentColor = colorPicker.value;
  let currentSize = 10;
  let lastPos = null;

  function resizeCanvas() {
    canvas.width = mapImage.clientWidth;
    canvas.height = mapImage.clientHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    lastPos = getMousePos(e);
  });
  canvas.addEventListener("mouseup", () => {
    drawing = false;
    lastPos = null;
  });
  canvas.addEventListener("mouseout", () => {
    drawing = false;
    lastPos = null;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const pos = getMousePos(e);

    ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : currentColor;
    ctx.lineWidth = currentSize * 2;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';

    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos = pos;
  });

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  colorPicker.addEventListener("input", (e) => {
    currentColor = e.target.value;
    erasing = false;
    eraseBtn.classList.remove("active");
  });

  brushButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentSize = parseInt(btn.dataset.size);
      erasing = false;
      eraseBtn.classList.remove("active");
      brushButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  eraseBtn.addEventListener("click", () => {
    erasing = !erasing;
    eraseBtn.classList.toggle("active");
    brushButtons.forEach(b => b.classList.remove("active"));
  });

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
});
