const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

//Rotas
const usuarioRoutes = require('./routes/userRoutes');
const nichoRoutes = require('./routes/nichoRoutes');
const empresasRoutes = require('./routes/estabelecimentoRoutes');
const prospecRoutes = require('./routes/prospecRoutes');
const agendamentosRoutes = require('./routes/agendaRoutes')

//MiddleWares
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors({
    origin:'*',
}));
app.use((req,res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    next();    
  });

//Conecção com o banco de dados
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB conectado!!");
  } catch (error) {
    console.error("Erro ao conectar MongoDB:", error);
    throw error;
  }
}

//Rotas
app.use('/', 
    usuarioRoutes, 
    nichoRoutes, 
    empresasRoutes, 
    prospecRoutes,
    agendamentosRoutes
);

// Inicia servidor só depois de conectar ao banco
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
});