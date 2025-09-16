const mongoose = require("mongoose");

const ProspecSchema = new mongoose.Schema({
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  // status inicial (indicador de prospecção)
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

  // observações livres do vendedor
  nicho: {type:String},
  observacao: { type: String, default: "" },
  tempoGasto: { type: Number, default: 0 },   
  criadoEm: { type: Date, default: Date.now },  
  atualizadoEm: { type: Date, default: Date.now },
  interesse: { type: Number, min: 0, max: 5, default: 0 },
  retornoAgendado: { type: Date, default: null },
  funil: { type: String, enum: ["topo", "meio", "fundo"], default: "topo" }
});

// Atualiza automaticamente o campo atualizadoEm
ProspecSchema.pre("save", function(next) {
  this.atualizadoEm = new Date();
  next();
});

module.exports = mongoose.model("Prospec", ProspecSchema);
