const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const { differenceInDays, formatDistance, isBefore } = require("date-fns");
const { ptBR } = require("date-fns/locale");
const { startOfDay, differenceInCalendarDays } = require("date-fns");

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Função auxiliar para calcular dias restantes
function calcularDiasRestantes(reuniao) {
  const agora = new Date();

  // preferir retornoAgendado (dia) para o cálculo de dias
  const retornoRaw = reuniao.retornoAgendado ? new Date(reuniao.retornoAgendado) : null;
  const dataTimeRaw  = reuniao.dataTime ? new Date(reuniao.dataTime) : null;

  // se não houver data alguma
  const referenciaDia = retornoRaw || dataTimeRaw;
  if (!referenciaDia || isNaN(referenciaDia.getTime())) return "Data inválida";

  // calcular diferença de dias usando midnight UTC
  const inicioRetorno = startOfDayUTC(referenciaDia);
  const inicioAgora   = startOfDayUTC(agora);

  const milDias = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((inicioRetorno.getTime() - inicioAgora.getTime()) / milDias);

  // se já passou o dia inteiro (diff < 0)
  if (diffDays < 0) {
    // usar dataTime para calcular quanto tempo já passou, se disponível
    const referenciaTempo = dataTimeRaw || retornoRaw;
    if (!referenciaTempo || isNaN(referenciaTempo.getTime())) return "Atrasada";
    const ago = formatDistance(referenciaTempo, agora, { locale: ptBR });
    return `Atrasada (há ${ago})`;
  }

  // se é hoje (mesmo dia)
  if (diffDays === 0) {
    // se houver hora exata (dataTime), comparar agora com essa hora
    const referenciaTempo = dataTimeRaw || retornoRaw;
    if (!referenciaTempo || isNaN(referenciaTempo.getTime())) return "hoje";

    if (isBefore(referenciaTempo, agora)) {
      const ago = formatDistance(referenciaTempo, agora, { locale: ptBR });
      return `Atrasada (há ${ago})`;
    } else {
      const restante = formatDistance(referenciaTempo, agora, { locale: ptBR });
      return `hoje (${restante})`;
    }
  }

  // futuro (diffDays > 0)
  return `${diffDays} dia(s)`;
}

module.exports.getAgenda = async (req, res) => {
  try {
    const hoje = new Date();
    const hojeUTCStart = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));

    const docs = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: { $ne: null }
    }).lean();

    const items = docs.map(item => {
      const retornoDate = item.retornoAgendado ? new Date(item.retornoAgendado) : null;
      const retornoValido = retornoDate && !isNaN(retornoDate.getTime());

      let retornoUTCStart = null;
      if (retornoValido) {
        retornoUTCStart = new Date(Date.UTC(
          retornoDate.getUTCFullYear(),
          retornoDate.getUTCMonth(),
          retornoDate.getUTCDate()
        ));
      }

      const isDelayed = retornoValido ? retornoUTCStart < hojeUTCStart : true;

      return { ...item, retornoDate: retornoUTCStart, retornoValido, isDelayed };
    });

    const naoAtrasados = items.filter(i => !i.isDelayed);
    const atrasados = items.filter(i => i.isDelayed);

    // Ordenação
    naoAtrasados.sort((a, b) => a.retornoDate - b.retornoDate || new Date(b.criadoEm) - new Date(a.criadoEm));
    atrasados.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const ordered = [...naoAtrasados, ...atrasados];

    const usuarioIds = Array.from(new Set(ordered.map(i => i.usuarioId).filter(Boolean).map(id => id.toString())));
    const usuarios = usuarioIds.length ? await Usuario.find({ _id: { $in: usuarioIds } }).lean() : [];
    const usuariosMap = {};
    usuarios.forEach(u => { usuariosMap[u._id.toString()] = u; });

    const resultado = ordered.map(item => {
      const usuario = item.usuarioId ? usuariosMap[item.usuarioId.toString()] : null;

      let diasRestantes = "";
      if (item.isDelayed) {
        diasRestantes = "atrasado";
      } else if (item.retornoValido) {
        const diffDias = Math.floor((item.retornoDate - hojeUTCStart) / (1000 * 60 * 60 * 24));
        if (diffDias === 0) diasRestantes = "hoje";
        else if (diffDias === 1) diasRestantes = "amanhã";
        else diasRestantes = `${diffDias} dias`;
      }

      return {
        ...item,
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
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const seteDiasDepois = new Date();
    seteDiasDepois.setDate(seteDiasDepois.getDate() + 7);
    seteDiasDepois.setHours(23, 59, 59, 999); // final do dia daqui a 7 dias

    // Buscar todos os agendamentos de hoje até 7 dias
    const agenda = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: { $gte: hoje, $lte: seteDiasDepois }
    }).sort({ retornoAgendado: 1 }); // ordena pela data do agendamento

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
