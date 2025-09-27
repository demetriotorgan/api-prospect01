const Prospec = require('../models/Prospec');
const Usuario = require('../models/User');
// Função auxiliar para calcular dias restantes
function calcularDiasRestantes(dataAgendada) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // zerar horas para comparar só datas

  const agendada = new Date(dataAgendada);
  agendada.setHours(0, 0, 0, 0);

  const diffTime = agendada - hoje;
  const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "hoje";
  if (diffDias > 0) return `${diffDias} dia(s)`;
  return "atrasado"; // caso a data já tenha passado
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

    // Buscar agenda dos próximos 7 dias
    const agenda = await Prospec.find({
      retornoAgendado: {
        $gte: hoje,
        $lte: seteDiasDepois
      }
    }).sort({ retornoAgendado: 1 });

    // Extrair todos os usuarioIds da agenda
    const usuarioIds = agenda.map(item => item.usuarioId);
    
    // Buscar os usuários correspondentes
    const usuarios = await Usuario.find({ _id: { $in: usuarioIds } });

    // Transformar em objeto para acesso rápido
    const usuariosMap = {};
    usuarios.forEach(u => {
      usuariosMap[u._id] = u;
    });

    // Mapear resultado incluindo o nome/email do usuário
    const resultado = agenda.map(item => {
      const usuario = usuariosMap[item.usuarioId] || {};
      return {
        ...item.toObject(),
        diasRestantes: calcularDiasRestantes(item.retornoAgendado),
        usuarioNome: usuario.email || "Usuário não encontrado"
      };
    });

    res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda dos próximos 7 dias" });
  }
};