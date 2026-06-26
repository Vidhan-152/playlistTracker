// src/themes.js
// Single source of truth for all color tokens.
// Import this wherever you need `themes` or `colors`.

export const themes = {
    light: {
        bg:             '#f0fafb',
        card:           '#ffffff',
        sidebar:        '#ffffff',
        text:           '#293241',
        secondary:      '#3d5a80',
        inputBg:        '#f4fbfc',
        border:         'rgba(152,193,217,0.28)',
        borderStrong:   'rgba(61,90,128,0.2)',
        button:         '#3d5a80',
        buttonHover:    '#2c4a6e',

        // video cards
        videoCard:      '#ffffff',
        videoBorder:    'rgba(152,193,217,0.22)',
        videoShadow:    '0 1px 3px rgba(61,90,128,0.07), 0 4px 14px rgba(61,90,128,0.04)',
        videoHoverShadow: '0 4px 12px rgba(61,90,128,0.14), 0 8px 28px rgba(61,90,128,0.07)',

        // progress / stat cards
        progressCard:   '#ffffff',
        progressTrack:  '#d8eef4',

        // text roles
        metaText:       '#3d5a80',
        mutedText:      '#98c1d9',

        // misc
        chip:           '#e8f4f8',
        chipText:       '#3d5a80',
        cardShadow:     '0 1px 3px rgba(61,90,128,0.07), 0 4px 14px rgba(61,90,128,0.04)',
        cardHoverShadow:'0 4px 12px rgba(61,90,128,0.14), 0 8px 28px rgba(61,90,128,0.07)',
    },
    dark: {
        bg:             '#0d1117',
        card:           '#161b22',
        sidebar:        '#161b22',
        text:           '#e6edf3',
        secondary:      '#8b949e',
        inputBg:        '#1c2128',
        border:         'rgba(255,255,255,0.07)',
        borderStrong:   'rgba(255,255,255,0.12)',
        button:         '#3d5a80',
        buttonHover:    '#4d7aad',

        videoCard:      '#1c2128',
        videoBorder:    'rgba(255,255,255,0.06)',
        videoShadow:    '0 1px 3px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.28)',
        videoHoverShadow: '0 4px 12px rgba(0,0,0,0.5), 0 8px 28px rgba(0,0,0,0.4)',

        progressCard:   '#1c2128',
        progressTrack:  '#1c2d3a',

        metaText:       '#8b949e',
        mutedText:      '#3d4a57',

        chip:           '#1c2d3a',
        chipText:       '#98c1d9',
        cardShadow:     '0 1px 3px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.28)',
        cardHoverShadow:'0 4px 12px rgba(0,0,0,0.5), 0 8px 28px rgba(0,0,0,0.4)',
    },
}