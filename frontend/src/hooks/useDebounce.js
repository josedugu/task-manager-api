import { useState, useEffect } from "react";

/**
 * Hook que retrasa la actualización de un valor hasta que el usuario
 * deje de escribir por el tiempo especificado.
 *
 * @param {any} value - El valor a debounce
 * @param {number} delay - El tiempo de espera en milisegundos (default: 300ms)
 * @returns {any} - El valor con debounce aplicado
 */
export function useDebounce(value, delay = 300) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
