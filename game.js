const STORAGE_KEY = "tochigiQuestState";

const defaultState = {
  totalExp: 0,
  visitedCities: [],
  totalQuizzes: 0
};

let state = loadState();
let currentCity = null;
let pendingCity = null;
let isMasterQuiz = false;
let quizQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let quizExp = 0;
let answered = false;
let firstVisit = false;

// ==============================
// DOM
// ==============================

const homeScreen = document.getElementById("homeScreen");
const masterSection = document.getElementById("masterSection");
const masterQuizBtn = document.getElementById("masterQuizBtn");

const difficultyScreen = document.getElementById("difficultyScreen");
const difficultyCityName = document.getElementById("difficultyCityName");
const difficultyBackBtn = document.getElementById("difficultyBackBtn");
const easyBtn = document.getElementById("easyBtn");
const hardBtn = document.getElementById("hardBtn");

const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const cityGrid = document.getElementById("cityGrid");

const levelValue = document.getElementById("levelValue");
const expValue = document.getElementById("expValue");
const expBar = document.getElementById("expBar");
const nextExp = document.getElementById("nextExp");
const visitedValue = document.getElementById("visitedValue");
const completionText = document.getElementById("completionText");

const quizCityName = document.getElementById("quizCityName");
const questionCount = document.getElementById("questionCount");
const questionBar = document.getElementById("questionBar");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");

const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultExp = document.getElementById("resultExp");
const resultBonus = document.getElementById("resultBonus");


// ==============================
// 保存データ
// ==============================

function loadState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!saved) {
      return { ...defaultState };
    }

    return {
      totalExp: Number(saved.totalExp) || 0,
      visitedCities: Array.isArray(saved.visitedCities)
        ? saved.visitedCities
        : [],
      totalQuizzes: Number(saved.totalQuizzes) || 0
    };

  } catch {
    return { ...defaultState };
  }
}


function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


// ==============================
// レベル・ステータス
// ==============================

function getLevel(exp) {
  return Math.floor(exp / 100) + 1;
}


function updateStatus() {
  const level = getLevel(state.totalExp);

  const progress = state.totalExp % 100;
  const remaining = 100 - progress;

  levelValue.textContent = `Lv.${level}`;

  expValue.textContent =
    `${state.totalExp} EXP`;

  expBar.style.width =
    `${progress}%`;

  nextExp.textContent =
    progress === 0
      ? "距离下一级还需要 100 EXP"
      : `距离下一级还需要 ${remaining} EXP`;

  const cityCount =
    tochigiData.cities.length;

  const visitedCount =
    state.visitedCities.length;

  visitedValue.textContent =
    `${visitedCount} / ${cityCount}`;

  const completion =
    Math.round(
      visitedCount / cityCount * 100
    );

  completionText.textContent =
    `探索完成度 ${completion}%`;

  // 14座城市全部完成后开放总合挑战
  const allVisited =
    visitedCount >= cityCount;

  masterSection.classList.toggle(
    "hidden",
    !allVisited
  );
}


// ==============================
// 随机排序
// ==============================

function shuffle(array) {
  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] =
      [copy[j], copy[i]];
  }

  return copy;
}


// ==============================
// 选项随机排序
// ==============================

function shuffleChoices(question) {
  const order =
    shuffle(
      question.choices.map(
        (_, i) => i
      )
    );

  return {
    ...question,

    choices:
      order.map(
        i => question.choices[i]
      ),

    answer:
      order.indexOf(
        question.answer
      )
  };
}


// ==============================
// 城市列表
// ==============================

function renderCities() {
  cityGrid.innerHTML = "";

  tochigiData.cities.forEach(city => {

    const visited =
      state.visitedCities.includes(
        city.id
      );

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      `city-card${visited ? " visited" : ""}`;

    button.innerHTML = `
      <span class="tag">
        ${visited ? "已探索" : "未探索"}
      </span>

      <div class="jp">
        ${city.name}
      </div>

      <div class="cn">
        ${city.pinyin}
      </div>

      <div class="desc">
        ${city.description}
      </div>
    `;

    button.addEventListener(
      "click",
      () => openDifficultyScreen(city)
    );

    cityGrid.appendChild(button);
  });
}


