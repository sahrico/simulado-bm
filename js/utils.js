function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getUsedQuestions() {
  return JSON.parse(localStorage.getItem("usedQuestions") || "[]");
}

function saveUsedQuestions(ids) {
  localStorage.setItem("usedQuestions", JSON.stringify(ids));
}

function resetUsedQuestions() {
  localStorage.removeItem("usedQuestions");
}
