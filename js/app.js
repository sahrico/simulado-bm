/* =============================
   ESTADO GLOBAL
============================= */
let questions = [];
let current = 0;
let score = 0;
let learning = [];
let seconds = 0;
let timerInterval = null;

/* =============================
   UTILIDADES
============================= */
function formatTime(t) {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

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

/* =============================
   GERADOR DO SIMULADO
============================= */
function generateSimulado() {
  const used = getUsedQuestions();
  let selected = [];

  const pools = [
    window.questionsDireitoPenal,
    window.questionsDireitoConstitucional,
    window.questionsDireitoProcessualPenal,
    window.questionsDireitoPenalMilitar,
    window.questionsDireitoProcessualPenalMilitar,
    window.questionsDireitoAdministrativo,
    window.questionsLegislacaoInstitucional
  ];

  for (const pool of pools) {
    const available = pool.filter(q => !used.includes(q.id));
    if (available.length < 5) return null;

    selected.push(...shuffle(available).slice(0, 5));
  }

  saveUsedQuestions([
    ...used,
    ...selected.map(q => q.id)
  ]);

  return selected; 
}

/* =============================
   INTRO
============================= */
function renderIntro() {
 const subjects = {
  "Direito Penal": 5,
  "Direito Constitucional": 5,
  "Direito Processual Penal": 5,
  "Direito Penal Militar": 5,
  "Direito Processual Penal Militar": 5,
  "Direito Administrativo": 5,
  "Legislação Institucional BMRS": 5
};

  document.getElementById("app").innerHTML = `
    <div class="intro-box">
      <h2>Bem-vindo ao Simulado BMRS – Sargento</h2>

      <p>
        Este simulado foi desenvolvido com base no <strong>edital de 2026</strong>
        para o concurso de <strong>Sargento da Brigada Militar do Rio Grande do Sul</strong>.
      </p>

      <p>
        As questões foram formuladas por IA <strong>baseada em provas reais</strong>, respeitando
        rigorosamente os conteúdos exigidos no edital.
      </p>

      <h3>📚 Divisão de matérias</h3>
      <ul>
        ${Object.entries(subjects).map(
          ([s, c]) => `<li>${s}: ${c} questões</li>`
        ).join("")}
      </ul>
      <div class="center">
        <button onclick="startSimulado()">Iniciar Simulado</button>
      </div>
    </div>
  `;
}

/* =============================
   INÍCIO DO SIMULADO
============================= */
function startSimulado() {
  const generated = generateSimulado();

  if (!generated) {
    document.getElementById("app").innerHTML = `
      <div class="center">
        <h2>Banco de questões esgotado</h2>
        <p>Todas as questões disponíveis já foram utilizadas.</p>
        <button onclick="resetBanco()">Reiniciar banco de questões</button>
      </div>
    `;
    return;
  }

  questions = generated;
  current = 0;
  score = 0;
  learning = [];
  seconds = 0;

  timerInterval = setInterval(() => {
    seconds++;
    const el = document.getElementById("timer-value");
    if (el) el.textContent = formatTime(seconds);
  }, 1000);

  renderQuestion();
}

function resetBanco() {
  resetUsedQuestions();
  renderIntro();
}

/* =============================
   CONTROLE POR MATÉRIA
============================= */
function getSubjectIndex() {
  const subjectsOrder = [...new Set(questions.map(q => q.subject))];
  return subjectsOrder.indexOf(questions[current].subject);
}

function getQuestionIndexInSubject() {
  const subject = questions[current].subject;
  return questions
    .filter(q => q.subject === subject)
    .findIndex(q => q === questions[current]);
}

function getTotalQuestionsInSubject() {
  return questions.filter(q => q.subject === questions[current].subject).length;
}

/* =============================
   RENDER QUESTÃO
============================= */
function renderQuestion() {
  const q = questions[current];

  document.getElementById("app").innerHTML = `
    <div class="subject subject-bracket">[${q.subject}]</div>

    <div class="top-bar">
      <div class="progress-info">
        Matéria ${getSubjectIndex() + 1} •
        Questão ${getQuestionIndexInSubject() + 1} de ${getTotalQuestionsInSubject()}
      </div>
      <div class="simulado-count">
        Questão ${current + 1} de ${questions.length}
      </div>
    </div>

    <div class="timer">⏱️ <span id="timer-value">${formatTime(seconds)}</span></div>

    <div class="progress-bar">
      <div class="progress-fill" style="width:${(current / questions.length) * 100}%"></div>
    </div>

    <div class="question">${q.question.replace(/\n/g, "<br>")}</div>

    <div class="options">
      ${q.options.map((o, i) => `
        <label id="opt-${i}">
          <input type="radio" name="opt" value="${i}"> ${o.text}
        </label>
      `).join("")}
    </div>

    <button id="answerBtn">Responder</button>
    <button id="nextBtn" class="hidden">Próxima pergunta</button>
    <div id="feedback" class="explanation hidden"></div>
  `;

  document.getElementById("answerBtn").onclick = checkAnswer;
}

/* =============================
   CORREÇÃO
============================= */
function checkAnswer() {
  const sel = document.querySelector('input[name="opt"]:checked');
  if (!sel) return alert("Selecione uma alternativa.");

  const q = questions[current];
  const ans = +sel.value;

  q.options.forEach((_, i) => {
    const lbl = document.getElementById(`opt-${i}`);
    if (i === q.correct) lbl.classList.add("correct");
    if (i === ans && i !== q.correct) lbl.classList.add("incorrect");
  });

  const correctOpt = q.options[q.correct];
  const selectedOpt = q.options[ans];
  const otherWrongs = q.options.filter((_, i) => i !== q.correct && i !== ans);

  document.getElementById("feedback").innerHTML = `
    <div class="correct-box">
      <strong>✅ Alternativa correta</strong><br>
      ${correctOpt.explanation}

      <div class="legal-box">
        <strong>📘 Referência legal</strong><br>
        ${q.reference.law} – ${q.reference.article}<br>
        <em>${q.reference.description}</em><br><br>
        <strong>Trecho da lei:</strong><br>
        "${q.reference.lawText}"
      </div>
    </div>

    ${ans !== q.correct ? `
      <div class="wrong-selected-box">
        <strong>❌ Alternativa escolhida</strong><br>
        ${selectedOpt.explanation}
      </div>
    ` : ""}

    <div class="other-wrongs-box">
      <strong>ℹ️ Por que as outras estão incorretas</strong>
      ${otherWrongs.map(o => `
        <p><strong>${o.text}</strong><br>${o.explanation}</p>
      `).join("")}
    </div>
  `;

  document.getElementById("feedback").classList.remove("hidden");

  if (ans !== q.correct) learning.push(q);
  else score++;

  document.querySelector('.explanation')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
 });


  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("nextBtn").onclick = nextQuestion;
}

