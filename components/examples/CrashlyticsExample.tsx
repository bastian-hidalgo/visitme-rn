import { useCrashlytics, useComponentMonitoring } from '@/lib/monitoring';
import { useEffect } from 'react';

/**
 * Ejemplo de cómo usar los hooks de Crashlytics en un componente funcional
 * Este archivo sirve como referencia para futuras implementaciones
 */
export function ExampleComponentMonitoring() {
  // Monitorear ciclo de vida del componente
  useComponentMonitoring('ExampleComponent');

  // Obtener funciones de Crashlytics
  const {
    recordError,
    addBreadcrumb,
    safeAsync,
    log
  } = useCrashlytics();

  useEffect(() => {
    // Ejemplo: Cargar datos con manejo automático de errores
    const loadData = async () => {
      await safeAsync(
        async () => {
          // Tu lógica aquí
          // Si hay un error, se reporta automáticamente a Crashlytics
          addBreadcrumb('Loading data', 'data_fetch');

          // Simulación de carga
          // const { data, error } = await supabase.from('table').select('*');
          // if (error) throw error;

          addBreadcrumb('Data loaded successfully', 'data_fetch');
        },
        'ExampleComponent.loadData',
        { shouldRethrow: false, showToast: true }
      );
    };

    loadData();
  }, [safeAsync, addBreadcrumb]);

  const handleUserAction = () => {
    // Tracking de acciones del usuario
    addBreadcrumb('User clicked button', {
      screen: 'Example',
      action: 'button_click'
    });

    // Simular una operación que puede fallar
    safeAsync(
      async () => {
        // Tu lógica aquí
        throw new Error('Ejemplo de error');
      },
      'ExampleComponent.handleUserAction'
    );
  };

  return null; // Tu JSX aquí
}

/**
 * Ejemplo de cómo integrar en pantallas existentes como (tabs)/index.tsx:
 *
 * ```typescript
 * export default function ResidentPage() {
 *   // Agregar al inicio del componente:
 *   useComponentMonitoring('ResidentPage');
 *
 *   const { addBreadcrumb } = useCrashlytics();
 *
 *   // En alguna acción:
 *   const handleSomething = () => {
 *     addBreadcrumb('User performed action', { detail: 'value' });
 *   };
 *
 *   // ... resto del código
 * }
 * ```
 */
