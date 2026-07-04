const jwt = require('jsonwebtoken');

function isAdmin(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.password === 'admin123';
    } catch (error) {
        return false;
    }
}

function setAdminToken() {
    const token = jwt.sign({ password: 'admin123' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}

module.exports = { isAdmin, setAdminToken };