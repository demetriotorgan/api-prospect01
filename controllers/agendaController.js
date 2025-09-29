const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const { differenceInDays, formatDistance, isBefore } = require("date-fns");
const { ptBR } = require("date-fns/locale");


// Função auxiliar para calcular dias restantes
function calcularDiasRestantes(reuniao) {
const agora = new Date();

  // Prioriza dataTime se existir
  const dataReferencia = reuniao.dataTime
    ? new Date(reuniao.dataTime)
    : new Date(reuniao.retornoAgendado);

  if (isBefore(dataReferencia, agora)) {
    return "Atrasada";
  }

  const dias = differenceInDays(dataReferencia, agora);

  if (dias === 0) {
    return "hoje (" + formatDistance(dataReferencia, agora, { locale: ptBR }) + ")";
  }

  return `${dias} dia(s)`
}

module.exports.getAgenda = async(req,res)=>{
try {
    const agenda = await Prospec.find({ retornoAgendado: { $ne: null } })
      .sort({ retornoAgendado: 1 });

    const resultado = agenda.map(item => ({
      ...item.toObject(),
      diasRestantes: calcularDiasRestantes(item.retornoAgendado)
    }));

    res.status(200).json(resultado);
} catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
}
};

module.exports.getAgendaProximos7Dias = async (req, res) => {
try {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    // Buscar todos os agendamentos até hoje
    const agenda = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: { $lte: hoje } // todos até hoje
    }).sort({ criadoEm: -1 }); // mais recentes primeiro

    // Buscar usuários correspondentes
    const usuarioIds = Array.from(new Set(agenda.map(item => item.usuarioId.toString())));
    const usuarios = await Usuario.find({ _id: { $in: usuarioIds } });
    const usuariosMap = {};
    usuarios.forEach(u => {
      usuariosMap[u._id.toString()] = u;
    });

    // Mapear resultado incluindo dias restantes e nome do usuário
    const resultado = agenda.map(item => {
      const usuario = usuariosMap[item.usuarioId.toString()] || {};
      return {
        ...item.toObject(),
        diasRestantes: calcularDiasRestantes(item),
        usuarioNome: usuario.email || "Usuário não encontrado"
      };
    });

    res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
  }
};
