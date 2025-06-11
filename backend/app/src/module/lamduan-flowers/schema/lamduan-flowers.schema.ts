import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({})
export class LamduanFlowers {

    @Prop({ required: true , type: Types.ObjectId , ref: 'User'})
    user : Types.ObjectId;

}