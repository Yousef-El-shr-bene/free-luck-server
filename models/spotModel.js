const mongoose = require('mongoose');
// spots : name : string , value : string , description : string

const spotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        lowercase: true
    },
    value: {
        type: String,
        required: [true, 'Value is required'],
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        lowercase: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be greater than or equal to 0']
    },
    isMain: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

module.exports = mongoose.model('Spot', spotSchema);