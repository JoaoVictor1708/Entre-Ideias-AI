import {quizQuestions, learningQuestions, gameEvents, styles, topicLabels} from './content.js';
import {scoreQuiz, describeQuiz, levelFor, clamp} from './scoring.js';
import {LifeGame} from './game.js';

const state = {
  screen:'inicio', quizIndex:0, quizAnswers:Array(quizQuestions.length).fill(null), quizScores:null,
  learningIndex:0, learningAnswers:Array(learningQuestions.length).fill(null), learningStyle:null, topics:[],
  learningEntry:'sequence', learningReturnScreen:null, game:null, gameResult:null
};
const emptyResearch = {participants:null,participantsLabel:'[DADO DA PESQUISA A INSERIR]',questions:[],insights:[],gameComparisons:{}};
const emptyRecommendations = {resources:[]};
let researchData = emptyResearch, recommendationsData = emptyRecommendations;
const $ = (selector, parent=document) => parent.querySelector(selector);
const $$ = (selector, parent=document) => [...parent.querySelectorAll(selector)];
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

async function loadData() {
  try {
    const [research, recommendations] = await Promise.all([
      fetch('./data/researchData.json').then(response => { if(!response.ok) throw new Error('research'); return response.json(); }),
      fetch('./data/recommendations.json').then(response => { if(!response.ok) throw new Error('recommendations'); return response.json(); })
    ]);
    researchData = research; recommendationsData = recommendations;
  } catch (error) {
    console.warn('Os arquivos JSON não foram carregados. A aplicação continuará com placeholders.', error);
    toast('Não foi possível carregar os dados. Confira se abriu pelo Live Server.');
  }
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message; element.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('show'), 3200);
}

function showScreen(name) {
  const target = $(`[data-screen="${name}"]`);
  if (!target) return;
  const preserveGameForProfile = state.learningEntry === 'header' && ['aprendizagem','recomendacoes'].includes(name);
  if (state.game && name !== 'jogo' && !preserveGameForProfile) { state.game.destroy(); state.game = null; }
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen === target));
  state.screen = name;
  const heading = $('h1, h2', target);
  if (heading) { heading.setAttribute('tabindex','-1'); heading.focus({preventScroll:true}); }
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}

function pctLabel(value) { return Number.isFinite(value) ? `${Math.round(value)}%` : '[A INSERIR]'; }
function insightById(id) { return researchData.insights?.find(item => item.id === id); }
function getResearchValue(id) {
  const insight = insightById(id);
  return Number.isFinite(insight?.value) ? `${Math.round(insight.value)}%` : '[DADO DA PESQUISA A INSERIR]';
}

function renderResearch() {
  const insights = researchData.insights?.length ? researchData.insights : emptyResearch.insights;
  $('#research-insights').innerHTML = insights.map((item,index) => `<article class="insight-card"><span class="insight-kicker">DESCOBERTA 0${index+1}</span><div><strong>${pctLabel(item.value)}</strong><p><b>${safe(item.title)}</b> — ${safe(item.description)}</p><small class="insight-base">BASE: ${safe(item.base||'Adolescentes entrevistados')}</small></div></article>`).join('');
  const questions = researchData.questions || [];
  $('#research-dashboard').innerHTML = `<article class="dashboard-card participants-card"><h3>Quem participou?</h3><p>O total de respostas será inserido com os dados da pesquisa.</p><div class="participant-total">${safe(researchData.participants ?? researchData.participantsLabel ?? '[DADO A INSERIR]')} <small>PARTICIPANTES</small></div></article>` + questions.map(question => {
    const max = Math.max(0,...(question.responses||[]).map(response => Number.isFinite(response.percentage)?response.percentage:0));
    const bars = (question.responses||[]).map(response => `<div class="bar-row"><span>${safe(response.option)}</span><b>${pctLabel(response.percentage)}</b><div class="bar"><i style="--value:${Number.isFinite(response.percentage)?clamp(response.percentage):0}%"></i></div></div>`).join('');
    return `<article class="dashboard-card"><h3>${safe(question.chartTitle || question.question)}</h3><p>${safe(question.interpretation || question.question)}</p>${question.base?`<small class="dashboard-base">${safe(question.base)}</small>`:''}${bars}${max===0?'<small class="placeholder-note">Preencha os percentuais no arquivo data/researchData.json.</small>':''}</article>`;
  }).join('');
}

