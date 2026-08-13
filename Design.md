# 🎨 Ads Manager - Manage ads - Campaigns

> This document outlines the core design tokens and visual language for the project. Use these guidelines to ensure consistency across the application.

## 1. Colors

The color system is defined by scales from 50 (lightest) to 950 (darkest), alongside semantic colors for specific intents.

### Primary

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f7f7f8` | `--color-primary-50` |
| 100 | `#efeff1` | `--color-primary-100` |
| 200 | `#d9dbde` | `--color-primary-200` |
| 300 | `#bdc1c7` | `--color-primary-300` |
| 400 | `#969ca6` | `--color-primary-400` |
| 500 | `#757d8a` | `--color-primary-500` |
| 600 | `#626974` | `--color-primary-600` |
| 700 | `#50555e` | `--color-primary-700` |
| 800 | `#3d4148` | `--color-primary-800` |
| 900 | `#2f3237` | `--color-primary-900` |
| 950 | `#1C1E21` | `--color-primary-950` |

### Secondary

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f1f7fe` | `--color-secondary-50` |
| 100 | `#e3f0fd` | `--color-secondary-100` |
| 200 | `#bddbf9` | `--color-secondary-200` |
| 300 | `#89c2fb` | `--color-secondary-300` |
| 400 | `#3f9efd` | `--color-secondary-400` |
| 500 | `#0980f6` | `--color-secondary-500` |
| 600 | `#076bcf` | `--color-secondary-600` |
| 700 | `#0657a8` | `--color-secondary-700` |
| 800 | `#043b72` | `--color-secondary-800` |
| 900 | `#0b335b` | `--color-secondary-900` |
| 950 | `#07213b` | `--color-secondary-950` |

### Accent

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f2f6fd` | `--color-accent-50` |
| 100 | `#e5edfa` | `--color-accent-100` |
| 200 | `#c2d6f4` | `--color-accent-200` |
| 300 | `#93b7f1` | `--color-accent-300` |
| 400 | `#508ced` | `--color-accent-400` |
| 500 | `#3578E5` | `--color-accent-500` |
| 600 | `#1858be` | `--color-accent-600` |
| 700 | `#14479a` | `--color-accent-700` |
| 800 | `#0f3675` | `--color-accent-800` |
| 900 | `#122b54` | `--color-accent-900` |
| 950 | `#0b1c37` | `--color-accent-950` |

### Neutral

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f7f7f8` | `--color-neutral-50` |
| 100 | `#efeff1` | `--color-neutral-100` |
| 200 | `#d9dbde` | `--color-neutral-200` |
| 300 | `#bdc1c7` | `--color-neutral-300` |
| 400 | `#969ca6` | `--color-neutral-400` |
| 500 | `#757d8a` | `--color-neutral-500` |
| 600 | `#626974` | `--color-neutral-600` |
| 700 | `#50555e` | `--color-neutral-700` |
| 800 | `#3d4148` | `--color-neutral-800` |
| 900 | `#2f3237` | `--color-neutral-900` |
| 950 | `#1c1e21` | `--color-neutral-950` |

### Semantic Intents

| Intent | Hex | Token Variable |
|--------|-----|----------------|
| Success | `#31A24C` | `--color-success` |
| Warning | `#af8f00` | `--color-warning` |
| Error   | `#1c1e21` | `--color-error` |

## 2. Typography

### Font Families

- **Sans (Body):** `system-ui, -apple-system, BlinkMacSystemFont, .SFNSText-Regular, sans-serif`

### Font Sizes

| Scale | Value | Token Variable |
|-------|-------|----------------|
| xs | `0.75rem` | `--font-size-xs` |
| sm | `0.875rem` | `--font-size-sm` |
| base | `1rem` | `--font-size-base` |
| lg | `1.125rem` | `--font-size-lg` |
| xl | `1.25rem` | `--font-size-xl` |
| 2xl | `1.5rem` | `--font-size-2xl` |
| 3xl | `1.875rem` | `--font-size-3xl` |
| 4xl | `2.25rem` | `--font-size-4xl` |

### Font Weights

| Name | Weight | Token Variable |
|------|--------|----------------|
| normal | `400` | `--font-weight-normal` |
| medium | `500` | `--font-weight-medium` |
| bold | `700` | `--font-weight-bold` |

## 3. Spacing & Sizing

| Scale | Value | Token Variable |
|-------|-------|----------------|
| 0 | `0` | `--spacing-0` |
| 1 | `0.125rem` | `--spacing-1` |
| 2 | `0.375rem` | `--spacing-2` |
| 3 | `0.625rem` | `--spacing-3` |
| 4 | `1rem` | `--spacing-4` |
| 6 | `1.375rem` | `--spacing-6` |

## 4. Borders & Shadows

### Border Radius

| Name | Value | Token Variable |
|------|-------|----------------|
| none | `0` | `--radius-none` |
| sm | `0.25rem` | `--radius-sm` |
| md | `0.5rem` | `--radius-md` |
| lg | `100%` | `--radius-lg` |
| xl | `62.4375rem` | `--radius-xl` |
| 2xl | `1rem` | `--radius-2xl` |
| full | `9999px` | `--radius-full` |

### Shadows

| Name | Value | Token Variable |
|------|-------|----------------|
| sm | `rgba(0, 0, 0, 0.1) 0px 0px 0px 1px` | `--shadow-sm` |
| md | `rgba(0, 0, 0, 0.1) 0px 0px 5px 0px, rgba(0, 0, 0, 0.1) 0px 0px 1px 0px` | `--shadow-md` |
| lg | `rgba(0, 0, 0, 0.3) 0px 1px 3px 0px` | `--shadow-lg` |
| xl | `rgba(0, 0, 0, 0.1) 0px 2px 8px 0px, rgba(0, 0, 0, 0.1) 0px 1px 1px 0px` | `--shadow-xl` |
