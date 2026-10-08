# Entre Ideias

Protótipo web interativo sobre inteligência artificial, criatividade e autonomia, desenvolvido para um projeto escolar de Inovação e Desenvolvimento. A experiência conecta a pesquisa feita na escola a um quiz de autorreflexão, uma jornada em pixel art e recomendações de aprendizagem.

Os indicadores dos quizzes e do jogo descrevem somente as respostas e escolhas feitas nesta experiência. Não são diagnóstico médico ou psicológico nem medida científica de criatividade ou dependência.

## Como executar

1. Abra a pasta `ia-criatividade` no VS Code.
2. Instale/ative a extensão **Live Server**, se ainda não estiver disponível.
3. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.
4. A aplicação abre no navegador. Não é necessário instalar dependências nem iniciar backend.

Use um servidor local como o Live Server porque o navegador precisa carregar `data/researchData.json` e `data/recommendations.json` via `fetch`. Abrir o arquivo por `file://` pode bloquear essa leitura. A experiência não envia respostas para nenhum servidor: as escolhas ficam somente na memória da página e são apagadas ao reiniciar ou fechar.

O quiz de perfil de aprendizagem também pode ser aberto pelo botão **Seu perfil** no cabeçalho. Ele continua aparecendo na sequência depois do jogo; quando aberto pelo cabeçalho, a tela de resultados oferece um retorno à etapa em que a pessoa estava.

## Tecnologias e estrutura

- HTML5, CSS3 e JavaScript com módulos nativos.
- Canvas API para a caminhada em pixel art.
- Arquivos JSON para recomendações e dados da pesquisa.

```text
ia-criatividade/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── data/
│   ├── recommendations.json
│   └── researchData.json
└── js/
    ├── app.js
    ├── content.js
    ├── game.js
    └── scoring.js
```

## Editar o quiz inicial

As perguntas ficam em `js/content.js`, na lista `quizQuestions`. Cada alternativa leva quatro indicadores de 0 a 100:

```js
['Texto da alternativa', { c: 70, a: 65, k: 75, d: 45 }]
```

`c` representa criatividade, `a` autonomia, `k` pensamento crítico e `d` dependência observada no quiz. O sistema calcula a média das alternativas selecionadas e atualiza o progresso automaticamente quando a lista muda.

O número e o progresso das perguntas são derivados automaticamente da lista. As faixas de interpretação estão em `js/scoring.js`; os limites servem para tornar a leitura do protótipo compreensível e não são limites clínicos.

## Editar o jogo e adicionar eventos

Os eventos estão em `gameEvents` em `js/content.js`. Cada evento deve incluir idade, fase, situação, contexto de pesquisa e alternativas. Um exemplo de alternativa:

```js
{
  label: 'Pesquiso fontes e escrevo minha própria síntese.',
  feedback: 'Você construiu uma resposta própria a partir das fontes.',
  delta: { creativity: 7, autonomy: 8, critical: 10, dependence: -2, knowledge: 8 },
  key: 'research'
}
```

Há oito eventos para coincidir com os oito marcos de idade mostrados no jogo. Ao alterar a quantidade, ajuste o total, as idades e os cálculos de progresso em `js/game.js` e `js/app.js`. Os valores de consequência são limitados a 0–100.

## Alterar recomendações

Edite `data/recommendations.json`. Cada recurso tem `title`, `category`, `description`, `why`, `level`, `url`, `profiles` e `topics`. O aplicativo combina os perfis e interesses que a pessoa escolheu para ordenar até seis cartões.

Os links incluídos apontam para recursos públicos conhecidos (MDN, Khan Academy, Manual do Mundo, entre outros). Antes de apresentar ou publicar o projeto, a equipe pode revisar se continuam adequados ao público e ao tema pesquisado.

## Inserir resultados reais da pesquisa

Todos os dados estão em `data/researchData.json`, separados da lógica de apresentação. Os cinco percentuais fornecidos pela equipe já estão preenchidos. O total de participantes e contagens não informados continuam como `null`; cada descoberta também declara a base a que seu percentual se refere.

- `participants`: total de participantes.
- `questions[].responses[]`: opção, quantidade (`count`) e percentual (`percentage`).
- `insights[].value`: percentual para os cards de descobertas; mantenha o texto da descrição coerente com a pergunta e o denominador.
- A reflexão após o jogo usa os mesmos itens de `insights`, evitando manter uma segunda cópia dos percentuais.

Exemplo de preenchimento quando os dados reais estiverem prontos:

```json
{
  "participants": null,
  "questions": [
    {
      "id": "study-use",
      "question": "Você utiliza IA para estudar?",
      "chartTitle": "IA na rotina de estudos",
      "interpretation": "Descrição baseada nos resultados observados.",
      "responses": [
        { "option": "Sim", "count": null, "percentage": null },
        { "option": "Às vezes", "count": null, "percentage": null },
        { "option": "Não", "count": null, "percentage": null }
      ]
    }
  ]
}
```

Os valores nulos acima são espaços reservados, não resultados. Preencha-os com os valores efetivamente coletados. Percentuais devem usar a mesma base amostral declarada pelo grupo.

## Salvar resultados em PDF

No fim do quiz inicial, da jornada e do perfil de aprendizagem, use **Salvar … em PDF**. O botão abre a janela de impressão do navegador; escolha **Salvar como PDF** para guardar o relatório no dispositivo. O relatório inclui os indicadores e, no perfil de aprendizagem, as recomendações.

O protótipo não envia resultados por e-mail. Para anexar e enviar PDFs automaticamente, seria necessário um backend e um serviço de e-mail, além de consentimento explícito e regras para proteger os dados. No modo atual, as respostas permanecem no navegador.

## Acessibilidade e personalização

Os controles são botões semânticos, selecionáveis por teclado, com foco visível, textos de progresso e rótulos; o Canvas tem descrição acessível. A interface responde a telas pequenas e respeita `prefers-reduced-motion`. A fonte externa é um detalhe visual; fontes locais alternativas continuam disponíveis quando offline.
