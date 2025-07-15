import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const enhancedChatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  safeArea: {
    flex: 1,
  },
  
  // Enhanced Header Styles
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10, 132, 255, 0.2)',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  backButton: {
    marginRight: 12,
  },
  
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  headerInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  onlineIndicator: {
    marginRight: 6,
  },
  
  memberCount: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  infoButton: {
    marginLeft: 8,
  },
  
  infoButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  
  // Enhanced Connection Status
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
    zIndex: 9,
  },
  
  connectionStatusGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  connectionStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Enhanced Join Banner
  joinBannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // Enhanced Reply Banner
  replyBannerContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  replyBannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  
  replyBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  replyIndicator: {
    width: 3,
    height: 24,
    backgroundColor: '#0A84FF',
    borderRadius: 2,
    marginRight: 12,
  },
  
  replyTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  
  replyBannerLabel: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  replyBannerText: {
    color: '#ccc',
    fontSize: 14,
  },
  
  replyCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  // Enhanced Messages Container
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // Enhanced Input Area
  inputContainer: {
    position: 'relative',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 132, 255, 0.2)',
  },
  
  inputGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default enhancedChatStyles;