// ==============================
// ホーム画面
// ==============================

function showHome() {

  homeScreen.classList.remove(
    "hidden"
  );

  difficultyScreen.classList.add(
    "hidden"
  );

  quizScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.add(
    "hidden"
  );

  renderCities();
  updateStatus();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==============================
// 難易度選択画面
// ==============================

function openDifficultyScreen(city) {

  pendingCity = city;

  homeScreen.classList.add(
    "hidden"
  );

  difficultyScreen.classList.remove(
    "hidden"
  );

  difficultyCityName.textContent =
    `${city.name}｜${city.pinyin}`;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==============================
// 城市クイズ開始
// ==============================

function startQuiz(city, count) {

  currentCity = city;

  isMasterQuiz = false;

  quizQuestions =
    shuffle(city.questions)
      .slice(0, count)
      .map(shuffleChoices);

  currentQuestionIndex = 0;

  correctCount = 0;

  quizExp = 0;

  answered = false;

  firstVisit =
    !state.visitedCities.includes(
      city.id
    );

  homeScreen.classList.add(
    "hidden"
  );

  difficultyScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.add(
    "hidden"
  );

  quizScreen.classList.remove(
    "hidden"
  );

  quizCityName.textContent =
    `${city.name}｜${city.pinyin}（${
      count === 15
        ? "高级"
        : "初级"
    }）`;

  renderQuestion();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==============================
// 栃木县総合クイズ
// ==============================

function startMasterQuiz() {

  currentCity = {
    id: "master",
    name: "栃木县综合",
    pinyin: ""
  };

  isMasterQuiz = true;

  const allQuestions =
    tochigiData.cities.flatMap(
      city => city.questions
    );

  // 総合クイズは10問
  quizQuestions =
    shuffle(allQuestions)
      .slice(0, 10)
      .map(shuffleChoices);

  currentQuestionIndex = 0;

  correctCount = 0;

  quizExp = 0;

  answered = false;

  firstVisit = false;

  homeScreen.classList.add(
    "hidden"
  );

  difficultyScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.add(
    "hidden"
  );

  quizScreen.classList.remove(
    "hidden"
  );

  quizCityName.textContent =
    "栃木县综合挑战｜MASTER";

  renderQuestion();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==============================
// 問題表示
// ==============================

function renderQuestion() {

  const question =
    quizQuestions[
      currentQuestionIndex
    ];

  answered = false;

  questionCount.textContent =
    `第 ${currentQuestionIndex + 1} 题 / ${quizQuestions.length}`;

  questionNumber.textContent =
    `QUESTION ${String(
      currentQuestionIndex + 1
    ).padStart(2, "0")}`;

  questionText.textContent =
    question.question;

  questionBar.style.width =
    `${
      (
        (currentQuestionIndex + 1) /
        quizQuestions.length
      ) * 100
    }%`;

  choices.innerHTML = "";

  feedback.classList.add(
    "hidden"
  );

  feedback.textContent = "";

  nextBtn.classList.add(
    "hidden"
  );

  question.choices.forEach(
    (choice, index) => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "choice-btn";

      button.textContent =
        `${String.fromCharCode(65 + index)}. ${choice}`;

      button.addEventListener(
        "click",
        () =>
          answerQuestion(
            index,
            button
          )
      );

      choices.appendChild(button);
    }
  );
}


// ==============================
// 回答チェック
// ==============================

function answerQuestion(
  selectedIndex,
  selectedButton
) {

  if (answered) return;

  answered = true;

  const question =
    quizQuestions[
      currentQuestionIndex
    ];

  const buttons =
    [
      ...choices.querySelectorAll(
        ".choice-btn"
      )
    ];

  buttons.forEach(
    (button, index) => {

      button.disabled = true;

      if (
        index === question.answer
      ) {
        button.classList.add(
          "correct"
        );
      }
    }
  );


  // 正解
  if (
    selectedIndex ===
    question.answer
  ) {

    selectedButton.classList.add(
      "correct"
    );

    correctCount++;

    quizExp += 10;

    feedback.innerHTML =
      `<strong>回答正确！</strong><br>${question.explanation}`;

  }

  // 不正解
  else {

    selectedButton.classList.add(
      "wrong"
    );

    feedback.innerHTML =
      `<strong>回答错误。</strong><br>` +
      `正确答案是「${
        question.choices[
          question.answer
        ]
      }」。<br>` +
      `${question.explanation}`;
  }

  feedback.classList.remove(
    "hidden"
  );

  nextBtn.textContent =
    currentQuestionIndex ===
    quizQuestions.length - 1
      ? "查看结果"
      : "下一题";

  nextBtn.classList.remove(
    "hidden"
  );
}


// ==============================
// クイズ終了
// ==============================

function finishQuiz() {

  let bonus = 0;

  const messages = [];


  // 初めてその都市をクリア
  if (
    !isMasterQuiz &&
    firstVisit
  ) {

    bonus += 20;

    messages.push(
      "首次探索奖励 +20 EXP"
    );

    state.visitedCities.push(
      currentCity.id
    );
  }


  // 全問正解
  if (
    correctCount ===
    quizQuestions.length
  ) {

    bonus +=
      isMasterQuiz
        ? 30
        : 10;

    messages.push(
      isMasterQuiz
        ? "综合挑战全答对奖励 +30 EXP"
        : "全答对奖励 +10 EXP"
    );
  }


  const gained =
    quizExp + bonus;

  state.totalExp +=
    gained;

  state.totalQuizzes +=
    1;

  saveState();

  updateStatus();


  // 結果表示
  resultTitle.textContent =
    isMasterQuiz
      ? "栃木县综合挑战完成！"
      : `${currentCity.name}探索完成！`;

  resultScore.textContent =
    `${quizQuestions.length}题中答对 ${correctCount}题`;

  resultExp.textContent =
    `+${gained} EXP`;

  resultBonus.textContent =
    messages.length
      ? messages.join("　")
      : "继续探索其他城市吧！";


  quizScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.remove(
    "hidden"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==============================
// イベント
// ==============================

nextBtn.addEventListener(
  "click",
  () => {

    if (
      currentQuestionIndex <
      quizQuestions.length - 1
    ) {

      currentQuestionIndex++;

      renderQuestion();

    } else {

      finishQuiz();
    }
  }
);


// 難易度画面 → ホーム
difficultyBackBtn.addEventListener(
  "click",
  showHome
);


// 初級：5問
easyBtn.addEventListener(
  "click",
  () =>
    startQuiz(
      pendingCity,
      5
    )
);


// 上級：15問
hardBtn.addEventListener(
  "click",
  () =>
    startQuiz(
      pendingCity,
      15
    )
);


// 栃木県総合クイズ
masterQuizBtn.addEventListener(
  "click",
  startMasterQuiz
);


// クイズ画面 → ホーム
document
  .getElementById("backBtn")
  .addEventListener(
    "click",
    showHome
  );


// 結果画面 → ホーム
document
  .getElementById("resultHomeBtn")
  .addEventListener(
    "click",
    showHome
  );


// ==============================
// データリセット
// ==============================

document
  .getElementById("resetBtn")
  .addEventListener(
    "click",
    () => {

      const ok =
        confirm(
          "经验值、等级、已探索城市等所有游戏数据都会被重置。确定要重置吗？"
        );

      if (!ok) return;

      localStorage.removeItem(
        STORAGE_KEY
      );

      state = {
        ...defaultState
      };

      showHome();
    }
  );


// ==============================
// 初期化
// ==============================

updateStatus();
renderCities();
