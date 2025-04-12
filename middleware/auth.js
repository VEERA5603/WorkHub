// middleware/auth.js - Authentication middleware

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    res.redirect('/login');
  };
  
  // Middleware to check user role
  const checkRole = (roles) => {
    return (req, res, next) => {
      if (req.session.user && roles.includes(req.session.user.role)) {
        return next();
      }
      res.status(403).render('error', { message: 'Access Denied: Insufficient permissions' });
    };
  };
  
  module.exports = {
    isAuthenticated,
    checkRole
  };