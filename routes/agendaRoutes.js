const express = require('express');
const { getAgenda, getAgendaProximos7Dias, salvarAgendamento, excluirListaAgendamento } = require('../controllers/agendaController');

const router = express.Router();

router.get('/agenda', getAgenda);
router.get('/agenda/proximos-7-dias', getAgendaProximos7Dias);
router.post('/salvar-agendamento', salvarAgendamento);
router.delete('/deletar-agendamentos', excluirListaAgendamento);
module.exports = router;