function renderQuizQuestion() {
  const question = quizQuestions[state.quizIndex];
  const total = quizQuestions.length;
  $('#quiz-step').textContent = `${String(state.quizIndex+1).padStart(2,'0')} / ${total}`;
  $('#quiz-number').textContent = String(state.quizIndex+1).padStart(2,'0');
  $('#quiz-progress').style.width = `${((state.quizIndex+1)/total)*100}%`;
  $('#quiz-title').textContent = question.q;
  $('#quiz-hint').textContent = 'Escolha a opção mais próxima da sua rotina.';
  $('#quiz-answers').innerHTML = question.a.map(([label],index) => `<button class="answer${state.quizAnswers[state.quizIndex]===index?' selected':''}" data-answer="${index}" aria-pressed="${state.quizAnswers[state.quizIndex]===index}"><span class="answer-key">${String.fromCharCode(65+index)}</span><span>${safe(label)}</span></button>`).join('');
  $('#quiz-back').textContent = state.quizIndex === 0 ? '← Pesquisa' : '← Anterior';
  $('#quiz-next').disabled = state.quizAnswers[state.quizIndex] === null;
  $('#quiz-next').innerHTML = state.quizIndex === total-1 ? 'Ver meu resultado <span>↗</span>' : 'Próxima <span>→</span>';
  $('#quiz-feedback').textContent = state.quizAnswers[state.quizIndex] === null ? 'Escolha uma resposta para continuar.' : 'Resposta registrada.';
}

function renderScores(container, scores, keys) {
  $(container).innerHTML = keys.map(key => {
    const value = clamp(scores[key]);
    const caption = key === 'dependence' ? `DEPENDÊNCIA ${levelFor(key,value)}` : levelFor(key,value);
    return `<article class="score-card"><div class="score-head"><span>${key==='critical'?'PENSAMENTO<br>CRÍTICO':key==='dependence'?'DEPENDÊNCIA<br>DE IA':key==='creativity'?'CRIATIVIDADE':key==='autonomy'?'AUTONOMIA':'CONHECIMENTO'}</span><span>0—100</span></div><div class="score-value">${value}<small>%</small></div><div class="bar"><i style="--value:${value}%"></i></div><div class="score-caption">${caption}</div></article>`;
  }).join('');
}

function finishQuiz() {
  state.quizScores = scoreQuiz(state.quizAnswers,quizQuestions);
  $('#quiz-interpretation').textContent = describeQuiz(state.quizScores);
  renderScores('#quiz-scores',state.quizScores,['creativity','dependence','autonomy','critical']);
  showScreen('quiz-result');
}

function advanceQuiz() {
  if (state.quizAnswers[state.quizIndex] === null) return;
  if (state.quizIndex < quizQuestions.length-1) {state.quizIndex += 1;renderQuizQuestion();$('#quiz-title').focus({preventScroll:true});}
  else finishQuiz();
}

function researchContext(eventIndex) {
  const id = gameEvents[eventIndex]?.researchId;
  const insight = insightById(id);
  if (insight && Number.isFinite(insight.value)) return `NA PESQUISA · ${Math.round(insight.value)}% ${insight.description} Base: ${insight.base}.`;
  return `NA PESQUISA DA ESCOLA · ${getResearchValue(id)}. Os dados reais serão inseridos pela equipe.`;
}

function renderMeters(metrics) {
  const keys = ['creativity','autonomy','critical','knowledge','dependence'];
  $('#game-meters').innerHTML = keys.map(key => `<div class="meter ${key==='dependence'?'dependence':''}"><div class="meter-head"><span>${key==='critical'?'PENSAMENTO CRÍTICO':key==='dependence'?'DEPENDÊNCIA DE IA':key==='creativity'?'CRIATIVIDADE':key==='autonomy'?'AUTONOMIA':'CONHECIMENTO'}</span><strong>${metrics[key]}%</strong></div><div class="bar"><i style="--value:${metrics[key]}%"></i></div></div>`).join('');
}

