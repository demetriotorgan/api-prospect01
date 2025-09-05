const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

//Rotas
const usuarioRoutes = require('./routes/userRoutes');

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
mongoose
    .connect(process.env.MONGODB_URI)
    .then(()=>console.log('Conenctado ao MongoDB!!!'))
    .catch((err)=>console.log(err));

//Rotas
app.use('/', usuarioRoutes);

app.listen(PORT, ()=>console.log( `Rodando na porta ${PORT}`));