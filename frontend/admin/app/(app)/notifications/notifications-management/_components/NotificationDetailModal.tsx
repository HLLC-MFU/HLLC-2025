import { Lang } from "@/types/lang";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";

interface NotificationProp {
    isOpen: boolean;
    onClose: () => void;
    notification: {
        title: Lang;
        subtitle: Lang;
        image?: string;
    } | null;
}

export default function NotificationModal({ isOpen, onClose, notification }: NotificationProp) {
    if (!notification) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="opaque">
            <ModalContent>
                <>
                    <ModalHeader className="flex flex-col gap-1">Model Information</ModalHeader>
                    <ModalBody>
                        {notification.image && (
                            <img
                                src={`http://localhost:8080/uploads/${notification.image}`}
                                alt="Notification"
                                className="w-full h-48 object-cover rounded"
                            />
                        )}
                        <p>{notification.title.en}</p>
                        <p className="mt-4">{notification.subtitle.th}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Close
                        </Button>
                        <Button color="primary" onPress={onClose}>
                            Action
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
}