function renderGameEvent(snapshot) {
  const {event,eventIndex,selected,feedback}=snapshot;
  const age = event?.age ?? 80;
  $('#game-age').innerHTML = `${String(age).padStart(2,'0')} <small>ANOS</small>`;
  $('#game-stage').textContent = event?.stage ?? 'JORNADA CONCLUÍDA';
  $('#game-time-label').textContent = `${String(Math.min(eventIndex+1,8)).padStart(2,'0')} / 08`;
  $('#game-progress').style.width = `${(eventIndex/7)*100}%`;
  $('#canvas-caption').textContent = event ? `CAPÍTULO ${String(eventIndex+1).padStart(2,'0')} · ${event.stage}` : 'FIM DE UMA JORNADA';
  renderMeters(snapshot.metrics);
  const card = $('#game-event');
  if (!event) {card.innerHTML='<p class="event-age">JORNADA COMPLETA</p><h3>Sua história está pronta para ser revisitada.</h3>';return;}
  const choiceMarkup = event.choices.map((choice,index) => `<button class="event-option" data-game-choice="${index}" ${selected!==null?'disabled':''}><b>${String.fromCharCode(65+index)}</b>${safe(choice.label)}</button>`).join('');
  const actions = selected !== null ? `<p class="event-feedback">${safe(feedback)}</p><button class="button button-dark event-next" data-action="continue" data-game-action="continue">${eventIndex===7?'Ver resultado da jornada':'Continuar jornada'} <span>→</span></button>` : '';
  card.innerHTML = `<p class="event-age">${String(age).padStart(2,'0')} ANOS · ${safe(event.stage)}</p><h3>${safe(event.title)}</h3><p class="event-research">${safe(researchContext(eventIndex))}</p><div class="event-options">${choiceMarkup}</div>${actions}`;
}

function startGame() {
  if (!state.quizScores) return showScreen('pesquisa');
  state.gameResult=null;
  showScreen('jogo');
  state.game = new LifeGame($('#game-canvas'),state.quizScores,renderGameEvent,finishGame);
}

function finishGame(result) {
  if(state.game){state.game.destroy();state.game=null;}
  state.gameResult=result;
  const s=result.metrics;
  const dependenceText=s.dependence>=68
    ? 'Nesta jornada, a IA apareceu em muitos momentos como atalho. Algumas escolhas deixaram menos espaço para praticar, criar e conferir por conta própria. Este indicador descreve apenas o caminho do jogo; ele não é uma avaliação psicológica.'
    : 'Nesta jornada, a tecnologia apareceu como uma ferramenta de apoio. Você buscou ajuda, pesquisou e também fez escolhas próprias, mantendo espaço para criar, questionar e aprender. Este indicador descreve apenas o caminho do jogo.';
  $('#game-interpretation').textContent=dependenceText;
  renderScores('#game-result-scores',s,['creativity','autonomy','critical','dependence']);
  const delegationCount=result.history.filter(item=>item.key==='delegate').length;
  const verifyCount=result.history.filter(item=>item.key==='verify').length;
  const metric=id=>insightById(id)?.value;
  const school=metric('study-use');
  const answers=metric('ready-answers');
  const ideas=metric('fewer-ideas');
  const comprehension=metric('comprehension');
  const critical=metric('critical-thinking');
  const schoolPart=Number.isFinite(school)?`Na pesquisa, ${Math.round(school)}% dos adolescentes entrevistados afirmam utilizar IA para trabalhos escolares.`:'O dado sobre uso de IA em trabalhos escolares ainda será inserido.';
  const answersPart=Number.isFinite(answers)?` Entre os que usam IA para estudar, ${Math.round(answers)}% dizem utilizá-la para obter respostas para atividades.`:'';
  const ideasPart=Number.isFinite(ideas)?` Entre os adolescentes que usam IA, ${Math.round(ideas)}% dizem gerar menos ideias por conta própria.`:'';
  const comprehensionPart=Number.isFinite(comprehension)?` Por outro lado, ${Math.round(comprehension)}% dizem que a IA os ajuda a compreender conteúdos escolares.`:'';
  const criticalPart=Number.isFinite(critical)?` E ${Math.round(critical)}% apontaram checagem de fatos e pensamento crítico como habilidades importantes para o futuro.`:'';
  $('#journey-research-copy').textContent=`No seu percurso, você delegou uma tarefa inteira à IA ${delegationCount} vez(es) e escolheu conferir informações ${verifyCount} vez(es). ${schoolPart}${answersPart}${ideasPart}${comprehensionPart}${criticalPart} Esses percentuais descrevem respostas da pesquisa, enquanto suas escolhas descrevem este jogo; eles ajudam a refletir sobre o tema, mas não medem o mesmo comportamento.`;
  showScreen('game-result');
}

