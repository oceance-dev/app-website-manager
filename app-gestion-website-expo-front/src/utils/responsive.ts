import { Dimensions, Platform } from "react-native";

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';


export const getResponsiveWidth = () => {
    const { width } = Dimensions.get('window');
    return width;
}

export const isLargeScreen = () => {
    return getResponsiveWidth() > 768;
};

export const getLayoutStyle = () => {
    if (isWeb && isLargeScreen()) {
        return 'desktop';
    }
    return 'mobile';
}