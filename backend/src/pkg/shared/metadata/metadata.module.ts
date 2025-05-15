import { Module } from "@nestjs/common";
import { SharedMetadataService } from "./metadata.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
    imports: [
        CacheModule.register()
    ],
    providers: [SharedMetadataService],
    exports: [SharedMetadataService]
})
export class SharedMetadataModule {}