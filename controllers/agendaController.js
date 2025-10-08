const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const Agendamento = require('../models/Agendamento')


// getAgenda com comparação por timezone (default: America/Sao_Paulo)
module.exports.getAgenda = async (req, res) => {
  try {
    const timeZone = req.query.timeZone || 'America/Sao_Paulo';

    // retorna 'YYYY-MM-DD' no timezone pedido
    const ymdNoTZ = (date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date); // ex: "2025-10-01"
    };

    // transforma "YYYY-MM-DD" em Date UTC midnight (00:00:00Z) — consistente para diferenças de dias
    const ymdParaUTCStart = (ymd) => {
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d)); // 00:00:00 UTC desse YMD
    };

    // hoje no timezone escolhido (string Y-M-D) e seu UTC-start correspondente
    const hojeYMD = ymdNoTZ(new Date());
    const hojeUTCStart = ymdParaUTCStart(hojeYMD);

    const docs = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: { $ne: null }
    }).lean();

    // map inicial: pega retorno, valida e normaliza para YMD no timezone
    const items = docs.map(item => {
      const retornoDateRaw = item.retornoAgendado ? new Date(item.retornoAgendado) : null;
      const retornoValido = retornoDateRaw && !isNaN(retornoDateRaw.getTime());

      let retornoYMD = null;
      let retornoUTCStart = null;
      if (retornoValido) {
        retornoYMD = ymdNoTZ(retornoDateRaw); // data no timezone (YYYY-MM-DD)
        retornoUTCStart = ymdParaUTCStart(retornoYMD); // midnight UTC para comparar por dias
      }

      const isDelayed = retornoValido ? (retornoUTCStart < hojeUTCStart) : true;

      return {
        ...item,
        retornoDateRaw,
        retornoValido,
        retornoYMD,
        retornoUTCStart,
        isDelayed
      };
    });

    // separar e ordenar
    const naoAtrasados = items.filter(i => !i.isDelayed);
    const atrasados = items.filter(i => i.isDelayed);

    naoAtrasados.sort((a, b) => a.retornoUTCStart - b.retornoUTCStart || new Date(b.criadoEm) - new Date(a.criadoEm));
    atrasados.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const ordered = [...naoAtrasados, ...atrasados];

    // buscar usuarios
    const usuarioIds = Array.from(new Set(ordered.map(i => i.usuarioId).filter(Boolean).map(id => id.toString())));
    const usuarios = usuarioIds.length ? await Usuario.find({ _id: { $in: usuarioIds } }).lean() : [];
    const usuariosMap = {};
    usuarios.forEach(u => { usuariosMap[u._id.toString()] = u; });

    // montar resultado final (diasRestantes calculado com base em retornoUTCStart e hojeUTCStart)
    const MS_P_DIA = 1000 * 60 * 60 * 24;
    const resultado = ordered.map(item => {
      const usuario = item.usuarioId ? usuariosMap[item.usuarioId.toString()] : null;

      let diasRestantes = "";
      if (item.retornoValido) {
        if (item.retornoUTCStart < hojeUTCStart) {
          diasRestantes = "atrasado";
        } else if (item.retornoUTCStart.getTime() === hojeUTCStart.getTime()) {
          diasRestantes = "hoje";
        } else {
          const diffDias = Math.floor((item.retornoUTCStart - hojeUTCStart) / MS_P_DIA);
          diasRestantes = diffDias === 1 ? "amanhã" : `${diffDias} dias`;
        }
      } else {
        diasRestantes = "atrasado";
      }

      return {
        ...item,
        retornoAgendadoOriginal: item.retornoAgendado,
        retornoYMD: item.retornoYMD,
        retornoDate: item.retornoUTCStart, // midnight UTC do YMD
        retornoValido: item.retornoValido,
        isDelayed: item.retornoValido ? (item.retornoUTCStart < hojeUTCStart) : true,
        diasRestantes,
        usuarioNome: usuario ? (usuario.email || usuario.nome || "Usuário não encontrado") : "Usuário não encontrado"
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
  }
};


module.exports.getAgendaProximos7Dias = async (req, res) => {
  try {
    const timeZone = 'America/Sao_Paulo'; // ou receba via req.query.timeZone
    const MS_P_DIA = 1000 * 60 * 60 * 24;

    // extrai YYYY-MM-DD no timezone pedido
    const ymdNoTZ = (date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date); // ex: "2025-10-01"
    };

    const ymdToUTCStart = (ymd) => {
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)); // midnight UTC do YMD
    };

    // hoje no timezone do usuário (string e UTC-start)
    const hojeYMD = ymdNoTZ(new Date());
    const hojeUTCStart = ymdToUTCStart(hojeYMD);

    // fim do 7º dia (UTC)
    const seteDiasDepoisUTCEnd = new Date(hojeUTCStart);
    seteDiasDepoisUTCEnd.setUTCDate(seteDiasDepoisUTCEnd.getUTCDate() + 7);
    seteDiasDepoisUTCEnd.setUTCHours(23, 59, 59, 999);

    // busca no banco com valores Date (UTC) corretos
    const agenda = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: {
        $gte: hojeUTCStart,
        $lte: seteDiasDepoisUTCEnd
      }
    }).lean();

    // buscar usuários
    const usuarioIds = Array.from(new Set(agenda.map(i => i.usuarioId).filter(Boolean).map(id => id.toString())));
    const usuarios = usuarioIds.length ? await Usuario.find({ _id: { $in: usuarioIds } }).lean() : [];
    const usuariosMap = {};
    usuarios.forEach(u => { usuariosMap[u._id.toString()] = u; });

    const resultado = agenda.map(item => {
      const usuario = item.usuarioId ? usuariosMap[item.usuarioId.toString()] : null;

      // pega retornoAgendado, extrai YMD no timezone do cliente e converte para UTC-start
      const retornoRaw = item.retornoAgendado ? new Date(item.retornoAgendado) : null;
      const retornoYMD = retornoRaw ? ymdNoTZ(retornoRaw) : null;
      const retornoUTCStart = retornoYMD ? ymdToUTCStart(retornoYMD) : null;

      const diffDias = retornoUTCStart ? Math.floor((retornoUTCStart - hojeUTCStart) / MS_P_DIA) : null;

      let diasRestantes = "";
      if (diffDias === 0) diasRestantes = "hoje";
      else if (diffDias === 1) diasRestantes = "amanhã";
      else if (diffDias > 1) diasRestantes = `${diffDias} dias`;
      // (não inclui atrasados aqui porque a query já os exclui)

      return {
        ...item,
        diasRestantes,
        usuarioNome: usuario ? (usuario.email || usuario.nome || "Usuário não encontrado") : "Usuário não encontrado"
      };
    });

    // ordenar
    resultado.sort((a, b) => new Date(a.retornoAgendado) - new Date(b.retornoAgendado));

    res.status(200).json(resultado);

    console.log('timeZone', timeZone, 'hojeYMD', hojeYMD, 'hojeUTCStart', hojeUTCStart.toISOString(), 
  'range', hojeUTCStart.toISOString(), seteDiasDepoisUTCEnd.toISOString());

