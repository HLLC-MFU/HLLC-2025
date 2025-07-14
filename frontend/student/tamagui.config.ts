import { defaultConfig } from '@tamagui/config/v4'
import { createFont, createTamagui } from 'tamagui'


const notoThaiFont = createFont({
    family: 'NotoSansThai',
    size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
        6: 24,
        7: 28,
        8: 32,
    },
    lineHeight: {
        1: 16,
        2: 18,
        3: 20,
        4: 24,
        5: 28,
        6: 32,
        7: 36,
        8: 40,
    },
    weight: {
        1: '100',
        3: '300',
        4: '400',
        5: '500',
        6: '600',
        7: '700',
        9: '900',
        normal: '400',
        bold: '700',
    },
    face: {
        100: { normal: 'NotoSansThai-100' },
        300: { normal: 'NotoSansThai-300' },
        400: { normal: 'NotoSansThai-400' },
        500: { normal: 'NotoSansThai-500' },
        600: { normal: 'NotoSansThai-600' },
        700: { normal: 'NotoSansThai-700' },
        900: { normal: 'NotoSansThai-900' },
    },
})

export const config = createTamagui({
    ...defaultConfig,
    // fonts: {
    //     body: notoThaiFont,
    //     heading: notoThaiFont,
    // },
    // components: {
    //     Button: {
    //         defaultProps: {
    //             fontFamily: '$body',
    //         },
    //     },
    //     Input: {
    //         defaultProps: {
    //             fontFamily: '$body',
    //         },
    //     },
    // },
    defaultTheme: 'light',
})
