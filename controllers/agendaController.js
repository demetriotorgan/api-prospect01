const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const Agendamento = require('../models/Agendamento')
const Estabelecimento = require('../models/Estabelecimento');
const mongoose = require('mongoose');

// ---------Salvar Agendamentos-------
module.exports.salvarAgendamento = async (req, res) => {
  const {
    empresaId,
    nomeEmpresa,
    usuarioId,
    indicador,
    nicho,
    observacao,
    tempoGasto,
    interesse,   
    retornoAgendado,
    dataTime,
    telefone,    
    site,
    funil,        
    resultado,
    texto,    
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(empresaId)) {
  return res.status(400).json({ success: false, msg: "Formato de empresaId inválido." });
}
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
    indicador,
    nicho,
    observacao,
    tempoGasto,
    interesse,   
    retornoAgendado,
    dataTime,
    telefone,    
    site,
    funil,        
    resultado,
    texto
    });
// console.log("📦 Dados recebidos para salvar agendamento:", req.body);
// console.log("📦 Validando empresaId:", empresaId, "Valido?", mongoose.Types.ObjectId.isValid(empresaId));
// console.log("📦 Validando usuarioId:", usuarioId, "Valido?", mongoose.Types.ObjectId.isValid(usuarioId));
    await novoAgendamento.save();
    
     return res.status(201).json({
      success: true,
      msg: "Agendamento salvo com sucesso.",     
    });

  } catch (error) {
    console.error("❌ Erro ao salvar agendamento:", error);
    res.status(500).json({
    success: false,
    msg: "Erro ao salvar agendamento.",
    error: error.message,
    stack: error.stack, // 🔎 adiciona para depurar
});
  }
};

// Função para converter uma data UTC para hora de São Paulo
function toSaoPauloDate(utcDate) {
  const date = new Date(utcDate);

  // Offset de SP: UTC-3
  const offsetSP = -3 * 60; // minutos
  const localOffset = date.getTimezoneOffset(); // minutos
  const diffMinutes = offsetSP - localOffset;

  date.setMinutes(date.getMinutes() + diffMinutes);
  return date;
}

module.exports.listarAgendamentosSalvos = async (req, res) => {
  try {
    const listaAgendamentosSalvos = await Agendamento.find()
      .sort({ _id: -1 })
      .populate('usuarioId', 'email')
      .exec();

    const agora = toSaoPauloDate(new Date());

    const listaComInfos = listaAgendamentosSalvos.map(a => {
      const obj = a.toObject();
      let tempoRestanteStr = 'Agendamento Expirado';

      if (a.retornoAgendado) {
        const retornoSP = toSaoPauloDate(a.retornoAgendado);

        // Zerando horas, minutos e segundos para comparar apenas a data
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const diaReuniao = new Date(retornoSP.getFullYear(), retornoSP.getMonth(), retornoSP.getDate());

        const diffDias = Math.floor((diaReuniao - hoje) / (1000 * 60 * 60 * 24));

        if (diffDias < 0) {
          tempoRestanteStr = 'Agendamento Expirado';
        } else if (diffDias === 0) {
          tempoRestanteStr = 'Hoje';
        } else {
          tempoRestanteStr = `Faltam ${diffDias} dias`;
        }
      }

      return {
        ...obj,
        emailUsuario: a.usuarioId?.email || null,
        tempoRestante: tempoRestanteStr,
      };
    });

    res.status(200).json(listaComInfos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erro ao listar agendamentos salvos' });
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

