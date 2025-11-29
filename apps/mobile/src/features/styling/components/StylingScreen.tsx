import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing } from '@/styles';
import {
    createStylingSession,
    sendStylingMessage,
    getBaseModelImage,
    SelectedItem,
} from '@/services/stylingService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    imageBase64?: string;
    selectedItems?: SelectedItem[];
    timestamp: Date;
}

export const StylingScreen: React.FC = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const scrollViewRef = useRef<ScrollView>(null);

    // Initialize session when screen is focused
    useFocusEffect(
        useCallback(() => {
            initializeSession();
            
            // Cleanup on unfocus
            return () => {
                setSessionId(null);
                setMessages([]);
                setCurrentImage(null);
            };
        }, [])
    );

    const initializeSession = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Create new session
            const session = await createStylingSession();
            setSessionId(session.session_id);
            
            // Add welcome message
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: session.message,
                timestamp: new Date(),
            }]);
            
            // Load base model image
            try {
                const baseImage = await getBaseModelImage();
                setCurrentImage(baseImage.image_base64);
            } catch (imgError) {
                console.log('Could not load base image:', imgError);
            }
            
        } catch (err) {
            console.error('Failed to initialize session:', err);
            setError('Failed to start styling session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !sessionId || isGenerating) return;
        
        const userMessage = inputText.trim();
        setInputText('');
        
        // Add user message immediately
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        
        // Scroll to bottom
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        try {
            setIsGenerating(true);
            setError(null);
            
            const response = await sendStylingMessage(sessionId, userMessage);
            
            // Add assistant response
            const assistantMsg: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.message,
                imageBase64: response.image_base64,
                selectedItems: response.selected_items,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            
            // Update displayed image
            if (response.image_base64) {
                setCurrentImage(response.image_base64);
            }
            
            // Scroll to bottom
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
        } catch (err: any) {
            console.error('Failed to send message:', err);
            setError(err.message || 'Failed to generate look. Please try again.');
            
            // Add error message
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I had trouble creating that look. Could you try describing it differently?',
                timestamp: new Date(),
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const renderMessage = (message: Message, index: number) => {
        const isUser = message.role === 'user';
        const isLast = index === messages.length - 1;
        
        return (
            <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessage : styles.assistantMessage,
                    isLast && styles.lastMessage,
                ]}
            >
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Ionicons name="sparkles" size={12} color={colors.primary} />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser && styles.userMessageText,
                    ]} numberOfLines={3}>
                        {message.content}
                    </Text>
                    
                    {/* Selected items chips */}
                    {message.selectedItems && message.selectedItems.length > 0 && (
                        <View style={styles.selectedItemsContainer}>
                            {message.selectedItems.slice(0, 3).map((item, idx) => (
                                <View key={idx} style={styles.itemChip}>
                                    <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                                    <Text style={styles.itemChipText} numberOfLines={1}>{item.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Starting your styling session...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Style Studio</Text>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={initializeSession}
                    >
                        <Ionicons name="refresh" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Full Model Image - takes most of the screen */}
                <View style={styles.imageContainer}>
                    {currentImage ? (
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${currentImage}` }}
                            style={styles.modelImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="body-outline" size={48} color={colors.textSecondary} />
                            <Text style={styles.placeholderText}>Your styled look will appear here</Text>
                        </View>
                    )}
                    
                    {/* Generating overlay */}
                    {isGenerating && (
                        <View style={styles.imageOverlay}>
                            <View style={styles.generatingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.generatingText}>Generating your look...</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Compact Chat Area at bottom */}
                <View style={styles.chatContainer}>
                    {/* Messages - compact scrollable */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesScroll}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((msg, idx) => renderMessage(msg, idx))}
                        
                        {isGenerating && (
                            <View style={[styles.messageContainer, styles.assistantMessage]}>
                                <View style={styles.avatarContainer}>
                                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                                </View>
                                <View style={[styles.messageBubble, styles.assistantBubble]}>
                                    <View style={styles.typingIndicator}>
                                        <View style={styles.typingDot} />
                                        <View style={[styles.typingDot, styles.typingDot2]} />
                                        <View style={[styles.typingDot, styles.typingDot3]} />
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Error Banner */}
                    {error && (
                        <View style={styles.errorBanner}>
                            <Ionicons name="warning" size={14} color={colors.error} />
                            <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
                            <TouchableOpacity onPress={() => setError(null)}>
                                <Ionicons name="close" size={14} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Describe your perfect outfit..."
                            placeholderTextColor={colors.textMuted}
                            maxLength={200}
                            editable={!isGenerating}
                            onSubmitEditing={handleSendMessage}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
                            ]}
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || isGenerating}
                        >
                            <Ionicons
                                name="send"
                                size={18}
                                color={inputText.trim() && !isGenerating ? '#fff' : colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
        fontWeight: '700',
    },
    refreshButton: {
        padding: spacing.xs,
    },
    
    // Image area - takes most of the screen
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        position: 'relative',
    },
    modelImage: {
        width: SCREEN_WIDTH * 0.85,
        height: '100%',
        maxHeight: SCREEN_HEIGHT * 0.55,
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    placeholderText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    generatingContainer: {
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    generatingText: {
        ...typography.body,
        color: colors.text,
        fontWeight: '500',
    },
    
    // Chat area - compact at bottom
    chatContainer: {
        maxHeight: SCREEN_HEIGHT * 0.28,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    messagesScroll: {
        maxHeight: SCREEN_HEIGHT * 0.14,
    },
    messagesContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
        alignItems: 'flex-start',
    },
    lastMessage: {
        marginBottom: 0,
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    assistantMessage: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.xs,
    },
    messageBubble: {
        maxWidth: '85%',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: colors.backgroundSecondary,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...typography.caption,
        color: colors.text,
        lineHeight: 18,
    },
    userMessageText: {
        color: '#fff',
    },
    selectedItemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    itemChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    itemChipText: {
        fontSize: 10,
        color: colors.success,
        fontWeight: '500',
        maxWidth: 80,
    },
    typingIndicator: {
        flexDirection: 'row',
        gap: 3,
        padding: 2,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.textSecondary,
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.6,
    },
    typingDot3: {
        opacity: 0.8,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        gap: spacing.xs,
    },
    errorText: {
        fontSize: 11,
        color: colors.error,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    textInput: {
        flex: 1,
        height: 40,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        ...typography.body,
        color: colors.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.backgroundSecondary,
    },
});

export default StylingScreen;