/* =============================
   RESULTADO FINAL
============================= */
function renderResult() {
  clearInterval(timerInterval);

  const avg = Math.floor(seconds / questions.length);
  const grouped = {};

  learning.forEach(q => {
    if (!grouped[q.subject]) grouped[q.subject] = [];
    grouped[q.subject].push(q);
  });

  let html = `
    <div class="center">
      <h2>Resultado do Simulado</h2>
      <h3>Acertos: ${score} de ${questions.length}</h3>
      <p>⏱️ Tempo total: ${formatTime(seconds)}</p>
      <p>📊 Tempo médio por questão: ${formatTime(avg)}</p>
    </div>
  `;

  if (learning.length === 0) {
    html += `<p class="center">🎉 <strong>Excelente!</strong> Você não cometeu erros neste simulado.</p>`;
  } else {
    html += `<h3>📘 O que aprendemos hoje</h3>`;

Object.keys(grouped).forEach((sub, index) => {
  html += `
    <div class="learning-subject">
      <button class="learning-toggle" onclick="toggleLearning(${index})">
        ${sub}
      </button>

      <div class="learning-content hidden" id="learning-${index}">
  `;

  grouped[sub].forEach((q, i) => {
    html += `
      <div class="learning-paragraph">
        ${i === 0
          ? `A partir das questões respondidas, aprendemos que ${q.learningSummary}`
          : q.learningSummary}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
});
  }

  html += `<div class="center"><button onclick="renderIntro()">Gerar novo simulado</button></div>`;
  document.getElementById("app").innerHTML = html;
}

function toggleLearning(index) {
  const el = document.getElementById(`learning-${index}`);
  el.classList.toggle("hidden");
}


/* =============================
   PRÓXIMA QUESTÃO
============================= */
function nextQuestion() {
  current++;
  if (current < questions.length) renderQuestion();
  else renderResult();
}

/* =============================
   START
============================= */
renderIntro();
