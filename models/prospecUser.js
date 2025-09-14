const mongoose = require('mongoose');

const ProspecUserSchema = new mongoose.Schema({
    userID:{type: mongoose.Schema.Types.ObjectId, ref:"Usuario", required:true, unique:true},
    tempoProspec:{type:Number, default:0},
    totalProspec:{type:Number, default:0},
});

ProspecUserSchema.statics.atualizarProspec = async function(userID, tempoGasto){
    const prospecUser = await this.findOne({userID});
    if(prospecUser){
        prospecUser.tempoProspec += tempoGasto;
        prospecUser.totalProspec += 1;
        await prospecUser.save();
    }else{
        const novoProspecUser = new this({
            userID,
            tempoProspec: tempoGasto,
            totalProspec:1,
        });
        await novoProspecUser.save();
    }
};

const UserProspec = mongoose.model("UserProspec", ProspecUserSchema);
module.exports = UserProspec;