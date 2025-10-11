const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    empresaId: {type: mongoose.Schema.Types.ObjectId, ref:"Estabelecimento", required:true},
    nomeEmpresa: {type:String, default:""},
    usuarioId: {type:mongoose.Schema.Types.ObjectId, ref:"User", required: true},
    indicador: { 
    type: String, 
    enum: [
      "nao-prospectado", 
      "ligou-nao-era-dono", 
      "ligou-sem-interesse", 
      "ligou-pediu-retorno", 
      "ligou-agendou-reuniao", 
      "ligou-nao-respondeu"
    ], 
    default: "nao-prospectado"
  },
    nicho:{type:String, default:''},
    observacao:{type:String, default:''},
    tempoGasto: { type: Number, default: 0 },   
    interesse:{ type: Number, min: 0, max: 5, default: 0 },
    retornoAgendado:{ type: Date, default: null },
    dataTime:{type:Date, default:null},   
    telefone:{type:String, default:""},
    site:{type:String, default:""},    
    funil:{type:String, default:''},   
    resultado:{type:String, default:""},
    texto:{type:String, default:""},    
});

module.exports = mongoose.model('Agendamentos', AgendamentoSchema);