let quizData = [];
let answeredCount = 0, correctCount = 0, incorrectCount = 0;
let timerSeconds = 0, timerInterval;
let incorrectQuestions = [];

const container = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer');
const answeredDisplay = document.getElementById('answered-count');
const correctDisplay = document.getElementById('correct-count');
const incorrectDisplay = document.getElementById('incorrect-count');
const progressBar = document.getElementById('progress-bar');
const resultsModal = document.getElementById('results-modal');
const sectionFilter = document.getElementById('section-filter');

async function loadData() {
    // 🔥 إصلاح مشكلة الكاش
    const res = await fetch('./quiz_data.json?v=' + Date.now());
    quizData = await res.json();
    populateSections();
}

function populateSections() {
    const sections = [...new Set(quizData.map(q => q.section || q.chapter))];
    sections.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sectionFilter.appendChild(opt);
    });
}

function initQuiz(mode = 'all') {
    resultsModal.classList.add('hidden');
    let pool = [...quizData];

    if (mode === 'incorrect') {
        pool = quizData.filter(q => incorrectQuestions.includes(q.id));
        if (pool.length === 0) { alert('لا توجد أسئلة خاطئة لإعادتها!'); return; }
    } else if (mode === 'shuffle') {
        pool.sort(() => Math.random() - 0.5);
    } else {
        const sel = sectionFilter.value;
        if (sel !== 'all') {
            pool = quizData.filter(q => (q.section || q.chapter) === sel);
        }
    }

    render(pool);
    resetStats(pool.length);
    startTimer();
}

function render(questions) {
    container.innerHTML = '';
    questions.forEach((q, i) => {
        const block = document.createElement('div');
        block.className = 'question-block';
        block.dataset.id = q.id;
        block.dataset.answer = q.answer;

        const reviewBadge = q.needs_review ? '<span class="review-badge">⚠️ يحتاج مراجعة</span>' : '';
        block.innerHTML = `
            <div class="question-meta">${q.chapter || ''} ${q.section ? '— ' + q.section : ''} | #${q.id} ${reviewBadge}</div>

            <div class="question-text">${i + 1}. ${q.question}</div>

            <!-- ⭐ عرض الصورة هنا -->
            ${q.image ? `<img src="${q.image}" class="question-image">` : ''}

            <ul class="options-list">
                ${Object.entries(q.options).map(([k, v]) => `<li class="option-item" data-key="${k}">${k}. ${v}</li>`).join('')}
            </ul>

            <div class="explanation-box hidden"><strong>الشرح:</strong> ${q.explanation || 'لا يوجد شرح متاح.'}</div>
        `;

        block.querySelectorAll('.option-item').forEach(opt => {
            opt.addEventListener('click', () => handleAnswer(opt, block, q.id));
        });
        container.appendChild(block);
    });
}

function handleAnswer(selected, block, qId) {
    if (selected.classList.contains('locked')) return;
    const correctKey = block.dataset.answer;
    const options = block.querySelectorAll('.option-item');
    options.forEach(o => o.classList.add('locked'));

    if (selected.dataset.key === correctKey) {
        selected.classList.add('correct');
        correctCount++;
        incorrectQuestions = incorrectQuestions.filter(id => id !== qId);
    } else {
        selected.classList.add('incorrect');
        options.forEach(o => { if (o.dataset.key === correctKey) o.classList.add('correct'); });
        incorrectCount++;
        if (!incorrectQuestions.includes(qId)) incorrectQuestions.push(qId);
    }
    answeredCount++;
    updateStats();
    block.querySelector('.explanation-box').classList.remove('hidden');
}

function updateStats() {
    answeredDisplay.innerText = answeredCount;
    correctDisplay.innerText = correctCount;
    incorrectDisplay.innerText = incorrectCount;
    const total = parseInt(document.getElementById('total-count').innerText) || 1;
    progressBar.style.width = `${(answeredCount / total) * 100}%`;
}

function resetStats(total) {
    answeredCount = 0; correctCount = 0; incorrectCount = 0; timerSeconds = 0;
    document.getElementById('total-count').innerText = total;
    updateStats();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        const h = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(timerSeconds % 60).padStart(2, '0');
        timerDisplay.innerText = `Time: ${h}:${m}:${s}`;
    }, 1000);
}

document.getElementById('finish-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    const total = parseInt(document.getElementById('total-count').innerText);
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-incorrect').innerText = incorrectCount;
    document.getElementById('res-unanswered').innerText = total - answeredCount;
    document.getElementById('final-percentage').innerText = total ? ((correctCount / total) * 100).toFixed(1) : 0;
    resultsModal.classList.remove('hidden');
});

document.getElementById('retest-incorrect-btn').addEventListener('click', () => initQuiz('incorrect'));
document.getElementById('restart-full-btn').addEventListener('click', () => initQuiz('shuffle'));
sectionFilter.addEventListener('change', () => initQuiz('all'));

loadData().then(() => initQuiz('all'));