function renderLearningQuestion() {
  const question=learningQuestions[state.learningIndex],total=learningQuestions.length;
  $('#learning-step').textContent=`${String(state.learningIndex+1).padStart(2,'0')} / ${total}`;
  $('#learning-progress').style.width=`${((state.learningIndex+1)/total)*100}%`;
  $('#learning-title').textContent=question.q;
  $('#learning-hint').textContent=question.hint || 'Escolha a opção mais próxima da sua preferência.';
  $('#learning-answers').innerHTML=question.a.map(([label],index)=>`<button class="answer${state.learningAnswers[state.learningIndex]===index?' selected':''}" data-learning-answer="${index}" aria-pressed="${state.learningAnswers[state.learningIndex]===index}"><span class="answer-key">${String.fromCharCode(65+index)}</span><span>${safe(label)}</span></button>`).join('');
  $('#learning-back').textContent=state.learningIndex===0?'← Resultado':'← Anterior';
  $('#learning-next').disabled=state.learningAnswers[state.learningIndex]===null;
  $('#learning-next').innerHTML=state.learningIndex===total-1?'Ver meu mapa <span>↗</span>':'Próxima <span>→</span>';
  $('#learning-feedback').textContent=state.learningAnswers[state.learningIndex]===null?'Escolha uma resposta para continuar.':'Resposta registrada.';
}

function finishLearning() {
  const styleTotals={}, topics=[];
  learningQuestions.forEach((question,index)=>{
    const choice=question.a[state.learningAnswers[index]]?.[1];
    if(choice?.style) styleTotals[choice.style]=(styleTotals[choice.style]||0)+1;
    if(choice?.topic && !topics.includes(choice.topic)) topics.push(choice.topic);
  });
  const sorted=Object.entries(styleTotals).sort((a,b)=>b[1]-a[1]);
  const style=sorted.length && sorted[0][1]>1 ? sorted[0][0] : 'multimodal';
  state.learningStyle=style; state.topics=topics;
  $('#learning-profile').textContent=styles[style].name;
  $('#learning-interpretation').textContent=styles[style].description;
  $('#interest-tags').innerHTML=topics.map(topic=>`<span class="interest-tag">${safe(topicLabels[topic]||topic.toUpperCase())}</span>`).join('');
  const nextStep=$('#learning-next-step');
  if(state.learningEntry==='header'){
    nextStep.dataset.action='return-to-flow';
    nextStep.innerHTML='Voltar à experiência <span>↗</span>';
  }else{
    nextStep.dataset.action='finish';
    nextStep.innerHTML='Finalizar experiência <span>↗</span>';
  }
  renderRecommendations(style,topics);
  showScreen('recomendacoes');
}

function renderRecommendations(style,topics) {
  const resources=recommendationsData.resources||[];
  const ranked=resources.map(item=>({item,score:(item.profiles?.includes(style)?3:0)+(item.topics||[]).filter(topic=>topics.includes(topic)).length*4})).sort((a,b)=>b.score-a.score);
  const chosen=ranked.filter(entry=>entry.score>0).slice(0,6);
  if(chosen.length<6) ranked.filter(entry=>!chosen.includes(entry)).slice(0,6-chosen.length).forEach(entry=>chosen.push(entry));
  $('#recommendation-cards').innerHTML=chosen.map(({item})=>`<article class="recommendation-card"><span class="rec-category">${safe(item.category)}</span><h3>${safe(item.title)}</h3><p>${safe(item.description)}</p><p class="rec-why">${safe(item.why)}</p><p class="rec-meta">NÍVEL · ${safe(item.level)}</p><a href="${safe(item.url)}" target="_blank" rel="noopener noreferrer">ACESSAR RECURSO ↗</a></article>`).join('');
}

