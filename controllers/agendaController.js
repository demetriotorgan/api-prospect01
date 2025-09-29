const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const { differenceInDays, formatDistance, isBefore } = require("date-fns");
const { ptBR } = require("date-fns/locale");


// Função auxiliar para calcular dias restantes
function calcularDiasRestantes(reuniao) {
  const agora = new Date();

  // Se tiver dataTime, ele é prioridade
  const dataReferencia = reuniao.dataTime
    ? new Date(reuniao.dataTime)
    : new Date(reuniao.retornoAgendado);

  // Caso já tenha passado
  if (isBefore(dataReferencia, agora)) {
    return "Atrasada";
  }

  // Diferença em dias inteiros
  const dias = differenceInDays(dataReferencia, agora);

  if (dias === 0) {
    // Reunião é hoje → mostrar tempo restante em horas/minutos
    return "hoje (" + formatDistance(dataReferencia, agora, { locale: ptBR }) + ")";
  }

  return `${dias} dia(s)`;
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
    hoje.setHours(0, 0, 0, 0);
    const seteDiasDepois = new Date(hoje);
    seteDiasDepois.setDate(hoje.getDate() + 7);
    seteDiasDepois.setHours(23, 59, 59, 999);

    // Buscar apenas agendamentos de reunião dentro do período
    const agenda = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: {
        $gte: hoje,
        $lte: seteDiasDepois
      }
    }).sort({ criadoEm: -1 }); // ordenar por mais recente

    // Extrair todos os usuarioIds da agenda
    const usuarioIds = agenda.map(item => item.usuarioId);

    // Buscar os usuários correspondentes
    const usuarios = await Usuario.find({ _id: { $in: usuarioIds } });

    // Transformar em objeto para acesso rápido
    const usuariosMap = {};
    usuarios.forEach(u => {
      usuariosMap[u._id.toString()] = u;
    });

    // Mapear resultado incluindo o nome/email do usuário
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
    res.status(500).json({ error: "Erro ao buscar agenda dos próximos 7 dias" });
  }
};
