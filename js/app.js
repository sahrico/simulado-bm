if (typeof questions === "undefined") {
  document.getElementById("app").innerHTML = `
    <p style="color:red; font-weight:bold">
      Erro: banco de questões não foi carregado (questions.js).
    </p>`;
  throw new Error("questions.js não carregado");
}

let current = 0, score = 0, learning = [], seconds = 0;
let timerInterval = null;

function formatTime(t){
  return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
}

/* INTRO */
function renderIntro(){
  const subjects = {};
  questions.forEach(q => {
    subjects[q.subject] = (subjects[q.subject] || 0) + 1;
  });

  document.getElementById("app").innerHTML = `
    <div class="intro-box">
      <h2>Bem-vindo ao Simulado BMRS – Sargento</h2>

      <p>
        Este simulado foi desenvolvido para a preparação ao concurso de
        <strong>Sargento da Brigada Militar do Rio Grande do Sul</strong>,
        com base no <strong>edital previsto para 2026</strong>.
      </p>

      <p>
        As questões foram extraídas e adaptadas de
        <strong>provas reais anteriores</strong>,
        respeitando rigorosamente os conteúdos exigidos no edital.
      </p>

      <h3>📚 Divisão de matérias</h3>
      <ul>
        ${Object.entries(subjects)
          .map(([subject, count]) => `<li>${subject}: ${count} questões</li>`)
          .join("")}
      </ul>

      <p>
        <strong>💡 Mensagem motivacional:</strong><br>
        Disciplina hoje é aprovação amanhã. Confie no processo.
      </p>

      <div class="center">
        <button onclick="startSimulado()">Iniciar Simulado</button>
      </div>
    </div>
  `;
}


function startSimulado(){
  // garante que não exista outro cronômetro rodando
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    seconds++;
    const el = document.getElementById("timer-value");
    if (el) {
      el.textContent = formatTime(seconds);
    }
  }, 1000);

  renderQuestion();
}


/* CONTAGEM POR MATÉRIA */
const subjectsOrder = [...new Set(questions.map(q => q.subject))];

function getSubjectIndex(){
  return subjectsOrder.indexOf(questions[current].subject);
}
function getQuestionIndexInSubject(){
  return questions.filter(q => q.subject === questions[current].subject)
                  .findIndex(q => q === questions[current]);
}
function getTotalQuestionsInSubject(){
  return questions.filter(q => q.subject === questions[current].subject).length;
}

/* QUESTÃO */
function renderQuestion(){
  const q = questions[current];
  document.getElementById("app").innerHTML = `
    <div class="subject subject-bracket">[${q.subject}]</div>

    <div class="top-bar">
      <div class="progress-info">
        Matéria ${getSubjectIndex()+1} de ${subjectsOrder.length} •
        Questão ${getQuestionIndexInSubject()+1} de ${getTotalQuestionsInSubject()}
      </div>
      <div class="simulado-count">
        Questão ${current+1} de ${questions.length}
      </div>
    </div>

    <div class="timer">
  ⏱️ <span id="timer-value">${formatTime(seconds)}</span>
    </div>


    <div class="progress-bar">
      <div class="progress-fill" style="width:${(current/questions.length)*100}%"></div>
    </div>

    <div class="question">${q.question}</div>

    <div class="options">
      ${q.options.map((o,i)=>`
        <label id="opt-${i}">
          <input type="radio" name="opt" value="${i}"> ${o.text}
        </label>`).join("")}
    </div>

    <button onclick="checkAnswer()">Responder</button>
    <button id="nextBtn" class="hidden" onclick="nextQuestion()">Próxima pergunta</button>
    <div id="feedback" class="explanation hidden"></div>
  `;
}

/* CORREÇÃO */
function checkAnswer(){
  const sel = document.querySelector('input[name="opt"]:checked');
  if(!sel) {
    alert("Selecione uma alternativa.");
    return;
  }

  const q = questions[current];
  const ans = Number(sel.value);

  // Marca visual das alternativas
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

  // Controle de acertos / erros
  if (ans !== q.correct) {
    learning.push(q);
  } else {
    score++;
  }

  // Libera próxima pergunta
  document.getElementById("nextBtn").classList.remove("hidden");
}


/* RESULTADO */
function renderResult(){
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
    html += `
      <p class="center">
        🎉 <strong>Excelente!</strong> Você não cometeu erros neste simulado.
      </p>
    `;
  } else {
    html += `<h3>📘 O que aprendemos hoje</h3>`;

    Object.keys(grouped).forEach(subject => {
      const q = grouped[subject][0];

      html += `
        <div class="subject-title">${subject}</div>

        <div class="learning-paragraph">
          A partir das questões respondidas, aprendemos que ${q.learningSummary}
        </div>

        <div class="legal-box">
          <strong>📘 Referência legal</strong><br>
          ${q.reference.law} – ${q.reference.article}<br>
          <em>${q.reference.description}</em><br><br>
          <strong>Trecho da lei:</strong><br>
          "${q.reference.lawText}"
        </div>
      `;
    });
  }

  html += `
    <div class="center">
      <button onclick="location.reload()">Gerar novo simulado</button>
    </div>
  `;

  document.getElementById("app").innerHTML = html;
}


function nextQuestion(){
  current++;
  if(current < questions.length) renderQuestion();
  else renderResult();
}

/* START */
renderIntro();