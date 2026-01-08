import { Dimensions, Platform } from "react-native";

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export const getResponsiveWidth = () => {
    const { width } = Dimensions.get('window');
    return width;
}

export const getResponsiveHeight = () => {
    const { height } = Dimensions.get('window');
    return height;
}

export const isLargeScreen = () => {
    return getResponsiveWidth() > 768;
};

export const isTablet = () => {
    const width = getResponsiveWidth();
    return width >= 768 && width < 1024;
};

export const isSmallMobile = () => {
    return getResponsiveWidth() < 375;
};

export const getLayoutStyle = () => {
    if (isWeb && isLargeScreen()) {
        return 'desktop';
    }
    return 'mobile';
}

// Responsive font sizes
export const getFontSize = (base: number) => {
    if (isMobile) {
        if (isSmallMobile()) {
            return base * 0.9;
        }
        return base;
    }
    return base;
};

// Responsive spacing
export const getSpacing = (base: number) => {
    if (isMobile) {
        if (isSmallMobile()) {
            return base * 0.8;
        }
        return base;
    }
    return base;
};

// Minimum touch target size for mobile (44x44 points)
export const MIN_TOUCH_TARGET = 44;

// Get responsive padding
export const getResponsivePadding = () => {
    if (isMobile) {
        if (isSmallMobile()) {
            return 12;
        }
        return 16;
    }
    return 20;
};

// Get responsive modal width
export const getModalWidth = () => {
    const width = getResponsiveWidth();
    if (isMobile) {
        return width - 32; // Full width minus padding
    }
    return Math.min(width * 0.9, 700); // 90% of width, max 700
};

// Get responsive modal height
export const getModalHeight = () => {
    const height = getResponsiveHeight();
    if (isMobile) {
        return height * 0.95; // 95% of screen height
    }
    return Math.min(height * 0.9, 900); // 90% of height, max 900
};