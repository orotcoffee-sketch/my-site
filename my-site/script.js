document.getElementById("year").textContent = new Date().getFullYear();

// 가짜 방문자 카운터 (80년대 감성)
document.getElementById("counter").textContent = String(
  Math.floor(Math.random() * 900000) + 1000
).padStart(6, "0");
