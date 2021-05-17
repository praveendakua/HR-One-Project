const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceCorrection = new Schema({
    date: {
        type: String,
    },
    checkin: {
        type: String,
    },
    checkout: {
        type: String,
    },
    remark: {
        type: String,
    },
    status: {
        type: String
    },
    userId: {
        type: Schema.Types.ObjectId,
    },
    managerCode: {
        type: Number,
    }
})

module.exports = mongoose.model('Correction', attendanceCorrection);