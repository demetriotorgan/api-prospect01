const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    empresaId: {type: mongoose.Schema.Types.ObjectId, ref:"Empresa", required:true},
    nomeEmpresa: {type:String, default:""},
    usuarioId: {type:mongoose.Schema.Types.ObjectId, ref:"Usuario", required: true},
    usuarioNome:{type:String, default:''},
    criadoEm:{type:Date, default: Date.now},
    dataTime:{type:Date, default:''},
    diasRestantes:{type:String, default:''},
    funil:{type:String, default:''},
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
    interesse:{ type: Number, min: 0, max: 5, default: 0 },
    nicho: {type:String, default:''},
    observacao:{type:String, default:''},
    retornoAgendado:{ type: Date, default: null },
    site:{type:String, default:""},
    telefone:{type:String, default:""},
    tempoGasto: { type: Number, default: 0 },   
});

module.exports = mongoose.model('Agendamentos', AgendamentoSchema);