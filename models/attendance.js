const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    date: {
        type: String,
    },
    checkin: {
        type: String,
    },
    checkout: {
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

module.exports = mongoose.model('Attendance', attendanceSchema);