import { SafeAreaView } from "react-native";
import { YStack,Text, Image, Card } from "tamagui";

interface QRCodePageProps {
    name: string;
    studentId: string;
    qrCodeUri: string;
}

export default function QRCodePage(props: QRCodePageProps) {
    return (
        <SafeAreaView>
            <Card style={{padding: 10, alignItems: 'center', gap: 12}}>
                <YStack style={{alignItems: 'center', gap: 4}}>
                    <Text style={{fontSize: 22, fontWeight: "bold"}}>Nattawat Nattachanasit</Text>
                    <Text>Scan the QR code to check in</Text>
                </YStack>
                <Image 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HelloWorld" 
                alt="QR Code"
                style={{width: 150, height: 150}}
                />
            </Card>
        </SafeAreaView>

    );
}