function nextLearning() {
  if(state.learningAnswers[state.learningIndex]===null)return;
  if(state.learningIndex<learningQuestions.length-1){state.learningIndex++;renderLearningQuestion();$('#learning-title').focus({preventScroll:true});}
  else finishLearning();
}

function restart() {
  if(state.game){state.game.destroy();state.game=null;}
  state.quizIndex=0;state.quizAnswers=Array(quizQuestions.length).fill(null);state.quizScores=null;
  state.learningIndex=0;state.learningAnswers=Array(learningQuestions.length).fill(null);state.learningStyle=null;state.topics=[];state.gameResult=null;
  showScreen('inicio');
}

function beginLearning(entry) {
  if(['aprendizagem','recomendacoes'].includes(state.screen))return;
  state.learningEntry=entry;
  state.learningReturnScreen=state.screen;
  state.learningIndex=0;
  state.learningAnswers=Array(learningQuestions.length).fill(null);
  renderLearningQuestion();
  showScreen('aprendizagem');
}

function saveCurrentResultPdf(name) {
  const originalTitle=document.title;
  document.title=`Entre Ideias - ${name}`;
  const restoreTitle=()=>{document.title=originalTitle;};
  window.addEventListener('afterprint',restoreTitle,{once:true});
  window.print();
  window.setTimeout(restoreTitle,15000);
}

document.addEventListener('click',event=>{
  const answer=event.target.closest('[data-answer]');
  if(answer){const index=Number(answer.dataset.answer);state.quizAnswers[state.quizIndex]=index;renderQuizQuestion();$(`[data-answer="${index}"]`).focus({preventScroll:true});return;}
  const learningAnswer=event.target.closest('[data-learning-answer]');
  if(learningAnswer){const index=Number(learningAnswer.dataset.learningAnswer);state.learningAnswers[state.learningIndex]=index;renderLearningQuestion();$(`[data-learning-answer="${index}"]`).focus({preventScroll:true});return;}
  const choice=event.target.closest('[data-game-choice]');
  if(choice&&state.game){state.game.choose(Number(choice.dataset.gameChoice));$('[data-game-action="continue"]')?.focus({preventScroll:true});return;}
  const go=event.target.closest('[data-go]');
  if(go){showScreen(go.dataset.go);if(go.dataset.go==='quiz')renderQuizQuestion();if(go.dataset.go==='aprendizagem')renderLearningQuestion();return;}
  const action=event.target.closest('[data-action]')?.dataset.action;
  switch(action){
    case 'start':showScreen('pesquisa');break;
    case 'start-quiz':state.quizIndex=0;renderQuizQuestion();showScreen('quiz');break;
    case 'quiz-next':advanceQuiz();break;
    case 'quiz-back':if(state.quizIndex>0){state.quizIndex--;renderQuizQuestion();$('#quiz-title').focus({preventScroll:true});}else showScreen('pesquisa');break;
    case 'start-game':startGame();break;
    case 'leave-game':if(confirm('Sair do jogo agora? O progresso desta jornada será encerrado.'))showScreen('quiz-result');break;
    case 'restart-game':startGame();break;
    case 'continue':if(state.game){state.game.continue();$('[data-game-choice="0"]')?.focus({preventScroll:true});}break;
    case 'start-learning':beginLearning('sequence');break;
    case 'open-learning':beginLearning('header');break;
    case 'learning-next':nextLearning();break;
    case 'learning-back':if(state.learningIndex>0){state.learningIndex--;renderLearningQuestion();$('#learning-title').focus({preventScroll:true});}else showScreen('game-result');break;
    case 'finish':showScreen('final');break;
    case 'return-to-flow':showScreen(state.learningReturnScreen||'inicio');break;
    case 'export-quiz':saveCurrentResultPdf('resultado-do-quiz');break;
    case 'export-game':saveCurrentResultPdf('resultado-da-jornada');break;
    case 'export-learning':saveCurrentResultPdf('perfil-de-aprendizagem');break;
    case 'restart':restart();break;
  }
});

await loadData();
renderResearch();
renderQuizQuestion();
renderLearningQuestion();
