export type Sticker = {
    id?: string; // จาก backend (json:"id")
    _id?: string; // fallback กรณี frontend ใช้ _id
    name: {
        en: string;
        th: string;
    };
    image: string;
    metadata?: StickerMetadata;
};

export type StickerMetadata = {
    category?: string;
    tags?: string[];
    usage?: {
        totalUses: number;
        lastUsed?: string;
    };
    [key: string]: any;
};

export type StickerResponse = {
    success: boolean;
    message: string;
    data: Sticker[];
};

export type StickerDetailResponse = {
    success: boolean;
    message: string;
    data: Sticker;
}; 