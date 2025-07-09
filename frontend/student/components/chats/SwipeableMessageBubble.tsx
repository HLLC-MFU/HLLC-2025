import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import MessageBubble from './MessageBubble';
import { Message } from '@/types/chatTypes';
import { Reply } from 'lucide-react-native';
import { triggerHapticFeedback } from '@/utils/chats/messageHandlers';

type MessageBubbleProps = React.ComponentProps<typeof MessageBubble>;

interface SwipeableMessageBubbleProps extends Omit<MessageBubbleProps, 'senderId' | 'senderName'> {
  allMessages?: Message[];
  onReplyPreviewClick?: (replyToId: string) => void;
  currentUsername: string;
  onReply: (message: Message) => void;
  onUnsend?: (message: Message) => void;
}

const SWIPE_THRESHOLD = 80;
const ICON_SIZE = 28;
const MAX_SWIPE_DISTANCE = 100;

const SwipeableMessageBubble: React.FC<SwipeableMessageBubbleProps> = ({
  message,
  isMyMessage,
  isRead,
  showAvatar = true,
  isLastInGroup = true,
  isFirstInGroup = true,
  onReply,
  allMessages = [],
  onReplyPreviewClick,
  currentUsername,
  onUnsend, // <-- add this
}) => {
  const translateX = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(0.5);
  const iconColor = useSharedValue('#b0b0b0');
  const [iconColorState, setIconColorState] = useState('#b0b0b0');

  // ทิศทาง swipe: ขวาไปซ้าย (isMyMessage) หรือ ซ้ายไปขวา (!isMyMessage)
  const swipeDirection = isMyMessage ? -1 : 1;

  const handleReply = useCallback(() => {
    if (message.isTemp) {
      alert('กรุณารอให้ข้อความนี้ถูกส่งสำเร็จก่อนจึงจะ reply ได้');
      return;
    }
    if (!message.id || message.id.startsWith('msg-')) {
      alert('ไม่สามารถ reply ข้อความนี้ได้');
      return;
    }
    triggerHapticFeedback();
    onReply && onReply(message);
  }, [message, onReply]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      iconOpacity.value = 0.7;
      iconScale.value = 1;
      iconColor.value = '#0A84FF';
      runOnJS(setIconColorState)('#0A84FF');
    },
    onActive: (event) => {
      const translationX = event.translationX * swipeDirection;
      if (translationX > 0) {
        // จำกัดระยะ swipe
        let clampedX = event.translationX;
        if (isMyMessage) {
          clampedX = Math.max(-MAX_SWIPE_DISTANCE, Math.min(0, event.translationX));
        } else {
          clampedX = Math.min(MAX_SWIPE_DISTANCE, Math.max(0, event.translationX));
        }
        translateX.value = clampedX;
        // scale/opacity/สี icon ตามระยะ swipe
        iconScale.value = 1 + Math.min(translationX, SWIPE_THRESHOLD) / 200;
        iconOpacity.value = 0.5 + Math.min(translationX, SWIPE_THRESHOLD) / (SWIPE_THRESHOLD * 2);
        const newColor = translationX > SWIPE_THRESHOLD ? '#0A84FF' : '#b0b0b0';
        iconColor.value = newColor;
        runOnJS(setIconColorState)(newColor);
      }
    },
    onEnd: (event) => {
      const translationX = event.translationX * swipeDirection;
      if (translationX > SWIPE_THRESHOLD) {
        runOnJS(handleReply)();
      }
      // เด้งกลับ
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      iconScale.value = withSpring(1, { damping: 15 });
      iconOpacity.value = withSpring(0.5, { damping: 15 });
      iconColor.value = '#b0b0b0';
      runOnJS(setIconColorState)('#b0b0b0');
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: '50%',
    marginTop: -ICON_SIZE / 2,
    // ตำแหน่ง icon: ด้านขวา (isMyMessage) หรือซ้าย (!isMyMessage) และขยับไปทางเดียวกับนิ้ว
    left: !isMyMessage ? -ICON_SIZE * 1.5 + translateX.value : undefined,
    right: isMyMessage ? -ICON_SIZE * 1.5 + translateX.value : undefined,
    zIndex: 10,
    opacity: iconOpacity.value,
    transform: [
      { scale: iconScale.value },
      { translateY: 0 },
    ],
  }));

  return (
    <View style={{ position: 'relative' }}>
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View style={[styles.container, animatedStyle]}>
          <MessageBubble
            message={message}
            isMyMessage={isMyMessage}
            isRead={isRead}
            showAvatar={showAvatar}
            isLastInGroup={isLastInGroup}
            isFirstInGroup={isFirstInGroup}
            onReply={onReply}
            allMessages={allMessages}
            onReplyPreviewClick={onReplyPreviewClick}
            currentUsername={currentUsername}
            onUnsend={onUnsend} // <-- pass down
          />
        </Animated.View>
      </PanGestureHandler>
      <Animated.View style={[iconAnimatedStyle]} pointerEvents="none">
        <Reply size={ICON_SIZE} color={iconColorState} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default SwipeableMessageBubble; 