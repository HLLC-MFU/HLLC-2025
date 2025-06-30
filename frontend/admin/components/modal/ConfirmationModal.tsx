import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
} from '@heroui/react';

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (() => void | Promise<void>) | undefined;
	title: string;
	body: string;
	confirmText?: string;
	confirmColor?: 'primary' | 'danger' | 'success' | 'warning' | 'secondary';
	cancelText?: string;
	cancelColor?: 'primary' | 'danger' | 'success' | 'warning' | 'secondary';
}

export function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	body,
	confirmText = 'Confirm',
	confirmColor = 'primary',
	cancelText = 'Cancel',
	cancelColor = 'danger',
}: ConfirmationModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
				<ModalBody>
					<p>{body}</p>
				</ModalBody>
				<ModalFooter>
					<Button color={cancelColor} variant="light" onPress={onClose}>
						{cancelText}
					</Button>
					<Button color={confirmColor} onPress={onConfirm}>
						{confirmText}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
