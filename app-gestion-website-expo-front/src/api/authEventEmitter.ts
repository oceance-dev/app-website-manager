/**
 * ========================================
 * Auth Event Emitter
 * Système d'événements pour gérer l'expiration de session
 * ========================================
 */

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: Set<AuthEventListener> = new Set();

  /**
   * S'abonner aux événements d'expiration de session
   */
  subscribe(listener: AuthEventListener): () => void {
    this.listeners.add(listener);

    // Retourner une fonction de désabonnement
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Émettre un événement d'expiration de session
   */
  emitSessionExpired(): void {
    console.log('🔔 Session expired event emitted');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in session expired listener:', error);
      }
    });
  }

  /**
   * Supprimer tous les listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

export const authEventEmitter = new AuthEventEmitter();
