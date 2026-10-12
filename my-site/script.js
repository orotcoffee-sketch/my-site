// 푸터 연도 자동 갱신
document.getElementById("year").textContent = new Date().getFullYear();

// 카드를 클릭하면 강조 표시 토글
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => card.classList.toggle("active"));
});
