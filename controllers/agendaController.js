const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
const { ptBR } = require("date-fns/locale");
const { differenceInCalendarDays, formatDistance, isBefore, startOfDay } = require("date-fns");


function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function calcularDiasRestantes(reuniao) {
  const agora = new Date();
  const retornoRaw = reuniao.retornoAgendado ? new Date(reuniao.retornoAgendado) : null;
  const dataTimeRaw = reuniao.dataTime ? new Date(reuniao.dataTime) : null;

  const referenciaDia = retornoRaw || dataTimeRaw;
  if (!referenciaDia || isNaN(referenciaDia.getTime())) return "Data inválida";

  const inicioRetorno = startOfDayUTC(referenciaDia);
  const inicioAgora = startOfDayUTC(agora);

  const diffDays = Math.round((inicioRetorno - inicioAgora) / (1000*60*60*24));

  if (diffDays < 0) {
    const ago = formatDistance(referenciaDia, agora, { locale: ptBR });
    return `Atrasada (há ${ago})`;
  }
  if (diffDays === 0) {
    const restante = formatDistance(referenciaDia, agora, { locale: ptBR });
    return `hoje (${restante})`;
  }

  return diffDays === 1 ? "amanhã" : `${diffDays} dias`;
};


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
    // Definir datas limite (UTC não é mais necessário, usamos calendário local)
    const hojeUTC = new Date();
hojeUTC.setUTCHours(0,0,0,0);


    const seteDiasDepoisUTC = new Date();
seteDiasDepoisUTC.setUTCDate(seteDiasDepoisUTC.getUTCDate()+7);
seteDiasDepoisUTC.setUTCHours(23,59,59,999);

    // Buscar agendamentos nos próximos 7 dias
    const agenda = await Prospec.find({
  indicador: "ligou-agendou-reuniao",
  retornoAgendado: { $gte: hojeUTC, $lte: seteDiasDepoisUTC }
});

    // Buscar usuários correspondentes
    const usuarioIds = Array.from(new Set(agenda.map(item => item.usuarioId).filter(Boolean)));
    const usuarios = await Usuario.find({ _id: { $in: usuarioIds } });
    const usuariosMap = {};
    usuarios.forEach(u => {
      usuariosMap[u._id.toString()] = u;
    });

    // Mapear resultado incluindo diasRestantes e nome do usuário
    const resultado = agenda.map(item => {
      const usuario = item.usuarioId ? usuariosMap[item.usuarioId.toString()] : null;
      return {
        ...item.toObject(),
        diasRestantes: calcularDiasRestantes(item),
        usuarioNome: usuario ? (usuario.email || usuario.nome || "Usuário não encontrado") : "Usuário não encontrado"
      };
    });

    res.status(200).json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
  }
};