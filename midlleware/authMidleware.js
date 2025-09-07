const jwt = require('jsonwebtoken')

module.exports = (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(400).json({msg:'Token não fornecido'});

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({msg:'Token inválido'});
    }
};