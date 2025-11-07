import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { logPoop, getPoops, type PoopLog } from '../../services/api';
import { BRISTOL_SCALE, type BristolType } from '../../constants/bristol-scale';

const USER_ID = 1;

export default function PoopLogScreen() {
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const [bleeding, setBleeding] = useState(false);
    const [urgency, setUrgency] = useState(3);
    const [notes, setNotes] = useState('');
    const [recentPoops, setRecentPoops] = useState<PoopLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRecentPoops();
    }, []);

    const loadRecentPoops = async () => {
        try {
            const poops = await getPoops(USER_ID);
            setRecentPoops(poops.slice(0, 5));
        } catch (error) {
            console.error('Error loading poops:', error);
        }
    };

    const handleSubmit = async () => {
        if (selectedType === null) {
            Alert.alert('Error', 'Please select a Bristol type');
            return;
        }

        setLoading(true);
        try {
            const poopLog = {
                user_id: USER_ID,
                bristol_type: selectedType,
                bleeding: bleeding,
                urgency: urgency,
                notes: notes,
            };

            await logPoop(poopLog);
            Alert.alert('Success', '💩 Poop logged!');

            setSelectedType(null);
            setBleeding(false);
            setUrgency(3);
            setNotes('');

            loadRecentPoops();
        } catch (error) {
            Alert.alert('Error', 'Failed to log poop');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerEmoji}>💩</Text>
                <Text style={styles.headerTitle}>Log Your Poop</Text>
                <Text style={styles.subtitle}>Select the Bristol Stool Scale type</Text>
            </View>

            {/* BRISTOL SCALE SELECTOR */}
            <View style={styles.scaleContainer}>
                {([1, 2, 3, 4, 5, 6, 7] as BristolType[]).map((type) => {
                    const scale = BRISTOL_SCALE[type];
                    return (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.scaleItem,
                                selectedType === type && styles.scaleItemSelected,
                            ]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={styles.scaleEmoji}>{scale.emoji}</Text>
                            <View style={styles.scaleInfo}>
                                <Text style={styles.scaleName}>{scale.name}</Text>
                                <Text style={styles.scaleDescription}>{scale.description}</Text>
                                <Text style={[styles.scaleStatus, { color: scale.color }]}>
                                    {scale.status}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* BLEEDING TOGGLE */}
            <View style={styles.optionSection}>
                <Text style={styles.optionLabel}>Did you bleed?</Text>

                <View style={styles.toggleContainer}>
                    {['No', 'Yes'].map((option, idx) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.toggleButton,
                                (idx === 0 && !bleeding) || (idx === 1 && bleeding)
                                    ? styles.toggleButtonActive
                                    : null,
                            ]}
                            onPress={() => setBleeding(idx === 1)}
                        >
                            <Text style={[
                                styles.toggleText,
                                (idx === 0 && !bleeding) || (idx === 1 && bleeding)
                                    ? styles.toggleTextActive
                                    : null,
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* URGENCY SCALE */}
            <View style={styles.optionSection}>
                <Text style={styles.optionLabel}>How urgent was it? (1=not urgent, 5=very urgent)</Text>

                <View style={styles.urgencyContainer}>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.urgencyButton,
                                urgency === level && styles.urgencyButtonActive,
                            ]}
                            onPress={() => setUrgency(level)}
                        >
                            <Text style={[
                                styles.urgencyText,
                                urgency === level && styles.urgencyTextActive,
                            ]}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* NOTES */}
            <View style={styles.notesSection}>
                <Text style={styles.optionLabel}>Any notes?</Text>

                <Text style={styles.notesInput} onPress={() => { }}>
                    {notes || 'Optional notes about your poop...'}
                </Text>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Logging...' : 'Log Poop 💩'}
                </Text>
            </TouchableOpacity>

            {/* RECENT POOPS */}
            {recentPoops.length > 0 && (
                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Recent Logs</Text>

                    {recentPoops.map((poop, index) => {
                        const scale = BRISTOL_SCALE[poop.bristol_type as BristolType];
                        return (
                            <View key={index} style={styles.poopItem}>
                                <Text style={styles.poopEmoji}>{scale.emoji}</Text>

                                <View style={styles.poopInfo}>
                                    <Text style={styles.poopType}>Type {poop.bristol_type}</Text>
                                    <Text style={styles.poopTime}>
                                        {new Date(poop.logged_at!).toLocaleString()}
                                    </Text>
                                    {poop.bleeding === 1 && (
                                        <Text style={styles.bleedingWarning}>⚠️ Bleeding</Text>
                                    )}
                                </View>

                                <Text style={styles.urgencyBadge}>
                                    {poop.urgency}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
}

// ═════════════════════════════════════════════════════════════════
// COMPLETE PINK THEME STYLING
// ═════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F9',
    },

    // HEADER
    header: {
        alignItems: 'center',
        paddingVertical: 35,
        paddingHorizontal: 20,
        backgroundColor: '#FFB6D9',
        borderBottomWidth: 4,
        borderBottomColor: '#FF69B4',
        borderBottomStyle: 'dashed',
        marginBottom: 5,
    },

    headerEmoji: {
        fontSize: 70,
        marginBottom: 12,
    },

    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FF1493',
        marginBottom: 8,
        textShadowColor: 'rgba(255, 105, 180, 0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },

    subtitle: {
        fontSize: 14,
        color: '#C2185B',
        fontStyle: 'italic',
    },

    // BRISTOL SCALE BUTTONS
    scaleContainer: {
        padding: 20,
    },

    scaleItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#FFB6D9',

        shadowColor: '#FF69B4',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },

    scaleItemSelected: {
        borderWidth: 4,
        borderColor: '#FF1493',
        backgroundColor: '#FFF5F9',

        shadowColor: '#FF1493',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },

    scaleEmoji: {
        fontSize: 40,
        marginRight: 15,
    },

    scaleInfo: {
        flex: 1,
    },

    scaleName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF1493',
    },

    scaleDescription: {
        fontSize: 14,
        color: '#C2185B',
        marginTop: 2,
    },

    scaleStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },

    // OPTION SECTIONS
    optionSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 2,
        borderTopColor: '#FFB6D9',
    },

    optionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF1493',
        marginBottom: 12,
    },

    // TOGGLE BUTTONS
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },

    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#FFB6D9',
        backgroundColor: 'white',

        shadowColor: '#FF69B4',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    toggleButtonActive: {
        backgroundColor: '#FF69B4',
        borderColor: '#FF1493',

        shadowColor: '#FF1493',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },

    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFB6D9',
    },

    toggleTextActive: {
        color: 'white',
        fontWeight: '900',
    },

    // URGENCY BUTTONS
    urgencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    urgencyButton: {
        width: '18%',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#FFB6D9',
        backgroundColor: 'white',
        alignItems: 'center',

        shadowColor: '#FF69B4',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    urgencyButtonActive: {
        backgroundColor: '#FF69B4',
        borderColor: '#FF1493',

        shadowColor: '#FF1493',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },

    urgencyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFB6D9',
    },

    urgencyTextActive: {
        color: 'white',
        fontWeight: '900',
    },

    // NOTES
    notesSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 2,
        borderTopColor: '#FFB6D9',
    },

    notesInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        borderWidth: 3,
        borderColor: '#FFB6D9',
        color: '#FFB6D9',

        shadowColor: '#FF69B4',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    // BUTTON
    button: {
        backgroundColor: '#FF69B4',
        borderRadius: 18,
        padding: 18,
        marginHorizontal: 20,
        marginVertical: 20,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FF1493',

        shadowColor: '#FF1493',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },

    buttonDisabled: {
        opacity: 0.6,
        backgroundColor: '#FFB6D9',
    },

    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // RECENT POOPS
    recentSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FF1493',
        marginBottom: 15,
    },

    poopItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#FFB6D9',
        alignItems: 'center',

        shadowColor: '#FF69B4',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },

    poopEmoji: {
        fontSize: 28,
        marginRight: 12,
    },

    poopInfo: {
        flex: 1,
    },

    poopType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF1493',
    },

    poopTime: {
        fontSize: 12,
        color: '#FFB6D9',
        marginTop: 2,
    },

    bleedingWarning: {
        fontSize: 12,
        color: '#D32F2F',
        marginTop: 4,
    },

    urgencyBadge: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF69B4',
        paddingHorizontal: 8,
    },
});