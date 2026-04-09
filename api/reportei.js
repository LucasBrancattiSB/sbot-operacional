export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Action');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['authorization'];
  const action = req.headers['x-action'];

  if (action === 'generate-insight') {
    const { clientName, metricsData, metricsMeta, integrations, start, end } = req.body;
    let summary = `Cliente: ${clientName}\nPeríodo: ${start} a ${end}\n\n`;
    for (const integ of integrations) {
      summary += `Integração: ${integ.name} (${integ.slug})\n`;
      const mdata = metricsData[integ.id];
      if (mdata) {
        for (const [id, val] of Object.entries(mdata)) {
          if (val && val.values !== undefined && val.values !== null && !isNaN(parseFloat(val.values))) {
            const lbl = metricsMeta[id] || id;
            const diff = val.comparison ? ` (${val.comparison.difference > 0 ? '+' : ''}${(val.comparison.difference * 100).toFixed(1)}% vs semana anterior)` : '';
            summary += `  ${lbl}: ${val.values}${diff}\n`;
          }
        }
      }
      summary += '\n';
    }
    const prompt = `Você é o SBot, analista de marketing digital da SB Marketing, agência especializada com squads nichados (Ruptura/foodservice, Ignição/serviços, Avalanche/grandes contas).

Analise os dados abaixo e gere um insight semanal ESPECÍFICO e ACIONÁVEL sobre a performance do cliente. Não seja genérico.

Regras:
- Identifique o que se destacou positivamente (maior crescimento, melhor métrica)
- Aponte o que precisa de atenção (queda relevante, métrica abaixo do esperado)
- Se houver comparação com semana anterior, destaque variações acima de 10% como pontos fora da curva
- Dê 1 recomendação concreta e específica para a próxima semana
- Use os nomes reais das métricas e valores nos comentários
- Tom: direto, próximo, como um analista falando com o cliente

Formato:
📊 [2 linhas de diagnóstico com números reais]

- [ponto de destaque positivo com número]
- [ponto de atenção com número, se houver]
- [variação fora da curva, se houver]

💡 Recomendação: [ação específica para próxima semana]

Máximo 180 palavras.

DADOS:
${summary}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content && data.content[0] ? data.content[0].text : 'Não foi possível gerar o insight.';
      return res.status(200).json({ insight: text });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const path = req.query.path || '';
  const url = 'https://app.reportei.com/api/v2' + path;
  try {
    const options = {
      method: req.method,
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    };
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}