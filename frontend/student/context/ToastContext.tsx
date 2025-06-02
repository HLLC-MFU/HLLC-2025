import { Toast, useToastState } from '@tamagui/toast';
import { YStack } from 'tamagui';

export const CurrentToast = () => {
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  // Determine the background color based on a "type" property
  let backgroundColor = '$background';
  let textColor = '$color';

  switch (currentToast.type) {
    case 'success':
      backgroundColor = '$green10';
      textColor = '$green1';
      break;
    case 'error':
      backgroundColor = '$red10';
      textColor = '$red1';
      break;
    case 'warning':
      backgroundColor = '$yellow10';
      textColor = '$yellow1';
      break;
    default:
      backgroundColor = '$gray10';
      textColor = '$gray1';
  }

  return (
    <Toast
      animation="100ms"
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, transform: [{ translateY: -20 }] }}
      exitStyle={{ opacity: 0, transform: [{ translateY: -20 }] }}
      transform={[{ translateY: 0 }]}
      opacity={1}
      scale={1}
      viewportName={currentToast.viewportName}
      backgroundColor={backgroundColor}
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <YStack>
        <Toast.Title color={textColor} fontWeight={600} textAlign="center">
          {currentToast.title}
        </Toast.Title>
        {!!currentToast.message && (
          <Toast.Description
            color={textColor}
            fontWeight={300}
            textAlign="center"
          >
            {currentToast.message}
          </Toast.Description>
        )}
      </YStack>
    </Toast>
  );
};