agenda.forEach(i => {
  const r = new Date(i.retornoAgendado);
  console.log(i._id, 'raw', i.retornoAgendado, 'retornoYMD', ymdNoTZ(r), 'retornoUTCStart', ymdToUTCStart(ymdNoTZ(r)).toISOString());
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda dos próximos 7 dias" });
  }
};

// ---------Salvar Agendamentos-------
module.exports.salvarAgendamento = async (req, res) => {
  const {
    empresaId,
    nomeEmpresa,
    usuarioId,
    usuarioNome,
    criadoEm,
    dataTime,
    diasRestantes,
    funil,
    indicador,
    interesse,
    nicho,
    observacao,
    retornoAgendado,
    site,
    telefone,
    tempoGasto,
    resultado,
    texto
  } = req.body;

  try {
    // 🔎 1️⃣ Verifica se já existe agendamento com o mesmo empresaId
    const agendamentoExistente = await Agendamento.findOne({ empresaId });

    if (agendamentoExistente) {
      return res
        .status(409) // 409 = Conflict
        .json({
          success: false,
          msg: "Agendamento já existe para esta empresa.",
          empresaId: agendamentoExistente.empresaId,
        });
    }

    // 🆕 2️⃣ Cria novo agendamento
    const novoAgendamento = new Agendamento({
      empresaId,
      nomeEmpresa,
      usuarioId,
      usuarioNome,
      criadoEm,
      dataTime,
      diasRestantes,
      funil,
      indicador,
      interesse,
      nicho,
      observacao,
      retornoAgendado,
      site,
      telefone,
      tempoGasto,
      resultado,
      texto
    });

    await novoAgendamento.save();

    res.status(201).json({
      success: true,
      msg: "Agendamento cadastrado com sucesso.",
      agendamento: novoAgendamento,
    });

  } catch (error) {
    console.error("Erro ao cadastrar agendamento:", error);
    res.status(500).json({
      success: false,
      msg: "Erro ao cadastrar agendamento.",
      error: error.message,
    });
  }
};

module.exports.excluirListaAgendamento = async(req,res)=>{
try {
  await Agendamento.deleteMany({});
  res.status(200).json({msg:'Todos os agendamentos foram excluidos'});
} catch (error) {
  console.error(error);
  res.status(500).json({msg:'Erro ao excluir agendamentos'});
}  
};

module.exports.excluirAgendamento = async(req,res)=>{
 try {
  const {empresaId} = req.params;

  if(!empresaId){
    return res.status(400).json({
      msg:'Parametro empresaId é obrigatório'
    });
  }
  //verifica se existe um registro com empresaId
  const agendamentoExistente = await Agendamento.findOne({empresaId});
  if(!agendamentoExistente){
    return res.status(404).json({
      msg:'Nenhum agendamento encontrado com o id fornecido'
    });
  }
  //Exlcui o registro
  await Agendamento.deleteOne({empresaId});
  return res.status(200).json({
    msg:'Agendamento excluido com sucesso'
  });
 } catch (error) {
  console.error("❌ Erro ao excluir agendamento:", error);
    return res.status(500).json({
      success: false,
      msg: "Erro interno ao excluir agendamento.",
      error: error.message,
    });
 } 
};