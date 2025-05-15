import { Module, Global } from "@nestjs/common";
import { MetadataEnrichmentService } from "./metadata-enrichment.service";
import { SharedMetadataModule } from "../metadata/metadata.module";

@Global()
@Module({
    imports: [SharedMetadataModule],
    providers: [MetadataEnrichmentService],
    exports: [MetadataEnrichmentService]
})
export class SharedEnrichmentModule {}
