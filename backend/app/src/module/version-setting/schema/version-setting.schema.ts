import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type VersionSettingDocument = HydratedDocument<VersionSetting>;

@Schema({ timestamps: true, collection: 'version-setting' })
export class VersionSetting {

    @Prop({ required: true, type: String })
    appVersion: string;
    
    @Prop({ required: true, type: Number })
    buildNumber: number;

}

export const VersionSettingSchema = SchemaFactory.createForClass(VersionSetting);
