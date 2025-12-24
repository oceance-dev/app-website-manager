import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isWeb } from '../../utils/responsive';

interface DatePickerWrapperProps {
    value: string; // Format: YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    style?: any;
}

export default function DatePickerWrapper({ 
    value, 
    onChange, 
    placeholder = "Date de naissance",
    style 
}: DatePickerWrapperProps) {
    const [show, setShow] = useState(false);
    const [date, setDate] = useState(value ? new Date(value) : new Date());

    useEffect(() => {
        if (value) {
            setDate(new Date(value));
        }
    }, [value]);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (dateString: string): string => {
        if (!dateString) return placeholder;
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        
        if (selectedDate) {
            setDate(selectedDate);
            onChange(formatDate(selectedDate));
            
            if (Platform.OS === 'ios') {
                setShow(false);
            }
        } else if (event.type === 'dismissed') {
            setShow(false);
        }
    };

    const inputRef = useRef<any>(null);

    if (isWeb) {
        return (
            <View style={[styles.webInput, style]}>
                {React.createElement('input', {
                    ref: inputRef,
                    type: 'date',
                    value: value || '',
                    onChange: (e: any) => onChange(e.target.value),
                    placeholder: placeholder,
                    style: {
                        flex: 1,
                        paddingVertical: 12,
                        fontSize: 16,
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        color: '#1e293b',
                        backgroundColor: 'transparent',
                    }
                })}
            </View>
        );
    }

    return (
        <View>
            <TouchableOpacity 
                onPress={() => setShow(true)}
                style={[styles.dateButton, style]}
            >
                <Text style={styles.dateText}>
                    {formatDisplayDate(value)}
                </Text>
            </TouchableOpacity>
            
            {show && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    dateButton: {
        flex: 1,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 16,
        color: '#1e293b',
    },
    webInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b',
    },
});

