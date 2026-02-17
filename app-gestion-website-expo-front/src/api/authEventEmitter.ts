/**
 * ========================================
 * Auth Event Emitter
 * Système d'événements pour gérer l'expiration de session
 * ========================================
 */
import { EventEmitter } from "events";

export type AuthEventType = "session_expired" | "logout" | "login";

export interface AuthEventData {
  type: AuthEventType;
  reason?: string;
  timestamp: Date;
}

class AuthEventEmitterClass extends EventEmitter {
  private static instance: AuthEventEmitterClass;

  private constructor() {
    super();
  }

  static getInstance(): AuthEventEmitterClass {
    if (!AuthEventEmitterClass.instance) {
      AuthEventEmitterClass.instance = new AuthEventEmitterClass();
    }
    return AuthEventEmitterClass.instance;
  }

  // Émettre un événement de session expirée
  emitSessionExpired(reason: string = "token_expired"): void {
    const data = {
      type: "session_expired",
      reason,
      timeStamp: new Date(),
    };

    this.emit("auth:session_expired", data);
  }

  // Émettre un événement de déconnexion
  emitLogout(reason: string = "user_logout"): void {
    const data = {
      type: "logout",
      reason,
      timeStamp: new Date(),
    };
    this.emit("auth:logout", data);
  }

  // Émettre un événement de déconnexion
  emitLogin(): void {
    const data = {
      type: "login",
      timeStamp: new Date(),
    };
    this.emit("auth:login", data);
  }

  // S'abonner au événements de session expirée
  onSessionExpired(callback: (AuthEventData) => void): () => void {
    this.on("auth:session_expired", callback);
    return () => this.off("auth:session_expired", callback);
  }

  // S'abonner aux événements de déconnexion
  onLogout(callback: (AuthEventData) => void): () => void {
    this.on("auth:logout", callback);
    return () => this.off("auth:logout", callback);
  }

  // S'abonner aux événements de déconnexion
  onLogin(callback: (AuthEventData) => void): () => void {
    this.on("auth:login", callback);
    return () => this.off("auth:login", callback);
  }
}

export const authEventEmitter = AuthEventEmitterClass.getInstance();
