/**
 * Utilities for handling Firestore Timestamp conversions
 */

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param timestamp - Firestore Timestamp, Date, or any date-like object
 * @returns Date object or null if conversion fails
 */
export function convertFirestoreDate(timestamp: any): Date | null {
    if (!timestamp) return null;

    // Si ya es una Date, devolverla
    if (timestamp instanceof Date) return timestamp;

    // Si es un Timestamp de Firestore
    if (timestamp && timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // Si es un objeto con seconds (formato Firestore serializado)
    if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
    }

    // Intentar convertir a Date directamente
    try {
        return new Date(timestamp);
    } catch {
        return null;
    }
}

/**
 * Format date for HTML input[type="date"]
 * @param date - Date object or null
 * @returns ISO date string (YYYY-MM-DD) or empty string
 */
export function formatDateForInput(date: Date | null): string {
    if (!date) return '';

    try {
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

/**
 * Calculate days between two dates
 * @param startDate - Start date
 * @param endDate - End date (defaults to today)
 * @returns Number of days between dates
 */
export function daysBetween(startDate: Date, endDate: Date = new Date()): number {
    if (!startDate) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
