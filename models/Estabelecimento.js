const mongoose = require("mongoose");

const EmpresaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  tipo: { type: String, required: true, index: true }, // filtro por nicho
  endereco: { type: String },
  telefone: { type: String },
  site: { type: String },
  cidade: { type: String, required: true, index: true },
  bairro: {type:String },
  estado: { type: String, required: true, index: true },
  statusAtual: {
    type: String,
    enum: [
      "não-prospectado",
      "não-atendeu",      
      "ligou-mas-não-era-o-dono",
      "ligou-sem-interesse",
      "ligou-e-pediu-retorno",
      "ligou-e-agendou-reunião",
      "ligou-mas-não-falou-com-responsável"
    ],
    default: "não-prospectado",
    index: true
  }
});

// Índice composto para facilitar buscas por tipo+cidade+estado
EmpresaSchema.index({ tipo: 1, cidade: 1, estado: 1 });
EmpresaSchema.index({ statusAtual: 1, cidade: 1, estado: 1 });

module.exports = mongoose.model("Empresa", EmpresaSchema);