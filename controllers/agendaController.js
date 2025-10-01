const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');


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
    const pad = (n) => String(n).padStart(2, "0");

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-${pad(hoje.getDate())}`;

    const seteDiasDepois = new Date();
    seteDiasDepois.setDate(seteDiasDepois.getDate() + 7);
    const seteDiasDepoisStr = `${seteDiasDepois.getFullYear()}-${pad(seteDiasDepois.getMonth()+1)}-${pad(seteDiasDepois.getDate())}`;

    const agenda = await Prospec.find({
      indicador: "ligou-agendou-reuniao",
      retornoAgendado: {
        $gte: hojeStr,
        $lte: seteDiasDepoisStr
      }
    });

    const usuarioIds = Array.from(new Set(agenda.map((item) => item.usuarioId).filter(Boolean)));
    const usuarios = await Usuario.find({ _id: { $in: usuarioIds } });
    const usuariosMap = {};
    usuarios.forEach((u) => (usuariosMap[u._id.toString()] = u));

    const resultado = agenda.map((item) => {
      const usuario = item.usuarioId ? usuariosMap[item.usuarioId.toString()] : null;

      let diasRestantes = "";
      const retorno = new Date(item.retornoAgendado);
      const diffDias = Math.round((retorno - new Date(hojeStr)) / (1000*60*60*24));

      if (diffDias === 0) diasRestantes = "Hoje";
      else if (diffDias > 0) diasRestantes = `${diffDias} dia${diffDias > 1 ? "s" : ""}`;

      return {
        ...item.toObject(),
        diasRestantes,
        usuarioNome: usuario ? usuario.email || usuario.nome || "Usuário não encontrado" : "Usuário não encontrado"
      };
    });

    res.status(200).json(resultado);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
  }
};
