export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

export function scoreQuiz(answers, questions) {
  const keys = ['c', 'a', 'k', 'd'];
  const sums = { c:0, a:0, k:0, d:0 };
  questions.forEach((question, index) => {
    const selected = question.a[answers[index]];
    if (!selected) return;
    keys.forEach(key => sums[key] += selected[1][key]);
  });
  const count = Math.max(1, answers.filter(Number.isInteger).length);
  return {creativity:clamp(sums.c/count),autonomy:clamp(sums.a/count),critical:clamp(sums.k/count),dependence:clamp(sums.d/count)};
}

export function describeQuiz(scores) {
  let dependence;
  if (scores.dependence < 35) dependence = 'baixa dependência observada';
  else if (scores.dependence < 68) dependence = 'dependência moderada observada';
  else dependence = 'dependência mais alta observada';
  const creative = scores.creativity >= 68 ? 'muitas vezes você abre espaço para criar e experimentar' : 'há espaço para experimentar mais caminhos próprios';
  const autonomy = scores.autonomy >= 65 ? 'e mantém boa autonomia ao resolver tarefas' : 'e pode fortalecer a autonomia tentando antes de delegar';
  const critical = scores.critical >= 65 ? 'Você também costuma questionar e conferir informações.' : 'Conferir respostas em outras fontes pode fortalecer seu pensamento crítico.';
  return `Neste quiz, aparece ${dependence}. ${creative} ${autonomy}. ${critical}`;
}

export function levelFor(key, value) {
  if (key === 'dependence') return value < 35 ? 'BAIXA' : value < 68 ? 'MODERADA' : 'ALTA';
  return value < 35 ? 'EM DESENVOLVIMENTO' : value < 68 ? 'EM MOVIMENTO' : 'FORTE NESTE QUIZ';
}

export const scoreLabels = {creativity:'CRIATIVIDADE',autonomy:'AUTONOMIA',critical:'PENSAMENTO CRÍTICO',dependence:'DEPENDÊNCIA DE IA',knowledge:'CONHECIMENTO'};
