# FRONTEND: constants / bristol - scale.ts - Bristol Stool Scale Data

// ═════════════════════════════════════════════════════════════════
// BRISTOL STOOL SCALE CONSTANT
// ═════════════════════════════════════════════════════════════════

// What is this?
// Bristol Stool Scale is a medical classification of 7 poop types
// Each type tells us about digestive health
// We store emoji, name, description, and color for each type

export const BRISTOL_SCALE = {
    1: {
        emoji: '🪨',
        name: 'Type 1',
        description: 'Separate hard lumps',
        status: 'Constipated',
        color: '#8B4513',
    },
    2: {
        emoji: '🥜',
        name: 'Type 2',
        description: 'Lumpy sausage',
        status: 'Slightly constipated',
        color: '#A0522D',
    },
    3: {
        emoji: '🌭',
        name: 'Type 3',
        description: 'Sausage with cracks',
        status: 'Normal',
        color: '#CD853F',
    },
    4: {
        emoji: '✨',
        name: 'Type 4',
        description: 'Smooth sausage',
        status: 'Ideal!',
        color: '#DAA520',
    },
    5: {
        emoji: '🍦',
        name: 'Type 5',
        description: 'Soft blobs',
        status: 'Lacking fiber',
        color: '#F4A460',
    },
    6: {
        emoji: '💨',
        name: 'Type 6',
        description: 'Mushy consistency',
        status: 'Mild diarrhea',
        color: '#DEB887',
    },
    7: {
        emoji: '💧',
        name: 'Type 7',
        description: 'Liquid',
        status: 'Diarrhea',
        color: '#D2691E',
    },
} as const;

// Type hint: Tell TypeScript that keys are 1-7
export type BristolType = keyof typeof BRISTOL_SCALE;

// ═════════════════════════════════════════════════════════════════
// HOW TO USE THIS
// ═════════════════════════════════════════════════════════════════

// In your component:
// import { BRISTOL_SCALE, type BristolType } from '@/constants/bristol-scale';
//
// const scale = BRISTOL_SCALE[4];  // Get type 4
// console.log(scale.emoji);        // ✨
// console.log(scale.description);  // Smooth sausage
// console.log(scale.status);       // Ideal!