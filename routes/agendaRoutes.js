const express = require('express');
const { getAgenda, getAgendaProximos7Dias } = require('../controllers/agendaController');

const router = express.Router();

router.get('/agenda', getAgenda);
router.get('/agenda/proximos-7-dias', getAgendaProximos7Dias);

module.exports = router;