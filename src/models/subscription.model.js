import mongoose, { model } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber : {
        type: Schema.Types.ObjectId,  // one is who subscribing
        ref: "User"
    },
    channel : {
        type: Schema.Types.ObjectId,  // one is who "subscriber" is subscribing
        ref: "User"
    }

}, {timestamps: true}); 

export const Subscription = mongoose.model("Subscription", subscriptionSchema)