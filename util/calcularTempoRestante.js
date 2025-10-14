// utils/calcularTempoRestante.js
function toSaoPauloDate(utcDate) {
  const date = new Date(utcDate);
  const offsetSP = -3 * 60; // UTC-3
  const localOffset = date.getTimezoneOffset();
  const diffMinutes = offsetSP - localOffset;
  date.setMinutes(date.getMinutes() + diffMinutes);
  return date;
}

function calcularTempoRestante(retornoAgendado) {
  if (!retornoAgendado) return "Agendamento Expirado";

  const agora = toSaoPauloDate(new Date());
  const retornoSP = toSaoPauloDate(retornoAgendado);

  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const diaReuniao = new Date(retornoSP.getFullYear(), retornoSP.getMonth(), retornoSP.getDate());

  const diffDias = Math.floor((diaReuniao - hoje) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "Agendamento Expirado";
  if (diffDias === 0) return "Hoje";
  return `Faltam ${diffDias} dias`;
}

module.exports = { calcularTempoRestante, toSaoPauloDate };
