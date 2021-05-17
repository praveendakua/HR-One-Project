const User = require('../models/newEmployee');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.isAdmin = async (req, res, next) => {
    const id = req.session.user_id;
    const userrole = await User.findById(id);
    console.log(userrole)
    const {role} = userrole;
    if(!(role === "Admin")) {
        req.flash('error', "You do not have permission to do that!")
        return res.redirect('/user')
    }
    next();
}