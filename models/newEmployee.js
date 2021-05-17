const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passport = require('passport-local-mongoose');

const EmployeeSchema = new Schema({
    employeeCode: {
        type: Number
    },
    dateOfJoining: {
        type: Date,
        default: Date.now
    },
    dateOfBirth: {
        type: Date,
        default: Date.now 
    },
    gender: {
        type: String,
        enum: ['Male', 'Female']
    },
    managerCode: {
        type: Number,
    },
    emailAddress: {
        type: String,
    }, 
    mobileNo: {
        type: Number,
    }, 
    profile: {
        type: String,
    },
    role: {
        type: String,
    },
    
});

EmployeeSchema.plugin(passport)
module.exports = mongoose.model('User', EmployeeSchema);