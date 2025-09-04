const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

//Rotas
const usuarioRoutes = require('./routes/userRoutes');

//MiddleWares
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

//Conecção com o banco de dados
mongoose
    .connect(process.env.DATABASE_URL)
    .then(()=>console.log('Conenctado ao MongoDB!!!'))
    .catch((err)=>console.log(err));

//Rotas
app.use('/', usuarioRoutes);

app.listen(PORT, ()=>console.log( `Rodando na porta ${PORT}`));