const mongoose = require('mongoose');

const nichoSchema = new mongoose.Schema({
    tipo:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Nicho', nichoSchema);