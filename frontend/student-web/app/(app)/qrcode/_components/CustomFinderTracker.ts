import { IDetectedBarcode } from "@yudiel/react-qr-scanner";

export const CustomFinderTracker = (detectedCodes: IDetectedBarcode[], ctx: CanvasRenderingContext2D) => {
    detectedCodes.forEach((code) => {
        const { boundingBox } = code;
        if (!boundingBox) return;

        const { x, y, width, height } = boundingBox;

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'lime';
        ctx.beginPath();

        const cornerLength = 20;

        // Top Left corner
        ctx.moveTo(x, y + cornerLength);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLength, y);

        // Top Right corner
        ctx.moveTo(x + width - cornerLength, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerLength);

        // Bottom Right corner
        ctx.moveTo(x + width, y + height - cornerLength);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width - cornerLength, y + height);

        // Bottom Left corner
        ctx.moveTo(x + cornerLength, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + height - cornerLength);

        ctx.stroke();
    });
}; 